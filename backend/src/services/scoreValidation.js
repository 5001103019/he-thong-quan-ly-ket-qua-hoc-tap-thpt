
"use strict";

const COMPONENT_TYPES = ["QT1", "QT2", "QT3", "GK", "CK"];

const SCORE_STATUSES = [
    "NOT_ENTERED",
    "SCORED",
    "ABSENT",
    "EXEMPT"
];

// Kiem tra loai thanh phan diem
function validateComponentType(type) {
    return COMPONENT_TYPES.includes(type);
}

// Kiem tra gia tri diem
function validateScoreValue(value, type) {
    // NULL nghia la khong co gia tri diem
    if (value === null) {
        return {
            valid: true,
            missing: true
        };
    }

    // Diem phai la so hop le
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return {
            valid: false,
            code: "INVALID_SCORE",
            message: "Diem phai la so hop le"
        };
    }

    // Diem nam trong khoang 0 den 10
    if (value < 0 || value > 10) {
        return {
            valid: false,
            code: "INVALID_SCORE",
            message: "Diem phai nam trong khoang 0 den 10"
        };
    }

    // Kiem tra quy tac theo loai diem
    if (type !== undefined) {
        if (!validateComponentType(type)) {
            return {
                valid: false,
                code: "INVALID_COMPONENT",
                message: "Loai diem khong hop le"
            };
        }

        // QT1, QT2, QT3 chi nhan diem nguyen
        if (["QT1", "QT2", "QT3"].includes(type)) {
            if (!Number.isInteger(value)) {
                return {
                    valid: false,
                    code: "INVALID_SCORE",
                    message: "Diem qua trinh phai la so nguyen"
                };
            }
        }

        // GK va CK nhan diem theo buoc 0.25
        if (["GK", "CK"].includes(type)) {
            if (!Number.isInteger(value * 4)) {
                return {
                    valid: false,
                    code: "INVALID_SCORE",
                    message: "Diem GK va CK phai theo buoc 0.25"
                };
            }
        }
    }

    return {
        valid: true,
        missing: false
    };
}

// Kiem tra trang thai va gia tri diem truoc khi luu
function validateScoreEntry(componentType, scoreValue, scoreStatus) {

    // Kiem tra loai thanh phan diem
    if (!validateComponentType(componentType)) {
        return {
            valid: false,
            code: "INVALID_COMPONENT",
            message: "Loai diem khong hop le"
        };
    }

    // Kiem tra trang thai diem
    if (!SCORE_STATUSES.includes(scoreStatus)) {
        return {
            valid: false,
            code: "INVALID_STATUS",
            message: "Trang thai diem khong hop le"
        };
    }

    // SCORED bat buoc co diem so
    if (scoreStatus === "SCORED") {
        if (scoreValue === null) {
            return {
                valid: false,
                code: "INVALID_SCORE_STATUS",
                message: "Trang thai SCORED phai co gia tri diem"
            };
        }

        return validateScoreValue(scoreValue, componentType);
    }

    // NOT_ENTERED, ABSENT, EXEMPT phai co gia tri NULL
    if (scoreValue !== null) {
        return {
            valid: false,
            code: "INVALID_SCORE_STATUS",
            message: "Trang thai nay yeu cau gia tri diem la NULL"
        };
    }

    return {
        valid: true,
        missing: true
    };
}

// Kiem tra tinh day du cua 5 thanh phan diem
function checkScoreCompleteness(scores) {
    const missing = [];
    const invalid = [];

    for (const type of COMPONENT_TYPES) {
        const value = Object.prototype.hasOwnProperty.call(scores, type)
            ? scores[type]
            : null;

        const result = validateScoreValue(value, type);

        if (!result.valid) {
            invalid.push(type);
        } else if (result.missing) {
            missing.push(type);
        }
    }

    return {
        complete: missing.length === 0 && invalid.length === 0,
        missing,
        invalid
    };
}

module.exports = {
    COMPONENT_TYPES,
    SCORE_STATUSES,
    validateComponentType,
    validateScoreValue,
    validateScoreEntry,
    checkScoreCompleteness
};
