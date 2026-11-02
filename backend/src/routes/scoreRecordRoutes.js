
"use strict";

const express = require("express");

// Su dung middleware xac thuc cua Giang.
const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

// Ham lay chi tiet diem cua Chau.
const {
    getScoreRecordById
} = require("../repositories/scoreRecordRepository");

// Ham nhap va cap nhat diem cua Chau.
const {
    saveScoreEntry
} = require("../services/scoreEntryService");

const router = express.Router();

// Kiem tra ID la so nguyen duong hop le.
function parsePositiveId(value) {
    if (typeof value !== "string" ||
        !/^[1-9][0-9]*$/.test(value)) {
        return null;
    }

    const number = Number(value);

    if (!Number.isSafeInteger(number)) {
        return null;
    }

    return number;
}

// ============================================
// 1. API LAY CHI TIET BAN GHI DIEM
// GET /api/v1/score-records/:id
// ============================================

router.get(
    "/:id",
    requireAuth,
    requireRole("KHAO_THI"),
    async (req, res, next) => {
        try {
            const scoreRecordId = parsePositiveId(
                req.params.id
            );

            if (scoreRecordId === null) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Ma ban ghi diem khong hop le"
                    }
                });
            }

            // Lay chi tiet ban ghi diem tu SQL Server.
            const data = await getScoreRecordById(
                scoreRecordId
            );

            if (data === null) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "NOT_FOUND",
                        message: "Khong tim thay ban ghi diem"
                    }
                });
            }

            return res.status(200).json({
                success: true,
                data: data
            });

        } catch (error) {
            next(error);
        }
    }
);

// ============================================
// 2. API NHAP VA CAP NHAT THANH PHAN DIEM
// PATCH /api/v1/score-records/:id/components/:type
// ============================================

router.patch(
    "/:id/components/:type",
    requireAuth,
    requireRole("KHAO_THI"),
    async (req, res, next) => {
        try {
            // Lay ma ban ghi diem tu URL.
            const scoreRecordId = parsePositiveId(
                req.params.id
            );

            // Lay loai diem tu URL.
            const componentType = req.params.type;

            if (scoreRecordId === null) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Ma ban ghi diem khong hop le"
                    }
                });
            }

            // Kiem tra du lieu JSON cua request.
            const body = req.body;

            if (
                body === null ||
                typeof body !== "object" ||
                Array.isArray(body) ||
                !Object.prototype.hasOwnProperty.call(
                    body, "scoreValue"
                ) ||
                !Object.prototype.hasOwnProperty.call(
                    body, "scoreStatus"
                ) ||
                !Object.prototype.hasOwnProperty.call(
                    body, "expectedVersion"
                )
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Thieu du lieu cap nhat diem"
                    }
                });
            }

            // Nguoi thuc hien lay tu phien dang nhap.
            // Khong nhan userId do frontend tu gui.
            const performedBy = req.auth.userId;

            // Goi service luu diem cua Chau.
            const result = await saveScoreEntry({
                scoreRecordId: scoreRecordId,
                componentType: componentType,
                scoreValue: body.scoreValue,
                scoreStatus: body.scoreStatus,
                expectedVersion: body.expectedVersion,
                performedBy: performedBy,
                reason: body.reason ?? null
            });

            // Tra ket qua cap nhat thanh cong.
            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            // Xu ly loi nghiep vu tu scoreEntryService.
            if (
                Number.isInteger(error.status) &&
                error.status >= 400 &&
                error.status < 500
            ) {
                return res.status(error.status).json({
                    success: false,
                    error: {
                        code: error.code || "BUSINESS_ERROR",
                        message: error.message
                    }
                });
            }

            // Chuyen cac loi khac sang Express.
            next(error);
        }
    }
);

module.exports = router;
