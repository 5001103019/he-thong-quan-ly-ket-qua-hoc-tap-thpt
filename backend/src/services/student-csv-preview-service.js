
"use strict";


const {
    validateStudentCsv
} = require("./student-csv-validator");

function addError(errors, lineNumber, field, code, message) {
    errors.push({
        lineNumber,
        field,
        code,
        message
    });
}

/*
 * Xem truoc du lieu import hoc sinh.
 * Chi doc database, KHONG ghi du lieu.
 */
async function previewStudentCsv(csvText, database = null) {
    // 1. Kiem tra cau truc va du lieu trong CSV.
    const validation = validateStudentCsv(csvText);

    const errors = [...validation.errors];
    const validRows = [];

    if (validation.rows.length === 0) {
        return {
            headers: validation.headers,
            rows: [],
            errors,
            canImport: false
        };
    }

    // 2. Ket noi SQL Server.
    // Cho phep truyen ket noi rieng khi kiem thu.
    // Neu khong truyen, su dung cau hinh Backend hien tai.
    const db = database || require("../config/database");

    const { sql, connectDatabase } = db;

    const pool = await connectDatabase();

    for (const row of validation.rows) {
        const { lineNumber, data } = row;
        const errorCountBefore = errors.length;

        // 3. Kiem tra trang thai hoc sinh.
        // Service phan lop hien tai yeu cau hoc sinh ACTIVE.
        if (data.status !== "ACTIVE") {
            addError(
                errors,
                lineNumber,
                "status",
                "STUDENT_INACTIVE",
                "Hoc sinh phai ACTIVE de duoc phan lop."
            );
        }

        // 4. Kiem tra ma hoc sinh da ton tai.
        const studentResult = await pool.request()
            .input(
                "studentCode",
                sql.VarChar(30),
                data.studentCode
            )
            .query(`
                SELECT TOP (1)
                    student_id
                FROM dbo.student
                WHERE student_code = @studentCode
            `);

        if (studentResult.recordset.length > 0) {
            addError(
                errors,
                lineNumber,
                "studentCode",
                "STUDENT_ALREADY_EXISTS",
                "Ma hoc sinh da ton tai trong database."
            );
        }

        // 5. Kiem tra nien khoa va lop.
        const classResult = await pool.request()
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
                LEFT JOIN dbo.[class] AS c
                    ON c.academic_year_id =
                        a.academic_year_id
                    AND c.code = @classCode
                WHERE a.code = @academicYearCode
            `);

        const target = classResult.recordset[0];

        if (!target) {
            addError(
                errors,
                lineNumber,
                "academicYearCode",
                "ACADEMIC_YEAR_NOT_FOUND",
                "Nien khoa khong ton tai."
            );
        } else {
            // Nien khoa CLOSED khong duoc phan lop.
            if (target.yearStatus === "CLOSED") {
                addError(
                    errors,
                    lineNumber,
                    "academicYearCode",
                    "ACADEMIC_YEAR_CLOSED",
                    "Nien khoa da dong."
                );
            }

            if (target.classId === null) {
                addError(
                    errors,
                    lineNumber,
                    "classCode",
                    "CLASS_NOT_FOUND",
                    "Khong tim thay lop trong nien khoa."
                );
            } else if (
                target.classStatus !== "ACTIVE"
            ) {
                addError(
                    errors,
                    lineNumber,
                    "classCode",
                    "CLASS_INACTIVE",
                    "Lop khong o trang thai ACTIVE."
                );
            }
        }

        // 6. Chi dua dong khong loi vao preview hop le.
        if (errors.length === errorCountBefore) {
            validRows.push({
                lineNumber,
                data
            });
        }
    }

    // Sap xep loi theo so dong.
    errors.sort(
        (a, b) => a.lineNumber - b.lineNumber
    );

    return {
        headers: validation.headers,
        rows: validRows,
        errors,
        canImport:
            validRows.length > 0 &&
            errors.length === 0
    };
}

module.exports = {
    previewStudentCsv
};
