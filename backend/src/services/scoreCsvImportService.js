
"use strict";

const {
    findScoreCsvContext,
    getScoreCsvCurrentState
} = require("../repositories/scoreCsvImportRepository");

// Kiem tra nghiep vu CSV voi SQL Server.
// Ham nay chi doc du lieu, khong ghi diem.

async function validateScoreCsvDatabase(localValidation) {

    if (
        !localValidation ||
        !Array.isArray(localValidation.rows) ||
        !Array.isArray(localValidation.errors) ||
        !Array.isArray(localValidation.warnings)
    ) {
        throw new TypeError(
            "Du lieu validation khong hop le"
        );
    }

    const errors = [...localValidation.errors];
    const warnings = [...localValidation.warnings];
    const rows = [];

    function addError(row, column, code, message) {
        errors.push({
            lineNumber: row.lineNumber,
            studentCode: row.codes.studentCode,
            column,
            code,
            message
        });
    }

    function addWarning(row, column, code, message) {
        warnings.push({
            lineNumber: row.lineNumber,
            studentCode: row.codes.studentCode,
            column,
            code,
            message
        });
    }

    for (const row of localValidation.rows) {

        const outputRow = {
            lineNumber: row.lineNumber,
            codes: row.codes,
            scores: row.scores,
            missingComponents: row.missingComponents,
            eligible: false,
            changes: []
        };

        // Dong co loi cuc bo thi khong tiep tuc xu ly.
        const hasLocalError = errors.some(
            error => error.lineNumber === row.lineNumber
        );

        if (hasLocalError) {
            rows.push(outputRow);
            continue;
        }

        // 1. Doi chieu ma voi SQL Server.
        const context = await findScoreCsvContext(
            row.codes
        );

        if (!context.student) {
            addError(
                row,
                "studentCode",
                "STUDENT_NOT_FOUND",
                "Khong tim thay hoc sinh"
            );
        }

        if (!context.academicYear) {
            addError(
                row,
                "academicYearCode",
                "ACADEMIC_YEAR_NOT_FOUND",
                "Khong tim thay nien khoa"
            );
        }

        if (!context.classInfo) {
            addError(
                row,
                "classCode",
                "CLASS_NOT_FOUND",
                "Khong tim thay lop trong nien khoa"
            );
        }

        if (!context.subject) {
            addError(
                row,
                "subjectCode",
                "SUBJECT_NOT_FOUND",
                "Khong tim thay mon hoc"
            );
        }

        // Khong truy van diem neu cac ma chua hop le.
        if (errors.some(
            error => error.lineNumber === row.lineNumber
        )) {
            rows.push(outputRow);
            continue;
        }

        // 2. Kiem tra lich su phan lop.
        if (context.enrollments.length === 0) {
            addError(
                row,
                "classCode",
                "ENROLLMENT_NOT_FOUND",
                "Hoc sinh khong thuoc lop trong nien khoa"
            );

            rows.push(outputRow);
            continue;
        }

        if (context.enrollments.length > 1) {
            addError(
                row,
                "classCode",
                "AMBIGUOUS_ENROLLMENT",
                "Co nhieu ban ghi phan lop phu hop"
            );

            rows.push(outputRow);
            continue;
        }

        // 3. Doc diem hien tai va trang thai khoa.
        const current = await getScoreCsvCurrentState({
            enrollmentId:
                context.enrollments[0].enrollmentId,
            academicYearId:
                context.academicYear.academicYearId,
            classId:
                context.classInfo.classId,
            subjectId:
                context.subject.subjectId
        });
        
        // Luu thong tin phien ban tai thoi diem Preview.
        // Confirm se doi chieu lai voi SQL Server.
        outputRow.scoreRecordId =
            current.scoreRecord?.scoreRecordId ?? null;

        outputRow.expectedVersion =
            current.scoreRecord?.version ?? null;

        const changes = [];

        // 4. Kiem tra tung thanh phan can cap nhat.
        for (const update of row.updates) {

            const component =
                current.components[update.componentType];

            if (!component) {
                addError(
                    row,
                    update.componentType,
                    "COMPONENT_NOT_FOUND",
                    "Khong tim thay thanh phan diem"
                );
                continue;
            }

            // Tuyet doi khong ghi de cot LOCKED.
            if (component.lockStatus === "LOCKED") {
                addError(
                    row,
                    update.componentType,
                    "SCORE_LOCKED",
                    "Cot diem da khoa, khong duoc ghi de"
                );
                continue;
            }

            // Trang thai khoa bat thuong phai tu choi.
            if (component.lockStatus !== "UNLOCKED") {
                addError(
                    row,
                    update.componentType,
                    "INVALID_LOCK_STATUS",
                    "Trang thai khoa diem khong hop le"
                );
                continue;
            }

            // Neu diem khong thay doi thi khong can ghi.
            if (
                component.scoreStatus === "SCORED" &&
                component.scoreValue === update.scoreValue
            ) {
                addWarning(
                    row,
                    update.componentType,
                    "NO_CHANGE",
                    "Gia tri diem giong du lieu hien tai"
                );
                continue;
            }

            changes.push({
                componentType: update.componentType,
                scoreValue: update.scoreValue,
                scoreStatus: update.scoreStatus
            });
        }

        // 5. Mot cot bi khoa/loi thi loai ca dong.
        const hasBusinessError = errors.some(
            error => error.lineNumber === row.lineNumber
        );

        if (hasBusinessError) {
            rows.push(outputRow);
            continue;
        }

        // Khong ghi neu khong co thay doi.
        if (changes.length === 0) {
            addWarning(
                row,
                null,
                "NO_CHANGES",
                "Dong CSV khong co gia tri can cap nhat"
            );

            rows.push(outputRow);
            continue;
        }

        outputRow.eligible = true;
        outputRow.changes = changes;

        rows.push(outputRow);
    }

    return {
        rows,
        errors,
        warnings,
        validationStage: "DATABASE_VALIDATION",

        // Chi danh gia kha nang nhap.
        // Chua co API Confirm nen chua cho phep import.
        eligibleRows: rows.filter(
            row => row.eligible
        ).length,

        readyToImport: false
    };
}

module.exports = {
    validateScoreCsvDatabase
};
