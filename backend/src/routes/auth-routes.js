
/*
 * =====================================================
 * VT1-04 - AUTH ROUTES
 * He thong quan ly ket qua hoc tap hoc sinh THPT
 * =====================================================
 *
 * POST /login  - Dang nhap
 * POST /logout - Dang xuat
 * GET  /me     - Xem tai khoan dang dang nhap
 *
 * Nguyen tac:
 * - Xac minh mat khau bang Argon2id.
 * - Luu session trong SQL Server.
 * - Token phien chi nam trong cookie HttpOnly.
 * - Khong tra password_hash hoac token trong JSON.
 * - Khong tin role va studentId tu client.
 * - Tu choi phien het han hoac bi thu hoi.
 */

const express = require("express");
const cookieParser = require("cookie-parser");
const { rateLimit } = require("express-rate-limit");

const {
    authenticateAccount
} = require("../services/auth-account-service");

const {
    SESSION_COOKIE_NAME,
    SESSION_TTL_MINUTES,
    createSession,
    getSession,
    revokeSession
} = require("../services/auth-session-service");

const router = express.Router();

// Doc cookie cho cac API xac thuc.
router.use(cookieParser());

// Khong cho cache phan hoi tai khoan.
router.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
});

// =====================================================
// 1. CAU HINH COOKIE
// =====================================================

function getCookieOptions() {
    const isProduction =
        process.env.NODE_ENV === "production";

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: "strict",
        path: "/"
    };
}

// =====================================================
// 2. KIEM TRA ORIGIN CHO YEU CAU THAY DOI TRANG THAI
//
// Chan Origin khac website duoc phep.
// Cho phep request khong co Origin de ho tro
// cong cu kiem thu API; trinh duyet van duoc
// bao ve boi SameSite va kiem tra Fetch Metadata.
// =====================================================

function checkRequestOrigin(req, res, next) {
    const fetchSite = req.get("sec-fetch-site");

    if (fetchSite === "cross-site") {
        return res.status(403).json({
            success: false,
            message: "Yeu cau khong duoc phep."
        });
    }

    const origin = req.get("origin");

    if (origin) {
        const host = req.get("host");

        const allowedOrigins = [
            `http://${host}`,
            `https://${host}`,
            process.env.FRONTEND_ORIGIN
        ].filter(Boolean);

        if (!allowedOrigins.includes(origin)) {
            return res.status(403).json({
                success: false,
                message: "Origin khong duoc phep."
            });
        }
    }

    next();
}

// =====================================================
// 3. GIOI HAN SO LAN DANG NHAP
// =====================================================

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    message: {
        success: false,
        message:
            "Qua nhieu lan dang nhap. " +
            "Vui long thu lai sau."
    }
});

// =====================================================
// 4. HAM BAO VE LOI ASYNC
// =====================================================

function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next))
            .catch(next);
    };
}

// =====================================================
// 5. API DANG NHAP
// POST /api/v1/auth/login
// =====================================================

router.post(
    "/login",
    checkRequestOrigin,
    loginLimiter,
    asyncHandler(async (req, res) => {
        if (!req.is("application/json")) {
            return res.status(415).json({
                success: false,
                message:
                    "Yeu cau phai dung JSON."
            });
        }

        const body = req.body;

        if (
            !body ||
            typeof body !== "object" ||
            Array.isArray(body)
        ) {
            return res.status(400).json({
                success: false,
                message: "Du lieu khong hop le."
            });
        }

        const { username, password } = body;

        if (
            typeof username !== "string" ||
            typeof password !== "string" ||
            username.trim().length === 0 ||
            password.length === 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Vui long nhap tai khoan va mat khau."
            });
        }

        // 1. Kiem tra username va mat khau.
        const account = await authenticateAccount({
            username,
            password
        });

        if (!account) {
            return res.status(401).json({
                success: false,
                message:
                    "Tai khoan hoac mat khau khong dung."
            });
        }

        // 2. Tao session moi trong SQL Server.
        const session = await createSession({
            userId: account.userId
        });

        // 3. Gui token trong cookie HttpOnly.
        res.cookie(
            SESSION_COOKIE_NAME,
            session.token,
            {
                ...getCookieOptions(),
                maxAge:
                    SESSION_TTL_MINUTES * 60 * 1000
            }
        );

        // 4. Khong tra mat khau hoac token.
        return res.status(200).json({
            success: true,
            message: "Dang nhap thanh cong.",
            data: {
                userId: String(account.userId),
                username: account.username,
                roleCode: account.roleCode,
                studentId:
                    account.studentId === null
                        ? null
                        : String(account.studentId)
            }
        });
    })
);

// =====================================================
// 6. API DANG XUAT
// POST /api/v1/auth/logout
// =====================================================

router.post(
    "/logout",
    checkRequestOrigin,
    asyncHandler(async (req, res) => {
        const token =
            req.cookies?.[SESSION_COOKIE_NAME];

        // Thu hoi session tren SQL Server.
        if (token) {
            await revokeSession(token);
        }

        // Xoa cookie trong trinh duyet.
        res.clearCookie(
            SESSION_COOKIE_NAME,
            getCookieOptions()
        );

        return res.status(200).json({
            success: true,
            message: "Dang xuat thanh cong."
        });
    })
);

// =====================================================
// 7. API XEM TAI KHOAN HIEN TAI
// GET /api/v1/auth/me
// =====================================================

router.get(
    "/me",
    asyncHandler(async (req, res) => {
        const token =
            req.cookies?.[SESSION_COOKIE_NAME];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Chua dang nhap."
            });
        }

        // Xac minh session va tai khoan trong DB.
        const session = await getSession(token);

        if (!session) {
            res.clearCookie(
                SESSION_COOKIE_NAME,
                getCookieOptions()
            );

            return res.status(401).json({
                success: false,
                message:
                    "Phien dang nhap khong hop le " +
                    "hoac da het han."
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                userId: String(session.user_id),
                username: session.username,
                roleCode: session.role_code,
                studentId:
                    session.student_id === null
                        ? null
                        : String(session.student_id)
            }
        });
    })
);

// =====================================================
// 8. XUAT ROUTER
// =====================================================

module.exports = router;
