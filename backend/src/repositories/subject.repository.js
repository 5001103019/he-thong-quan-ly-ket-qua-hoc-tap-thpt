
const { sql, connectDatabase } = require("../config/database");

/*
 * Lay danh sach tat ca mon hoc.
 * Bao gom ca mon ACTIVE va INACTIVE.
 */
async function getAllSubjects() {
    const pool = await connectDatabase();

    const result = await pool.request().query(`
        SELECT
            subject_id AS subjectId,
            code,
            name,
            status,
            created_at AS createdAt
        FROM dbo.subject
        ORDER BY code ASC
    `);

    return result.recordset;
}

/*
 * Lay thong tin mot mon hoc theo ID.
 */
async function getSubjectById(id) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("id", sql.BigInt, id)
        .query(`
            SELECT
                subject_id AS subjectId,
                code,
                name,
                status,
                created_at AS createdAt
            FROM dbo.subject
            WHERE subject_id = @id
        `);

    return result.recordset[0] || null;
}

/*
 * Them mon hoc moi vao SQL Server.
 * Du lieu dau vao duoc kiem tra tai Controller.
 */
async function createSubject(data) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("code", sql.VarChar(20), data.code)
        .input("name", sql.NVarChar(100), data.name)
        .input("status", sql.VarChar(20), data.status)
        .query(`
            INSERT INTO dbo.subject (
                code,
                name,
                status
            )
            OUTPUT
                INSERTED.subject_id AS subjectId,
                INSERTED.code,
                INSERTED.name,
                INSERTED.status,
                INSERTED.created_at AS createdAt
            VALUES (
                @code,
                @name,
                @status
            )
        `);

    return result.recordset[0];
}

/*
 * Cap nhat thong tin mon hoc theo ID.
 * Khong thay doi subject_id.
 * Khong xoa du lieu mon hoc va diem lich su.
 */
async function updateSubject(id, data) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("id", sql.BigInt, id)
        .input("code", sql.VarChar(20), data.code)
        .input("name", sql.NVarChar(100), data.name)
        .input("status", sql.VarChar(20), data.status)
        .query(`
            UPDATE dbo.subject
            SET
                code = @code,
                name = @name,
                status = @status
            OUTPUT
                INSERTED.subject_id AS subjectId,
                INSERTED.code,
                INSERTED.name,
                INSERTED.status,
                INSERTED.created_at AS createdAt
            WHERE subject_id = @id
        `);

    return result.recordset[0] || null;
}

// Xuat cac ham de Controller su dung
module.exports = {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject
};
