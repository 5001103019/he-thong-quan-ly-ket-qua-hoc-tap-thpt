
/*
 * ==================================================
 * VT1-04 - TAO TAI KHOAN DEMO
 * He thong quan ly ket qua hoc tap hoc sinh THPT
 * ==================================================
 *
 * Tao 2 tai khoan:
 * - KHAO_THI: khong lien ket hoc sinh
 * - HOC_SINH: lien ket voi mot hoc sinh demo
 *
 * Bao mat:
 * - Mat khau ngau nhien.
 * - Bam Argon2id truoc khi luu.
 * - Khong luu mat khau goc trong database.
 * - Khong sua tai khoan da ton tai.
 * - Chi chay tren database phat trien cuc bo.
 */

"use strict";

const crypto = require("node:crypto");

const {
    sql,
    connectDatabase
} = require("../src/config/database");

const {
    hashPassword
} = require("../src/services/auth-account-service");

// Tim role; neu chua co thi tao moi.
async function ensureRole(transaction, code, name) {
    const existing = await new sql.Request(transaction)
        .input("code", sql.VarChar(30), code)
        .query(`
            SELECT role_id
            FROM dbo.[role]
            WHERE code = @code;
        `);

    if (existing.recordset.length === 1) {
        return Number(existing.recordset[0].role_id);
    }

    const created = await new sql.Request(transaction)
        .input("code", sql.VarChar(30), code)
        .input("name", sql.NVarChar(100), name)
        .query(`
            INSERT INTO dbo.[role] (code, name)
            VALUES (@code, @name);

            SELECT CAST(SCOPE_IDENTITY() AS BIGINT)
                AS role_id;
        `);

    return Number(created.recordset[0].role_id);
}

// Tao tai khoan voi password_hash da bam.
async function createAccount(
    transaction,
    username,
    passwordHash,
    roleId,
    studentId
) {
    const result = await new sql.Request(transaction)
        .input("username", sql.NVarChar(50), username)
        .input(
            "passwordHash",
            sql.VarChar(255),
            passwordHash
        )
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
            VALUES (
                @username,
                @passwordHash,
                @roleId,
                @studentId,
                1
            );

            SELECT CAST(SCOPE_IDENTITY() AS BIGINT)
                AS user_id;
        `);

    return Number(result.recordset[0].user_id);
}

// ==================================================
// HAM CHINH
// ==================================================

async function main() {
    let pool = null;
    let transaction = null;
    let started = false;

    try {
        // 1. Ket noi database.
        if (process.env.NODE_ENV === "production") {
            throw new Error(
                "Khong duoc tao tai khoan demo tren production."
            );
        }

        pool = await connectDatabase();

        const dbResult = await pool.request().query(`
            SELECT DB_NAME() AS database_name;
        `);

        if (
            dbResult.recordset[0].database_name !==
            "thpt_grade_management"
        ) {
            throw new Error(
                "Dang ket noi sai database."
            );
        }

        console.log("PASS 1: Ket noi dung database.");

        // 2. Sinh ma rieng va mat khau ngau nhien.
        const token = crypto
            .randomBytes(5)
            .toString("hex")
            .toUpperCase();

        const adminUsername = "DEMO_KT_" + token;
        const studentUsername = "DEMO_HS_" + token;
        const studentCode = "DEMO_S_" + token;

        const adminPassword = crypto
            .randomBytes(24)
            .toString("base64url");

        const studentPassword = crypto
            .randomBytes(24)
            .toString("base64url");

        // 3. Bam mat khau bang Argon2id.
        const adminHash = await hashPassword(
            adminPassword
        );

        const studentHash = await hashPassword(
            studentPassword
        );

        if (
            !adminHash.startsWith("$argon2id$") ||
            !studentHash.startsWith("$argon2id$")
        ) {
            throw new Error(
                "Khong bam duoc mat khau Argon2id."
            );
        }

        // 4. Bat dau transaction.
        transaction = new sql.Transaction(pool);

        await transaction.begin(
            sql.ISOLATION_LEVEL.SERIALIZABLE
        );

        started = true;

        // 5. Dam bao hai role ton tai.
        const adminRoleId = await ensureRole(
            transaction,
            "KHAO_THI",
            "Phong Khao thi"
        );

        const studentRoleId = await ensureRole(
            transaction,
            "HOC_SINH",
            "Hoc sinh"
        );

        console.log("PASS 2: Hai role da san sang.");

        // 6. Tao hoc sinh demo.
        const studentResult =
            await new sql.Request(transaction)
                .input(
                    "studentCode",
                    sql.VarChar(30),
                    studentCode
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
                        N'Hoc sinh demo xac thuc',
                        '2010-05-20',
                        'ACTIVE'
                    );

                    SELECT
                        CAST(SCOPE_IDENTITY() AS BIGINT)
                        AS student_id;
                `);

        const studentId = Number(
            studentResult.recordset[0].student_id
        );

        console.log(
            "PASS 3: Da tao ho so hoc sinh demo."
        );

        // 7. Tao tai khoan KHAO_THI.
        const adminId = await createAccount(
            transaction,
            adminUsername,
            adminHash,
            adminRoleId,
            null
        );

        // 8. Tao tai khoan HOC_SINH.
        const studentUserId = await createAccount(
            transaction,
            studentUsername,
            studentHash,
            studentRoleId,
            studentId
        );

        if (
            !Number.isSafeInteger(adminId) ||
            !Number.isSafeInteger(studentUserId)
        ) {
            throw new Error(
                "Khong tao duoc ID tai khoan."
            );
        }

        console.log(
            "PASS 4: Da tao hai tai khoan demo."
        );

        // 9. COMMIT khi tat ca thanh cong.
        await transaction.commit();
        started = false;

        console.log(
            "PASS 5: Da COMMIT du lieu demo."
        );

        console.log("");
        console.log("====================================");
        console.log("TAO TAI KHOAN DEMO THANH CONG!");
        console.log("====================================");

        // Chi hien thi mat khau mot lan
        // tren CMD cuc bo, khong ghi vao file.
        console.log("");
        console.log("TAI KHOAN KHAO THI:");
        console.log("Username:", adminUsername);
        console.log("Password:", adminPassword);

        console.log("");
        console.log("TAI KHOAN HOC SINH:");
        console.log("Username:", studentUsername);
        console.log("Password:", studentPassword);
        console.log("Student code:", studentCode);

        console.log("");
        console.log(
            "LUU Y: Khong chia se mat khau, " +
            "khong commit mat khau len GitHub."
        );

    } catch (error) {
        if (started && transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error(
                    "Khong xac nhan duoc ROLLBACK:",
                    rollbackError.message
                );
            }
        }

        console.error("TAO TAI KHOAN THAT BAI!");
        console.error(error.message);
        process.exitCode = 1;

    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

main();
