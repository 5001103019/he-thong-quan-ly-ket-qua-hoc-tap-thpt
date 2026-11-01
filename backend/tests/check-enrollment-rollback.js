
/*
 * BUOC 26.2.3 - KIEM THU ROLLBACK CHUYEN LOP
 *
 * Tao loi gia lap khi INSERT Enrollment moi.
 * Kiem tra transaction da ROLLBACK:
 * - Enrollment cu van con hieu luc
 * - Khong co Enrollment moi
 * - Diem QT1 van la 6
 *
 * Khong thay doi trigger hay migration.
 */

const {
    sql,
    connectDatabase
} = require("../src/config/database");

const {
    transferStudentWithTransaction
} = require("../src/services/enrollment-transaction");

async function testRollback() {
    let pool = null;

    try {
        pool = await connectDatabase();

        console.log("Da ket noi SQL Server.");

        // 1. Tim bo du lieu RB26.
        const sampleResult = await pool.request().query(`
            SELECT TOP (1)
                e.enrollment_id,
                e.student_id,
                e.academic_year_id,
                e.class_id,
                s.student_code,
                c.code AS class_code,
                sc.score_component_id
            FROM dbo.enrollment e
            JOIN dbo.student s
                ON s.student_id = e.student_id
            JOIN dbo.[class] c
                ON c.class_id = e.class_id
            JOIN dbo.academic_year ay
                ON ay.academic_year_id =
                   e.academic_year_id
            JOIN dbo.score_record sr
                ON sr.enrollment_id = e.enrollment_id
            JOIN dbo.score_component sc
                ON sc.score_record_id =
                   sr.score_record_id
            WHERE ay.code = '2090-2091'
              AND s.student_code LIKE 'RB26S[_]%'
              AND c.code LIKE 'RB26A[_]%'
              AND e.start_date = '2090-09-01'
              AND e.end_date IS NULL
              AND sc.component_type = 'QT1'
              AND sc.score_status = 'SCORED'
              AND sc.score_value = 6
            ORDER BY e.enrollment_id DESC
        `);

        if (sampleResult.recordset.length !== 1) {
            throw new Error(
                "Khong tim thay du lieu RB26 ban dau."
            );
        }

        const sample = sampleResult.recordset[0];
        const token = sample.student_code.substring(6);

        if (
            !/^[0-9A-F]{8}$/i.test(token) ||
            sample.class_code !== "RB26A_" + token
        ) {
            throw new Error(
                "Ma du lieu RB26 khong khop."
            );
        }

        console.log(
            "PASS 1: Tim thay hoc sinh RB26 tai lop A."
        );

        // 2. Tim lop B.
        const classResult = await pool.request()
            .input(
                "yearId",
                sql.BigInt,
                sample.academic_year_id
            )
            .input(
                "classCode",
                sql.VarChar(20),
                "RB26B_" + token
            )
            .query(`
                SELECT class_id
                FROM dbo.[class]
                WHERE academic_year_id = @yearId
                  AND code = @classCode
                  AND status = 'ACTIVE'
            `);

        if (classResult.recordset.length !== 1) {
            throw new Error(
                "Khong tim thay lop B."
            );
        }

        const newClassId =
            Number(classResult.recordset[0].class_id);

        console.log(
            "PASS 2: Tim thay lop B."
        );

        // 3. Tim tai khoan KHAO_THI test.
        const userResult = await pool.request().query(`
            SELECT TOP (1) u.user_id
            FROM dbo.app_user u
            JOIN dbo.[role] r
                ON r.role_id = u.role_id
            WHERE u.username LIKE 'TXK[_]%'
              AND r.code = 'KHAO_THI'
              AND u.is_active = 1
            ORDER BY u.user_id DESC
        `);

        if (userResult.recordset.length !== 1) {
            throw new Error(
                "Khong tim thay tai khoan KHAO_THI test."
            );
        }

        const performedBy =
            Number(userResult.recordset[0].user_id);

        console.log(
            "PASS 3: Tim thay tai khoan KHAO_THI."
        );

        // 4. Gia lap loi tai thao tac INSERT.
        //
        // Day la ky thuat fault injection trong file test.
        // Ham transaction van chay UPDATE that.
        // Chi thao tac INSERT Enrollment moi bi gia lap loi.
        //
        // Khong sua code production hoac schema.

        const originalQuery = sql.Request.prototype.query;

        let injected = false;
        let rejected = false;

        const injectedError =
            "RB26_INJECTED_INSERT_FAILURE";

        try {
            sql.Request.prototype.query = function (
                command,
                ...args
            ) {
                if (
                    typeof command === "string" &&
                    /\bINSERT\s+INTO\s+dbo\.enrollment\s*\(/i
                        .test(command)
                ) {
                    injected = true;

                    return Promise.reject(
                        new Error(injectedError)
                    );
                }

                return originalQuery.call(
                    this,
                    command,
                    ...args
                );
            };

            try {
                await transferStudentWithTransaction({
                    studentId: Number(sample.student_id),
                    academicYearId: Number(
                        sample.academic_year_id
                    ),
                    newClassId,
                    transferDate: "2090-10-01",
                    performedBy
                });

            } catch (error) {
                if (error.message === injectedError) {
                    rejected = true;
                } else {
                    throw error;
                }
            }

        } finally {
            // Phuc hoi ngay ham query goc.
            sql.Request.prototype.query = originalQuery;
        }

        if (!injected || !rejected) {
            throw new Error(
                "Khong gay duoc loi INSERT mong doi."
            );
        }

        console.log(
            "PASS 4: Loi INSERT duoc gia lap thanh cong."
        );

        console.log(
            "PASS 5: Backend da tu choi giao dich."
        );

        // 5. Doc lai lich su Enrollment.
        const historyResult = await pool.request()
            .input(
                "studentId",
                sql.BigInt,
                sample.student_id
            )
            .input(
                "yearId",
                sql.BigInt,
                sample.academic_year_id
            )
            .query(`
                SELECT
                    enrollment_id,
                    class_id,
                    CONVERT(
                        VARCHAR(10),
                        end_date,
                        23
                    ) AS end_date_text,
                    exit_reason
                FROM dbo.enrollment
                WHERE student_id = @studentId
                  AND academic_year_id = @yearId
            `);

        const history = historyResult.recordset;

        if (
            history.length !== 1 ||
            String(history[0].enrollment_id) !==
                String(sample.enrollment_id) ||
            String(history[0].class_id) !==
                String(sample.class_id) ||
            history[0].end_date_text !== null ||
            history[0].exit_reason !== null
        ) {
            throw new Error(
                "FAIL: Enrollment cu khong duoc khoi phuc."
            );
        }

        console.log(
            "PASS 6: Enrollment cu da duoc ROLLBACK."
        );

        console.log(
            "PASS 7: Khong tao Enrollment moi."
        );

        // 6. Kiem tra diem lich su.
        const scoreResult = await pool.request()
            .input(
                "componentId",
                sql.BigInt,
                sample.score_component_id
            )
            .query(`
                SELECT
                    sc.score_value,
                    sc.score_status,
                    sr.enrollment_id
                FROM dbo.score_component sc
                JOIN dbo.score_record sr
                    ON sr.score_record_id =
                       sc.score_record_id
                WHERE sc.score_component_id =
                      @componentId
            `);

        const scores = scoreResult.recordset;

        if (
            scores.length !== 1 ||
            Number(scores[0].score_value) !== 6 ||
            scores[0].score_status !== "SCORED" ||
            String(scores[0].enrollment_id) !==
                String(sample.enrollment_id)
        ) {
            throw new Error(
                "FAIL: Diem lich su bi thay doi."
            );
        }

        console.log(
            "PASS 8: Diem QT1 = 6 duoc bao toan."
        );

        console.log("");
        console.log("==================================");
        console.log("TRANSFER ROLLBACK THANH CONG!");
        console.log("==================================");

    } catch (error) {
        console.error("");
        console.error("KIEM THU THAT BAI!");
        console.error(error.message);
        process.exitCode = 1;

    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

testRollback();
