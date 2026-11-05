
"use strict";

const {
    sql,
    connectDatabase
} = require("../config/database");

const COMPONENT_TYPES = [
    "QT1", "QT2", "QT3", "GK", "CK"
];

// ============================================
// 1. DOI CHIEU MA CSV VOI SQL SERVER
// ============================================

async function findScoreCsvContext({
    studentCode,
    academicYearCode,
    classCode,
    subjectCode
}) {
    const codes = [
        studentCode,
        academicYearCode,
        classCode,
        subjectCode
    ];

    if (codes.some(value =>
        typeof value !== "string" ||
        value.trim() === ""
    )) {
        throw new TypeError(
            "Ma nhan dien CSV khong hop le"
        );
    }

    const pool = await connectDatabase();

    const result = await pool.request()
        .input(
            "studentCode",
            sql.VarChar(30),
            studentCode.trim()
        )
        .input(
            "yearCode",
            sql.VarChar(9),
            academicYearCode.trim()
        )
        .input(
            "classCode",
            sql.VarChar(20),
            classCode.trim()
        )
        .input(
            "subjectCode",
            sql.VarChar(20),
            subjectCode.trim()
        )
        .query(`
            -- 1. Kiem tra hoc sinh.
            SELECT
                CONVERT(VARCHAR(20), student_id)
                    AS studentId,
                student_code AS studentCode,
                status AS studentStatus
            FROM dbo.student
            WHERE student_code = @studentCode;

            -- 2. Kiem tra nien khoa.
            SELECT
                CONVERT(VARCHAR(20), academic_year_id)
                    AS academicYearId,
                code AS academicYearCode,
                status AS academicYearStatus
            FROM dbo.academic_year
            WHERE code = @yearCode;

            -- 3. Kiem tra lop thuoc nien khoa.
            SELECT
                CONVERT(VARCHAR(20), c.class_id)
                    AS classId,
                c.code AS classCode,
                c.name AS className,
                c.status AS classStatus
            FROM dbo.[class] c
            JOIN dbo.academic_year ay
                ON ay.academic_year_id =
                    c.academic_year_id
            WHERE ay.code = @yearCode
              AND c.code = @classCode;

            -- 4. Kiem tra mon hoc.
            SELECT
                CONVERT(VARCHAR(20), subject_id)
                    AS subjectId,
                code AS subjectCode,
                name AS subjectName,
                status AS subjectStatus
            FROM dbo.subject
            WHERE code = @subjectCode;

            -- 5. Kiem tra lich su phan lop.
            SELECT
                CONVERT(VARCHAR(20), e.enrollment_id)
                    AS enrollmentId,
                e.start_date AS startDate,
                e.end_date AS endDate
            FROM dbo.enrollment e
            JOIN dbo.student s
                ON s.student_id = e.student_id
            JOIN dbo.academic_year ay
                ON ay.academic_year_id =
                    e.academic_year_id
            JOIN dbo.[class] c
                ON c.class_id = e.class_id
               AND c.academic_year_id =
                    e.academic_year_id
            WHERE s.student_code = @studentCode
              AND ay.code = @yearCode
              AND c.code = @classCode;
        `);

    return {
        student: result.recordsets[0][0] ?? null,
        academicYear: result.recordsets[1][0] ?? null,
        classInfo: result.recordsets[2][0] ?? null,
        subject: result.recordsets[3][0] ?? null,
        enrollments: result.recordsets[4]
    };
}

// ============================================
// 2. DOC DIEM HIEN TAI VA TRANG THAI KHOA
// ============================================

async function getScoreCsvCurrentState({
    enrollmentId,
    academicYearId,
    classId,
    subjectId
}) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input(
            "enrollmentId",
            sql.BigInt,
            String(enrollmentId)
        )
        .input(
            "yearId",
            sql.BigInt,
            String(academicYearId)
        )
        .input(
            "classId",
            sql.BigInt,
            String(classId)
        )
        .input(
            "subjectId",
            sql.BigInt,
            String(subjectId)
        )
        .query(`
            -- 1. Tim ban ghi diem.
            SELECT
                CONVERT(VARCHAR(20), score_record_id)
                    AS scoreRecordId,
                version
            FROM dbo.score_record
            WHERE enrollment_id = @enrollmentId
              AND subject_id = @subjectId;

            -- 2. Lay tung thanh phan diem hien co.
            SELECT
                sc.component_type AS componentType,
                sc.score_value AS scoreValue,
                sc.score_status AS scoreStatus
            FROM dbo.score_component sc
            JOIN dbo.score_record sr
                ON sr.score_record_id =
                    sc.score_record_id
            WHERE sr.enrollment_id = @enrollmentId
              AND sr.subject_id = @subjectId;

            -- 3. Lay trang thai khoa theo cot.
            SELECT
                component AS componentType,
                status AS lockStatus
            FROM dbo.lock_status
            WHERE academic_year_id = @yearId
              AND class_id = @classId
              AND subject_id = @subjectId;
        `);

    const scoreRecord =
        result.recordsets[0][0] ?? null;

    const components = {};

    // Trang thai mac dinh khi chua co du lieu.
    for (const type of COMPONENT_TYPES) {
        components[type] = {
            scoreValue: null,
            scoreStatus: "NOT_ENTERED",
            lockStatus: "UNLOCKED"
        };
    }

    // Doc gia tri diem da luu.
    for (const row of result.recordsets[1]) {
        const component = components[row.componentType];

        if (!component) {
            continue;
        }

        component.scoreValue =
            row.scoreValue == null
                ? null
                : Number(row.scoreValue);

        component.scoreStatus = row.scoreStatus;
    }

    // Doc trang thai khoa tu SQL Server.
    for (const row of result.recordsets[2]) {
        const component = components[row.componentType];

        if (!component) {
            continue;
        }

        component.lockStatus = row.lockStatus;
    }

    return {
        scoreRecord,
        components
    };
}

module.exports = {
    findScoreCsvContext,
    getScoreCsvCurrentState
};
