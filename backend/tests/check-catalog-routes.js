
"use strict";

const assert = require("node:assert/strict");
const express = require("express");
const cookieParser = require("cookie-parser");

/*
 * Gia lap mot module.
 * Khong thay doi file goc cua du an.
 */
function mockModule(path, value) {
    const resolved = require.resolve(path);

    require.cache[resolved] = {
        id: resolved,
        filename: resolved,
        loaded: true,
        exports: value
    };
}

/*
 * Gia lap phien dang nhap.
 * Khong ket noi database that.
 */
mockModule(
    "../src/services/auth-session-service",
    {
        SESSION_COOKIE_NAME: "thpt_session",

        getSession: async (token) => {
            if (token === "admin-mock") {
                return {
                    user_id: 1,
                    username: "khao_thi_test",
                    role_code: "KHAO_THI",
                    student_id: null
                };
            }

            if (token === "student-mock") {
                return {
                    user_id: 2,
                    username: "hoc_sinh_test",
                    role_code: "HOC_SINH",
                    student_id: 1
                };
            }

            return null;
        }
    }
);

/*
 * Du lieu gia lap cua cac danh muc.
 */
const year = {
    academicYearId: 1,
    code: "2026-2027",
    startYear: 2026,
    endYear: 2027,
    status: "PLANNED"
};

const grade = {
    gradeId: 1,
    gradeNumber: 10
};

const classData = {
    classId: 1,
    academicYearId: 1,
    gradeId: 1,
    code: "10A1",
    name: "Lop 10A1",
    status: "ACTIVE"
};

const subject = {
    subjectId: 1,
    code: "TOAN",
    name: "Toan",
    status: "ACTIVE"
};

/*
 * Gia lap Repository nien khoa.
 */
mockModule(
    "../src/repositories/academic-year.repository",
    {
        getAllAcademicYears: async () => [year],

        getAcademicYearById: async (id) =>
            id === 1 ? year : null,

        createAcademicYear: async (data) => ({
            academicYearId: 2,
            ...data
        }),

        updateAcademicYear: async (id, data) => ({
            academicYearId: id,
            ...data
        })
    }
);

/*
 * Gia lap Repository khoi.
 */
mockModule(
    "../src/repositories/grade.repository",
    {
        getAllGrades: async () => [grade],

        getGradeById: async (id) =>
            id === 1 ? grade : null,

        createGrade: async (gradeNumber) => ({
            gradeId: 2,
            gradeNumber
        }),

        updateGrade: async (id, gradeNumber) => ({
            gradeId: id,
            gradeNumber
        })
    }
);

/*
 * Gia lap Repository lop hoc.
 */
mockModule(
    "../src/repositories/class.repository",
    {
        getAllClasses: async () => [classData],

        getClassById: async (id) =>
            id === 1 ? classData : null,

        createClass: async (data) => ({
            classId: 2,
            ...data
        }),

        updateClass: async (id, data) => ({
            classId: id,
            ...data
        })
    }
);

/*
 * Gia lap Repository mon hoc.
 */
mockModule(
    "../src/repositories/subject.repository",
    {
        getAllSubjects: async () => [subject],

        getSubjectById: async (id) =>
            id === 1 ? subject : null,

        createSubject: async (data) => ({
            subjectId: 2,
            ...data
        }),

        updateSubject: async (id, data) => ({
            subjectId: id,
            ...data
        })
    }
);

/*
 * Tao Express de kiem thu HTTP.
 * Su dung Routes va middleware that.
 */
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use(
    "/api/v1/academic-years",
    require("../src/routes/academic-year.routes")
);

app.use(
    "/api/v1/grades",
    require("../src/routes/grade.routes")
);

app.use(
    "/api/v1/classes",
    require("../src/routes/class.routes")
);

app.use(
    "/api/v1/subjects",
    require("../src/routes/subject.routes")
);

/*
 * Du lieu gui len API cho tung nhom.
 */
const apis = [
    {
        name: "Nien khoa",
        path: "/api/v1/academic-years",
        post: {
            code: "2027-2028",
            startYear: 2027,
            endYear: 2028
        },
        patch: {
            status: "ACTIVE"
        }
    },
    {
        name: "Khoi",
        path: "/api/v1/grades",
        post: {
            gradeNumber: 11
        },
        patch: {
            gradeNumber: 10
        }
    },
    {
        name: "Lop hoc",
        path: "/api/v1/classes",
        post: {
            academicYearId: 1,
            gradeId: 1,
            code: "10A2",
            name: "Lop 10A2"
        },
        patch: {
            status: "INACTIVE"
        }
    },
    {
        name: "Mon hoc",
        path: "/api/v1/subjects",
        post: {
            code: "NGUVAN",
            name: "Ngu van"
        },
        patch: {
            status: "INACTIVE"
        }
    }
];

/*
 * Thuc hien mot yeu cau HTTP.
 */
async function request(baseUrl, path, method, body, token) {
    const headers = {};

    if (token) {
        headers.Cookie = `thpt_session=${token}`;
    }

    if (body !== null) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(baseUrl + path, {
        method,
        headers,
        ...(body !== null
            ? { body: JSON.stringify(body) }
            : {})
    });

    return {
        status: response.status,
        body: await response.json()
    };
}

/*
 * Kiem tra Routes va phan quyen.
 */
async function main() {
    const server = app.listen(0, "127.0.0.1");

    try {
        await new Promise((resolve) => {
            server.once("listening", resolve);
        });

        const port = server.address().port;
        const baseUrl = `http://127.0.0.1:${port}`;

        let passed = 0;

        for (const api of apis) {
            console.log(`\n=== ${api.name} ===`);

            const operations = [
                ["GET", api.path, null, 200],
                ["POST", api.path, api.post, 201],
                ["PATCH", `${api.path}/1`, api.patch, 200]
            ];

            for (const [method, path, body, successCode]
                of operations) {

                const roles = [
                    ["Chua dang nhap", null, 401],
                    ["Hoc sinh", "student-mock", 403],
                    ["Khao thi", "admin-mock", successCode]
                ];

                for (const [role, token, expected]
                    of roles) {

                    const result = await request(
                        baseUrl,
                        path,
                        method,
                        body,
                        token
                    );

                    assert.equal(
                        result.status,
                        expected,
                        `${api.name} - ${method} - ${role}`
                    );

                    assert.equal(
                        result.body.success,
                        expected < 400
                    );

                    passed++;

                    console.log(
                        `PASS ${passed}: ${method} - ${role} - HTTP ${expected}`
                    );
                }
            }
        }

        console.log(
            `\nHOAN THANH: ${passed}/36 TEST PASS`
        );

    } finally {
        await new Promise((resolve) => {
            server.close(resolve);
        });
    }
}

// Bao loi neu co bai kiem thu that bai
main().catch((error) => {
    console.error("TEST FAILED:", error);
    process.exitCode = 1;
});
