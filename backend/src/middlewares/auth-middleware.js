
"use strict";

const {
    SESSION_COOKIE_NAME,
    getSession
} = require("../services/auth-session-service");

// Kiem tra nguoi dung da dang nhap hay chua.
async function requireAuth(req, res, next) {
    try {
        const token = req.cookies?.[SESSION_COOKIE_NAME];

        if (!token || typeof token !== "string") {
            return res.status(401).json({
                success: false,
                message: "Chua dang nhap."
            });
        }

        // Lay phien dang nhap tu SQL Server.
        const session = await getSession(token);

        if (!session) {
            return res.status(401).json({
                success: false,
                message: "Phien dang nhap khong hop le hoac da het han."
            });
        }

        // getSession tra ve cac truong theo ten trong SQL.
        const roleCode = session.role_code;

        const studentId =
            session.student_id == null
                ? null
                : String(session.student_id);

        // Chi chap nhan hai vai tro cua he thong.
        if (!["KHAO_THI", "HOC_SINH"].includes(roleCode)) {
            return res.status(403).json({
                success: false,
                message: "Vai tro tai khoan khong hop le."
            });
        }

        // Tai khoan Hoc sinh bat buoc co ho so lien ket.
        if (roleCode === "HOC_SINH" && studentId === null) {
            return res.status(403).json({
                success: false,
                message: "Tai khoan hoc sinh chua duoc lien ket ho so."
            });
        }

        // Luu thong tin xac thuc cho cac API su dung.
        req.auth = Object.freeze({
            userId: String(session.user_id),
            username: session.username,
            roleCode: roleCode,
            studentId: studentId
        });

        next();
    } catch (error) {
        next(error);
    }
}

// Kiem tra nguoi dung co dung vai tro hay khong.
function requireRole(...allowedRoles) {
    return function (req, res, next) {
        if (!req.auth) {
            return res.status(401).json({
                success: false,
                message: "Chua dang nhap."
            });
        }
        if (!allowedRoles.includes(req.auth.roleCode)) {

            return res.status(403).json({
                success: false,
                message: "Khong co quyen truy cap."
            });
        }

        next();
    };
}

module.exports = {
    requireAuth,
    requireRole
};
