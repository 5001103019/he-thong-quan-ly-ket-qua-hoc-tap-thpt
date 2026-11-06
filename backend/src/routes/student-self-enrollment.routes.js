
"use strict";

const express = require("express");

const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

const studentRepository = require(
    "../repositories/student.repository"
);

const router = express.Router();

// Hoc sinh xem lich su phan lop cua chinh minh.
// GET /api/v1/hoc-sinh/enrollments
router.get(
    "/",
    requireAuth,
    requireRole("HOC_SINH"),
    async function (req, res) {
        const studentId = req.auth.studentId;

        // Chi su dung studentId tu phien dang nhap.
        // Khong cho phep client chon hoc sinh khac.
        if (
            !/^[1-9][0-9]*$/.test(
                String(studentId ?? "")
            )
        ) {
            return res.status(403).json({
                success: false,
                error: {
                    code: "FORBIDDEN",
                    message: "Tai khoan chua lien ket hoc sinh hop le"
                }
            });
        }

        try {
            const student =
                await studentRepository.getStudentById(
                    studentId
                );

            if (!student) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "NOT_FOUND",
                        message: "Khong tim thay hoc sinh"
                    }
                });
            }

            const enrollments =
                await studentRepository
                    .getStudentEnrollmentHistory(
                        studentId
                    );

            return res.status(200).json({
                success: true,
                data: enrollments
            });

        } catch (error) {
            console.error(
                "Loi lay lich su phan lop ca nhan:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    code: "INTERNAL_ERROR",
                    message: "Loi may chu"
                }
            });
        }
    }
);

module.exports = router;
