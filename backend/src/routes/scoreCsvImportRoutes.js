
"use strict";

const express = require("express");

// Middleware xac thuc cua Giang.
const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

// Parser CSV cua Ngoc.
const {
    parseCsv
} = require("../utils/csv-parser");

// Validation Import diem CSV cua Chau.
const {
    validateScoreCsvRows
} = require("../services/scoreCsvImportValidation");

const {
    validateScoreCsvDatabase
} = require("../services/scoreCsvImportService");

const router = express.Router();

// ============================================
// API XEM TRUOC DU LIEU DIEM CSV
// POST /api/v1/score-import/preview
// ============================================

router.post(
    "/preview",
    requireAuth,
    requireRole("KHAO_THI"),
    async (req, res, next) => {
        try {
            const csvText = req.body?.csvText;

            // 1. Kiem tra noi dung request.
            if (
                typeof csvText !== "string" ||
                csvText.trim() === ""
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Noi dung CSV khong hop le"
                    }
                });
            }

            // 2. Kiem tra kich thuoc noi dung.
            if (
                Buffer.byteLength(csvText, "utf8") >
                1024 * 1024
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "FILE_TOO_LARGE",
                        message: "Noi dung CSV vuot qua 1 MB"
                    }
                });
            }

            // 3. Doc cau truc CSV bang parser cua Ngoc.
            const parsed = parseCsv(csvText);

            
            // 4. Kiem tra du lieu CSV cuc bo.
            const localValidation = validateScoreCsvRows(
                parsed
            );

            // 5. Doi chieu hoc sinh, nien khoa, lop, mon,
            // Enrollment, diem hien tai va trang thai khoa.
            // Chi doc SQL Server, khong ghi diem.
            const validation = await validateScoreCsvDatabase(
                localValidation
            );

            // 5. Tra ket qua xem truoc.
            // Khong ghi du lieu vao SQL Server.
            return res.status(200).json({
                success: true,
               
            data: {
                headers: parsed.headers,
                rows: validation.rows,
                errors: validation.errors,
                warnings: validation.warnings,
                totalRows: validation.rows.length,
                eligibleRows: validation.eligibleRows,
                validationStage:
                    validation.validationStage,
                readyToImport: false
            }
            });

        } catch (error) {
            next(error);
        }
    }
);

router.use(
    "/ui",
    express.static(
        require("node:path").resolve(
            __dirname,
            "../../../frontend"
        ),
        { index: false }
    )
);

module.exports = router;

/*
 * Xac nhan Import diem CSV.
 * POST /api/v1/score-import/confirm
 *
 * - Kiem tra lai CSV va SQL Server.
 * - Phat hien version da thay doi sau Preview.
 * - Bo qua dong khong hop le.
 * - Moi dong hop le duoc ghi trong mot transaction.
 * - Khong ghi de diem LOCKED.
 * - Ghi AuditLog SCORE_IMPORT.
 */

const {
    saveConfirmedCsvRow
} = require("../services/scoreCsvImportConfirmService");

