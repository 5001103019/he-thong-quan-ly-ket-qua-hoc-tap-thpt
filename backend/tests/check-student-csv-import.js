
"use strict";

const assert = require("node:assert/strict");

const {
    confirmStudentCsv
} = require("../src/services/student-csv-import-service");

const header = [
    "studentCode",
    "fullName",
    "dateOfBirth",
    "academicYearCode",
    "classCode",
    "startDate",
    "status"
].join(",");

function studentRow(code, status = "ACTIVE") {
    return [
        code,
        "Hoc sinh kiem thu",
        "2010-02-15",
        "2026-2027",
        "10A1",
        "2026-09-01",
        status
    ].join(",");
}

function csv(...rows) {
    return [header, ...rows].join("\n");
}

// Tao database gia lap, khong ket noi SQL Server that.
function fakeDatabase(options = {}) {
    const calls = {
        begin: 0,
        commit: 0,
        rollback: 0,
        students: 0,
        enrollments: 0,
        isolationLevel: null
    };

    class Transaction {
        constructor(pool) {
            this.pool = pool;
        }

        async begin(level) {
            calls.begin++;
            calls.isolationLevel = level;
        }

        async commit() {
            calls.commit++;
        }

        async rollback() {
            calls.rollback++;
        }
    }

    class Request {
        constructor(transaction) {
            assert.ok(
                transaction instanceof Transaction,
                "Truy van phai nam trong transaction."
            );

            this.params = {};
        }

        input(name, type, value) {
            this.params[name] = value;
            return this;
        }

        async query(queryText) {
            // Kiem tra ma hoc sinh da ton tai.
            if (
                queryText.includes(
                    "FROM dbo.student WITH"
                )
            ) {
                const exists =
                    this.params.studentCode ===
                    options.existingStudentCode;

                return {
                    recordset: exists
                        ? [{ student_id: "999" }]
                        : []
                };
            }

            // Kiem tra nien khoa va lop.
            if (
                queryText.includes(
                    "FROM dbo.academic_year AS a"
                )
            ) {
                if (options.missingYear) {
                    return { recordset: [] };
                }

                return {
                    recordset: [{
                        academicYearId: "1",
                        yearStatus:
                            options.closedYear
                                ? "CLOSED"
                                : "PLANNED",
                        classId:
                            options.missingClass
                                ? null
                                : "10",
                        classStatus:
                            options.inactiveClass
                                ? "INACTIVE"
                                : "ACTIVE"
                    }]
                };
            }

            // Gia lap them hoc sinh.
            if (
                queryText.includes(
                    "INSERT INTO dbo.student ("
                )
            ) {
                calls.students++;

            if (
                options.uniqueStudentInsertAt ===
                calls.students
            ) {
                const conflict = new Error(
                    "Gia lap vi pham UNIQUE"
                );

                if (options.uniqueErrorNumber === 2601) {
                    conflict.number = 2601;
                } else {
                    conflict.originalError = {
                        info: { number: 2627 }
                    };
                }

                throw conflict;
            }

                return {
                    recordset: [{
                        studentId:
                            String(100 + calls.students)
                    }]
                };
            }

            // Gia lap them Enrollment.
            if (
                queryText.includes(
                    "INSERT INTO dbo.enrollment ("
                )
            ) {
                calls.enrollments++;

                if (
                    options.failEnrollmentAt ===
                    calls.enrollments
                ) {
                    throw new Error(
                        "Loi SQL Server gia lap."
                    );
                }

                return {
                    recordset: [{
                        enrollmentId:
                            String(200 + calls.enrollments)
                    }]
                };
            }

            throw new Error(
                "Truy van SQL chua duoc gia lap."
            );
        }
    }

    const sql = {
        Transaction,
        Request,
        ISOLATION_LEVEL: {
            SERIALIZABLE: "SERIALIZABLE"
        },
        VarChar: () => "VarChar",
        NVarChar: () => "NVarChar",
        BigInt: "BigInt"
    };

    return {
        database: {
            sql,
            connectDatabase: async () => ({})
        },
        calls
    };
}

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

async function expectImportError(
    input,
    database,
    expectedCode
) {
    await assert.rejects(
        () => confirmStudentCsv(input, database),
        error => {
            assert.ok(
                error.errors.some(
                    item => item.code === expectedCode
                ),
                "Thieu ma loi: " + expectedCode
            );

            return true;
        }
    );
}

