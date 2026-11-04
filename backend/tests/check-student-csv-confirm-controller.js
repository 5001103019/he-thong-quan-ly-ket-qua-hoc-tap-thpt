
"use strict";

const assert = require("node:assert/strict");

const {
    confirmStudentImport
} = require("../src/controllers/student-csv.controller");

let passed = 0;
let failed = 0;

// Gia lap doi tuong Response cua Express.
function createResponse() {
    return {
        statusCode: 200,
        body: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.body = data;
            return this;
        }
    };
}

// Kiem tra Controller tra dung HTTP va ma loi.
async function test(name, body, expectedStatus, expectedCode) {
    try {
        const req = { body };
        const res = createResponse();

        await confirmStudentImport(req, res);

        assert.equal(res.statusCode, expectedStatus);
        assert.equal(res.body.success, false);
        assert.equal(res.body.error.code, expectedCode);

        passed++;
        console.log("PASS:", name);
    } catch (error) {
        failed++;
        console.log("FAIL:", name);
        console.log("Ly do:", error.message);
    }
}

async function main() {
    // 1. Khong gui du lieu.
    await test(
        "Tu choi body rong",
        {},
        400,
        "VALIDATION_ERROR"
    );

    // 2. csvText khong phai chuoi.
    await test(
        "Tu choi csvText sai kieu",
        {
            csvText: 123,
            confirmed: true
        },
        400,
        "VALIDATION_ERROR"
    );

    // 3. Thieu confirmed.
    await test(
        "Tu choi khi thieu xac nhan",
        {
            csvText: "abc"
        },
        400,
        "VALIDATION_ERROR"
    );

    // 4. confirmed = false.
    await test(
        "Tu choi khi confirmed la false",
        {
            csvText: "abc",
            confirmed: false
        },
        400,
        "VALIDATION_ERROR"
    );

    // 5. confirmed phai la boolean true.
    await test(
        "Tu choi confirmed dang chuoi",
        {
            csvText: "abc",
            confirmed: "true"
        },
        400,
        "VALIDATION_ERROR"
    );

    // 6. Khong chap nhan truong du lieu la.
    await test(
        "Tu choi body co truong khong hop le",
        {
            csvText: "abc",
            confirmed: true,
            extra: "unknown"
        },
        400,
        "VALIDATION_ERROR"
    );

    // 7. Gioi han kich thuoc CSV.
    await test(
        "Tu choi CSV vuot 64 KB",
        {
            csvText: "A".repeat(65537),
            confirmed: true
        },
        413,
        "CSV_TOO_LARGE"
    );

    // 8. Da xac nhan nhung CSV sai cau truc.
    // Service phai tu choi truoc khi ket noi database.
    await test(
        "Tu choi CSV sai cau truc du da xac nhan",
        {
            csvText: "wrongHeader\nvalue",
            confirmed: true
        },
        422,
        "CSV_VALIDATION_ERROR"
    );

    console.log("\n===== TONG KET KIEM THU =====");
    console.log("PASS:", passed);
    console.log("FAIL:", failed);

    if (passed === 8 && failed === 0) {
        console.log("KET QUA: 8/8 PASS");
    } else {
        console.log("KET QUA: CHUA DAT");
        process.exitCode = 1;
    }
}

main().catch(error => {
    console.error("LOI:", error.message);
    process.exitCode = 1;
});
