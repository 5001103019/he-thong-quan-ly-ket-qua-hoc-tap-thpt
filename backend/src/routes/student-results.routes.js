
"use strict";

const express = require("express");
const { sql, connectDatabase } = require("../config/database");

const { requireAuth, requireRole } =
    require("../middlewares/auth-middleware");

const { getLatestFormulaPolicy } =
    require("../repositories/scoreRecordRepository");

const { calculateScoreSummary } =
    require("../services/scoreSummaryService");

const router = express.Router();
const COMPONENTS = ["QT1", "QT2", "QT3", "GK", "CK"];

// 1. Lay 2 nien khoa tu SQL Server
router.get(
    "/academic-years",
    requireAuth,
    requireRole("HOC_SINH"),
    async (req, res) => {
        res.set("Cache-Control", "no-store");

        try {
            const pool = await connectDatabase();

            const result = await pool.request().query(`
                SELECT
                    academic_year_id AS academicYearId,
                    code
                FROM dbo.academic_year
                WHERE code IN ('2025-2026', '2026-2027')
                ORDER BY code
            `);

            return res.json({
                success: true,
                data: result.recordset
            });

        } catch (error) {
            console.error("Load academic years:", error);

            return res.status(500).json({
                success: false,
                error: { message: "Không tải được niên khóa." }
            });
        }
    }
);

// 2. Xu ly 5 cot diem va tinh tong ket
function scoreRow(record, policy) {
    const result = calculateScoreSummary(record, policy);

    const values = Object.fromEntries(
        COMPONENTS.map(k => [k, null])
    );

    for (const part of result.components) {
        values[part.componentType] =
            part.scoreStatus === "SCORED"
                ? part.scoreValue
                : null;
    }

    let status = "Đủ điểm";

    if (result.missingComponents.length) {
        status =
            "Thiếu " + result.missingComponents.join(", ");
    } else if (
        result.calculationStatus === "FORMULA_NOT_APPROVED"
    ) {
        status = "Chưa duyệt công thức";
    }

    return {
        subjectCode: record.subjectCode,
        subjectName: record.subjectName,
        ...values,
        finalScore: result.finalScore,
        status
    };
}

// 3. Lay diem HK1 tu bang diem hien tai
async function loadHK1(pool, studentId, yearId, policy) {
    const result = await pool.request()
        .input("studentId", sql.BigInt, studentId)
        .input("yearId", sql.BigInt, yearId)
        .query(`
            SELECT
                sr.score_record_id AS scoreRecordId,
                sr.version,
                sub.code AS subjectCode,
                sub.name AS subjectName,
                sc.component_type AS componentType,
                sc.score_value AS scoreValue,
                sc.score_status AS scoreStatus

            FROM dbo.score_record AS sr

            JOIN dbo.enrollment AS e
                ON e.enrollment_id = sr.enrollment_id

            JOIN dbo.subject AS sub
                ON sub.subject_id = sr.subject_id

            LEFT JOIN dbo.score_component AS sc
                ON sc.score_record_id = sr.score_record_id

            WHERE e.student_id = @studentId
              AND e.academic_year_id = @yearId

            ORDER BY sub.name, sr.score_record_id
        `);

    const byId = new Map();

    for (const row of result.recordset) {
        const key = String(row.scoreRecordId);

        if (!byId.has(key)) {
            byId.set(key, {
                scoreRecordId: key,
                version: row.version,
                subjectCode: row.subjectCode,
                subjectName: row.subjectName,
                components: []
            });
        }

        if (row.componentType) {
            byId.get(key).components.push({
                componentType: row.componentType,
                scoreValue:
                    row.scoreValue === null
                        ? null
                        : Number(row.scoreValue),
                scoreStatus:
                    row.scoreStatus || "NOT_ENTERED"
            });
        }
    }

    return [...byId.values()].map(
        record => scoreRow(record, policy)
    );
}

