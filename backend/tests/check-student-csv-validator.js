
"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { validateStudentCsv } = require(
    "../src/services/student-csv-validator"
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
        console.log("FAIL:", name);
        console.log("Ly do:", error.message);
    }
}

const header =
    "studentCode,fullName,dateOfBirth," +
    "academicYearCode,classCode,startDate,status";

function makeRow(studentCode = "HS001", changes = {}) {
    const data = {
        studentCode,
        fullName: "Nguyen Van A",
        dateOfBirth: "2010-02-15",
        academicYearCode: "2026-2027",
        classCode: "DEMO_10A1",
        startDate: "2026-09-01",
        status: "ACTIVE",
        ...changes
    };

    return [
        data.studentCode,
        data.fullName,
        data.dateOfBirth,
        data.academicYearCode,
        data.classCode,
        data.startDate,
        data.status
    ].join(",");
}

function makeCsv(...rows) {
    return [header, ...rows].join("\n");
}

function hasError(result, code) {
    return result.errors.some(error => error.code === code);
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

// 1. File mau hop le
test("CSV hoc sinh mau hop le", () => {
    const result = validateStudentCsv(
        readSample("students-valid.csv")
    );

    assert.equal(result.rows.length, 2);
    assert.equal(result.errors.length, 0);
});

// 2. File mau co loi
test("Phat hien loi trong CSV mau", () => {
    const result = validateStudentCsv(
        readSample("students-invalid.csv")
    );

    assert.equal(result.rows.length, 2);
    assert.equal(result.errors.length, 4);

    assert.ok(hasError(result, "INVALID_STUDENT_CODE"));
    assert.ok(hasError(result, "INVALID_FULL_NAME"));
    assert.ok(hasError(result, "INVALID_DATE_OF_BIRTH"));
    assert.ok(hasError(result, "DUPLICATE_STUDENT_CODE"));
});

// 3. Ma hoc sinh rong
test("Tu choi ma hoc sinh rong", () => {
    const result = validateStudentCsv(
        makeCsv(makeRow(""))
    );

    assert.ok(hasError(result, "INVALID_STUDENT_CODE"));
    assert.equal(result.rows.length, 0);
});

// 4. Ma hoc sinh qua dai
test("Tu choi ma hoc sinh qua 30 ky tu", () => {
    const result = validateStudentCsv(
        makeCsv(makeRow("A".repeat(31)))
    );

    assert.ok(hasError(result, "INVALID_STUDENT_CODE"));
});

// 5. Ho ten rong
test("Tu choi ho ten rong", () => {
    const result = validateStudentCsv(
        makeCsv(makeRow("HS001", { fullName: "" }))
    );

    assert.ok(hasError(result, "INVALID_FULL_NAME"));
});

// 6. Ngay sinh khong ton tai
test("Tu choi ngay sinh khong hop le", () => {
    const result = validateStudentCsv(
        makeCsv(makeRow("HS001", {
            dateOfBirth: "2010-15-40"
        }))
    );

    assert.ok(hasError(result, "INVALID_DATE_OF_BIRTH"));
});

// 7. Ngay sinh trong tuong lai
test("Tu choi ngay sinh trong tuong lai", () => {
    const result = validateStudentCsv(
        makeCsv(makeRow("HS001", {
            dateOfBirth: "2099-01-01"
        }))
    );

    assert.ok(hasError(result, "INVALID_DATE_OF_BIRTH"));
});

// 8. Ma nien khoa sai
test("Tu choi ma nien khoa sai", () => {
    const result = validateStudentCsv(
        makeCsv(makeRow("HS001", {
            academicYearCode: "2026-2028"
        }))
    );

    assert.ok(hasError(result, "INVALID_ACADEMIC_YEAR"));
});

// 9. Ngay phan lop sai
test("Tu choi ngay phan lop khong ton tai", () => {
    const result = validateStudentCsv(
        makeCsv(makeRow("HS001", {
            startDate: "2026-02-30"
        }))
    );

    assert.ok(hasError(result, "INVALID_START_DATE"));
});

// 10. Phan lop truoc ngay sinh
test("Tu choi phan lop truoc ngay sinh", () => {
    const result = validateStudentCsv(
        makeCsv(makeRow("HS001", {
            startDate: "2009-01-01"
        }))
    );

    assert.ok(hasError(result, "INVALID_START_DATE"));
});

// 11. Trang thai sai
test("Tu choi trang thai khong hop le", () => {
    const result = validateStudentCsv(
        makeCsv(makeRow("HS001", {
            status: "UNKNOWN"
        }))
    );

    assert.ok(hasError(result, "INVALID_STATUS"));
});

// 12. Trung ma hoc sinh trong cung CSV
test("Phat hien trung ma khong phan biet hoa thuong", () => {
    const result = validateStudentCsv(
        makeCsv(
            makeRow("HS001"),
            makeRow("hs001")
        )
    );

    assert.equal(result.rows.length, 1);
    assert.ok(
        hasError(result, "DUPLICATE_STUDENT_CODE")
    );
});

// 13. Sai danh sach cot
test("Tu choi thieu cot bat buoc", () => {
    const result = validateStudentCsv(
        "studentCode,fullName\nHS001,Nguyen Van A"
    );

    assert.equal(result.rows.length, 0);
    assert.ok(hasError(result, "INVALID_HEADER"));
});

// 14. Sai so luong cot tai mot dong
test("Phat hien dong CSV sai so cot", () => {
    const result = validateStudentCsv(
        makeCsv(
            makeRow("HS001"),
            "HS002,Nguyen Van B"
        )
    );

    assert.equal(result.rows.length, 1);
    assert.ok(
        hasError(result, "COLUMN_COUNT_MISMATCH")
    );
});

// 15. Ma lop sai ve cau truc
test("Tu choi ma lop rong", () => {
    const result = validateStudentCsv(
        makeCsv(makeRow("HS001", {
            classCode: ""
        }))
    );

    assert.equal(result.rows.length, 0);
    assert.ok(hasError(result, "INVALID_CLASS_CODE"));
});
// 16. CSV chi co tieu de, khong co hoc sinh.
test("Tu choi CSV chi co tieu de", () => {
    const result = validateStudentCsv(header);

    assert.equal(result.rows.length, 0);

    assert.ok(
        result.errors.some(error =>
            error.code === "NO_DATA_ROWS" &&
            error.lineNumber === 1
        )
    );
});

console.log("\n===== TONG KET KIEM THU =====");
console.log("PASS:", passed);
console.log("FAIL:", failed);

console.log(
    "KET QUA:",
    failed === 0 && passed === 16
        ? "16/16 PASS"
        : "CHUA DAT"
);

if (failed > 0 || passed !== 16) {
    process.exitCode = 1;
}
