
/*
 * ===================================================
 * BUOC 26 - TRANSACTION CHUYEN LOP
 * He thong quan ly ket qua hoc tap THPT
 * ===================================================
 *
 * Quy tac:
 * 1. Bao toan Enrollment cu.
 * 2. Tao Enrollment moi.
 * 3. Khong xoa ScoreRecord lich su.
 * 4. Khong cho phep chong lan thoi gian.
 * 5. COMMIT neu tat ca thanh cong.
 * 6. ROLLBACK neu co loi.
 * 7. Su dung khoa de xu ly thao tac dong thoi.
 */

const {
    sql,
    connectDatabase
} = require("../config/database");

// Kiem tra ID
function validId(value) {
    return Number.isSafeInteger(value) && value > 0;
}

// Kiem tra ngay theo dinh dang YYYY-MM-DD
function validDate(value) {
    if (typeof value !== "string") {
        return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(value + "T00:00:00Z");

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value &&
        value.substring(0, 4) !== "0000"
    );
}

// ===================================================
// HAM CHUYEN LOP
// ===================================================

async function transferStudentWithTransaction({
    studentId,
    academicYearId,
    newClassId,
    transferDate,
    performedBy
}) {
    // 1. Kiem tra tham so
    if (
        !validId(studentId) ||
        !validId(academicYearId) ||
        !validId(newClassId) ||
        !validId(performedBy)
    ) {
        throw new Error("Ma dinh danh khong hop le.");
    }

    if (!validDate(transferDate)) {
        throw new Error(
            "Ngay chuyen lop phai co dang YYYY-MM-DD."
        );
    }

    const pool = await connectDatabase();

    const transaction = new sql.Transaction(pool);

    let started = false;

    try {
        // 2. Bat dau giao dich
        await transaction.begin(
            sql.ISOLATION_LEVEL.SERIALIZABLE
        );

        started = true;

        // 3. Khoa theo hoc sinh va nien khoa
        // Hai thao tac cung pham vi phai cho nhau.
        const lockKey =
            `enrollment:${studentId}:${academicYearId}`;

        const lockResult =
            await new sql.Request(transaction)
                .input(
                    "resource",
                    sql.NVarChar(255),
                    lockKey
                )
                .query(`
                    DECLARE @result INT;

                    EXEC @result = sys.sp_getapplock
                        @Resource = @resource,
                        @LockMode = 'Exclusive',
                        @LockOwner = 'Transaction',
                        @LockTimeout = 10000;

                    SELECT @result AS lock_result;
                `);

        if (
            lockResult.recordset[0].lock_result < 0
        ) {
            throw new Error(
                "Khong the khoa giao dich chuyen lop."
            );
        }

        // 4. Kiem tra quyen KHAO_THI
        const actor =
            await new sql.Request(transaction)
                .input(
                    "userId",
                    sql.BigInt,
                    performedBy
                )
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
            throw new Error(
                "Tai khoan khong co quyen chuyen lop."
            );
        }

        // 5. Tim Enrollment hien tai
        const current =
            await new sql.Request(transaction)
                .input(
                    "studentId",
                    sql.BigInt,
                    studentId
                )
                .input(
                    "yearId",
                    sql.BigInt,
                    academicYearId
                )
                .query(`
                    SELECT
                        e.enrollment_id,
                        e.class_id,
                        e.academic_year_id,
                        CONVERT(
                            VARCHAR(10),
                            e.start_date,
                            23
                        ) AS start_date_text,
                        c.grade_id
                    FROM dbo.enrollment e
                        WITH (UPDLOCK, HOLDLOCK)
                    JOIN dbo.[class] c
                      ON c.class_id = e.class_id
                    WHERE e.student_id = @studentId
                      AND e.academic_year_id = @yearId
                      AND e.end_date IS NULL
                `);

        if (current.recordset.length !== 1) {
            throw new Error(
                "Khong tim thay phan lop hien tai."
            );
        }

        const old = current.recordset[0];

        // 6. Kiem tra ngay chuyen lop
        if (transferDate <= old.start_date_text) {
            throw new Error(
                "Ngay chuyen lop phai sau ngay bat dau lop cu."
            );
        }

        // 7. Kiem tra lop moi
        const target =
            await new sql.Request(transaction)
                .input(
                    "classId",
                    sql.BigInt,
                    newClassId
                )
                .input(
                    "yearId",
                    sql.BigInt,
                    academicYearId
                )
                .query(`
                    SELECT
                        class_id,
                        grade_id
                    FROM dbo.[class]
                    WHERE class_id = @classId
                      AND academic_year_id = @yearId
                      AND status = 'ACTIVE'
                `);

        if (target.recordset.length !== 1) {
            throw new Error(
                "Lop moi khong ton tai hoac khong hop le."
            );
        }

        const newClass = target.recordset[0];

        if (
            String(old.class_id) ===
            String(newClassId)
        ) {
            throw new Error(
                "Lop moi phai khac lop hien tai."
            );
        }

        if (
            String(old.grade_id) !==
            String(newClass.grade_id)
        ) {
            throw new Error(
                "Chuyen lop phai trong cung khoi."
            );
        }

        // 8. Ket thuc Enrollment cu
        const update =
            await new sql.Request(transaction)
                .input(
                    "oldId",
                    sql.BigInt,
                    old.enrollment_id
                )
                .input(
                    "transferDate",
                    sql.VarChar(10),
                    transferDate
                )
                .query(`
                    UPDATE dbo.enrollment
                    SET
                        end_date = CONVERT(
                            DATE,
                            @transferDate,
                            23
                        ),
                        exit_reason = 'TRANSFER'
                    WHERE enrollment_id = @oldId
                      AND end_date IS NULL
                `);

        if (update.rowsAffected[0] !== 1) {
            throw new Error(
                "Khong the ket thuc phan lop cu."
            );
        }
        // 9. Tao Enrollment moi
        const inserted =
            await new sql.Request(transaction)
                .input(
                    "studentId",
                    sql.BigInt,
                    studentId
                )
                .input(
                    "newClassId",
                    sql.BigInt,
                    newClassId
                )
                .input(
                    "yearId",
                    sql.BigInt,
                    academicYearId
                )
                .input(
                    "transferDate",
                    sql.VarChar(10),
                    transferDate
                )
                .query(`
                    INSERT INTO dbo.enrollment (
                        student_id,
                        class_id,
                        academic_year_id,
                        start_date
                    )
                    VALUES (
                        @studentId,
                        @newClassId,
                        @yearId,
                        CONVERT(DATE, @transferDate, 23)
                    );

                    SELECT
                        CAST(SCOPE_IDENTITY() AS BIGINT)
                        AS enrollment_id;
                `);

        const newEnrollmentId =
            inserted.recordset[0].enrollment_id;


        // 10. Chi COMMIT khi ca hai thao tac thanh cong
        await transaction.commit();

        started = false;

        return {
            success: true,
            studentId,
            academicYearId,
            oldEnrollmentId: old.enrollment_id,
            newEnrollmentId,
            oldClassId: old.class_id,
            newClassId,
            transferDate
        };

    } catch (error) {
        // 11. Co loi thi hoan tac toan bo
        if (started) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                // Giu lai thong bao loi ban dau
            }
        }

        throw error;
    }
}

module.exports = {
    transferStudentWithTransaction
};
