
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { parseCsv } = require(
    "../src/utils/csv-parser"
);

let passed = 0;
let failed = 0;

function test(name, callback) {
    try {
        callback();
        passed++;
        console.log("PASS:", name);
    } catch (error) {
        failed++;
        console.error("FAIL:", name);
        console.error("  Ly do:", error.message);
    }
}

function readSample(filename) {
    return fs.readFileSync(
        path.join(
            __dirname,
            "../demo-data/csv",
            filename
        ),
        "utf8"
    );
}

// 1. CSV hoc sinh hop le
test("CSV hoc sinh hop le", () => {
    const result = parseCsv(
        readSample("students-valid.csv")
    );

    assert.equal(result.headers.length, 7);
    assert.equal(result.rows.length, 2);
    assert.equal(result.errors.length, 0);
    assert.equal(result.rows[0].lineNumber, 2);
    assert.equal(
        result.rows[0].data.studentCode,
        "DEMO_G05_CSV_S01"
    );
});

// 2. CSV hoc sinh co loi nghiep vu
test("CSV sai nghiep vu van doc duoc cau truc", () => {
    const result = parseCsv(
        readSample("students-invalid.csv")
    );

    assert.equal(result.headers.length, 7);
    assert.equal(result.rows.length, 6);
    assert.equal(result.errors.length, 0);

    // Loi ma rong, ngay sai, lop sai va trung ma
    // se duoc kiem tra o lop nghiep vu, khong phai parser.
});

// 3. CSV diem dung chung
test("Parser doc duoc CSV diem", () => {
    const result = parseCsv(
        "studentCode,QT1,QT2,GK\nHS001,0,8,7\n"
    );

    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].data.QT1, "0");
    assert.equal(result.rows[0].data.GK, "7");
    assert.equal(result.errors.length, 0);
});

// 4. UTF-8 BOM
test("Xu ly UTF-8 BOM", () => {
    const result = parseCsv(
        "\uFEFFstudentCode,fullName\nHS001,An"
    );

    assert.deepEqual(
        result.headers,
        ["studentCode", "fullName"]
    );
    assert.equal(result.errors.length, 0);
});

// 5. Dau phay trong noi dung
test("Dau phay trong chuoi co nhay kep", () => {
    const result = parseCsv(
        'code,name\nHS001,"Nguyen, Van An"'
    );

    assert.equal(
        result.rows[0].data.name,
        "Nguyen, Van An"
    );
});

// 6. Nhay kep duoc thoat
test("Dau nhay kep thoat bang hai dau nhay", () => {
    const result = parseCsv(
        'code,note\nHS001,"Hoc sinh ""A"""'
    );

    assert.equal(
        result.rows[0].data.note,
        'Hoc sinh "A"'
    );
});

// 7. Xuong dong Windows
test("Xu ly CRLF", () => {
    const result = parseCsv(
        "code,name\r\nHS001,An\r\nHS002,Binh\r\n"
    );

    assert.equal(result.rows.length, 2);
    assert.equal(result.errors.length, 0);
});

// 8. Chuoi chua xuong dong
test("Xuong dong ben trong nhay kep", () => {
    const result = parseCsv(
        'code,note\nHS001,"Dong 1\nDong 2"\nHS002,OK'
    );

    assert.equal(result.rows.length, 2);
    assert.equal(result.rows[0].lineNumber, 2);
    assert.equal(result.rows[1].lineNumber, 4);
    assert.equal(
        result.rows[0].data.note,
        "Dong 1\nDong 2"
    );
});

// 9. Trung ten cot
test("Phat hien trung ten cot", () => {
    const result = parseCsv(
        "code,code\nHS001,HS002"
    );

    assert.equal(result.rows.length, 0);
    assert.ok(
        result.errors.some(
            error => error.code === "INVALID_HEADER"
        )
    );
});

// 10. Sai so cot
test("Phat hien sai so luong cot", () => {
    const result = parseCsv(
        "code,name\nHS001,An,ThuaCot\nHS002,Binh"
    );

    assert.equal(result.rows.length, 1);
    assert.equal(result.rows[0].lineNumber, 3);

    assert.ok(
        result.errors.some(
            error =>
                error.lineNumber === 2 &&
                error.code === "COLUMN_COUNT_MISMATCH"
        )
    );
});

// 11. Thieu dau nhay kep dong
test("Phat hien nhay kep chua dong", () => {
    const result = parseCsv(
        'code,name\nHS001,"Nguyen Van An'
    );

    assert.ok(
        result.errors.some(
            error =>
                error.lineNumber === 2 &&
                error.code === "INVALID_CSV"
        )
    );
});

// 12. File rong
test("Phat hien file CSV rong", () => {
    const result = parseCsv("");

    assert.equal(result.rows.length, 0);
    assert.ok(
        result.errors.some(
            error => error.code === "EMPTY_CSV"
        )
    );
});


test("Giu khoang trang trong nhay kep", () => {
    const result = parseCsv(
        'code,note\nHS01,"  Ghi chu  "'
    );

    assert.equal(result.errors.length, 0);
    assert.equal(
        result.rows[0].data.note,
        "  Ghi chu  "
    );
});

test("Giu dau phay va khoang trang", () => {
    const result = parseCsv(
        'code,note\nHS01,"  A, B  "'
    );

    assert.equal(result.errors.length, 0);
    assert.equal(
        result.rows[0].data.note,
        "  A, B  "
    );
});

test("Doc truong rong trong nhay kep", () => {
    const result = parseCsv(
        'code,note\nHS01,""'
    );

    assert.equal(result.errors.length, 0);
    assert.equal(result.rows[0].data.note, "");
});

console.log("\n===== TONG KET KIEM THU =====");
console.log("PASS:", passed);
console.log("FAIL:", failed);
console.log(
    "KET QUA:",
    failed === 0 ? "15/15 PASS" : "CHUA DAT"
);

if (failed > 0) {
    process.exitCode = 1;
}
