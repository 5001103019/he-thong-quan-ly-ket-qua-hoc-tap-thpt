
const { sql, connectDatabase } = require("../config/database");

// Lay danh sach tat ca cac khoi
async function getAllGrades() {
    const pool = await connectDatabase();

    const result = await pool.request().query(`
        SELECT
            grade_id AS gradeId,
            grade_number AS gradeNumber
        FROM dbo.grade
        ORDER BY grade_number ASC
    `);

    return result.recordset;
}

// Tim khoi theo ID
async function getGradeById(id) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("id", sql.SmallInt, id)
        .query(`
            SELECT
                grade_id AS gradeId,
                grade_number AS gradeNumber
            FROM dbo.grade
            WHERE grade_id = @id
        `);

    return result.recordset[0] || null;
}

// Them khoi moi
async function createGrade(gradeNumber) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("gradeNumber", sql.SmallInt, gradeNumber)
        .query(`
            INSERT INTO dbo.grade (
                grade_number
            )
            OUTPUT
                INSERTED.grade_id AS gradeId,
                INSERTED.grade_number AS gradeNumber
            VALUES (
                @gradeNumber
            )
        `);

    return result.recordset[0];
}

/*
 * Cap nhat so khoi theo ID.
 * Khong cho phep thay doi neu khoi da co lop hoc.
 */
async function updateGrade(id, gradeNumber) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("id", sql.SmallInt, id)
        .input("gradeNumber", sql.SmallInt, gradeNumber)
        .query(`
            UPDATE g
            SET grade_number = @gradeNumber
            OUTPUT
                INSERTED.grade_id AS gradeId,
                INSERTED.grade_number AS gradeNumber
            FROM dbo.grade AS g
            WHERE g.grade_id = @id
              AND NOT EXISTS (
                  SELECT 1
                  FROM dbo.[class] AS c WITH (UPDLOCK, HOLDLOCK)
                  WHERE c.grade_id = g.grade_id
              )
        `);

    // Tra ve null neu khong cap nhat duoc
    return result.recordset[0] || null;
}

// Xuat cac ham de Controller su dung
module.exports = {
    getAllGrades,
    getGradeById,
    createGrade,
    updateGrade
};
