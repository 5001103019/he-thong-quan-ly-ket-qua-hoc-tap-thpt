
/*
 * VT1-05 - SEED TAI KHOAN DEMO
 *
 * Tao 2 tai khoan:
 * - KHAO_THI: DEMO_G05_KT
 * - HOC_SINH: DEMO_G05_HS
 *
 * Nguyen tac:
 * - Mat khau lay tu backend/.env.
 * - Mat khau luu trong SQL Server duoi dang Argon2id.
 * - Khong tao tai khoan trung.
 * - Khong ghi de tai khoan da ton tai.
 * - Chi chay tren database phat trien.
 * - Dung transaction va rollback khi loi.
 */

"use strict";

const argon2 = require("argon2");

const {
    sql,
    connectDatabase
} = require("../src/config/database");

const {
    hashPassword
} = require("../src/services/auth-account-service");

const STUDENT_CODE = "DEMO_G05_2627_G10_S01";

// 1. Kiem tra mat khau trong file .env.
function getDemoPasswords() {
    const adminPassword =
        process.env.DEMO_G05_KT_PASSWORD;

    const studentPassword =
        process.env.DEMO_G05_HS_PASSWORD;

    if (
        typeof adminPassword !== "string" ||
        adminPassword.length < 16 ||
        typeof studentPassword !== "string" ||
        studentPassword.length < 16
    ) {
        throw new Error(
            "Thieu mat khau demo trong backend/.env " +
            "hoac mat khau ngan hon 16 ky tu."
        );
    }

    if (adminPassword === studentPassword) {
        throw new Error(
            "Hai tai khoan demo khong duoc dung chung mat khau."
        );
    }

    return {
        adminPassword,
        studentPassword
    };
}

// 2. Tim hoac tao vai tro.
async function ensureRole(transaction, code, name) {
    const existing = await new sql.Request(transaction)
        .input("code", sql.VarChar(30), code)
        .query(`
            SELECT role_id AS roleId
            FROM dbo.[role] WITH (UPDLOCK, HOLDLOCK)
            WHERE code = @code;
        `);

    if (existing.recordset.length > 0) {
        return Number(existing.recordset[0].roleId);
    }

    const created = await new sql.Request(transaction)
        .input("code", sql.VarChar(30), code)
        .input("name", sql.NVarChar(100), name)
        .query(`
            INSERT INTO dbo.[role] (
                code,
                name
            )
            VALUES (
                @code,
                @name
            );

            SELECT CAST(SCOPE_IDENTITY() AS BIGINT)
                AS roleId;
        `);

    console.log("[TAO MOI] Vai tro " + code);
    return Number(created.recordset[0].roleId);
}

// 3. Tim hoc sinh demo da duoc phan lop.
async function findDemoStudent(transaction) {
    const result = await new sql.Request(transaction)
        .input(
            "studentCode",
            sql.VarChar(30),
            STUDENT_CODE
        )
        .query(`
            SELECT s.student_id AS studentId
            FROM dbo.student s
            JOIN dbo.enrollment e
                ON e.student_id = s.student_id
            JOIN dbo.academic_year a
                ON a.academic_year_id =
                   e.academic_year_id
            JOIN dbo.[class] c
                ON c.class_id = e.class_id
            WHERE s.student_code = @studentCode
              AND a.code = '2026-2027'
              AND c.code = 'DEMO_10A1'
              AND e.end_date IS NULL;
        `);

    if (result.recordset.length !== 1) {
        throw new Error(
            "Khong tim thay hoc sinh demo " +
            "da phan lop hop le: " + STUDENT_CODE
        );
    }

    return Number(result.recordset[0].studentId);
}

