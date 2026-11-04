
"use strict";

const {
    validateStudentCsv
} = require("./student-csv-validator");

function importError(code, message, status, errors = []) {
    const error = new Error(message);
    error.code = code;
    error.status = status;
    error.errors = errors;
    return error;
}

function rowError(lineNumber, field, code, message) {
    return {
        lineNumber,
        field,
        code,
        message
    };
}

/*
 * Xac nhan Import hoc sinh.
 *
 * - Kiem tra lai CSV.
 * - Tao Student va Enrollment trong mot transaction.
 * - Mot dong loi thi rollback toan bo.
 *
 * database la tham so tuy chon de kiem thu tren MacBook.
 */
async function confirmStudentCsv(csvText, database = null) {
    // 1. Kiem tra cau truc va nghiep vu CSV.
    const validation = validateStudentCsv(csvText);

    if (
        validation.errors.length > 0 ||
        validation.rows.length === 0
    ) {
        throw importError(
            "CSV_VALIDATION_ERROR",
            "CSV hoc sinh khong hop le.",
            422,
            validation.errors
        );
    }

    // 2. Lay ket noi database.
    const db = database || require("../config/database");
    const { sql, connectDatabase } = db;

    const pool = await connectDatabase();
    const transaction = new sql.Transaction(pool);

    let started = false;
    let currentLineNumber = null;
    const imported = [];

    try {
        await transaction.begin(
            sql.ISOLATION_LEVEL.SERIALIZABLE
        );

        started = true;

        // 3. Kiem tra lai tung dong trong transaction.
        for (const row of validation.rows) {
            const { lineNumber, data } = row;
            currentLineNumber = lineNumber;

            if (data.status !== "ACTIVE") {
                throw importError(
                    "IMPORT_CONFLICT",
                    "Hoc sinh phai ACTIVE de phan lop.",
                    409,
                    [
                        rowError(
                            lineNumber,
                            "status",
                            "STUDENT_INACTIVE",
                            "Hoc sinh phai ACTIVE de duoc phan lop."
                        )
                    ]
                );
            }

            // 4. Kiem tra ma hoc sinh da ton tai.
            const existingStudent =
                await new sql.Request(transaction)
                    .input(
                        "studentCode",
                        sql.VarChar(30),
                        data.studentCode
                    )
                    .query(`
                        SELECT TOP (1) student_id
                        FROM dbo.student WITH (UPDLOCK, HOLDLOCK)
                        WHERE student_code = @studentCode
                    `);

            if (existingStudent.recordset.length > 0) {
                throw importError(
                    "IMPORT_CONFLICT",
                    "Ma hoc sinh da ton tai.",
                    409,
                    [
                        rowError(
                            lineNumber,
                            "studentCode",
                            "STUDENT_ALREADY_EXISTS",
                            "Ma hoc sinh da ton tai trong database."
                        )
                    ]
                );
            }

            // 5. Tim nien khoa va lop, kiem tra trang thai.
            const targetResult =
                await new sql.Request(transaction)
                    .input(
                        "academicYearCode",
                        sql.VarChar(9),
                        data.academicYearCode
                    )
                    .input(
                        "classCode",
                        sql.VarChar(20),
                        data.classCode
                    )
                    .query(`
                        SELECT
                            a.academic_year_id AS academicYearId,
                            a.status AS yearStatus,
                            c.class_id AS classId,
                            c.status AS classStatus
                        FROM dbo.academic_year AS a
                            WITH (HOLDLOCK)
                        LEFT JOIN dbo.[class] AS c
                            WITH (HOLDLOCK)
                            ON c.academic_year_id =
                                a.academic_year_id
                            AND c.code = @classCode
                        WHERE a.code = @academicYearCode
                    `);

            const target = targetResult.recordset[0];

            let field = null;
            let errorCode = null;
            let message = null;

            if (!target) {
                field = "academicYearCode";
                errorCode = "ACADEMIC_YEAR_NOT_FOUND";
                message = "Nien khoa khong ton tai.";
            } else if (target.yearStatus === "CLOSED") {
                field = "academicYearCode";
                errorCode = "ACADEMIC_YEAR_CLOSED";
                message = "Nien khoa da dong.";
            } else if (target.classId == null) {
                field = "classCode";
                errorCode = "CLASS_NOT_FOUND";
                message = "Lop khong ton tai trong nien khoa.";
            } else if (target.classStatus !== "ACTIVE") {
                field = "classCode";
                errorCode = "CLASS_INACTIVE";
                message = "Lop khong o trang thai ACTIVE.";
            }

            if (errorCode !== null) {
                throw importError(
                    "IMPORT_CONFLICT",
                    message,
                    409,
                    [
                        rowError(
                            lineNumber,
                            field,
                            errorCode,
                            message
                        )
                    ]
                );
            }

            // 6. Tao hoc sinh moi.
            const insertedStudent =
                await new sql.Request(transaction)
                    .input(
                        "studentCode",
                        sql.VarChar(30),
                        data.studentCode
                    )
                    .input(
                        "fullName",
                        sql.NVarChar(150),
                        data.fullName
                    )
                    .input(
                        "dateOfBirth",
                        sql.VarChar(10),
                        data.dateOfBirth
                    )
                    .input(
                        "status",
                        sql.VarChar(20),
                        data.status
                    )
                    .query(`
                        INSERT INTO dbo.student (
                            student_code,
                            full_name,
                            date_of_birth,
                            status
                        )
                        VALUES (
                            @studentCode,
                            @fullName,
                            CONVERT(DATE, @dateOfBirth, 23),
                            @status
                        );

                        SELECT
                            CONVERT(VARCHAR(20), SCOPE_IDENTITY())
                                AS studentId;
                    `);

            const studentId =
                insertedStudent.recordset[0].studentId;

            // 7. Tao phan lop cho hoc sinh.
            const insertedEnrollment =
                await new sql.Request(transaction)
                    .input(
                        "studentId",
                        sql.BigInt,
                        String(studentId)
                    )
                    .input(
                        "classId",
                        sql.BigInt,
                        String(target.classId)
                    )
                    .input(
                        "academicYearId",
                        sql.BigInt,
                        String(target.academicYearId)
                    )
                    .input(
                        "startDate",
                        sql.VarChar(10),
                        data.startDate
                    )
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

            imported.push({
                lineNumber,
                studentCode: data.studentCode,
                studentId: String(studentId),
                enrollmentId:
                    insertedEnrollment.recordset[0].enrollmentId
            });
        }

        // 8. Chi commit khi TAT CA dong thanh cong.
        await transaction.commit();
        started = false;

        return {
            importedCount: imported.length,
            imported
        };

    } catch (error) {
        // 1. Rollback neu transaction da bat dau.
        if (started) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error(
                    "Loi rollback Import hoc sinh:",
                    rollbackError.message
                );
            }
        }

        // 2. Lay ma loi SQL Server.
        // Ho tro thong tin loi tu cac driver MSSQL.
        const sqlErrorNumbers = [
            error.number,
            error.originalError?.number,
            error.originalError?.info?.number
        ].map(Number);

        // 3. Chuyen vi pham khoa duy nhat thanh HTTP 409.
        if (
            sqlErrorNumbers.includes(2601) ||
            sqlErrorNumbers.includes(2627)
        ) {
            throw importError(
                "IMPORT_CONFLICT",
                "Du lieu Import xung dot voi rang buoc duy nhat.",
                409,
                [
                    rowError(
                        currentLineNumber,
                        null,
                        "UNIQUE_CONSTRAINT_CONFLICT",
                        "Dong CSV xung dot voi rang buoc duy nhat trong database."
                    )
                ]
            );
        }

        // 4. Giu nguyen cac loi nghiep vu da xu ly
        // va cac loi he thong khac.
        throw error;
    }
}

module.exports = {
    confirmStudentCsv
};
