"use strict";

const express = require("express");

const {
    requireAuth,
    requireRole
} = require("../middlewares/auth-middleware");

const {
    loadScoreExportData
} = require("../services/score-export-data");

const {
    createCsv
} = require("../utils/score-export-csv");

const router = express.Router();

const COMPONENTS = [
    "QT1", "QT2", "QT3", "GK", "CK"
];

// Xuat bang diem chi tiet.
function createDetailsCsv(data) {
    const headers = [
        "Niên khóa",
        "Lớp",
        "Mã học sinh",
        "Họ và tên",
        "Mã môn",
        "Môn học",
        ...COMPONENTS,
        ...COMPONENTS.map(
            type => `Trạng thái ${type}`
        ),
        "Điểm tổng kết",
        "Trạng thái tổng kết"
    ];

    const rows = data.details.map(item => [
        data.academicYearCode,
        data.classCode,
        item.studentCode,
        item.fullName,
        item.subjectCode,
        item.subjectName,
        ...COMPONENTS.map(type => item[type]),
        ...COMPONENTS.map(
            type => item[type + "Status"]
        ),
        item.finalScore,
        item.calculationStatus
    ]);

    return createCsv(headers, rows);
}

// Xuat thong ke theo mon hoc.
function createStatisticsCsv(data) {
    const headers = [
        "Niên khóa",
        "Lớp",
        "Mã môn",
        "Môn học",
        "Số học sinh",
        "Số học sinh đủ điểm tổng kết",
        "Số học sinh chưa có điểm tổng kết",
        "Điểm trung bình tổng kết"
    ];

    const rows = data.statistics.map(item => [
        data.academicYearCode,
        data.classCode,
        item.subjectCode,
        item.subjectName,
        item.studentCount,
        item.calculatedCount,
        item.notCalculatedCount,
        item.averageFinalScore
    ]);

    return createCsv(headers, rows);
}

// Chi su dung ky tu an toan trong ten file.
function safeFilenamePart(value) {
    return String(value ?? "")
        .replace(/[^A-Za-z0-9._-]/g, "_")
        .slice(0, 60) || "unknown";
}

// GET /api/v1/score-export
// Chi Phong Khao thi duoc xuat CSV.
router.get(
    "/",
    requireAuth,
    requireRole("KHAO_THI"),
    async (req, res, next) => {
        try {
            const {
                type,
                academicYearId,
                classId,
                subjectId
            } = req.query;

            if (
                type !== "details" &&
                type !== "statistics"
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Loai du lieu xuat khong hop le."
                    }
                });
            }

            // Chi chap nhan tham so dang chuoi.
            if (
                typeof academicYearId !== "string" ||
                typeof classId !== "string" ||
                (
                    subjectId !== undefined &&
                    typeof subjectId !== "string"
                )
            ) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Bo loc xuat CSV khong hop le."
                    }
                });
            }

            // Khong truyen subjectId hoac truyen "all"
            // nghia la xuat tat ca mon hoc.
            const selectedSubjectId =
                subjectId === undefined ||
                subjectId === "all"
                    ? null
                    : subjectId;

            const data = await loadScoreExportData({
                academicYearId,
                classId,
                subjectId: selectedSubjectId
            });

            // UC12 - TH1: Khong tao file CSV khi khong co du lieu.
            if (data.details.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "NO_EXPORT_DATA",
                        message:
                            "Không có dữ liệu phù hợp với điều kiện xuất đã chọn."
                    }
                });
            }

            const csv =
                type === "details"
                    ? createDetailsCsv(data)
                    : createStatisticsCsv(data);

            const subjectPart =
                data.subjectId === null
                    ? "tat-ca-mon"
                    : `mon-${data.subjectId}`;

            const filename = [
                "score",
                type,
                safeFilenamePart(data.academicYearCode),
                safeFilenamePart(data.classCode),
                subjectPart
            ].join("-") + ".csv";

            // Tra file UTF-8 kem BOM de Excel
            // doc dung tieng Viet.
            res.setHeader(
                "Content-Type",
                "text/csv; charset=utf-8"
            );

            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${filename}"`
            );

            res.setHeader("Cache-Control", "no-store");

            return res.status(200).send(
                Buffer.from(csv, "utf8")
            );

        } catch (error) {
            if (
                Number.isInteger(error.status) &&
                error.status >= 400 &&
                error.status < 500
            ) {
                return res.status(error.status).json({
                    success: false,
                    error: {
                        code: error.code || "EXPORT_ERROR",
                        message: error.message
                    }
                });
            }

            next(error);
        }
    }
);

module.exports = router;