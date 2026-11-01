
const { sql, connectDatabase } = require("../config/database");

// Lay danh sach tat ca nien khoa
async function getAllAcademicYears() {
    const pool = await connectDatabase();

    const result = await pool.request().query(`
        SELECT
            academic_year_id AS academicYearId,
            code,
            start_year AS startYear,
            end_year AS endYear,
            status
        FROM dbo.academic_year
        ORDER BY start_year DESC
    `);

    return result.recordset;
}

// Tim nien khoa theo ID
async function getAcademicYearById(id) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("id", sql.BigInt, id)
        .query(`
            SELECT
                academic_year_id AS academicYearId,
                code,
                start_year AS startYear,
                end_year AS endYear,
                status
            FROM dbo.academic_year
            WHERE academic_year_id = @id
        `);

    return result.recordset[0] || null;
}

// Them nien khoa moi
async function createAcademicYear(data) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("code", sql.VarChar(9), data.code)
        .input("startYear", sql.SmallInt, data.startYear)
        .input("endYear", sql.SmallInt, data.endYear)
        .input("status", sql.VarChar(20), data.status)
        .query(`
            INSERT INTO dbo.academic_year (
                code,
                start_year,
                end_year,
                status
            )
            OUTPUT
                INSERTED.academic_year_id AS academicYearId,
                INSERTED.code,
                INSERTED.start_year AS startYear,
                INSERTED.end_year AS endYear,
                INSERTED.status
            VALUES (
                @code,
                @startYear,
                @endYear,
                @status
            )
        `);

    return result.recordset[0];
}

// Cap nhat thong tin nien khoa theo ID
async function updateAcademicYear(id, data) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("id", sql.BigInt, id)
        .input("code", sql.VarChar(9), data.code)
        .input("startYear", sql.SmallInt, data.startYear)
        .input("endYear", sql.SmallInt, data.endYear)
        .input("status", sql.VarChar(20), data.status)
        .query(`
            UPDATE dbo.academic_year
            SET
                code = @code,
                start_year = @startYear,
                end_year = @endYear,
                status = @status
            OUTPUT
                INSERTED.academic_year_id AS academicYearId,
                INSERTED.code,
                INSERTED.start_year AS startYear,
                INSERTED.end_year AS endYear,
                INSERTED.status
            WHERE academic_year_id = @id
        `);

    return result.recordset[0] || null;
}

// Xuat cac ham de Controller su dung
module.exports = {
    getAllAcademicYears,
    getAcademicYearById,
    createAcademicYear,
    updateAcademicYear
};
