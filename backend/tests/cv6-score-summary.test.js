
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    calculateScoreSummary
} = require("../src/services/scoreSummaryService");

test("TC18 - O chua nhap khong tinh tong ket", () => {
    const scoreRecord = {
        scoreRecordId: 999,
        version: 1,
        components: [
            {
                componentType: "QT1",
                scoreValue: 10,
                scoreStatus: "SCORED"
            },
            {
                componentType: "QT2",
                scoreValue: 0,
                scoreStatus: "SCORED"
            },
            {
                componentType: "QT3",
                scoreValue: null,
                scoreStatus: "NOT_ENTERED"
            },
            {
                componentType: "GK",
                scoreValue: 7.5,
                scoreStatus: "SCORED"
            },
            {
                componentType: "CK",
                scoreValue: 8.25,
                scoreStatus: "SCORED"
            }
        ]
    };

    const formulaPolicy = {
        approvalStatus: "APPROVED"
    };

    const result = calculateScoreSummary(
        scoreRecord,
        formulaPolicy
    );

    assert.equal(result.calculationStatus, "INCOMPLETE");
    assert.equal(result.finalScore, null);
    assert.deepEqual(result.missingComponents, ["QT3"]);

    const qt2 = result.components.find(
        item => item.componentType === "QT2"
    );

    assert.equal(qt2.weightedValue, 0);
});

test("TC19 - Tinh tong ket khop phep tinh tay", () => {
    const scoreRecord = {
        scoreRecordId: 999,
        version: 1,
        components: [
            {
                componentType: "QT1",
                scoreValue: 8,
                scoreStatus: "SCORED"
            },
            {
                componentType: "QT2",
                scoreValue: 7,
                scoreStatus: "SCORED"
            },
            {
                componentType: "QT3",
                scoreValue: 9,
                scoreStatus: "SCORED"
            },
            {
                componentType: "GK",
                scoreValue: 7.5,
                scoreStatus: "SCORED"
            },
            {
                componentType: "CK",
                scoreValue: 8.25,
                scoreStatus: "SCORED"
            }
        ]
    };

    const formulaPolicy = {
        approvalStatus: "APPROVED"
    };

    const result = calculateScoreSummary(
        scoreRecord,
        formulaPolicy
    );

    assert.equal(result.calculationStatus, "CALCULATED");
    assert.equal(result.weightedSum, 63.75);
    assert.equal(result.finalScore, 7.97);
    assert.deepEqual(result.missingComponents, []);
});
