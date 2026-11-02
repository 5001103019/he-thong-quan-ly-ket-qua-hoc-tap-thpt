
"use strict";

const { sql, connectDatabase } = require("../config/database");
const { validateScoreEntry } = require("./scoreValidation");

// Tao loi nghiep vu de API xu ly.
function createError(code, message, status) {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    return error;
}

// Luu mot thanh phan diem trong transaction.
// Chi su dung sau khi API da xac thuc nguoi dung.
async function saveScoreEntry({
    scoreRecordId,
    componentType,
    scoreValue,
    scoreStatus,
    expectedVersion,
    performedBy,
    reason = null
}) {
    // 1. Kiem tra tham so dau vao.
    const userId = Number(performedBy);

    if (!Number.isSafeInteger(scoreRecordId) ||
        scoreRecordId <= 0 ||
        !Number.isSafeInteger(userId) ||
        userId <= 0) {
        throw createError(
            "VALIDATION_ERROR",
            "Ma ban ghi diem hoac nguoi dung khong hop le",
            400
        );
    }

    if (!Number.isInteger(expectedVersion) ||
        expectedVersion < 1 ||
        expectedVersion > 2147483647) {
        throw createError(
            "VALIDATION_ERROR",
            "Phien ban ban ghi diem khong hop le",
            400
        );
    }

    // Kiem tra loai diem, gia tri va trang thai.
    const validation = validateScoreEntry(
        componentType,
        scoreValue,
        scoreStatus
    );

    if (!validation.valid) {
        throw createError(
            validation.code,
            validation.message,
            400
        );
    }

    if (reason !== null &&
        (typeof reason !== "string" ||
         reason.length > 1000)) {
        throw createError(
            "VALIDATION_ERROR",
            "Ly do khong hop le",
            400
        );
    }

    const normalizedReason =
        reason === null ? null : reason.trim() || null;

    const pool = await connectDatabase();

    // 2. Xac dinh pham vi truoc khi khoa giao dich.
    const scopeResult = await pool.request()
        .input("recordId", sql.BigInt, scoreRecordId)
        .query(`
            SELECT
                sr.score_record_id,
                sr.subject_id,
                e.student_id,
                e.class_id,
                e.academic_year_id
            FROM dbo.score_record sr
            JOIN dbo.enrollment e
                ON e.enrollment_id = sr.enrollment_id
            WHERE sr.score_record_id = @recordId
        `);

    if (scopeResult.recordset.length !== 1) {
        throw createError(
            "NOT_FOUND",
            "Khong tim thay ban ghi diem",
            404
        );
    }

    const scope = scopeResult.recordset[0];

    // 3. Bat dau transaction.
    const transaction = new sql.Transaction(pool);
    let started = false;

    try {
        await transaction.begin(
            sql.ISOLATION_LEVEL.SERIALIZABLE
        );
        started = true;

        // 4. Khoa pham vi cot diem.
        // Dung cung lock key voi transaction cua Giang.
        const lockKey = [
            "score",
            scope.academic_year_id,
            scope.class_id,
            scope.subject_id,
            componentType
        ].join(":");

        const appLock = await new sql.Request(transaction)
            .input("lockKey", sql.VarChar(255), lockKey)
            .query(`
                DECLARE @result INT;

                EXEC @result = sys.sp_getapplock
                    @Resource = @lockKey,
                    @LockMode = 'Exclusive',
                    @LockOwner = 'Transaction',
                    @LockTimeout = 10000;

                SELECT @result AS lock_result;
            `);

        if (appLock.recordset[0].lock_result < 0) {
            throw createError(
                "LOCK_TIMEOUT",
                "Khong the khoa giao dich diem",
                409
            );
        }

        // 5. Kiem tra nguoi thuc hien la KHAO_THI.
        const actor = await new sql.Request(transaction)
            .input("userId", sql.BigInt, userId)
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
            throw createError(
                "FORBIDDEN",
                "Khong co quyen sua diem",
                403
            );
        }

        // 6. Khoa ban ghi va kiem tra version.
        const recordResult = await new sql.Request(transaction)
            .input("recordId", sql.BigInt, scoreRecordId)
            .query(`
                SELECT
                    sr.version,
                    sr.subject_id,
                    e.student_id,
                    e.class_id,
                    e.academic_year_id
                FROM dbo.score_record sr
                    WITH (UPDLOCK, HOLDLOCK)
                JOIN dbo.enrollment e
                    ON e.enrollment_id = sr.enrollment_id
                WHERE sr.score_record_id = @recordId
            `);

        if (recordResult.recordset.length !== 1) {
            throw createError(
                "NOT_FOUND",
                "Ban ghi diem khong con ton tai",
                404
            );
        }

        const record = recordResult.recordset[0];

        // Dam bao pham vi khong thay doi.
        if (
            String(record.academic_year_id) !==
                String(scope.academic_year_id) ||
            String(record.class_id) !==
                String(scope.class_id) ||
            String(record.subject_id) !==
                String(scope.subject_id) ||
            String(record.student_id) !==
                String(scope.student_id)
        ) {
            throw createError(
                "SCOPE_CHANGED",
                "Pham vi ban ghi diem da thay doi",
                409
            );
        }

        if (record.version !== expectedVersion) {
            throw createError(
                "VERSION_CONFLICT",
                "Du lieu diem da thay doi, can tai lai",
                409
            );
        }

        // 7. Kiem tra cot diem co bi khoa khong.
        const lockResult = await new sql.Request(transaction)
            .input(
                "yearId",
                sql.BigInt,
                scope.academic_year_id
            )
            .input("classId", sql.BigInt, scope.class_id)
            .input("subjectId", sql.BigInt, scope.subject_id)
            .input("component", sql.VarChar(10), componentType)
            .query(`
                SELECT status
                FROM dbo.lock_status WITH (UPDLOCK, HOLDLOCK)
                WHERE academic_year_id = @yearId
                  AND class_id = @classId
                  AND subject_id = @subjectId
                  AND component = @component
            `);

        if (
            lockResult.recordset.length > 0 &&
            lockResult.recordset[0].status === "LOCKED"
        ) {
            throw createError(
                "SCORE_LOCKED",
                "Cot diem dang bi khoa",
                409
            );
        }

        // 8. Kiem tra thanh phan diem da ton tai.
        const currentResult = await new sql.Request(transaction)
            .input("recordId", sql.BigInt, scoreRecordId)
            .input("component", sql.VarChar(10), componentType)
            .query(`
                SELECT
                    score_component_id,
                    score_value,
                    score_status
                FROM dbo.score_component
                    WITH (UPDLOCK, HOLDLOCK)
                WHERE score_record_id = @recordId
                  AND component_type = @component
            `);

        const current = currentResult.recordset[0] || null;

        const oldValue = current
            ? current.score_value === null
                ? null
                : Number(current.score_value)
            : null;

        const oldStatus = current
            ? current.score_status
            : "NOT_ENTERED";

        // Khong ghi lai neu du lieu khong thay doi.
        if (
            oldValue === scoreValue &&
            oldStatus === scoreStatus
        ) {
            await transaction.commit();
            started = false;

            return {
                success: true,
                changed: false,
                scoreRecordId,
                componentType,
                version: record.version
            };
        }

        // Neu diem/trang thai da duoc ghi nhan truoc do,
        // moi thay doi thuc su deu phai co ly do.
        // NOT_ENTERED duoc xem la chua nhap diem lan dau.
        if (
            current !== null &&
            oldStatus !== "NOT_ENTERED" &&
            normalizedReason === null
        ) {
            throw createError(
                "REASON_REQUIRED",
                "Phai nhap ly do khi sua diem da co",
                400
            );
        }

        let scoreComponentId;

        // 9. Cap nhat neu da co thanh phan diem.
        if (current) {
            scoreComponentId = current.score_component_id;

            await new sql.Request(transaction)
                .input(
                    "componentId",
                    sql.BigInt,
                    scoreComponentId
                )
                .input(
                    "value",
                    sql.Decimal(4, 2),
                    scoreValue
                )
                .input(
                    "status",
                    sql.VarChar(15),
                    scoreStatus
                )
                .query(`
                    UPDATE dbo.score_component
                    SET score_value = @value,
                        score_status = @status
                    WHERE score_component_id = @componentId
                `);
        } else {
            // Tao thanh phan diem neu chua ton tai.
            const inserted = await new sql.Request(transaction)
                .input("recordId", sql.BigInt, scoreRecordId)
                .input(
                    "component",
                    sql.VarChar(10),
                    componentType
                )
                .input(
                    "value",
                    sql.Decimal(4, 2),
                    scoreValue
                )
                .input(
                    "status",
                    sql.VarChar(15),
                    scoreStatus
                )
                .query(`
                    INSERT INTO dbo.score_component (
                        score_record_id,
                        component_type,
                        score_value,
                        score_status
                    )
                    OUTPUT INSERTED.score_component_id
                    VALUES (
                        @recordId,
                        @component,
                        @value,
                        @status
                    )
                `);

            scoreComponentId =
                inserted.recordset[0].score_component_id;
        }

        // 10. Tang version cua ban ghi diem.
        const updated = await new sql.Request(transaction)
            .input("recordId", sql.BigInt, scoreRecordId)
            .query(`
                UPDATE dbo.score_record
                SET version = version + 1
                OUTPUT INSERTED.version AS new_version
                WHERE score_record_id = @recordId
            `);

        const newVersion =
            updated.recordset[0].new_version;

        // 11. Ghi AuditLog trong cung transaction.
        const audit = await new sql.Request(transaction)
            .input("userId", sql.BigInt, userId)
            .input(
                "yearId",
                sql.BigInt,
                scope.academic_year_id
            )
            .input("classId", sql.BigInt, scope.class_id)
            .input("subjectId", sql.BigInt, scope.subject_id)
            .input("studentId", sql.BigInt, scope.student_id)
            .input("recordId", sql.BigInt, scoreRecordId)
            .input(
                "componentId",
                sql.BigInt,
                scoreComponentId
            )
            .input(
                "component",
                sql.VarChar(10),
                componentType
            )
            .input(
                "oldValue",
                sql.Decimal(4, 2),
                oldValue
            )
            .input(
                "newValue",
                sql.Decimal(4, 2),
                scoreValue
            )
            .input(
                "reason",
                sql.NVarChar(sql.MAX),
                normalizedReason
            )
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
                    reason,
                    result
                )
                OUTPUT INSERTED.audit_log_id
                VALUES (
                    'SCORE_EDIT',
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
                    @reason,
                    'SUCCESS'
                )
            `);

        // 12. Luu giao dich.
        await transaction.commit();
        started = false;

        return {
            success: true,
            changed: true,
            scoreRecordId,
            scoreComponentId,
            componentType,
            oldValue,
            scoreValue,
            scoreStatus,
            version: newVersion,
            auditLogId: audit.recordset[0].audit_log_id
        };

    } catch (error) {
        // Neu loi, rollback toan bo thay doi.
        if (started) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                // SQL Server co the da rollback.
            }
        }

        throw error;
    }
}

module.exports = {
    saveScoreEntry
};