// 4. Dam bao tai khoan ton tai dung thong tin.
async function ensureAccount(
    transaction,
    username,
    password,
    roleId,
    studentId
) {
    const existing = await new sql.Request(transaction)
        .input("username", sql.NVarChar(50), username)
        .query(`
            SELECT
                user_id AS userId,
                password_hash AS passwordHash,
                role_id AS roleId,
                student_id AS studentId,
                is_active AS isActive
            FROM dbo.app_user WITH (UPDLOCK, HOLDLOCK)
            WHERE username = @username;
        `);

    // Tai khoan da ton tai: kiem tra, khong ghi de.
    if (existing.recordset.length > 0) {
        const account = existing.recordset[0];

        const actualStudentId =
            account.studentId === null
                ? null
                : Number(account.studentId);

        if (
            Number(account.roleId) !== roleId ||
            actualStudentId !== studentId ||
            Number(account.isActive) !== 1
        ) {
            throw new Error(
                "Tai khoan ton tai nhung sai vai tro, " +
                "lien ket hoc sinh hoac trang thai: " +
                username
            );
        }

        // Mat khau .env phai khop voi hash da luu.
        const passwordMatches = await argon2.verify(
            account.passwordHash,
            password
        );

        if (!passwordMatches) {
            throw new Error(
                "Mat khau .env khong khop voi " +
                "tai khoan da ton tai: " + username
            );
        }

        console.log("[DA CO] Tai khoan " + username);
        return Number(account.userId);
    }

    // Tai khoan chua co: bam mat khau va tao moi.
    const passwordHash = await hashPassword(password);

    if (!passwordHash.startsWith("$argon2id$")) {
        throw new Error(
            "Khong bam duoc mat khau Argon2id."
        );
    }

    const created = await new sql.Request(transaction)
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
                AS userId;
        `);

    console.log("[TAO MOI] Tai khoan " + username);
    return Number(created.recordset[0].userId);
}

// 5. Chuong trinh chinh.
async function main() {
    let pool = null;
    let transaction = null;
    let started = false;

    try {
        if (
            String(process.env.NODE_ENV).toLowerCase() ===
            "production"
        ) {
            throw new Error(
                "Khong duoc seed tai khoan tren production."
            );
        }

        const passwords = getDemoPasswords();

        pool = await connectDatabase();

        const dbResult = await pool.request().query(`
            SELECT DB_NAME() AS databaseName;
        `);

        const databaseName =
            dbResult.recordset[0].databaseName;

        if (databaseName !== "thpt_grade_management") {
            throw new Error(
                "Dang ket noi sai database: " +
                databaseName
            );
        }

        console.log(
            "Ket noi database: " + databaseName
        );

        transaction = new sql.Transaction(pool);

        await transaction.begin(
            sql.ISOLATION_LEVEL.SERIALIZABLE
        );

        started = true;

        // Dam bao hai vai tro ton tai.
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

        // Lay hoc sinh da tao o Buoc 6.
        const studentId = await findDemoStudent(
            transaction
        );

        // Tao hoac kiem tra tai khoan Khao thi.
        await ensureAccount(
            transaction,
            "DEMO_G05_KT",
            passwords.adminPassword,
            adminRoleId,
            null
        );

        // Tao hoac kiem tra tai khoan Hoc sinh.
        await ensureAccount(
            transaction,
            "DEMO_G05_HS",
            passwords.studentPassword,
            studentRoleId,
            studentId
        );

        await transaction.commit();
        started = false;

        console.log("");
        console.log("==============================");
        console.log("SEED TAI KHOAN THANH CONG");
        console.log("==============================");

        console.log("KHAO_THI: DEMO_G05_KT");
        console.log("HOC_SINH: DEMO_G05_HS");
        console.log("Hoc sinh: " + STUDENT_CODE);

        console.log("");
        console.log(
            "Mat khau duoc luu rieng trong backend/.env."
        );
        console.log(
            "Khong hien thi hoac commit mat khau."
        );

    } catch (error) {
        if (started && transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error(
                    "Loi rollback:",
                    rollbackError.message
                );
            }
        }

        console.error("SEED TAI KHOAN THAT BAI!");
        console.error(error.message);
        process.exitCode = 1;

    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

main();
