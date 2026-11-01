
"use strict";

const express = require("express");

// Su dung middleware xac thuc cua Giang (VT1-04).
const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

// Su dung ham truy van diem cua Chau.
const {
    getScores
} = require("../repositories/scoreRepository");

const router = express.Router();

// GET /api/v1/scores
// Lay bang diem theo nien khoa, lop va mon hoc.
// Chi Phong Khao thi duoc xem bang diem cua ca lop.
router.get(
    "/",
    requireAuth,
    requireRole("KHAO_THI"),
    async (req, res, next) => {
        try {
            const {
                academicYearId,
                classId,
                subjectId
            } = req.query;

            // Kiem tra cac ma duoc cung cap.
            const ids = [
                academicYearId,
                classId,
                subjectId
            ];

            const valid = ids.every(id => {
                if (typeof id !== "string") {
                    return false;
                }

                if (!/^[1-9][0-9]*$/.test(id)) {
                    return false;
                }

                return Number.isSafeInteger(Number(id));
            });

            if (!valid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Ma nien khoa, lop hoac mon khong hop le"
                    }
                });
            }

            // Lay du lieu diem tu SQL Server.
            const data = await getScores({
                academicYearId: Number(academicYearId),
                classId: Number(classId),
                subjectId: Number(subjectId)
            });

            // Tra ket qua cho frontend.
            return res.status(200).json({
                success: true,
                data: data
            });

        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