async function main() {
    // 1. Hai hoc sinh hop le.
    await test(
        "Import hop le thi COMMIT mot lan",
        async () => {
            const { database, calls } = fakeDatabase();

            const result = await confirmStudentCsv(
                csv(
                    studentRow("HS001"),
                    studentRow("HS002")
                ),
                database
            );

            assert.equal(result.importedCount, 2);
            assert.equal(calls.begin, 1);
            assert.equal(calls.commit, 1);
            assert.equal(calls.rollback, 0);
            assert.equal(calls.students, 2);
            assert.equal(calls.enrollments, 2);
            assert.equal(
                calls.isolationLevel,
                "SERIALIZABLE"
            );
        }
    );

    // 2. Hoc sinh thu hai trung ma database.
    await test(
        "Trung ma dong thu hai thi ROLLBACK",
        async () => {
            const { database, calls } = fakeDatabase({
                existingStudentCode: "HS002"
            });

            await expectImportError(
                csv(
                    studentRow("HS001"),
                    studentRow("HS002")
                ),
                database,
                "STUDENT_ALREADY_EXISTS"
            );

            assert.equal(calls.commit, 0);
            assert.equal(calls.rollback, 1);
        }
    );

    // 3. Nien khoa khong ton tai.
    await test(
        "Nien khoa khong ton tai thi ROLLBACK",
        async () => {
            const { database, calls } = fakeDatabase({
                missingYear: true
            });

            await expectImportError(
                csv(studentRow("HS001")),
                database,
                "ACADEMIC_YEAR_NOT_FOUND"
            );

            assert.equal(calls.commit, 0);
            assert.equal(calls.rollback, 1);
        }
    );

    // 4. Lop khong ton tai.
    await test(
        "Lop khong ton tai thi ROLLBACK",
        async () => {
            const { database, calls } = fakeDatabase({
                missingClass: true
            });

            await expectImportError(
                csv(studentRow("HS001")),
                database,
                "CLASS_NOT_FOUND"
            );

            assert.equal(calls.commit, 0);
            assert.equal(calls.rollback, 1);
        }
    );

    // 5. Nien khoa da dong.
    await test(
        "Nien khoa CLOSED thi ROLLBACK",
        async () => {
            const { database, calls } = fakeDatabase({
                closedYear: true
            });

            await expectImportError(
                csv(studentRow("HS001")),
                database,
                "ACADEMIC_YEAR_CLOSED"
            );

            assert.equal(calls.commit, 0);
            assert.equal(calls.rollback, 1);
        }
    );

    // 6. Hoc sinh INACTIVE khong duoc phan lop.
    await test(
        "Hoc sinh INACTIVE thi ROLLBACK",
        async () => {
            const { database, calls } = fakeDatabase();

            await expectImportError(
                csv(studentRow("HS001", "INACTIVE")),
                database,
                "STUDENT_INACTIVE"
            );

            assert.equal(calls.commit, 0);
            assert.equal(calls.rollback, 1);
        }
    );

    // 7. SQL Server loi khi tao Enrollment thu hai.
    await test(
        "Loi Enrollment dong thu hai thi ROLLBACK",
        async () => {
            const { database, calls } = fakeDatabase({
                failEnrollmentAt: 2
            });

            await assert.rejects(
                () => confirmStudentCsv(
                    csv(
                        studentRow("HS001"),
                        studentRow("HS002")
                    ),
                    database
                ),
                /Loi SQL Server gia lap/
            );

            assert.equal(calls.students, 2);
            assert.equal(calls.enrollments, 2);
            assert.equal(calls.commit, 0);
            assert.equal(calls.rollback, 1);
        }
    );

    // 8. CSV sai ngay sinh, khong mo transaction.
    await test(
        "CSV sai thi khong bat dau transaction",
        async () => {
            const { database, calls } = fakeDatabase();

            const invalidCsv = csv(
                studentRow("HS001").replace(
                    "2010-02-15",
                    "2010-15-40"
                )
            );

            await assert.rejects(
                () => confirmStudentCsv(
                    invalidCsv,
                    database
                ),
                error =>
                    error.code === "CSV_VALIDATION_ERROR"
            );

            assert.equal(calls.begin, 0);
            assert.equal(calls.commit, 0);
            assert.equal(calls.rollback, 0);
        }
    );

    // 9. SQL Server bao loi 2601 tai dong thu hai.
    await test(
        "SQL 2601 dong thu hai: HTTP 409 va rollback",
        async () => {
            const { database, calls } = fakeDatabase({
                uniqueStudentInsertAt: 2,
                uniqueErrorNumber: 2601
            });

            await assert.rejects(
                () => confirmStudentCsv(
                    csv(
                        studentRow("HS001"),
                        studentRow("HS002")
                    ),
                    database
                ),
                error => {
                    assert.equal(error.code, "IMPORT_CONFLICT");
                    assert.equal(error.status, 409);
                    assert.equal(error.errors[0].lineNumber, 3);
                    assert.equal(
                        error.errors[0].code,
                        "UNIQUE_CONSTRAINT_CONFLICT"
                    );
                    return true;
                }
            );

            assert.equal(calls.commit, 0);
            assert.equal(calls.rollback, 1);
            assert.equal(calls.enrollments, 1);
        }
    );

    // 10. SQL Server bao loi 2627 duoi dang originalError.
    await test(
        "SQL 2627: xu ly loi long nhau va rollback",
        async () => {
            const { database, calls } = fakeDatabase({
                uniqueStudentInsertAt: 1,
                uniqueErrorNumber: 2627
            });

            await assert.rejects(
                () => confirmStudentCsv(
                    csv(studentRow("HS001")),
                    database
                ),
                error => {
                    assert.equal(error.code, "IMPORT_CONFLICT");
                    assert.equal(error.status, 409);
                    assert.equal(error.errors[0].lineNumber, 2);
                    assert.equal(
                        error.errors[0].code,
                        "UNIQUE_CONSTRAINT_CONFLICT"
                    );
                    return true;
                }
            );

            assert.equal(calls.commit, 0);
            assert.equal(calls.rollback, 1);
            assert.equal(calls.enrollments, 0);
        }
    );

    console.log("\n===== TONG KET =====");
    console.log("PASS:", passed);
    console.log("FAIL:", failed);

    if (failed === 0 && passed === 10) {
        console.log("KET QUA: 10/10 PASS");
    } else {
        console.log("KET QUA: CHUA DAT");
        process.exitCode = 1;
    }
}

main().catch(error => {
    console.error("LOI KIEM THU:", error.message);
    process.exitCode = 1;
});
