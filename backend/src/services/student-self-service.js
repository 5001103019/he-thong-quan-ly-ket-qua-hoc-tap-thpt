
"use strict";

const sql = require("mssql/msnodesqlv8");
const { connectDatabase } = require("../config/database");

// Lay ho so hoc sinh theo ID da duoc xac thuc.
// ID nay phai duoc truyen tu middleware, khong lay tu client.
async function getMyStudentProfile(studentId) {
    if (
        studentId === null ||
        studentId === undefined ||
        !/^[1-9][0-9]*$/.test(String(studentId))
    ) {
        throw new Error("Student ID trong phien khong hop le.");
    }

    const pool = await connectDatabase();

    const result = await pool.request()
        .input("studentId", sql.BigInt, String(studentId))
        .query(`
            SELECT
                student_id,
                student_code,
                full_name,
                date_of_birth,
                status
            FROM dbo.student
            WHERE student_id = @studentId
        `);

    if (result.recordset.length === 0) {
        return null;
    }

    const student = result.recordset[0];

    return {
        studentId: String(student.student_id),
        studentCode: student.student_code,
        fullName: student.full_name,
        dateOfBirth: student.date_of_birth,
        status: student.status
    };
}

module.exports = {
    getMyStudentProfile
};
