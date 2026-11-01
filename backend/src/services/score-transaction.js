
/*
 * Transaction cap nhat diem va ghi AuditLog.
 * He thong quan ly ket qua hoc tap THPT.
 *
 * Neu mot thao tac that bai, rollback giao dich.
 */

const { sql, connectDatabase } = require("../config/database");

async function updateScoreWithAudit({
    scoreComponentId,
    scoreValue,
    performedBy,
    reason = null
}) {
    // 1. Kiem tra du lieu dau vao
    if (!Number.isSafeInteger(scoreComponentId) ||
        scoreComponentId <= 0) {
        throw new Error("Ma thanh phan diem khong hop le.");
    }

    if (!Number.isSafeInteger(performedBy) ||
        performedBy <= 0) {
        throw new Error("Ma nguoi thuc hien khong hop le.");
    }

    if (typeof scoreValue !== "number" ||
        !Number.isFinite(scoreValue) ||
        scoreValue < 0 ||
        scoreValue > 10) {
        throw new Error("Diem phai tu 0 den 10.");
    }

    if (reason !== null && typeof reason !== "string") {
        throw new Error("Ly do khong hop le.");
    }

    const pool = await connectDatabase();

    // 2. Xac dinh pham vi thanh phan diem
    const scopeResult = await pool.request()
        .input("id", sql.BigInt, scoreComponentId)
        .query(`
            SELECT
                sc.component_type,
                sr.subject_id,
                e.academic_year_id,
                e.class_id
            FROM dbo.score_component sc
            JOIN dbo.score_record sr
                ON sc.score_record_id = sr.score_record_id
            JOIN dbo.enrollment e
                ON sr.enrollment_id = e.enrollment_id
            WHERE sc.score_component_id = @id
        `);

    if (scopeResult.recordset.length !== 1) {
        throw new Error("Khong tim thay thanh phan diem.");
    }

    const scope = scopeResult.recordset[0];

    // 3. Kiem tra quy tac diem
    if (["QT1", "QT2", "QT3"].includes(scope.component_type)) {
        if (!Number.isInteger(scoreValue)) {
            throw new Error("Diem qua trinh phai la so nguyen.");
        }
    } else if (
        ["GK", "CK"].includes(scope.component_type)
    ) {
        if (!Number.isInteger(scoreValue * 4)) {
            throw new Error("GK va CK phai theo buoc 0.25.");
        }
    } else {
        throw new Error("Thanh phan diem khong hop le.");
    }

    // 4. Tao transaction
    const transaction = new sql.Transaction(pool);
    let started = false;

    try {
        await transaction.begin(
            sql.ISOLATION_LEVEL.SERIALIZABLE
        );
        started = true;

        // 5. Khoa pham vi cot diem
        const lockKey = [
            "score",
            scope.academic_year_id,
            scope.class_id,
            scope.subject_id,
            scope.component_type
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
            throw new Error("Khong the khoa giao dich.");
        }

        // 6. Xac nhan nguoi thuc hien la KHAO_THI
        const actor = await new sql.Request(transaction)
            .input("userId", sql.BigInt, performedBy)
            .query(`
                SELECT u.user_id
                FROM dbo.app_user u
                JOIN dbo.[role] r
                    ON u.role_id = r.role_id
                WHERE u.user_id = @userId
                  AND u.is_active = 1
                  AND r.code = 'KHAO_THI'
            `);

        if (actor.recordset.length !== 1) {
            throw new Error("Khong co quyen sua diem.");
        }

        // 7. Doc va khoa ban ghi diem
        const current = await new sql.Request(transaction)
            .input("id", sql.BigInt, scoreComponentId)
            .query(`
                SELECT
                    sc.score_value,
                    sc.component_type,
                    sc.score_record_id,
                    sr.subject_id,
                    e.student_id,
                    e.class_id,
                    e.academic_year_id
                FROM dbo.score_component sc
                    WITH (UPDLOCK, HOLDLOCK)
                JOIN dbo.score_record sr
                    ON sc.score_record_id = sr.score_record_id
                JOIN dbo.enrollment e
                    ON sr.enrollment_id = e.enrollment_id
                WHERE sc.score_component_id = @id
            `);

        if (current.recordset.length !== 1) {
            throw new Error("Ban ghi diem khong ton tai.");
        }

        const old = current.recordset[0];

        // Kiem tra pham vi khong thay doi
        if (
            String(old.academic_year_id) !==
                String(scope.academic_year_id) ||
            String(old.class_id) !==
                String(scope.class_id) ||
            String(old.subject_id) !==
                String(scope.subject_id) ||
            old.component_type !== scope.component_type
        ) {
            throw new Error("Pham vi diem da thay doi.");
        }

        // 8. Kiem tra trang thai khoa diem
        const lockStatus = await new sql.Request(transaction)
            .input("yearId", sql.BigInt, old.academic_year_id)
            .input("classId", sql.BigInt, old.class_id)
            .input("subjectId", sql.BigInt, old.subject_id)
            .input(
                "component",
                sql.VarChar(10),
                old.component_type
            )
            .query(`
                SELECT status
                FROM dbo.lock_status WITH (UPDLOCK, HOLDLOCK)
                WHERE academic_year_id = @yearId
                  AND class_id = @classId
                  AND subject_id = @subjectId
                  AND component = @component
            `);

        if (
            lockStatus.recordset.length > 0 &&
            lockStatus.recordset[0].status === "LOCKED"
        ) {
            throw new Error("Cot diem dang bi khoa.");
        }

        // 9. Cap nhat diem
        const update = await new sql.Request(transaction)
            .input("id", sql.BigInt, scoreComponentId)
            .input("value", sql.Decimal(4, 2), scoreValue)
            .query(`
                UPDATE dbo.score_component
                SET
                    score_value = @value,
                    score_status = 'SCORED'
                WHERE score_component_id = @id
            `);

        if (update.rowsAffected[0] !== 1) {
            throw new Error("Cap nhat diem that bai.");
        }

        // 10. Tang phien ban ban ghi diem
        await new sql.Request(transaction)
            .input("recordId", sql.BigInt, old.score_record_id)
            .query(`
                UPDATE dbo.score_record
                SET version = version + 1
                WHERE score_record_id = @recordId
            `);

        // 11. Ghi AuditLog
        const audit = await new sql.Request(transaction)
            .input("userId", sql.BigInt, performedBy)
            .input("yearId", sql.BigInt, old.academic_year_id)
            .input("classId", sql.BigInt, old.class_id)
            .input("subjectId", sql.BigInt, old.subject_id)
            .input(
                "component",
                sql.VarChar(10),
                old.component_type
            )
            .input("studentId", sql.BigInt, old.student_id)
            .input("recordId", sql.BigInt, old.score_record_id)
            .input("componentId", sql.BigInt, scoreComponentId)
            .input(
                "oldValue",
                sql.Decimal(4, 2),
                old.score_value
            )
            .input(
                "newValue",
                sql.Decimal(4, 2),
                scoreValue
            )
            .input(
                "reason",
                sql.NVarChar(sql.MAX),
                reason === null ? null : reason.trim() || null
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

        // 12. Luu toan bo transaction
        await transaction.commit();
        started = false;

        return {
            success: true,
            scoreComponentId,
            oldValue: old.score_value,
            newValue: scoreValue,
            auditLogId: audit.recordset[0].audit_log_id
        };

    } catch (error) {
        // Neu loi, hoan tac cac thay doi
        if (started) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                // SQL Server co the da rollback truoc do
            }
        }

        throw error;
    }
}

module.exports = {
    updateScoreWithAudit
};
