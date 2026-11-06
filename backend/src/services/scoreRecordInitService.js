
"use strict";

const {
    sql,
    connectDatabase
} = require("../config/database");

// Tao loi nghiep vu cho API.
function createError(code, message, status) {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    return error;
}

// Dam bao ScoreRecord ton tai cho Enrollment va Subject.
// Neu da ton tai thi tra lai ban ghi hien tai.
// Neu chua co thi tao moi voi version = 1.
async function ensureScoreRecordCore({
    enrollmentId,
    subjectId
}) {
    // 1. Kiem tra ma dau vao.
    if (
        !Number.isSafeInteger(enrollmentId) ||
        enrollmentId <= 0 ||
        !Number.isSafeInteger(subjectId) ||
        subjectId <= 0
    ) {
        throw createError(
            "VALIDATION_ERROR",
            "Ma phan lop hoac mon hoc khong hop le",
            400
        );
    }

    const pool = await connectDatabase();
    const transaction = new sql.Transaction(pool);
    let started = false;

    try {
        // 2. Bat dau transaction.

        await transaction.begin(
            sql.ISOLATION_LEVEL.READ_COMMITTED
        );

        started = true;

        // Khoa giao dich theo Enrollment va Subject.
        // Cac POST cung cap ID se duoc xu ly lan luot.
        const lockKey =
            `score-record:init:${enrollmentId}:${subjectId}`;

        const appLock = await new sql.Request(transaction)
            .input("lockKey", sql.NVarChar(255), lockKey)
            .query(`
                DECLARE @result INT;

                EXEC @result = sys.sp_getapplock
                    @Resource = @lockKey,
                    @LockMode = 'Exclusive',
                    @LockOwner = 'Transaction',
                    @LockTimeout = 15000;

                SELECT @result AS lock_result;
            `);

        if (appLock.recordset[0].lock_result < 0) {
            throw createError(
                "LOCK_TIMEOUT",
                "Khong the lay khoa khoi tao ScoreRecord",
                409
            );
        }
        // 3. Kiem tra Enrollment ton tai.
        const enrollment = await new sql.Request(transaction)
            .input("enrollmentId", sql.BigInt, enrollmentId)
            .query(`
                SELECT enrollment_id
                FROM dbo.enrollment
                WHERE enrollment_id = @enrollmentId
            `);

        if (enrollment.recordset.length !== 1) {
            throw createError(
                "NOT_FOUND",
                "Khong tim thay phan lop",
                404
            );
        }

        // 4. Kiem tra Subject ton tai.
        const subject = await new sql.Request(transaction)
            .input("subjectId", sql.BigInt, subjectId)
            .query(`
                SELECT subject_id
                FROM dbo.subject
                WHERE subject_id = @subjectId
            `);

        if (subject.recordset.length !== 1) {
            throw createError(
                "NOT_FOUND",
                "Khong tim thay mon hoc",
                404
            );
        }

        // 5. Tim ScoreRecord, khoa de tranh tao trung.
        const existing = await new sql.Request(transaction)
            .input("enrollmentId", sql.BigInt, enrollmentId)
            .input("subjectId", sql.BigInt, subjectId)
            .query(`
                SELECT score_record_id, version
                FROM dbo.score_record WITH (UPDLOCK, HOLDLOCK)
                WHERE enrollment_id = @enrollmentId
                  AND subject_id = @subjectId
            `);

        if (existing.recordset.length > 0) {
            const record = existing.recordset[0];

            await transaction.commit();
            started = false;

            return {
                created: false,
                scoreRecordId: Number(record.score_record_id),
                version: Number(record.version)
            };
        }

        // 6. Tao ban ghi moi.
        const inserted = await new sql.Request(transaction)
            .input("enrollmentId", sql.BigInt, enrollmentId)
            .input("subjectId", sql.BigInt, subjectId)
            .query(`
                INSERT INTO dbo.score_record (
                    enrollment_id,
                    subject_id
                )
                OUTPUT
                    INSERTED.score_record_id,
                    INSERTED.version
                VALUES (
                    @enrollmentId,
                    @subjectId
                )
            `);

        const record = inserted.recordset[0];

        // 7. Hoan tat transaction.
        await transaction.commit();
        started = false;

        return {
            created: true,
            scoreRecordId: Number(record.score_record_id),
            version: Number(record.version)
        };

    } catch (error) {
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

// Hang doi khoi tao ScoreRecord trong cung mot tien trinh.
const pendingScoreRecordInit = new Map();

async function ensureScoreRecord(params) {
    const key = `${params.enrollmentId}:${params.subjectId}`;

    const previous =
        pendingScoreRecordInit.get(key) || Promise.resolve();

    let release;

    const current = new Promise((resolve) => {
        release = resolve;
    });

    pendingScoreRecordInit.set(key, current);

    // Cho yeu cau truoc hoan tat.
    await previous;

    try {
        return await ensureScoreRecordCore(params);
    } finally {
        release();

        if (pendingScoreRecordInit.get(key) === current) {
            pendingScoreRecordInit.delete(key);
        }
    }
}

module.exports = {
    ensureScoreRecord
};
