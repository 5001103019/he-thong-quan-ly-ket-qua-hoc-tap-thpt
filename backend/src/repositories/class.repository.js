
const { sql, connectDatabase } = require("../config/database");

/*
 * Lay danh sach lop hoc.
 * Co the loc theo nien khoa va khoi.
 */
async function getAllClasses(academicYearId = null, gradeId = null) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("academicYearId", sql.BigInt, academicYearId)
        .input("gradeId", sql.SmallInt, gradeId)
        .query(`
            SELECT
                c.class_id AS classId,
                c.academic_year_id AS academicYearId,
                a.code AS academicYearCode,
                c.grade_id AS gradeId,
                g.grade_number AS gradeNumber,
                c.code,
                c.name,
                c.status
            FROM dbo.[class] AS c
            INNER JOIN dbo.academic_year AS a
                ON c.academic_year_id = a.academic_year_id
            INNER JOIN dbo.grade AS g
                ON c.grade_id = g.grade_id
            WHERE
                (@academicYearId IS NULL
                    OR c.academic_year_id = @academicYearId)
                AND
                (@gradeId IS NULL
                    OR c.grade_id = @gradeId)
            ORDER BY
                a.start_year DESC,
                g.grade_number ASC,
                c.code ASC
        `);

    return result.recordset;
}

// Tim lop hoc theo ID
async function getClassById(id) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("id", sql.BigInt, id)
        .query(`
            SELECT
                c.class_id AS classId,
                c.academic_year_id AS academicYearId,
                a.code AS academicYearCode,
                c.grade_id AS gradeId,
                g.grade_number AS gradeNumber,
                c.code,
                c.name,
                c.status
            FROM dbo.[class] AS c
            INNER JOIN dbo.academic_year AS a
                ON c.academic_year_id = a.academic_year_id
            INNER JOIN dbo.grade AS g
                ON c.grade_id = g.grade_id
            WHERE c.class_id = @id
        `);

    return result.recordset[0] || null;
}

// Them lop hoc moi
async function createClass(data) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("academicYearId", sql.BigInt, data.academicYearId)
        .input("gradeId", sql.SmallInt, data.gradeId)
        .input("code", sql.VarChar(20), data.code)
        .input("name", sql.NVarChar(100), data.name)
        .input("status", sql.VarChar(20), data.status)
        .query(`
            INSERT INTO dbo.[class] (
                academic_year_id,
                grade_id,
                code,
                name,
                status
            )
            OUTPUT
                INSERTED.class_id AS classId,
                INSERTED.academic_year_id AS academicYearId,
                INSERTED.grade_id AS gradeId,
                INSERTED.code,
                INSERTED.name,
                INSERTED.status
            VALUES (
                @academicYearId,
                @gradeId,
                @code,
                @name,
                @status
            )
        `);

    return result.recordset[0];
}

/*
 * Cap nhat thong tin lop hoc.
 * Khong cho doi nien khoa hoac khoi
 * neu lop da co du lieu phan lop.
 */
async function updateClass(id, data) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("id", sql.BigInt, id)
        .input("academicYearId", sql.BigInt, data.academicYearId)
        .input("gradeId", sql.SmallInt, data.gradeId)
        .input("code", sql.VarChar(20), data.code)
        .input("name", sql.NVarChar(100), data.name)
        .input("status", sql.VarChar(20), data.status)
        .query(`
            UPDATE c
            SET
                academic_year_id = @academicYearId,
                grade_id = @gradeId,
                code = @code,
                name = @name,
                status = @status
            OUTPUT
                INSERTED.class_id AS classId,
                INSERTED.academic_year_id AS academicYearId,
                INSERTED.grade_id AS gradeId,
                INSERTED.code,
                INSERTED.name,
                INSERTED.status
            FROM dbo.[class] AS c
            WHERE c.class_id = @id
              AND (
                  (
                      c.academic_year_id = @academicYearId
                      AND c.grade_id = @gradeId
                  )
                  OR NOT EXISTS (
                      SELECT 1
                      FROM dbo.enrollment AS e
                      WHERE e.class_id = c.class_id
                  )
              )
        `);

    return result.recordset[0] || null;
}

// Xuat cac ham de Controller su dung
module.exports = {
    getAllClasses,
    getClassById,
    createClass,
    updateClass
};
