
"use strict";

const assert = require("node:assert/strict");

const { parseCsv } = require("../src/utils/csv-parser");

const {
    validateScoreCsvRows
} = require("../src/services/scoreCsvImportValidation");

const repositoryPath = require.resolve(
    "../src/repositories/scoreCsvImportRepository"
);

const servicePath = require.resolve(
    "../src/services/scoreCsvImportService"
);

const repository = require(repositoryPath);

const originalFind = repository.findScoreCsvContext;
const originalState = repository.getScoreCsvCurrentState;

const TYPES = ["QT1", "QT2", "QT3", "GK", "CK"];

let lockedTypes = new Set();
let existingScores = {};
let enrollmentCount = 1;

repository.findScoreCsvContext = async () => ({
    student: { studentCode: "HS001" },
    academicYear: { academicYearId: "1" },
    classInfo: { classId: "2" },
    subject: { subjectId: "3" },
    enrollments: Array.from(
        { length: enrollmentCount },
        (_, i) => ({ enrollmentId: String(i + 4) })
    )
});

repository.getScoreCsvCurrentState = async () => {
    const components = {};

    for (const type of TYPES) {
        const value = existingScores[type];

        components[type] = {
            scoreValue: value ?? null,
            scoreStatus: value === undefined
                ? "NOT_ENTERED"
                : "SCORED",
            lockStatus: lockedTypes.has(type)
                ? "LOCKED"
                : "UNLOCKED"
        };
    }

    return {
        scoreRecord: {
            scoreRecordId: "10",
            version: 1
        },
        components
    };
};

// Nap Service sau khi thay Repository bang mock.
delete require.cache[servicePath];

const {
    validateScoreCsvDatabase
} = require(servicePath);

function reset() {
    lockedTypes = new Set();
    existingScores = {};
    enrollmentCount = 1;
}

async function preview() {
    const csv = [
        "studentCode,academicYearCode,classCode,subjectCode,QT1,QT2,QT3,GK,CK",
        "HS001,2026-2027,DEMO_10A1,TINHOC,8,9,,,"
    ].join("\n");

    const local = validateScoreCsvRows(
        parseCsv(csv)
    );

    assert.equal(local.errors.length, 0);

    return validateScoreCsvDatabase(local);
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
    reset();

    try {
        await fn();
        passed++;
        console.log("PASS:", name);
    } catch (error) {
        failed++;
        console.error("FAIL:", name);
        console.error("Chi tiet:", error.message);
    }
}

async function main() {

    await test("TC01 - Khong khoa, dong hop le", async () => {
        const result = await preview();

        assert.equal(result.errors.length, 0);
        assert.equal(result.rows[0].eligible, true);
        assert.equal(result.rows[0].changes.length, 2);
        assert.equal(result.eligibleRows, 1);
        assert.equal(result.readyToImport, false);
    });

    await test("TC02 - QT1 khoa, loai ca dong", async () => {
        lockedTypes.add("QT1");

        const result = await preview();

        assert.ok(result.errors.some(error =>
            error.code === "SCORE_LOCKED" &&
            error.column === "QT1" &&
            error.lineNumber === 2
        ));

        assert.equal(result.rows[0].eligible, false);
        assert.equal(result.rows[0].changes.length, 0);
        assert.equal(result.eligibleRows, 0);
    });

    await test("TC03 - QT2 khoa, loai ca dong", async () => {
        lockedTypes.add("QT2");

        const result = await preview();

        assert.ok(result.errors.some(error =>
            error.code === "SCORE_LOCKED" &&
            error.column === "QT2"
        ));

        assert.equal(result.rows[0].eligible, false);
        assert.equal(result.rows[0].changes.length, 0);
    });

    await test("TC04 - Cot khong cap nhat bi khoa", async () => {
        // GK de trong CSV, khong duoc ghi de.
        lockedTypes.add("GK");

        const result = await preview();

        assert.equal(result.errors.length, 0);
        assert.equal(result.rows[0].eligible, true);
        assert.equal(result.rows[0].changes.length, 2);

        assert.equal(
            result.rows[0].changes.some(
                change => change.componentType === "GK"
            ),
            false
        );
    });

    await test("TC05 - Diem khong thay doi", async () => {
        existingScores = {
            QT1: 8,
            QT2: 9
        };

        const result = await preview();

        assert.equal(result.errors.length, 0);
        assert.equal(result.rows[0].eligible, false);
        assert.equal(result.rows[0].changes.length, 0);

        assert.ok(result.warnings.some(w =>
            w.code === "NO_CHANGES"
        ));
    });

    await test("TC06 - Khong co Enrollment", async () => {
        enrollmentCount = 0;

        const result = await preview();

        assert.ok(result.errors.some(error =>
            error.code === "ENROLLMENT_NOT_FOUND"
        ));

        assert.equal(result.rows[0].eligible, false);
    });

    await test("TC07 - Nhieu Enrollment phu hop", async () => {
        enrollmentCount = 2;

        const result = await preview();

        assert.ok(result.errors.some(error =>
            error.code === "AMBIGUOUS_ENROLLMENT"
        ));

        assert.equal(result.rows[0].eligible, false);
    });

    console.log("\n===== KIEM THU KHOA DIEM CSV =====");
    console.log("PASS:", passed);
    console.log("FAIL:", failed);
    console.log("KET QUA:", `${passed}/${passed + failed}`);

    if (failed > 0) {
        process.exitCode = 1;
    }
}

main()
    .catch(error => {
        console.error("FAIL:", error.message);
        process.exitCode = 1;
    })
    .finally(() => {
        repository.findScoreCsvContext = originalFind;
        repository.getScoreCsvCurrentState = originalState;
        delete require.cache[servicePath];
    });
