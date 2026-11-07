"use strict";

const {
    sql,
    connectDatabase
} = require("../config/database");

// Lay danh sach Enrollment hien con hieu luc
// trong nien khoa va lop da chon.
//
// Chi SELECT, khong chinh sua SQL Server.
// Khong xoa hay thay doi lich su chuyen lop.

async function getCurrentEnrollmentIds({
    academicYearId,
    classId
}) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input(
            "academicYearId",
            sql.BigInt,
            academicYearId
        )
        .input(
            "classId",
            sql.BigInt,
            classId
        )
        .query(`
            SELECT
                e.enrollment_id
            FROM dbo.enrollment AS e
            WHERE
                e.academic_year_id = @academicYearId
                AND e.class_id = @classId
                AND e.end_date IS NULL
        `);

    // Dung Set de loc nhanh va tranh trung ID.
    return new Set(
        result.recordset.map(
            row => String(row.enrollment_id)
        )
    );
}

module.exports = {
    getCurrentEnrollmentIds
};