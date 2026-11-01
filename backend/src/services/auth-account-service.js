
/*
 * =====================================================
 * VT1-04 - AUTH ACCOUNT SERVICE
 * He thong quan ly ket qua hoc tap hoc sinh THPT
 * =====================================================
 *
 * Chuc nang:
 * 1. Bam mat khau bang Argon2id.
 * 2. Kiem tra mat khau.
 * 3. Tim tai khoan trong SQL Server.
 * 4. Xac minh tai khoan va vai tro.
 *
 * Nguyen tac bao mat:
 * - Khong luu mat khau dang van ban.
 * - Khong ghi mat khau vao log.
 * - Khong tra password_hash ra API.
 * - Khong cho tai khoan INACTIVE dang nhap.
 * - Chi chap nhan 2 role KHAO_THI va HOC_SINH.
 * - Tai khoan hoc sinh phai co student_id.
 */

const argon2 = require("argon2");
const crypto = require("node:crypto");

const {
    sql,
    connectDatabase
} = require("../config/database");

// =====================================================
// 1. CAU HINH BAM MAT KHAU
// =====================================================

const ARGON2_OPTIONS = {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
};

// Dung cho truong hop username khong ton tai.
// Giup han che su khac biet thoi gian xu ly.

const dummyPassword = crypto
    .randomBytes(24)
    .toString("hex");

let dummyHashPromise = null;

function getDummyHash() {
    if (!dummyHashPromise) {
        dummyHashPromise = argon2.hash(
            dummyPassword,
            ARGON2_OPTIONS
        ).catch(error => {
            dummyHashPromise = null;
            throw error;
        });
    }

    return dummyHashPromise;
}

// =====================================================
// 2. KIEM TRA MAT KHAU MOI
// =====================================================

function validateNewPassword(password) {
    if (typeof password !== "string") {
        throw new Error(
            "Mat khau phai la chuoi ky tu."
        );
    }

    const length = Array.from(password).length;
    const bytes = Buffer.byteLength(password, "utf8");

    if (
        length < 12 ||
        length > 128 ||
        bytes > 512
    ) {
        throw new Error(
            "Mat khau phai tu 12 den 128 ky tu " +
            "va khong vuot qua 512 byte."
        );
    }
}

// =====================================================
// 3. BAM MAT KHAU ARGON2ID
// Su dung khi tao tai khoan demo.
// =====================================================

async function hashPassword(password) {
    validateNewPassword(password);

    return await argon2.hash(
        password,
        ARGON2_OPTIONS
    );
}

// =====================================================
// 4. KIEM TRA MAT KHAU
// =====================================================

async function verifyPassword(
    password,
    passwordHash
) {
    if (
        typeof password !== "string" ||
        typeof passwordHash !== "string" ||
        Buffer.byteLength(password, "utf8") > 512 ||
        !passwordHash.startsWith("$argon2id$")
    ) {
        return false;
    }

    try {
        return await argon2.verify(
            passwordHash,
            password
        );
    } catch (error) {
        // Khong tiet lo loi hash ra client.
        return false;
    }
}

// =====================================================
// 5. XAC THUC TAI KHOAN
//
// Ham nay chi kiem tra username va password.
// Chua tao session.
//
// Session se duoc tao o API login sau khi
// ham nay tra ve tai khoan hop le.
// =====================================================

async function authenticateAccount({
    username,
    password
}) {
    // 5.1. Kiem tra dau vao
    if (
        typeof username !== "string" ||
        typeof password !== "string"
    ) {
        return null;
    }

    const normalizedUsername = username.trim();

    if (
        normalizedUsername.length === 0 ||
        normalizedUsername.length > 50 ||
        password.length === 0 ||
        Buffer.byteLength(password, "utf8") > 512
    ) {
        return null;
    }

    // 5.2. Tim tai khoan trong SQL Server
    const pool = await connectDatabase();

    const result = await pool.request()
        .input(
            "username",
            sql.NVarChar(50),
            normalizedUsername
        )
        .query(`
            SELECT TOP (1)
                u.user_id,
                u.username,
                u.password_hash,
                u.student_id,
                u.is_active,
                r.code AS role_code
            FROM dbo.app_user u
            JOIN dbo.[role] r
                ON r.role_id = u.role_id
            WHERE u.username = @username;
        `);

    const account =
        result.recordset.length === 1
            ? result.recordset[0]
            : null;

    // 5.3. Kiem tra mat khau.
    // Neu tai khoan khong ton tai, van thuc hien
    // phep bam doi chieu voi hash gia.

    const storedHash =
        account &&
        typeof account.password_hash === "string" &&
        account.password_hash.startsWith("$argon2id$")
            ? account.password_hash
            : await getDummyHash();

    const passwordCorrect =
        await verifyPassword(password, storedHash);

    if (!account || !passwordCorrect) {
        return null;
    }

    // 5.4. Khong cho tai khoan bi vo hieu hoa
    if (!account.is_active) {
        return null;
    }

    // 5.5. Kiem tra quan he tai khoan - role
    if (account.role_code === "KHAO_THI") {
        if (account.student_id !== null) {
            return null;
        }
    } else if (account.role_code === "HOC_SINH") {
        if (account.student_id === null) {
            return null;
        }
    } else {
        return null;
    }

    // 5.6. Chi tra ve thong tin can thiet.
    // Khong tra ve password_hash.
    return {
        userId: Number(account.user_id),
        username: account.username,
        roleCode: account.role_code,
        studentId: account.student_id === null
            ? null
            : Number(account.student_id)
    };
}

// =====================================================
// 6. XUAT HAM
// =====================================================

module.exports = {
    hashPassword,
    verifyPassword,
    authenticateAccount
};
