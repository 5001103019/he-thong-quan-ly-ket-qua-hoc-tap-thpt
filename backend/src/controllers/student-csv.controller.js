
"use strict";

const {
    previewStudentCsv
} = require("../services/student-csv-preview-service");

const {
    confirmStudentCsv
} = require("../services/student-csv-import-service");

/*
 * POST /api/v1/students/import/preview
 *
 * Nhan noi dung CSV, kiem tra va tra ket qua xem truoc.
 * Khong ghi du lieu vao database.
 */
async function previewStudentImport(req, res) {
    const body = req.body;

    // 1. Kiem tra du lieu dau vao.
    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).length !== 1 ||
        typeof body.csvText !== "string" ||
        body.csvText.trim().length === 0
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Noi dung CSV khong hop le."
            }
        });
    }

    // Gioi han kich thuoc phu hop express.json mac dinh.
    const maxBytes = 64 * 1024;

    if (
        Buffer.byteLength(body.csvText, "utf8") > maxBytes
    ) {
        return res.status(413).json({
            success: false,
            error: {
                code: "CSV_TOO_LARGE",
                message: "File CSV vuot qua gioi han 64 KB."
            }
        });
    }

    try {
        // 2. Goi service kiem tra CSV va database.
        const result = await previewStudentCsv(
            body.csvText
        );

        // 3. Tra ket qua Preview.
        // CSV co loi nghiep vu van tra HTTP 200
        // de giao dien hien thi loi theo tung dong.
        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error(
            "Loi Preview Import hoc sinh:",
            error
        );

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Khong the xem truoc CSV hoc sinh."
            }
        });
    }
}


/*
 * POST /api/v1/students/import/confirm
 *
 * Chi import khi nguoi dung xac nhan.
 * Service se kiem tra lai CSV va database
 * trong transaction truoc khi ghi.
 */
async function confirmStudentImport(req, res) {
    const body = req.body;

    // 1. Kiem tra noi dung va xac nhan.
    if (
        !body ||
        typeof body !== "object" ||
        Array.isArray(body) ||
        Object.keys(body).length !== 2 ||
        typeof body.csvText !== "string" ||
        body.csvText.trim().length === 0 ||
        body.confirmed !== true
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message:
                    "Can cung cap CSV va xac nhan Import."
            }
        });
    }

    // 2. Gioi han dung luong CSV.
    if (
        Buffer.byteLength(body.csvText, "utf8") >
        64 * 1024
    ) {
        return res.status(413).json({
            success: false,
            error: {
                code: "CSV_TOO_LARGE",
                message: "CSV vuot qua gioi han 64 KB."
            }
        });
    }

    try {
        // 3. Service kiem tra lai du lieu
        // va chi COMMIT neu tat ca dong hop le.
        const result = await confirmStudentCsv(
            body.csvText
        );

        return res.status(201).json({
            success: true,
            data: result
        });

    } catch (error) {
        // 4. Loi CSV va xung dot nghiep vu.
        if (
            error.code === "CSV_VALIDATION_ERROR" ||
            error.code === "IMPORT_CONFLICT"
        ) {
            return res.status(
                error.code === "CSV_VALIDATION_ERROR"
                    ? 422
                    : 409
            ).json({
                success: false,
                error: {
                    code: error.code,
                    message: error.message,
                    details: Array.isArray(error.errors)
                        ? error.errors
                        : []
                }
            });
        }

        // 5. Loi chua duoc xu ly.
        console.error(
            "Loi xac nhan Import hoc sinh:",
            error.message
        );

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Khong the Import hoc sinh."
            }
        });
    }
}

module.exports = {
    previewStudentImport,
    confirmStudentImport
};
