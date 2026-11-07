"use strict";

const {
    buildScoreDetails
} = require("./score-export-service");

const {
    buildScoreStatistics
} = require("./score-export-statistics");

// Chi nap cac repository khi can truy cap database.
// Cho phep kiem thu bang du lieu gia lap tren MacBook.
function getRepositories() {
    return {
        getCurrentEnrollmentIds: require(
            "../repositories/score-export.repository"
        ).getCurrentEnrollmentIds,

        getClassById: require(
            "../repositories/class.repository"
        ).getClassById,

        getAllSubjects: require(
            "../repositories/subject.repository"
        ).getAllSubjects,

        getSubjectById: require(
            "../repositories/subject.repository"
        ).getSubjectById,

        getScores: require(
            "../repositories/scoreRepository"
        ).getScores,

        getLatestFormulaPolicy: require(
            "../repositories/scoreRecordRepository"
        ).getLatestFormulaPolicy
    };
}

function exportError(status, code, message) {
    const error = new Error(message);
    error.status = status;
    error.code = code;
    return error;
}

function parseId(value) {
    const text = String(value);

    if (!/^[1-9][0-9]*$/.test(text)) {
        throw exportError(
            400,
            "VALIDATION_ERROR",
            "Ma loc khong hop le."
        );
    }

    const number = Number(text);

    if (!Number.isSafeInteger(number)) {
        throw exportError(
            400,
            "VALIDATION_ERROR",
            "Ma loc vuot qua pham vi cho phep."
        );
    }

    return number;
}

// Lay du lieu bang diem va thong ke.
// subjectId = null nghia la tat ca mon hoc.
// Khong thay doi du lieu SQL Server.
async function loadScoreExportData(
    filters,
    repositories = null
) {
    const db = repositories || getRepositories();

    const academicYearId = parseId(
        filters.academicYearId
    );

    const classId = parseId(
        filters.classId
    );

    const subjectId =
        filters.subjectId == null
            ? null
            : parseId(filters.subjectId);

    // Kiem tra lop co thuoc nien khoa da chon.
    const classInfo = await db.getClassById(classId);

    if (!classInfo) {
        throw exportError(
            404,
            "CLASS_NOT_FOUND",
            "Khong tim thay lop hoc."
        );
    }

    if (
        String(classInfo.academicYearId) !==
        String(academicYearId)
    ) {
        throw exportError(
            400,
            "SCOPE_MISMATCH",
            "Lop hoc khong thuoc nien khoa da chon."
        );
    }

    // Chi lay Enrollment hien dang thuoc lop.
    // Khong thay doi lich su chuyen lop trong SQL Server.
    const currentEnrollmentIds =
        await db.getCurrentEnrollmentIds({
            academicYearId,
            classId
        });

    // Chon mot mon hoac tat ca mon.
    let subjects;

    if (subjectId === null) {
        // Bao gom ca mon INACTIVE de khong bo sot
        // du lieu lich su.
        subjects = await db.getAllSubjects();
    } else {
        const subject = await db.getSubjectById(
            subjectId
        );

        if (!subject) {
            throw exportError(
                404,
                "SUBJECT_NOT_FOUND",
                "Khong tim thay mon hoc."
            );
        }

        subjects = [subject];
    }

    // Su dung phien ban cong thuc da duoc
    // phe duyet theo he thong hien tai.
    const formulaPolicy =
        await db.getLatestFormulaPolicy();

    const details = [];

    for (const subject of subjects) {
        // Lay diem hien tai tu repository cua Chau.
        const students = await db.getScores({
            academicYearId,
            classId,
            subjectId: Number(subject.subjectId)
        });

        // Loc cac ban ghi phan lop da ket thuc.
        // Ap dung cho ca bang diem chi tiet va thong ke.
        const currentStudents = students.filter(
            student => currentEnrollmentIds.has(
                String(student.enrollmentId)
            )
        );

        const rows = buildScoreDetails(
            currentStudents,
            subject,
            formulaPolicy
        );

        details.push(...rows);
    }

    // Phat hien trung hoc sinh trong cung mon.
    // Khong tu dong bo lich su chuyen lop.
    const statistics = buildScoreStatistics(details);

    return {
        academicYearId,
        classId,
        classCode: classInfo.code,
        academicYearCode:
            classInfo.academicYearCode,
        subjectId,
        details,
        statistics
    };
}

module.exports = {
    loadScoreExportData
};