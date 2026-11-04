
"use strict";

const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const cookieParser = require("cookie-parser");

// Gia lap module ma khong sua file goc.
function mockModule(modulePath, value) {
    const resolved = require.resolve(modulePath);

    require.cache[resolved] = {
        id: resolved,
        filename: resolved,
        loaded: true,
        exports: value
    };
}

// 1. Gia lap session dang nhap.
mockModule(
    "../src/services/auth-session-service",
    {
        SESSION_COOKIE_NAME: "thpt_session",

        getSession: async token => {
            if (token === "admin-mock") {
                return {
                    user_id: 1,
                    username: "admin_test",
                    role_code: "KHAO_THI",
                    student_id: null
                };
            }

            if (token === "student-mock") {
                return {
                    user_id: 2,
                    username: "student_test",
                    role_code: "HOC_SINH",
                    student_id: 2
                };
            }

            return null;
        }
    }
);

// 2. Gia lap cac API hoc sinh cu.
// Khong sua Controller cua VT3-03.
const unusedHandler = (req, res) => {
    return res.status(501).json({
        success: false
    });
};

mockModule(
    "../src/controllers/student.controller",
    {
        getAllStudents: unusedHandler,
        getStudentById: unusedHandler,
        getStudentEnrollmentHistory: unusedHandler,
        createStudent: unusedHandler,
        updateStudentProfile: unusedHandler,
        assignStudentToClass: unusedHandler,
        transferStudentToClass: unusedHandler,
        updateStudentStatus: unusedHandler
    }
);

// 3. Gia lap ket qua Preview.
mockModule(
    "../src/services/student-csv-preview-service",
    {
        previewStudentCsv: async () => ({
            headers: ["studentCode"],
            rows: [{
                lineNumber: 2,
                data: { studentCode: "HS001" }
            }],
            errors: [],
            canImport: true
        })
    }
);

// 4. Gia lap ket qua Confirm.
mockModule(
    "../src/services/student-csv-import-service",
    {
        confirmStudentCsv: async csvText => {
            if (csvText === "INVALID_CSV") {
                const error = new Error(
                    "CSV hoc sinh khong hop le."
                );

                error.code = "CSV_VALIDATION_ERROR";
                error.errors = [{
                    lineNumber: 2,
                    code: "INVALID_STUDENT_CODE",
                    message: "Ma hoc sinh khong hop le."
                }];

                throw error;
            }

            if (csvText === "DUPLICATE_CSV") {
                const error = new Error(
                    "Ma hoc sinh da ton tai."
                );

                error.code = "IMPORT_CONFLICT";
                error.errors = [{
                    lineNumber: 2,
                    code: "STUDENT_ALREADY_EXISTS",
                    message: "Ma hoc sinh da ton tai."
                }];

                throw error;
            }

            return {
                importedCount: 1,
                imported: [{
                    lineNumber: 2,
                    studentCode: "HS001",
                    studentId: "100",
                    enrollmentId: "200"
                }]
            };
        }
    }
);

// 5. Tao Express server kiem thu.
const studentRoutes = require(
    "../src/routes/student.routes"
);

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use("/api/v1/students", studentRoutes);

let passed = 0;
let failed = 0;

async function test(name, callback) {
    try {
        await callback();
        passed++;
        console.log("PASS:", name);
    } catch (error) {
        failed++;
        console.log("FAIL:", name);
        console.log("Ly do:", error.message);
    }
}

