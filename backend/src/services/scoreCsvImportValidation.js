
"use strict";

const {
    COMPONENT_TYPES,
    validateScoreEntry
} = require("./scoreValidation");

// Cau truc CSV diem cua nhom.
const REQUIRED_HEADERS = [
    "studentCode",
    "academicYearCode",
    "classCode",
    "subjectCode",
    "QT1",
    "QT2",
    "QT3",
    "GK",
    "CK"
];

const ID_FIELDS = [
    "studentCode",
    "academicYearCode",
    "classCode",
    "subjectCode"
];

// Kiem tra gia tri diem doc tu CSV.
function parseScoreCell(rawValue, componentType) {

    if (typeof rawValue !== "string") {
        return {
            valid: false,
            code: "INVALID_SCORE",
            message: "Gia tri CSV khong hop le"
        };
    }

    const text = rawValue.trim();

    // O trong la thieu diem, khong phai diem 0.
    if (text === "") {
        return {
            valid: true,
            missing: true,
            scoreValue: null
        };
    }

    // Chi chap nhan bieu dien so thap phan thong thuong.
    if (!/^(0|[1-9][0-9]*)(\.[0-9]+)?$/.test(text)) {
        return {
            valid: false,
            code: "INVALID_SCORE",
            message: "Gia tri diem phai la so hop le"
        };
    }

    const scoreValue = Number(text);

    // Su dung ham kiem tra diem da co cua Chau.
    const result = validateScoreEntry(
        componentType,
        scoreValue,
        "SCORED"
    );

    if (!result.valid) {
        return {
            valid: false,
            code: result.code,
            message: result.message
        };
    }

    return {
        valid: true,
        missing: false,
        scoreValue,
        scoreStatus: "SCORED"
    };
}

// Kiem tra du lieu diem sau khi parser doc CSV.
function validateScoreCsvRows(parsed) {

    if (
        !parsed ||
        !Array.isArray(parsed.headers) ||
        !Array.isArray(parsed.rows) ||
        !Array.isArray(parsed.errors)
    ) {
        throw new TypeError(
            "Ket qua parser CSV khong hop le"
        );
    }

    const errors = [...parsed.errors];
    const warnings = [];
    const rows = [];

    // Kiem tra chinh xac 9 cot CSV diem.
    const headersValid =
        parsed.headers.length === REQUIRED_HEADERS.length &&
        REQUIRED_HEADERS.every(header =>
            parsed.headers.includes(header)
        );

    if (!headersValid) {
        errors.push({
            lineNumber: 1,
            code: "INVALID_SCORE_CSV_HEADERS",
            message: "Tep CSV khong dung cau truc cot diem"
        });

        return {
            rows: [],
            errors,
            warnings,
            validationStage: "LOCAL_VALIDATION",
            readyToImport: false
        };
    }

    // Luu cac dong de phat hien trung.
    const seenRows = new Map();

    for (const row of parsed.rows) {

        const data = row.data;
        const lineNumber = row.lineNumber;

        const codes = {};
        const scores = {};
        const missingComponents = [];
        const updates = [];

        // 1. Kiem tra cac ma nhan dien khong rong.
        for (const field of ID_FIELDS) {
            const raw = data[field];

            const value =
                typeof raw === "string"
                    ? raw.trim()
                    : "";

            codes[field] = value;

            if (value === "") {
                errors.push({
                    lineNumber,
                    column: field,
                    value: raw ?? null,
                    code: "REQUIRED_FIELD",
                    message: "Thieu ma nhan dien bat buoc"
                });
            }
        }

        // 2. Kiem tra 5 thanh phan diem.
        for (const component of COMPONENT_TYPES) {

            const rawValue = data[component];

            const result = parseScoreCell(
                rawValue,
                component
            );

            if (!result.valid) {
                errors.push({
                    lineNumber,
                    studentCode: codes.studentCode,
                    column: component,
                    value: rawValue ?? null,
                    code: result.code,
                    message: result.message
                });

                continue;
            }

            if (result.missing) {
                scores[component] = null;
                missingComponents.push(component);

                warnings.push({
                    lineNumber,
                    studentCode: codes.studentCode,
                    column: component,
                    code: "MISSING_SCORE",
                    message:
                        "O diem trong, khong duoc tu dong doi thanh 0"
                });

                continue;
            }

            scores[component] = result.scoreValue;

            updates.push({
                componentType: component,
                scoreValue: result.scoreValue,
                scoreStatus: "SCORED"
            });
        }

        // 3. Phat hien trung pham vi hoc sinh - mon.
        if (ID_FIELDS.every(field => codes[field] !== "")) {

            const key = JSON.stringify(
                ID_FIELDS.map(field => codes[field])
            );

            if (seenRows.has(key)) {
                const firstLine = seenRows.get(key);

                for (const duplicateLine of [
                    firstLine,
                    lineNumber
                ]) {
                    if (!errors.some(error =>
                        error.code === "DUPLICATE_SCORE_ROW" &&
                        error.lineNumber === duplicateLine
                    )) {
                        errors.push({
                            lineNumber: duplicateLine,
                            column: "studentCode",
                            code: "DUPLICATE_SCORE_ROW",
                            message:
                                "Trung hoc sinh, nien khoa, lop va mon trong CSV"
                        });
                    }
                }
            } else {
                seenRows.set(key, lineNumber);
            }
        }

        rows.push({
            lineNumber,
            codes,
            scores,
            missingComponents,
            updates
        });
    }

    // Chua kiem tra CSDL, quyen va khoa diem.
    // Khong cho phep Import tai giai doan nay.
    return {
        rows,
        errors,
        warnings,
        validationStage: "LOCAL_VALIDATION",
        readyToImport: false
    };
}

module.exports = {
    REQUIRED_HEADERS,
    parseScoreCell,
    validateScoreCsvRows
};
