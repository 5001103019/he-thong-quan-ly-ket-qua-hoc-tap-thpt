
"use strict";

const { parseCsv } = require("../utils/csv-parser");

const REQUIRED_HEADERS = [
    "studentCode",
    "fullName",
    "dateOfBirth",
    "academicYearCode",
    "classCode",
    "startDate",
    "status"
];

function validDate(value) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        value.startsWith("0000-")
    ) {
        return false;
    }

    const date = new Date(value + "T00:00:00Z");

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
}

function todayInVietnam() {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const get = type =>
        parts.find(part => part.type === type).value;

    return (
        get("year") + "-" +
        get("month") + "-" +
        get("day")
    );
}

function validAcademicYearCode(value) {
    const match = /^(\d{4})-(\d{4})$/.exec(value);

    if (!match) {
        return false;
    }

    const firstYear = Number(match[1]);
    const secondYear = Number(match[2]);

    return (
        firstYear >= 1000 &&
        firstYear <= 9998 &&
        secondYear === firstYear + 1
    );
}

function validateStudentCsv(csvText) {
    const parsed = parseCsv(csvText);
    const errors = [...parsed.errors];
    const validRows = [];

    const headers = parsed.headers;

    // Kiem tra du 7 cot bat buoc va khong co cot la.
    const headerValid =
        headers.length === REQUIRED_HEADERS.length &&
        REQUIRED_HEADERS.every(
            field => headers.includes(field)
        );

    if (headers.length === 0) {
        return {
            headers,
            rows: [],
            errors
        };
    }

    if (!headerValid) {
        errors.push({
            lineNumber: 1,
            code: "INVALID_HEADER",
            message: "Cau truc cot CSV hoc sinh khong hop le."
        });

        return {
            headers,
            rows: [],
            errors
        };
    }

    // Neu parser da phat hien loi tieu de, dung xu ly.
    if (errors.some(error =>
        error.code === "INVALID_HEADER"
    )) {
        return {
            headers,
            rows: [],
            errors
        };
    }

    // File co tieu de nhung khong co dong hoc sinh.
    if (
        parsed.rows.length === 0 &&
        errors.length === 0
    ) {
        errors.push({
            lineNumber: 1,
            field: null,
            code: "NO_DATA_ROWS",
            message: "CSV khong co dong du lieu hoc sinh."
        });
    }

    const seenCodes = new Map();
    const today = todayInVietnam();

    for (const row of parsed.rows) {
        const { lineNumber } = row;

        const data = {
            studentCode: row.data.studentCode.trim(),
            fullName: row.data.fullName.trim(),
            dateOfBirth: row.data.dateOfBirth.trim(),
            academicYearCode:
                row.data.academicYearCode.trim(),
            classCode: row.data.classCode.trim(),
            startDate: row.data.startDate.trim(),
            status: row.data.status.trim()
        };

        let rowValid = true;

        function addError(field, code, message) {
            rowValid = false;

            errors.push({
                lineNumber,
                field,
                code,
                message
            });
        }

        // 1. Ma hoc sinh
        if (
            data.studentCode.length === 0 ||
            data.studentCode.length > 30
        ) {
            addError(
                "studentCode",
                "INVALID_STUDENT_CODE",
                "Ma hoc sinh phai co tu 1 den 30 ky tu."
            );
        } else {
            // Kiem tra trung ma trong cung file.
            const key = data.studentCode.toLowerCase();

            if (seenCodes.has(key)) {
                addError(
                    "studentCode",
                    "DUPLICATE_STUDENT_CODE",
                    "Ma hoc sinh trung voi dong " +
                        seenCodes.get(key) + "."
                );
            } else {
                seenCodes.set(key, lineNumber);
            }
        }

        // 2. Ho va ten
        if (
            data.fullName.length === 0 ||
            data.fullName.length > 150
        ) {
            addError(
                "fullName",
                "INVALID_FULL_NAME",
                "Ho ten phai co tu 1 den 150 ky tu."
            );
        }

        // 3. Ngay sinh
        if (
            !validDate(data.dateOfBirth) ||
            data.dateOfBirth > today
        ) {
            addError(
                "dateOfBirth",
                "INVALID_DATE_OF_BIRTH",
                "Ngay sinh khong hop le."
            );
        }

        // 4. Ma nien khoa
        if (
            !validAcademicYearCode(
                data.academicYearCode
            )
        ) {
            addError(
                "academicYearCode",
                "INVALID_ACADEMIC_YEAR",
                "Ma nien khoa khong hop le."
            );
        }

        // 5. Ma lop
        if (
            data.classCode.length === 0 ||
            data.classCode.length > 20
        ) {
            addError(
                "classCode",
                "INVALID_CLASS_CODE",
                "Ma lop phai co tu 1 den 20 ky tu."
            );
        }

        // 6. Ngay bat dau phan lop
        if (!validDate(data.startDate)) {
            addError(
                "startDate",
                "INVALID_START_DATE",
                "Ngay bat dau phan lop khong hop le."
            );
        }

        // Ngay bat dau khong the truoc ngay sinh.
        if (
            validDate(data.dateOfBirth) &&
            validDate(data.startDate) &&
            data.startDate < data.dateOfBirth
        ) {
            addError(
                "startDate",
                "INVALID_START_DATE",
                "Ngay phan lop khong duoc truoc ngay sinh."
            );
        }

        // 7. Trang thai hoc sinh
        if (
            !["ACTIVE", "INACTIVE"].includes(data.status)
        ) {
            addError(
                "status",
                "INVALID_STATUS",
                "Trang thai hoc sinh khong hop le."
            );
        }

        if (rowValid) {
            validRows.push({
                lineNumber,
                data
            });
        }
    }

    return {
        headers,
        rows: validRows,
        errors
    };
}

module.exports = {
    validateStudentCsv
};
