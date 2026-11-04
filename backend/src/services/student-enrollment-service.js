
"use strict";

const {
    sql,
    connectDatabase
} = require("../config/database");

function businessError(code, message, status = 409) {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    return error;
}

function validId(value) {
    const text = String(value);

    return /^[1-9][0-9]*$/.test(text) &&
        Number.isSafeInteger(Number(text));
}

function validDate(value) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        value.startsWith("0000-")
    ) {
        return false;
    }

    const date = new Date(value + "T00:00:00Z");

    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
}

/*
 * Phan hoc sinh vao lop.
 * Giu nguyen ho so Student va lich su Enrollment cu.
 * Dung transaction SERIALIZABLE de bao ve du lieu.
 */
async function assignStudentToClass(data) {
    const {
        studentId,
        academicYearId,
        classId,
        startDate
    } = data;

    if (
        !validId(studentId) ||
        !validId(academicYearId) ||
        !validId(classId) ||
        !validDate(startDate)
    ) {
        throw businessError(
            "VALIDATION_ERROR",
            "Thong tin phan lop khong hop le",
            400
        );
    }

    const pool = await connectDatabase();
    const transaction = new sql.Transaction(pool);

    await transaction.begin(
        sql.ISOLATION_LEVEL.SERIALIZABLE
    );

    try {
        // 1. Kiem tra hoc sinh va khoa ban ghi
        const studentResult = await new sql.Request(transaction)
            .input("studentId", sql.BigInt, String(studentId))
            .query(`
                SELECT student_id, status
                FROM dbo.student WITH (UPDLOCK, HOLDLOCK)
                WHERE student_id = @studentId
            `);

        const student = studentResult.recordset[0];

        if (!student) {
            throw businessError(
                "NOT_FOUND",
                "Khong tim thay hoc sinh",
                404
            );
        }

        if (student.status !== "ACTIVE") {
            throw businessError(
                "CONFLICT",
                "Hoc sinh khong o trang thai hoat dong"
            );
        }

        // 2. Kiem tra lop thuoc dung nien khoa
        const classResult = await new sql.Request(transaction)
            .input("classId", sql.BigInt, String(classId))
            .input(
                "academicYearId",
                sql.BigInt,
                String(academicYearId)
            )
            .query(`
                SELECT
                    c.class_id,
                    c.status AS class_status,
                    a.status AS year_status
                FROM dbo.[class] AS c
                INNER JOIN dbo.academic_year AS a
                    ON a.academic_year_id = c.academic_year_id
                WHERE c.class_id = @classId
                  AND c.academic_year_id = @academicYearId
            `);

        const targetClass = classResult.recordset[0];

        if (!targetClass) {
            throw businessError(
                "NOT_FOUND",
                "Khong tim thay lop trong nien khoa",
                404
            );
        }

        if (
            targetClass.class_status !== "ACTIVE" ||
            targetClass.year_status === "CLOSED"
        ) {
            throw businessError(
                "CONFLICT",
                "Lop hoac nien khoa khong cho phep phan lop"
            );
        }

        // 3. Kiem tra phan lop trung hoac chong lan
        const existingResult = await new sql.Request(transaction)
            .input("studentId", sql.BigInt, String(studentId))
            .input(
                "academicYearId",
                sql.BigInt,
                String(academicYearId)
            )
            .input("startDate", sql.VarChar(10), startDate)
            .query(`
                SELECT TOP (1) enrollment_id
                FROM dbo.enrollment WITH (UPDLOCK, HOLDLOCK)
                WHERE student_id = @studentId
                  AND academic_year_id = @academicYearId
                  AND (
                      end_date IS NULL
                      OR end_date > CONVERT(DATE, @startDate, 23)
                  )
            `);

        if (existingResult.recordset.length > 0) {
            throw businessError(
                "CONFLICT",
                "Hoc sinh da co phan lop xung dot trong nien khoa"
            );
        }

        // 4. Tao ban ghi phan lop moi
        const inserted = await new sql.Request(transaction)
            .input("studentId", sql.BigInt, String(studentId))
            .input("classId", sql.BigInt, String(classId))
            .input(
                "academicYearId",
                sql.BigInt,
                String(academicYearId)
            )
            .input("startDate", sql.VarChar(10), startDate)
            .query(`
                INSERT INTO dbo.enrollment (
                    student_id,
                    class_id,
                    academic_year_id,
                    start_date,
                    end_date,
                    exit_reason
                )
                VALUES (
                    @studentId,
                    @classId,
                    @academicYearId,
                    CONVERT(DATE, @startDate, 23),
                    NULL,
                    NULL
                );

                SELECT
                    CONVERT(VARCHAR(20), SCOPE_IDENTITY())
                        AS enrollmentId;
            `);

        const enrollmentId =
            inserted.recordset[0].enrollmentId;

        await transaction.commit();

        return {
            enrollmentId,
            studentId: String(studentId),
            classId: String(classId),
            academicYearId: String(academicYearId),
            startDate,
            endDate: null,
            exitReason: null
        };

    } catch (error) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error(
                "Loi rollback phan lop:",
                rollbackError.message
            );
        }

        throw error;
    }
}

module.exports = {
    assignStudentToClass
};
