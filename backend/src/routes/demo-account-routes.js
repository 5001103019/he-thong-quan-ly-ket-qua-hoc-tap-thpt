
"use strict";

const express = require("express");

const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

const {
    createDemoAccount,
    linkStudentAccount,
    disableDemoAccount,
    getDemoAccounts
} = require("../services/demo-account-service");

const router = express.Router();

// Tat ca API trong file nay chi danh cho Phong Khao thi.
router.use(requireAuth);
router.use(requireRole("KHAO_THI"));

// Tra ve loi an toan, khong de lo thong tin database.
function handleError(error, res) {
    const status = Number(error.status);

    if (
        Number.isInteger(status) &&
        status >= 400 &&
        status < 500
    ) {
        return res.status(status).json({
            success: false,
            message: error.message
        });
    }

    console.error("Demo account API error:", error);

    return res.status(500).json({
        success: false,
        message: "Loi he thong. Vui long thu lai."
    });
}

// 1. Tra cuu danh sach tai khoan Hoc sinh.
// GET /api/v1/khao-thi/demo-accounts
// GET /api/v1/khao-thi/demo-accounts?studentId=22
router.get("/", async (req, res) => {
    try {
        const accounts = await getDemoAccounts(
            req.query.studentId
        );

        return res.status(200).json({
            success: true,
            data: {
                accounts,
                total: accounts.length
            }
        });
    } catch (error) {
        return handleError(error, res);
    }
});

// 2. Tao tai khoan demo.
// POST /api/v1/khao-thi/demo-accounts
router.post("/", async (req, res) => {
    try {
        const data = req.body || {};

        const result = await createDemoAccount({
            username: data.username,
            password: data.password,
            roleCode: data.roleCode,
            studentId: data.studentId
        });

        // Khong tra mat khau hoac password_hash cho client.
        return res.status(201).json({
            success: true,
            message: "Tao tai khoan thanh cong.",
            data: result
        });
    } catch (error) {
        return handleError(error, res);
    }
});

// 3. Lien ket tai khoan voi ho so Hoc sinh.
// PATCH /api/v1/khao-thi/demo-accounts/:userId/link-student
router.patch("/:userId/link-student", async (req, res) => {
    try {
        const result = await linkStudentAccount(
            req.params.userId,
            req.body?.studentId
        );

        return res.status(200).json({
            success: true,
            message: "Lien ket hoc sinh thanh cong.",
            data: result
        });
    } catch (error) {
        return handleError(error, res);
    }
});

// 4. Vo hieu hoa tai khoan demo.
// PATCH /api/v1/khao-thi/demo-accounts/:userId/disable
router.patch("/:userId/disable", async (req, res) => {
    try {
        const result = await disableDemoAccount(
            req.params.userId,

            // Lay ID nguoi thuc hien tu phien dang nhap.
            // Khong tin vao ID do client gui.
            req.auth.userId
        );

        return res.status(200).json({
            success: true,
            message: "Vo hieu hoa tai khoan thanh cong.",
            data: result
        });
    } catch (error) {
        return handleError(error, res);
    }
});

module.exports = router;