router.post(
    "/confirm",
    requireAuth,
    requireRole("KHAO_THI"),
    async (req, res, next) => {
        try {
            const body = req.body;

            if (
                !body ||
                typeof body.csvText !== "string" ||
                body.csvText.trim() === "" ||
                body.csvText.length > 1024 * 1024 ||
                !Array.isArray(body.previewRows)
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Du lieu xac nhan CSV khong hop le"
                    }
                });
            }

            const reason = body.reason ?? null;

            if (
                reason !== null &&
                (typeof reason !== "string" ||
                 reason.length > 1000)
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Ly do Import khong hop le"
                    }
                });
            }

            // 1. Doc va kiem tra lai tep CSV.
            const parsed = parseCsv(body.csvText);

            const localValidation =
                validateScoreCsvRows(parsed);

            // 2. Doi chieu lai voi SQL Server.
            const validation =
                await validateScoreCsvDatabase(
                    localValidation
                );

            const errors = [...validation.errors];
            const warnings = [...validation.warnings];
            const results = [];

            // 3. Lap danh sach phien ban da xem truoc.
            const snapshots = new Map();

            for (const item of body.previewRows) {
                if (
                    !item ||
                    !Number.isInteger(item.lineNumber) ||
                    item.lineNumber < 2 ||
                    snapshots.has(item.lineNumber)
                ) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: "INVALID_PREVIEW",
                            message: "Danh sach Preview khong hop le"
                        }
                    });
                }

                snapshots.set(item.lineNumber, item);
            }

            // 4. Kiem tra tat ca phien ban truoc khi ghi.
            // Khong cho phep dung Preview cu.
            for (const row of validation.rows) {
                if (!row.eligible) {
                    continue;
                }

                const snapshot =
                    snapshots.get(row.lineNumber);

                if (!snapshot) {
                    return res.status(409).json({
                        success: false,
                        error: {
                            code: "PREVIEW_REQUIRED",
                            message:
                                "Can xem truoc CSV truoc khi xac nhan",
                            lineNumber: row.lineNumber
                        }
                    });
                }

                const oldId =
                    snapshot.scoreRecordId == null
                        ? null
                        : String(snapshot.scoreRecordId);

                const newId =
                    row.scoreRecordId == null
                        ? null
                        : String(row.scoreRecordId);

                if (
                    oldId !== newId ||
                    snapshot.expectedVersion !==
                        row.expectedVersion
                ) {
                    return res.status(409).json({
                        success: false,
                        error: {
                            code: "VERSION_CONFLICT",
                            message:
                                "Du lieu da thay doi, can xem truoc lai",
                            lineNumber: row.lineNumber
                        }
                    });
                }
            }

            let importedRows = 0;
            let changedComponents = 0;

            // 5. Xu ly tung dong CSV.
            for (const row of validation.rows) {
                if (!row.eligible) {
                    results.push({
                        lineNumber: row.lineNumber,
                        studentCode:
                            row.codes?.studentCode ?? null,
                        status: "SKIPPED",
                        changedComponents: 0
                    });
                    continue;
                }

                const snapshot =
                    snapshots.get(row.lineNumber);

                try {
                    // Service tu kiem tra lai quyen,
                    // version va khoa trong transaction.
                    const saved =
                        await saveConfirmedCsvRow({
                            codes: row.codes,
                            updates: row.changes,
                            expectedScoreRecordId:
                                snapshot.scoreRecordId,
                            expectedVersion:
                                snapshot.expectedVersion,
                            performedBy: req.auth.userId,
                            reason
                        });

                    if (saved.changed) {
                        importedRows++;
                        changedComponents +=
                            saved.changedComponents;
                    }

                    results.push({
                        lineNumber: row.lineNumber,
                        studentCode:
                            row.codes.studentCode,
                        status: saved.changed
                            ? "IMPORTED"
                            : "UNCHANGED",
                        changedComponents:
                            saved.changedComponents,
                        scoreRecordId:
                            saved.scoreRecordId,
                        version: saved.version,
                        auditLogIds:
                            saved.auditLogIds
                    });

                } catch (error) {
                    errors.push({
                        lineNumber: row.lineNumber,
                        studentCode:
                            row.codes.studentCode,
                        column: error.column ?? null,
                        code:
                            error.code || "IMPORT_FAILED",
                        message:
                            error.status
                                ? error.message
                                : "Khong the ghi dong diem"
                    });

                    results.push({
                        lineNumber: row.lineNumber,
                        studentCode:
                            row.codes.studentCode,
                        status: "SKIPPED",
                        changedComponents: 0
                    });

                    if (!error.status) {
                        console.error(
                            "CSV import error:",
                            error
                        );
                    }
                }
            }

            const skippedRows = results.filter(
                row => row.status === "SKIPPED"
            ).length;

            return res.status(200).json({
                success: true,
                data: {
                    totalRows:
                        validation.rows.length,
                    importedRows,
                    skippedRows,
                    changedComponents,
                    errors,
                    warnings,
                    results
                }
            });

        } catch (error) {
            next(error);
        }
    }
);