// 4. Lay diem HK2 tu bang moi
async function loadHK2(pool, studentId, yearId, policy) {
    const result = await pool.request()
        .input("studentId", sql.BigInt, studentId)
        .input("yearId", sql.BigInt, yearId)
        .query(`
            SELECT
                h.hk2_score_id AS hk2ScoreId,
                sub.code AS subjectCode,
                sub.name AS subjectName,
                h.QT1, h.QT2, h.QT3, h.GK, h.CK

            FROM dbo.student_hk2_score AS h

            JOIN dbo.enrollment AS e
                ON e.enrollment_id = h.enrollment_id

            JOIN dbo.subject AS sub
                ON sub.subject_id = h.subject_id

            WHERE e.student_id = @studentId
              AND e.academic_year_id = @yearId

            ORDER BY sub.name, h.hk2_score_id
        `);

    return result.recordset.map(item => scoreRow({
        scoreRecordId: String(item.hk2ScoreId),
        version: 1,
        subjectCode: item.subjectCode,
        subjectName: item.subjectName,

        components: COMPONENTS.map(key => ({
            componentType: key,
            scoreValue:
                item[key] == null
                    ? null
                    : Number(item[key]),
            scoreStatus:
                item[key] == null
                    ? "NOT_ENTERED"
                    : "SCORED"
        }))
    }, policy));
}

// 5. API chung: HK1, HK2, Ca nam
router.get(
    "/",
    requireAuth,
    requireRole("HOC_SINH"),
    async (req, res) => {
        res.set("Cache-Control", "no-store");

        const yearId =
            String(req.query.academicYearId || "");

        const term = String(req.query.term || "");

        if (
            !/^[1-9]\d*$/.test(yearId) ||
            !Number.isSafeInteger(Number(yearId))
        ) {
            return res.status(400).json({
                success: false,
                error: { message: "Niên khóa không hợp lệ." }
            });
        }

        if (!["HK1", "HK2", "YEAR"].includes(term)) {
            return res.status(400).json({
                success: false,
                error: { message: "Học kỳ không hợp lệ." }
            });
        }

        try {
            const pool = await connectDatabase();
            const policy = await getLatestFormulaPolicy();

            // StudentId lay tu phien dang nhap
            const studentId = req.auth.studentId;

            // Truong hop HK1
            if (term === "HK1") {
                const rows = await loadHK1(
                    pool, studentId, yearId, policy
                );

                return res.json({
                    success: true,
                    data: { rows }
                });
            }

            // Truong hop HK2
            if (term === "HK2") {
                const rows = await loadHK2(
                    pool, studentId, yearId, policy
                );

                return res.json({
                    success: true,
                    data: { rows }
                });
            }

            // Truong hop CA NAM
            // Chi xu ly mon da cong bo ca HK1 va HK2
            const [hk1Rows, hk2Rows] = await Promise.all([
                loadHK1(pool, studentId, yearId, policy),
                loadHK2(pool, studentId, yearId, policy)
            ]);

            const hk2BySubject = new Map(
                hk2Rows.map(row => [row.subjectCode, row])
            );

            const rows = [];

            for (const first of hk1Rows) {
                const second =
                    hk2BySubject.get(first.subjectCode);

                if (!second) continue;

                const complete =
                    first.finalScore != null &&
                    second.finalScore != null;

                rows.push({
                    subjectCode: first.subjectCode,
                    subjectName: first.subjectName,

                    scoreHK1: first.finalScore,
                    scoreHK2: second.finalScore,

                    finalScore: complete
                        ? Math.round(
                            (
                                (first.finalScore +
                                    2 * second.finalScore) / 3
                            ) * 100
                        ) / 100
                        : null,

                    status: complete
                        ? "Đủ điểm"
                        : "Chưa đủ điểm hoặc chưa duyệt công thức"
                });
            }

            return res.json({
                success: true,
                data: { rows }
            });

        } catch (error) {
            console.error(
                "Loi API diem hoc sinh:",
                error
            );

            return res.status(500).json({
                success: false,
                error: {
                    message:
                        "Không lấy được kết quả. Kiểm tra " +
                        "bảng điểm và dữ liệu công bố trên Backend."
                }
            });
        }
    }
);

module.exports = router;
