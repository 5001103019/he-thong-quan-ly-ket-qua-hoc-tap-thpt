
const COMPONENT_TYPES = ["QT1", "QT2", "QT3", "GK", "CK"];

// Kiem tra loai thanh phan diem
function validateComponentType(type) {
    return COMPONENT_TYPES.includes(type);
}

// Kiem tra gia tri diem
function validateScoreValue(value) {
    // NULL nghia la chua nhap diem
    if (value === null) {
        return {
            valid: true,
            missing: true
        };
    }

    // Kiem tra du lieu co phai la so hop le
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return {
            valid: false,
            code: "INVALID_SCORE",
            message: "Diem phai la so hop le"
        };
    }

    // Mien diem 0-10: de xuat, cho nhom xac nhan
    if (value < 0 || value > 10) {
        return {
            valid: false,
            code: "INVALID_SCORE",
            message: "Diem phai nam trong khoang 0 den 10"
        };
    }

    return {
        valid: true,
        missing: false
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

        const result = validateScoreValue(value);

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
    validateComponentType,
    validateScoreValue,
    checkScoreCompleteness
};
