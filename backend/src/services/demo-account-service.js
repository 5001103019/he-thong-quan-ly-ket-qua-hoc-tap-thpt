
"use strict";


const sql = require("mssql/msnodesqlv8");
const { connectDatabase } = require("../config/database");
const { hashPassword } = require("./auth-account-service");
const {
    revokeAllUserSessions
} = require("./auth-session-service");

// Tao loi co ma HTTP de API xu ly.
function apiError(status, message) {
    const error = new Error(message);
    error.status = status;
    return error;
}

// Kiem tra ID duoc truyen vao.
function parseId(value, fieldName) {
    const text = String(value ?? "");

    if (!/^[1-9][0-9]*$/.test(text)) {
        throw apiError(400, `${fieldName} khong hop le.`);
    }

    const id = Number(text);

    if (!Number.isSafeInteger(id)) {
        throw apiError(400, `${fieldName} qua lon.`);
    }

    return id;
}

// Thuc hien thay doi du lieu trong transaction.
async function runTransaction(callback) {
    const pool = await connectDatabase();
    const transaction = new sql.Transaction(pool);

    await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);

    try {
        const result = await callback(transaction);
        await transaction.commit();
        return result;
    } catch (error) {
        try {
            await transaction.rollback();
        } catch (_) {
            // Transaction co the da duoc rollback.
        }

        if (error.number === 2601 || error.number === 2627) {
            throw apiError(
                409,
                "Username hoac lien ket hoc sinh da ton tai."
            );
        }

        throw error;
    }
}

// 1. Tao tai khoan demo.
// Role: KHAO_THI hoac HOC_SINH.
// Hoc sinh co the lien ket ngay hoac lien ket sau.
async function createDemoAccount(data) {
    const username =
        typeof data.username === "string"
            ? data.username.trim()
            : "";

    const password = data.password;
    const roleCode = data.roleCode;

    if (!/^[A-Za-z0-9._-]{3,50}$/.test(username)) {
        throw apiError(400, "Username khong hop le.");
    }

    if (
        typeof password !== "string" ||
        password.length < 12 ||
        password.length > 128
    ) {
        throw apiError(
            400,
            "Mat khau phai co tu 12 den 128 ky tu."
        );
    }

    if (!["KHAO_THI", "HOC_SINH"].includes(roleCode)) {
        throw apiError(400, "Vai tro khong hop le.");
    }

    if (roleCode === "KHAO_THI" && data.studentId != null) {
        throw apiError(
            400,
            "Tai khoan Khao thi khong duoc lien ket hoc sinh."
        );
    }

    const studentId =
        data.studentId == null
            ? null
            : parseId(data.studentId, "studentId");

    // Chi luu mat khau da bam, khong luu mat khau goc.
    const passwordHash = await hashPassword(password);

    return runTransaction(async (transaction) => {
        const roleResult = await new sql.Request(transaction)
            .input("roleCode", sql.VarChar(30), roleCode)
            .query(`
                SELECT role_id
                FROM dbo.[role]
                WHERE code = @roleCode
            `);

        if (roleResult.recordset.length === 0) {
            throw apiError(
                400,
                "Vai tro chua ton tai trong database."
            );
        }

        if (studentId !== null) {
            const studentResult =
                await new sql.Request(transaction)
                    .input("studentId", sql.BigInt, studentId)
                    .query(`
                        SELECT student_id
                        FROM dbo.student WITH (UPDLOCK, HOLDLOCK)
                        WHERE student_id = @studentId
                    `);

            if (studentResult.recordset.length === 0) {
                throw apiError(404, "Khong tim thay hoc sinh.");
            }
        }

        const roleId = roleResult.recordset[0].role_id;

        const result = await new sql.Request(transaction)
            .input("username", sql.NVarChar(50), username)
            .input("passwordHash", sql.VarChar(255), passwordHash)
            .input("roleId", sql.BigInt, roleId)
            .input("studentId", sql.BigInt, studentId)
            .query(`
                INSERT INTO dbo.app_user (
                    username,
                    password_hash,
                    role_id,
                    student_id,
                    is_active
                )
                OUTPUT INSERTED.user_id AS user_id
                VALUES (
                    @username,
                    @passwordHash,
                    @roleId,
                    @studentId,
                    1
                )
            `);

        return {
            userId: String(result.recordset[0].user_id),
            username,
            roleCode,
            studentId:
                studentId === null ? null : String(studentId),
            isActive: true
        };
    });
}

