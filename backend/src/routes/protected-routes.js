
"use strict";

const express = require("express");

const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

const {
    getMyStudentProfile
} = require("../services/student-self-service");

const router = express.Router();

// 1. API chi danh cho Phong Khao thi
router.get(
    "/khao-thi/me",
    requireAuth,
    requireRole("KHAO_THI"),
    (req, res) => {
        return res.status(200).json({
            success: true,
            message: "Truy cap Khao thi thanh cong.",
            data: {
                userId: req.auth.userId,
                username: req.auth.username,
                roleCode: req.auth.roleCode
            }
        });
    }
);

// 2. API kiem tra phien Hoc sinh
router.get(
    "/hoc-sinh/me",
    requireAuth,
    requireRole("HOC_SINH"),
    (req, res) => {
        return res.status(200).json({
            success: true,
            message: "Truy cap Hoc sinh thanh cong.",
            data: {
                userId: req.auth.userId,
                username: req.auth.username,
                roleCode: req.auth.roleCode,
                studentId: req.auth.studentId
            }
        });
    }
);

// 3. API Hoc sinh xem ho so cua chinh minh
router.get(
    "/hoc-sinh/profile",
    requireAuth,
    requireRole("HOC_SINH"),
    async (req, res) => {
        try {
            // Chi lay studentId tu phien dang nhap.
            // Khong lay tu URL, query hoac request body.
            const studentId = req.auth.studentId;

            const student = await getMyStudentProfile(studentId);

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Khong tim thay ho so hoc sinh."
                });
            }

            return res.status(200).json({
                success: true,
                message: "Lay ho so hoc sinh thanh cong.",
                data: student
            });
        } catch (error) {
            console.error("Loi lay ho so hoc sinh:", error);

            return res.status(500).json({
                success: false,
                message: "Loi he thong. Vui long thu lai."
            });
        }
    }
);

module.exports = router;
