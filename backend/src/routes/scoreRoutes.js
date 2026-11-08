
"use strict";

const express = require("express");

const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

const {
    getScores
} = require("../repositories/scoreRepository");

const router = express.Router();

// API lay bang diem theo hoc ky
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

            const term = req.query.term ?? "HK1";

            // Chi HK1 va HK2 co 5 cot diem rieng
            if (!["HK1", "HK2", "YEAR"].includes(term)) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "INVALID_TERM",
                        message: "Hoc ky khong hop le."
                    }
                });
            }

            // Ca nam se tinh sau tu HK1 va HK2
            if (term === "YEAR") {
                return res.status(422).json({
                    success: false,
                    error: {
                        code: "YEAR_NOT_READY",
                        message:
                            "Hien chua co du lieu tong ket ca nam."
                    }
                });
            }

            // Kiem tra ID
            const ids = [
                academicYearId,
                classId,
                subjectId
            ];

            const valid = ids.every(id =>
                typeof id === "string" &&
                /^[1-9][0-9]*$/.test(id) &&
                Number.isSafeInteger(Number(id))
            );

            if (!valid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Bo loc khong hop le."
                    }
                });
            }

            // Doc du lieu dung theo HK1 hoac HK2
            const data = await getScores({
                academicYearId: Number(academicYearId),
                classId: Number(classId),
                subjectId: Number(subjectId),
                term
            });

            res.set("Cache-Control", "no-store");

            return res.status(200).json({
                success: true,
                data
            });

        } catch (error) {
            next(error);
        }
    }
);

module.exports = router;