// 2. Lien ket tai khoan Hoc sinh voi ho so hoc sinh.
// Khong cho phep chiem lien ket cua hoc sinh khac.
async function linkStudentAccount(userIdValue, studentIdValue) {
    const userId = parseId(userIdValue, "userId");
    const studentId = parseId(studentIdValue, "studentId");

    return runTransaction(async (transaction) => {
        const userResult = await new sql.Request(transaction)
            .input("userId", sql.BigInt, userId)
            .query(`
                SELECT
                    u.user_id,
                    u.student_id,
                    u.is_active,
                    r.code AS role_code
                FROM dbo.app_user AS u
                    WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN dbo.[role] AS r
                    ON r.role_id = u.role_id
                WHERE u.user_id = @userId
            `);

        const account = userResult.recordset[0];

        if (!account) {
            throw apiError(404, "Khong tim thay tai khoan.");
        }

        if (!account.is_active) {
            throw apiError(409, "Tai khoan da bi vo hieu hoa.");
        }

        if (account.role_code !== "HOC_SINH") {
            throw apiError(
                400,
                "Chi duoc lien ket tai khoan Hoc sinh."
            );
        }

        if (
            account.student_id != null &&
            String(account.student_id) !== String(studentId)
        ) {
            throw apiError(
                409,
                "Tai khoan da lien ket voi hoc sinh khac."
            );
        }

        const studentResult = await new sql.Request(transaction)
            .input("studentId", sql.BigInt, studentId)
            .query(`
                SELECT student_id
                FROM dbo.student WITH (UPDLOCK, HOLDLOCK)
                WHERE student_id = @studentId
            `);

        if (studentResult.recordset.length === 0) {
            throw apiError(404, "Khong tim thay hoc sinh.");
        }

        await new sql.Request(transaction)
            .input("userId", sql.BigInt, userId)
            .input("studentId", sql.BigInt, studentId)
            .query(`
                UPDATE dbo.app_user
                SET student_id = @studentId
                WHERE user_id = @userId
            `);

        return {
            userId: String(userId),
            studentId: String(studentId),
            linked: true
        };
    });
}

// 3. Vo hieu hoa tai khoan.
// Khong xoa Student, Enrollment hay du lieu diem.
async function disableDemoAccount(userIdValue, actorUserIdValue) {
    const userId = parseId(userIdValue, "userId");
    const actorUserId = parseId(actorUserIdValue, "actorUserId");

    if (userId === actorUserId) {
        throw apiError(
            403,
            "Khong duoc tu vo hieu hoa tai khoan dang dung."
        );
    }

    const result = await runTransaction(async (transaction) => {
        const userResult = await new sql.Request(transaction)
            .input("userId", sql.BigInt, userId)
            .query(`
                SELECT user_id
                FROM dbo.app_user WITH (UPDLOCK, HOLDLOCK)
                WHERE user_id = @userId
            `);

        if (userResult.recordset.length === 0) {
            throw apiError(404, "Khong tim thay tai khoan.");
        }

        await new sql.Request(transaction)
            .input("userId", sql.BigInt, userId)
            .query(`
                UPDATE dbo.app_user
                SET is_active = 0
                WHERE user_id = @userId
            `);

        return {
            userId: String(userId),
            isActive: false
        };
    });

    // Thu hoi cac phien cua tai khoan bi vo hieu hoa.
    await revokeAllUserSessions(userId);

    return result;
}

 // 4. Tra cuu tai khoan Hoc sinh.
 // Co the loc theo studentId.
 // Khong tra mat khau hoac password_hash.
 async function getDemoAccounts(studentIdValue) {
     let studentId = null;

     if (studentIdValue !== undefined) {
         studentId = parseId(studentIdValue, "studentId");
     }

     const pool = await connectDatabase();

     const result = await pool.request()
         .input("studentId", sql.BigInt, studentId)
         .query(`
             SELECT
                 u.user_id,
                 u.username,
                 r.code AS role_code,
                 u.student_id,
                 u.is_active,
                 s.student_code,
                 s.full_name
             FROM dbo.app_user AS u
             INNER JOIN dbo.[role] AS r
                 ON r.role_id = u.role_id
             LEFT JOIN dbo.student AS s
                 ON s.student_id = u.student_id
             WHERE r.code = 'HOC_SINH'
               AND (
                   @studentId IS NULL
                   OR u.student_id = @studentId
               )
             ORDER BY u.user_id
         `);

     return result.recordset.map((row) => ({
         userId: String(row.user_id),
         username: row.username,
         roleCode: row.role_code,
         studentId:
             row.student_id == null
                 ? null
                 : String(row.student_id),
         studentCode: row.student_code ?? null,
         fullName: row.full_name ?? null,
         isActive: Boolean(row.is_active)
     }));
 }


module.exports = {
    createDemoAccount,
    linkStudentAccount,
    disableDemoAccount,
    getDemoAccounts
};