async function main() {
    const server = app.listen(0, "127.0.0.1");

    try {
        await once(server, "listening");

        const address = server.address();

        const baseUrl =
            "http://127.0.0.1:" + address.port +
            "/api/v1/students/import";

        // Gui HTTP request that den Express.
        async function post(endpoint, body, token) {
            const headers = {
                "Content-Type": "application/json"
            };

            if (token) {
                headers.Cookie =
                    "thpt_session=" + token;
            }

            const response = await fetch(
                baseUrl + endpoint,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify(body)
                }
            );

            return {
                status: response.status,
                body: await response.json()
            };
        }

        // 1. Preview chua dang nhap.
        await test(
            "Preview tu choi khi chua dang nhap",
            async () => {
                const res = await post(
                    "/preview",
                    { csvText: "VALID_CSV" }
                );

                assert.equal(res.status, 401);
            }
        );

        // 2. Hoc sinh khong co quyen Preview.
        await test(
            "Hoc sinh khong duoc Preview",
            async () => {
                const res = await post(
                    "/preview",
                    { csvText: "VALID_CSV" },
                    "student-mock"
                );

                assert.equal(res.status, 403);
            }
        );

        // 3. Preview tu choi body rong.
        await test(
            "Preview tu choi body rong",
            async () => {
                const res = await post(
                    "/preview",
                    {},
                    "admin-mock"
                );

                assert.equal(res.status, 400);
                assert.equal(
                    res.body.error.code,
                    "VALIDATION_ERROR"
                );
            }
        );

        // 4. Phong Khao thi Preview thanh cong.
        await test(
            "Phong Khao thi Preview thanh cong",
            async () => {
                const res = await post(
                    "/preview",
                    { csvText: "VALID_CSV" },
                    "admin-mock"
                );

                assert.equal(res.status, 200);
                assert.equal(res.body.success, true);
                assert.equal(
                    res.body.data.canImport,
                    true
                );
            }
        );

        // 5. Confirm chua dang nhap.
        await test(
            "Confirm tu choi khi chua dang nhap",
            async () => {
                const res = await post(
                    "/confirm",
                    {
                        csvText: "VALID_CSV",
                        confirmed: true
                    }
                );

                assert.equal(res.status, 401);
            }
        );

        // 6. Hoc sinh khong co quyen Confirm.
        await test(
            "Hoc sinh khong duoc Confirm",
            async () => {
                const res = await post(
                    "/confirm",
                    {
                        csvText: "VALID_CSV",
                        confirmed: true
                    },
                    "student-mock"
                );

                assert.equal(res.status, 403);
            }
        );

        // 7. Chua xac nhan Import.
        await test(
            "Confirm tu choi khi confirmed la false",
            async () => {
                const res = await post(
                    "/confirm",
                    {
                        csvText: "VALID_CSV",
                        confirmed: false
                    },
                    "admin-mock"
                );

                assert.equal(res.status, 400);
            }
        );

        // 8. Confirm CSV sai.
        await test(
            "Confirm tra HTTP 422 khi CSV sai",
            async () => {
                const res = await post(
                    "/confirm",
                    {
                        csvText: "INVALID_CSV",
                        confirmed: true
                    },
                    "admin-mock"
                );

                assert.equal(res.status, 422);
                assert.equal(
                    res.body.error.code,
                    "CSV_VALIDATION_ERROR"
                );
                assert.equal(
                    res.body.error.details[0].lineNumber,
                    2
                );
            }
        );

        // 9. Confirm gap ma hoc sinh trung.
        await test(
            "Confirm tra HTTP 409 khi trung ma",
            async () => {
                const res = await post(
                    "/confirm",
                    {
                        csvText: "DUPLICATE_CSV",
                        confirmed: true
                    },
                    "admin-mock"
                );

                assert.equal(res.status, 409);
                assert.equal(
                    res.body.error.code,
                    "IMPORT_CONFLICT"
                );
            }
        );

        // 10. Confirm hop le.
        await test(
            "Confirm tra HTTP 201 khi thanh cong",
            async () => {
                const res = await post(
                    "/confirm",
                    {
                        csvText: "VALID_CSV",
                        confirmed: true
                    },
                    "admin-mock"
                );

                assert.equal(res.status, 201);
                assert.equal(res.body.success, true);
                assert.equal(
                    res.body.data.importedCount,
                    1
                );
            }
        );

        console.log("\n===== TONG KET HTTP =====");
        console.log("PASS:", passed);
        console.log("FAIL:", failed);

        if (passed === 10 && failed === 0) {
            console.log("KET QUA: 10/10 PASS");
        } else {
            console.log("KET QUA: CHUA DAT");
            process.exitCode = 1;
        }

    } finally {
        await new Promise((resolve, reject) => {
            server.close(error => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
}

main().catch(error => {
    console.error("LOI KIEM THU:", error.message);
    process.exitCode = 1;
});
