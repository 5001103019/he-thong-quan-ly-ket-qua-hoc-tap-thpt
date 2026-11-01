
const assert = require("node:assert/strict");

const {
    validateComponentType,
    validateScoreValue,
    checkScoreCompleteness
} = require("../src/services/scoreValidation");

let passed = 0;

function runTest(name, testFunction) {
    try {
        testFunction();
        console.log("[PASS] " + name);
        passed++;
    } catch (error) {
        console.error("[FAIL] " + name);
        console.error(error.message);
        process.exitCode = 1;
    }
}

// TC01: Diem 0 hop le
runTest("Diem 0 hop le", () => {
    assert.equal(validateScoreValue(0).valid, true);
});

// TC02: Diem 10 hop le
runTest("Diem 10 hop le", () => {
    assert.equal(validateScoreValue(10).valid, true);
});

// TC03: NULL la chua nhap
runTest("NULL la chua nhap", () => {
    const result = validateScoreValue(null);
    assert.equal(result.valid, true);
    assert.equal(result.missing, true);
});

// TC04: Diem 11 khong hop le
runTest("Diem 11 khong hop le", () => {
    assert.equal(validateScoreValue(11).valid, false);
});

// TC05: Diem am khong hop le
runTest("Diem am khong hop le", () => {
    assert.equal(validateScoreValue(-1).valid, false);
});

// TC06: Chuoi khong phai diem so
runTest("Chuoi khong hop le", () => {
    assert.equal(validateScoreValue("8").valid, false);
});

// TC07: Kiem tra loai diem
runTest("Loai diem hop le", () => {
    assert.equal(validateComponentType("QT1"), true);
    assert.equal(validateComponentType("ABC"), false);
});

// TC08: Thieu QT3
runTest("Phat hien thieu QT3", () => {
    const scores = {
        QT1: 0,
        QT2: 7,
        QT3: null,
        GK: 8,
        CK: 9
    };

    const result = checkScoreCompleteness(scores);

    assert.equal(result.complete, false);
    assert.deepEqual(result.missing, ["QT3"]);
});

// TC09: Day du 5 thanh phan
runTest("Day du 5 thanh phan", () => {
    const scores = {
        QT1: 0,
        QT2: 7,
        QT3: 8,
        GK: 9,
        CK: 10
    };

    const result = checkScoreCompleteness(scores);

    assert.equal(result.complete, true);
});

// TC10: Phat hien diem sai
runTest("Phat hien diem sai", () => {
    const scores = {
        QT1: 7,
        QT2: 11,
        QT3: 8,
        GK: 9,
        CK: 10
    };

    const result = checkScoreCompleteness(scores);

    assert.equal(result.complete, false);
    assert.deepEqual(result.invalid, ["QT2"]);
});


    // TC11: QT1 nhan diem nguyen
    runTest("QT1 nhan diem nguyen", () => {
        assert.equal(validateScoreValue(7, "QT1").valid, true);
    });

    // TC12: QT1 khong nhan diem le
    runTest("QT1 tu choi diem le", () => {
        assert.equal(validateScoreValue(7.5, "QT1").valid, false);
    });

    // TC13: GK nhan diem theo buoc 0.25
    runTest("GK nhan diem 7.25", () => {
        assert.equal(validateScoreValue(7.25, "GK").valid, true);
    });

    // TC14: CK tu choi diem khong dung buoc
    runTest("CK tu choi diem 7.3", () => {
        assert.equal(validateScoreValue(7.3, "CK").valid, false);
    });

    console.log("\nTong ket: " + passed + "/14 PASS");
