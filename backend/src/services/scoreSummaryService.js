
"use strict";

// Cong thuc tinh diem tong ket:
// QT1, QT2, QT3: he so 1
// GK: he so 2
// CK: he so 3
// Tong he so: 8
// Lam tron 2 chu so thap phan.

const WEIGHTS = {
    QT1: 1,
    QT2: 1,
    QT3: 1,
    GK: 2,
    CK: 3
};

const TOTAL_WEIGHT = 8;

const FORMULA =
    "(QT1 + QT2 + QT3 + 2 * GK + 3 * CK) / 8";

// Tinh diem tong ket tu du lieu hien tai.
// Khong ghi du lieu vao SQL Server.
// Giu tham so formulaPolicy de tuong thich code cu.
function calculateScoreSummary(scoreRecord, formulaPolicy) {

    if (
        !scoreRecord ||
        !Array.isArray(scoreRecord.components)
    ) {
        throw new Error(
            "Du lieu ban ghi diem khong hop le"
        );
    }

    const components = [];
    const missingComponents = [];

    let weightedSum = 0;

    // Duyet qua 5 cot diem
    for (const componentType of Object.keys(WEIGHTS)) {

        const weight = WEIGHTS[componentType];

        const current = scoreRecord.components.find(
            item => item.componentType === componentType
        );

        const scoreStatus = current
            ? current.scoreStatus
            : "NOT_ENTERED";

        const scoreValue = current
            ? current.scoreValue
            : null;

        // Kiem tra diem hop le
        const isValid =
            scoreStatus === "SCORED" &&
            typeof scoreValue === "number" &&
            Number.isFinite(scoreValue) &&
            scoreValue >= 0 &&
            scoreValue <= 10;

        const weightedValue = isValid
            ? scoreValue * weight
            : null;

        components.push({
            componentType: componentType,
            scoreValue: scoreValue,
            scoreStatus: scoreStatus,
            weight: weight,
            weightedValue: weightedValue
        });

        if (!isValid) {
            missingComponents.push(componentType);
        } else {
            weightedSum += weightedValue;
        }
    }

    // Thieu diem thi chua tinh tong ket
    if (missingComponents.length > 0) {
        return {
            scoreRecordId: scoreRecord.scoreRecordId,
            version: scoreRecord.version,
            calculationStatus: "INCOMPLETE",
            finalScore: null,
            formula: FORMULA,
            totalWeight: TOTAL_WEIGHT,
            weightedSum: null,
            components: components,
            missingComponents: missingComponents
        };
    }

    // Du 5 cot diem thi tinh tong ket tu dong
    const finalScore = Math.round(
        (weightedSum / TOTAL_WEIGHT) * 100
    ) / 100;

    return {
        scoreRecordId: scoreRecord.scoreRecordId,
        version: scoreRecord.version,
        calculationStatus: "CALCULATED",
        finalScore: finalScore,
        formula: FORMULA,
        totalWeight: TOTAL_WEIGHT,
        weightedSum: weightedSum,
        components: components,
        missingComponents: []
    };
}

module.exports = {
    calculateScoreSummary
};
