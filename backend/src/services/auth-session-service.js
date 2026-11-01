
/*
 * =====================================================
 * VT1-04 - AUTH SESSION SERVICE
 * He thong quan ly ket qua hoc tap hoc sinh THPT
 * =====================================================
 *
 * Chuc nang:
 * 1. Tao phien dang nhap.
 * 2. Xac thuc phien dang nhap.
 * 3. Thu hoi phien khi dang xuat.
 * 4. Thu hoi tat ca phien cua tai khoan.
 *
 * Bao mat:
 * - Token ngau nhien 256-bit.
 * - Chi luu SHA-256 token trong SQL Server.
 * - Phien het han sau 8 gio.
 * - Khong chap nhan tai khoan bi vo hieu hoa.
 * - Khong ghi token vao log.
 */

const crypto = require("node:crypto");

const {
    sql,
    connectDatabase
} = require("../config/database");

const SESSION_COOKIE_NAME = "thpt_session";

const SESSION_TTL_MINUTES = 480;

// =====================================================
// KIEM TRA USER ID
// =====================================================

function validUserId(value) {
    return (
        Number.isSafeInteger(value) &&
        value > 0
    );
}

// =====================================================
// BAM TOKEN BANG SHA-256
// =====================================================

function hashToken(token) {
    if (
        typeof token !== "string" ||
        !/^[A-Za-z0-9_-]{43}$/.test(token)
    ) {
        return null;
    }

    const raw = Buffer.from(token, "base64url");

    if (raw.length !== 32) {
        return null;
    }

    return crypto
        .createHash("sha256")
        .update(raw)
        .digest();
}

// =====================================================
// 1. TAO SESSION
// Chi goi sau khi da xac minh mat khau thanh cong.
// Khong nhan userId truc tiep tu client.
// =====================================================

async function createSession({ userId }) {
    if (!validUserId(userId)) {
        throw new Error("User ID khong hop le.");
    }

    const token = crypto
        .randomBytes(32)
        .toString("base64url");

    const tokenHash = hashToken(token);

    const pool = await connectDatabase();

    const result = await pool.request()
        .input("userId", sql.BigInt, userId)
        .input(
            "tokenHash",
            sql.VarBinary(32),
            tokenHash
        )
        .input(
            "ttl",
            sql.Int,
            SESSION_TTL_MINUTES
        )
        .query(`
            INSERT INTO dbo.auth_session (
                user_id,
                token_hash,
                expires_at
            )
            SELECT
                u.user_id,
                @tokenHash,
                DATEADD(
                    MINUTE,
                    @ttl,
                    SYSDATETIMEOFFSET()
                )
            FROM dbo.app_user u
            JOIN dbo.[role] r
                ON r.role_id = u.role_id
            WHERE u.user_id = @userId
              AND u.is_active = 1
              AND (
                    (
                        r.code = 'KHAO_THI'
                        AND u.student_id IS NULL
                    )
                    OR
                    (
                        r.code = 'HOC_SINH'
                        AND u.student_id IS NOT NULL
                    )
              );

            IF @@ROWCOUNT <> 1
            BEGIN
                THROW 51402,
                    'Tai khoan khong hop le.',
                    1;
            END;

            SELECT
                CAST(SCOPE_IDENTITY() AS BIGINT)
                AS session_id;
        `);

    return {
        sessionId: result.recordset[0].session_id,
        token,
        expiresInSeconds: SESSION_TTL_MINUTES * 60
    };
}

// =====================================================
// 2. KIEM TRA SESSION
// Tra ve danh tinh tu database.
// Khong tin role hoac studentId do client gui.
// =====================================================

async function getSession(token) {
    const tokenHash = hashToken(token);

    if (!tokenHash) {
        return null;
    }

    const pool = await connectDatabase();

    const result = await pool.request()
        .input(
            "tokenHash",
            sql.VarBinary(32),
            tokenHash
        )
        .query(`
            SELECT TOP (1)
                s.session_id,
                u.user_id,
                u.username,
                u.student_id,
                r.code AS role_code
            FROM dbo.auth_session s
            JOIN dbo.app_user u
                ON u.user_id = s.user_id
            JOIN dbo.[role] r
                ON r.role_id = u.role_id
            WHERE s.token_hash = @tokenHash
              AND s.revoked_at IS NULL
              AND s.expires_at > SYSDATETIMEOFFSET()
              AND u.is_active = 1
              AND (
                    (
                        r.code = 'KHAO_THI'
                        AND u.student_id IS NULL
                    )
                    OR
                    (
                        r.code = 'HOC_SINH'
                        AND u.student_id IS NOT NULL
                    )
              );
        `);

    if (result.recordset.length !== 1) {
        return null;
    }

    return result.recordset[0];
}

// =====================================================
// 3. THU HOI MOT SESSION
// Su dung khi dang xuat.
// =====================================================

async function revokeSession(token) {
    const tokenHash = hashToken(token);

    if (!tokenHash) {
        return false;
    }

    const pool = await connectDatabase();

    const result = await pool.request()
        .input(
            "tokenHash",
            sql.VarBinary(32),
            tokenHash
        )
        .query(`
            UPDATE dbo.auth_session
            SET revoked_at = SYSDATETIMEOFFSET()
            WHERE token_hash = @tokenHash
              AND revoked_at IS NULL;
        `);

    return result.rowsAffected[0] === 1;
}

// =====================================================
// 4. THU HOI TAT CA SESSION CUA USER
// Goi khi tai khoan bi vo hieu hoa.
// =====================================================

async function revokeAllUserSessions(userId) {
    if (!validUserId(userId)) {
        throw new Error("User ID khong hop le.");
    }

    const pool = await connectDatabase();

    const result = await pool.request()
        .input("userId", sql.BigInt, userId)
        .query(`
            UPDATE dbo.auth_session
            SET revoked_at = SYSDATETIMEOFFSET()
            WHERE user_id = @userId
              AND revoked_at IS NULL;
        `);

    return result.rowsAffected[0] || 0;
}

// =====================================================
// XUAT CAC HAM CHO BACKEND
// =====================================================

module.exports = {
    SESSION_COOKIE_NAME,
    SESSION_TTL_MINUTES,
    createSession,
    getSession,
    revokeSession,
    revokeAllUserSessions
};
