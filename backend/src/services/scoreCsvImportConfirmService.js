
"use strict";

const {
    sql,
    connectDatabase
} = require("../config/database");

const {
    validateScoreEntry
} = require("./scoreValidation");

const TYPES = ["QT1", "QT2", "QT3", "GK", "CK"];

function businessError(code, message, status = 409, column = null) {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    error.column = column;
    return error;
}

function validId(value) {
    const id = String(value ?? "");
    return /^[1-9]\d*$/.test(id) &&
        BigInt(id) <= 9223372036854775807n;
}

// Ghi mot dong CSV trong mot transaction.
// Khong tin diem, version hoac quyen do client tu khai.
async function saveConfirmedCsvRow({
    codes,
    updates,
    expectedScoreRecordId = null,
    expectedVersion = null,
    performedBy,
    reason = null
}) {
    if (!validId(performedBy)) {
        throw businessError(
            "VALIDATION_ERROR",
            "Nguoi thuc hien khong hop le",
            400
        );
    }

    if (!codes || [
        "studentCode",
        "academicYearCode",
        "classCode",
        "subjectCode"
    ].some(key =>
        typeof codes[key] !== "string" ||
        !codes[key].trim()
    )) {
        throw businessError(
            "VALIDATION_ERROR",
            "Ma dinh danh CSV khong hop le",
            400
        );
    }

    if (!Array.isArray(updates) || updates.length === 0) {
        throw businessError(
            "VALIDATION_ERROR",
            "Khong co diem can cap nhat",
            400
        );
    }

    const uniqueTypes = new Set();

    for (const update of updates) {
        if (uniqueTypes.has(update.componentType)) {
            throw businessError(
                "DUPLICATE_COMPONENT",
                "Thanh phan diem bi trung",
                400,
                update.componentType
            );
        }

        uniqueTypes.add(update.componentType);

        const checked = validateScoreEntry(
            update.componentType,
            update.scoreValue,
            update.scoreStatus
        );

        if (!checked.valid) {
            throw businessError(
                checked.code,
                checked.message,
                400,
                update.componentType
            );
        }

        // CSV chi nhap diem so; o rong khong ghi de.
        if (update.scoreStatus !== "SCORED") {
            throw businessError(
                "INVALID_SCORE_STATUS",
                "CSV chi cap nhat diem so",
                400,
                update.componentType
            );
        }
    }

    if (reason !== null &&
        (typeof reason !== "string" || reason.length > 1000)) {
        throw businessError(
            "VALIDATION_ERROR",
            "Ly do khong hop le",
            400
        );
    }

    const normalizedReason =
        reason === null ? null : reason.trim() || null;

    const expectedNewRecord =
        expectedScoreRecordId === null &&
        expectedVersion === null;

    if (!expectedNewRecord && (
        !validId(expectedScoreRecordId) ||
        !Number.isInteger(expectedVersion) ||
        expectedVersion < 1
    )) {
        throw businessError(
            "VALIDATION_ERROR",
            "Phien ban Preview khong hop le",
            400
        );
    }

    const pool = await connectDatabase();
    const tx = new sql.Transaction(pool);
    let started = false;

    try {
        await tx.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
        started = true;

        // Kiem tra lai nguoi thuc hien trong database.
        const actor = await new sql.Request(tx)
            .input("userId", sql.BigInt, String(performedBy))
            .query(`
                SELECT u.user_id
                FROM dbo.app_user u
                JOIN dbo.[role] r
                    ON r.role_id = u.role_id
                WHERE u.user_id = @userId
                  AND u.is_active = 1
                  AND r.code = 'KHAO_THI'
            `);

        if (actor.recordset.length !== 1) {
            throw businessError(
                "FORBIDDEN",
                "Khong co quyen Import diem",
                403
            );
        }

        // Kiem tra lai hoc sinh, nien khoa, lop, mon.
        const scopes = await new sql.Request(tx)
            .input("studentCode", sql.VarChar(30),
                codes.studentCode.trim())
            .input("yearCode", sql.VarChar(9),
                codes.academicYearCode.trim())
            .input("classCode", sql.VarChar(20),
                codes.classCode.trim())
            .input("subjectCode", sql.VarChar(20),
                codes.subjectCode.trim())
            .query(`
                SELECT
                    e.enrollment_id,
                    e.student_id,
                    e.academic_year_id,
                    e.class_id,
                    sub.subject_id
                FROM dbo.enrollment e WITH (UPDLOCK, HOLDLOCK)
                JOIN dbo.student s
                    ON s.student_id = e.student_id
                JOIN dbo.academic_year ay
                    ON ay.academic_year_id =
                        e.academic_year_id
                JOIN dbo.[class] c
                    ON c.class_id = e.class_id
                   AND c.academic_year_id =
                        e.academic_year_id
                JOIN dbo.subject sub
                    ON sub.code = @subjectCode
                WHERE s.student_code = @studentCode
                  AND ay.code = @yearCode
                  AND c.code = @classCode
            `);

        if (scopes.recordset.length !== 1) {
            throw businessError(
                "ENROLLMENT_CONFLICT",
                "Khong tim thay phan lop duy nhat",
                409,
                "classCode"
            );
        }

        const scope = scopes.recordset[0];

        // Khoa cung pham vi voi service nhap diem.
        // Sap xep co dinh de giam nguy co deadlock.
        const orderedUpdates = [...updates].sort(
            (a, b) =>
                TYPES.indexOf(a.componentType) -
                TYPES.indexOf(b.componentType)
        );

        for (const update of orderedUpdates) {
            const lockKey = [
                "score",
                scope.academic_year_id,
                scope.class_id,
                scope.subject_id,
                update.componentType
            ].join(":");

            const lock = await new sql.Request(tx)
                .input("key", sql.VarChar(255), lockKey)
                .query(`
                    DECLARE @r INT;
                    EXEC @r = sys.sp_getapplock
                        @Resource = @key,
                        @LockMode = 'Exclusive',
                        @LockOwner = 'Transaction',
                        @LockTimeout = 10000;
                    SELECT @r AS result;
                `);

            if (lock.recordset[0].result < 0) {
                throw businessError(
                    "LOCK_TIMEOUT",
                    "Khong the khoa giao dich diem"
                );
            }
        }

        // Kiem tra score_record va version.
        const records = await new sql.Request(tx)
            .input("enrollmentId", sql.BigInt,
                scope.enrollment_id)
            .input("subjectId", sql.BigInt,
                scope.subject_id)
            .query(`
                SELECT score_record_id, version
                FROM dbo.score_record WITH (UPDLOCK, HOLDLOCK)
                WHERE enrollment_id = @enrollmentId
                  AND subject_id = @subjectId
            `);

        let record = records.recordset[0] ?? null;

        const versionMatches = expectedNewRecord
            ? record === null
            : record !== null &&
              String(record.score_record_id) ===
                String(expectedScoreRecordId) &&
              record.version === expectedVersion;

        if (!versionMatches) {
            throw businessError(
                "VERSION_CONFLICT",
                "Diem da thay doi sau Preview, can xem lai"
            );
        }

        const changes = [];

        // Kiem tra lai moi cot trong transaction.
        for (const update of orderedUpdates) {
            const type = update.componentType;

            const lockState = await new sql.Request(tx)
                .input("yearId", sql.BigInt,
                    scope.academic_year_id)
                .input("classId", sql.BigInt, scope.class_id)
                .input("subjectId", sql.BigInt,
                    scope.subject_id)
                .input("component", sql.VarChar(10), type)
                .query(`
                    SELECT status
                    FROM dbo.lock_status WITH (UPDLOCK, HOLDLOCK)
                    WHERE academic_year_id = @yearId
                      AND class_id = @classId
                      AND subject_id = @subjectId
                      AND component = @component
                `);

            const status =
                lockState.recordset[0]?.status ?? "UNLOCKED";

            if (status !== "UNLOCKED") {
                throw businessError(
                    "SCORE_LOCKED",
                    "Cot diem dang bi khoa",
                    409,
                    type
                );
            }

            let current = null;

            if (record) {
                const found = await new sql.Request(tx)
                    .input("recordId", sql.BigInt,
                        record.score_record_id)
                    .input("type", sql.VarChar(10), type)
                    .query(`
                        SELECT
                            score_component_id,
                            score_value,
                            score_status
                        FROM dbo.score_component
                            WITH (UPDLOCK, HOLDLOCK)
                        WHERE score_record_id = @recordId
                          AND component_type = @type
                    `);

                current = found.recordset[0] ?? null;
            }

            const oldValue = current?.score_value == null
                ? null : Number(current.score_value);

            const oldStatus =
                current?.score_status ?? "NOT_ENTERED";

            if (
                oldValue === update.scoreValue &&
                oldStatus === update.scoreStatus
            ) {
                continue;
            }

            // Xac dinh chu ky mo khoa hien hanh.
            // Chua tung khoa: relatedLogId = null.
            // Da UNLOCK hop le: lien ket den UNLOCK moi nhat.
            // Khong su dung UNLOCK cu sau RELOCK.
            let relatedLogId = null;

            const lockEvents = await new sql.Request(tx)
                .input("yearId", sql.BigInt,
                    scope.academic_year_id)
                .input("classId", sql.BigInt,
                    scope.class_id)
                .input("subjectId", sql.BigInt,
                    scope.subject_id)
                .input("component", sql.VarChar(10), type)
                .query(`
                    SELECT TOP (1)
                        audit_log_id,
                        action_type
                    FROM dbo.audit_log
                    WHERE academic_year_id = @yearId
                      AND class_id = @classId
                      AND subject_id = @subjectId
                      AND component = @component
                      AND action_type IN (
                          'LOCK', 'UNLOCK', 'RELOCK'
                      )
                      AND result = 'SUCCESS'
                    ORDER BY audit_log_id DESC
                `);

            const lastEvent = lockEvents.recordset[0] ?? null;

            if (lastEvent?.action_type === "UNLOCK") {
                relatedLogId = lastEvent.audit_log_id;
            } else if (lastEvent !== null) {
                // Co lich su khoa nhung khong co UNLOCK
                // hien hanh: khong cho phep cap nhat.
                throw businessError(
                    "UNLOCK_REQUIRED",
                    "Cot diem chua co lan mo khoa hop le",
                    409,
                    type
                );
            }
             changes.push({
                ...update,
                oldValue,
                oldStatus,
                relatedLogId,
                componentId:
                    current?.score_component_id ?? null
            });

        }

        if (changes.length === 0) {
            await tx.commit();
            started = false;

            return {
                changed: false,
                changedComponents: 0,
                scoreRecordId: record
                    ? String(record.score_record_id)
                    : null,
                version: record?.version ?? null,
                auditLogIds: []
            };
        }

        // Tao score_record neu chua co.
        if (!record) {
            const inserted = await new sql.Request(tx)
                .input("enrollmentId", sql.BigInt,
                    scope.enrollment_id)
                .input("subjectId", sql.BigInt,
                    scope.subject_id)
                .query(`
                    INSERT INTO dbo.score_record (
                        enrollment_id, subject_id
                    )
                    OUTPUT
                        INSERTED.score_record_id,
                        INSERTED.version
                    VALUES (@enrollmentId, @subjectId)
                `);

            record = inserted.recordset[0];
        }

        const auditLogIds = [];

        // Luu tung thay doi va AuditLog cung transaction.
        for (const change of changes) {
            let componentId = change.componentId;

            if (componentId !== null) {
                await new sql.Request(tx)
                    .input("id", sql.BigInt, componentId)
                    .input("value", sql.Decimal(4, 2),
                        change.scoreValue)
                    .input("status", sql.VarChar(15),
                        change.scoreStatus)
                    .query(`
                        UPDATE dbo.score_component
                        SET score_value = @value,
                            score_status = @status
                        WHERE score_component_id = @id
                    `);
            } else {
                const inserted = await new sql.Request(tx)
                    .input("recordId", sql.BigInt,
                        record.score_record_id)
                    .input("type", sql.VarChar(10),
                        change.componentType)
                    .input("value", sql.Decimal(4, 2),
                        change.scoreValue)
                    .input("status", sql.VarChar(15),
                        change.scoreStatus)
                    .query(`
                        INSERT INTO dbo.score_component (
                            score_record_id,
                            component_type,
                            score_value,
                            score_status
                        )
                        OUTPUT INSERTED.score_component_id
                        VALUES (
                            @recordId, @type, @value, @status
                        )
                    `);

                componentId =
                    inserted.recordset[0].score_component_id;
            }

            const audit = await new sql.Request(tx)
                .input("userId", sql.BigInt,
                    String(performedBy))
                .input("yearId", sql.BigInt,
                    scope.academic_year_id)
                .input("classId", sql.BigInt,
                    scope.class_id)
                .input("subjectId", sql.BigInt,
                    scope.subject_id)
                .input("studentId", sql.BigInt,
                    scope.student_id)
                .input("recordId", sql.BigInt,
                    record.score_record_id)
                .input("componentId", sql.BigInt,
                    componentId)
                .input("component", sql.VarChar(10),
                    change.componentType)
                .input("oldValue", sql.Decimal(4, 2),
                    change.oldValue)
                .input("newValue", sql.Decimal(4, 2),
                    change.scoreValue)
                .input("oldStatus", sql.VarChar(15),
                    change.oldStatus)
                .input("newStatus", sql.VarChar(15),
                    change.scoreStatus)
                .input("reason", sql.NVarChar(sql.MAX),
                    normalizedReason)
                .input("relatedLogId", sql.BigInt,
                    change.relatedLogId)
                .query(`
                    INSERT INTO dbo.audit_log (
                        action_type,
                        performed_by,
                        academic_year_id,
                        class_id,
                        subject_id,
                        component,
                        student_id,
                        score_record_id,
                        score_component_id,
                        old_value,
                        new_value,
                        old_score_status,
                        new_score_status,
                        related_log_id,
                        reason,
                        result
                    )
                    OUTPUT INSERTED.audit_log_id
                    VALUES (
                        'SCORE_IMPORT',
                        @userId,
                        @yearId,
                        @classId,
                        @subjectId,
                        @component,
                        @studentId,
                        @recordId,
                        @componentId,
                        @oldValue,
                        @newValue,
                        @oldStatus,
                        @newStatus,
                        @relatedLogId,
                        @reason,
                        'SUCCESS'
                    )
                `);

            auditLogIds.push(
                String(audit.recordset[0].audit_log_id)
            );
        }

        // Tang version theo so thanh phan da thay doi.
        const updatedVersion = await new sql.Request(tx)
            .input("recordId", sql.BigInt,
                record.score_record_id)
            .input("count", sql.Int, changes.length)
            .query(`
                UPDATE dbo.score_record
                SET version = version + @count
                OUTPUT INSERTED.version
                WHERE score_record_id = @recordId
            `);

        await tx.commit();
        started = false;

        return {
            changed: true,
            changedComponents: changes.length,
            scoreRecordId: String(record.score_record_id),
            version: updatedVersion.recordset[0].version,
            auditLogIds
        };

    } catch (error) {
        if (started) {
            try {
                await tx.rollback();
            } catch (_) {
                // SQL Server co the da rollback.
            }
        }

        throw error;
    }
}

module.exports = {
    saveConfirmedCsvRow
};
