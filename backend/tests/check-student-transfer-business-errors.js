
"use strict";

const assert = require("node:assert/strict");

let messageToThrow = "";

// Gia lap service va repository.
// Khong ket noi hoac thay doi SQL Server.
function mockModule(file, value) {
    const id = require.resolve(file);

    require.cache[id] = {
        id,
        filename: id,
        loaded: true,
        exports: value
    };
}

mockModule("../src/services/enrollment-transaction", {
    transferStudentWithTransaction: async () => {
        throw new Error(messageToThrow);
    }
});

mockModule("../src/repositories/student.repository", {
    getStudentById: async () => ({
        studentId: 4,
        status: "ACTIVE"
    }),

    getStudentEnrollmentHistory: async () => [
        {
            academicYearId: 1,
            classId: 3,
            endDate: null
        }
    ]
});

mockModule("../src/services/student-enrollment-service", {
    assignStudentToClass: async () => null
});

const {
    transferStudentToClass
} = require("../src/controllers/student.controller");

async function checkError(name, message, expectedStatus, expectedCode) {
    messageToThrow = message;

    const req = {
        params: { id: "4" },
        body: {
            academicYearId: 1,
            newClassId: 2,
            transferDate: "2026-11-01"
        },
        auth: {
            userId: "1",
            roleCode: "KHAO_THI"
        }
    };

    const res = {
        statusCode: null,
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

    await transferStudentToClass(req, res);

    assert.equal(
        res.statusCode,
        expectedStatus,
        name + ": sai HTTP status"
    );

    assert.equal(res.body?.success, false);

    assert.equal(
        res.body?.error?.code,
        expectedCode,
        name + ": sai error code"
    );

    assert.equal(
        res.body?.error?.message,
        message
    );

    console.log("PASS:", name);
}

async function main() {
    await checkError(
        "Chuyen lop khac khoi",
        "Chuyen lop phai trong cung khoi.",
        409,
        "CONFLICT"
    );

    await checkError(
        "Ngay chuyen lop truoc ngay bat dau",
        "Ngay chuyen lop phai sau ngay bat dau lop cu.",
        400,
        "VALIDATION_ERROR"
    );

    await checkError(
        "Lop dich khong ton tai",
        "Lop moi khong ton tai hoac khong hop le.",
        409,
        "CONFLICT"
    );

    await checkError(
        "Khong co phan lop hien tai",
        "Khong tim thay phan lop hien tai.",
        409,
        "CONFLICT"
    );

    console.log("");

    await checkError(
        "Ma dinh danh khong hop le",
        "Ma dinh danh khong hop le.",
        400,
        "VALIDATION_ERROR"
    );

    await checkError(
        "Sai dinh dang ngay chuyen lop",
        "Ngay chuyen lop phai co dang YYYY-MM-DD.",
        400,
        "VALIDATION_ERROR"
    );

    await checkError(
        "Tai khoan khong co quyen chuyen lop",
        "Tai khoan khong co quyen chuyen lop.",
        403,
        "FORBIDDEN"
    );

    await checkError(
        "Lop moi trung lop hien tai",
        "Lop moi phai khac lop hien tai.",
        409,
        "CONFLICT"
    );

    console.log("TONG KET: 8/8 PASS");
}

main().catch(error => {
    console.error("FAIL:", error.message);
    process.exitCode = 1;
});
