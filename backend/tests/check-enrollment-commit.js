
/*
 * ===================================================
 * BUOC 26.2.2 - KIEM THU COMMIT CHUYEN LOP
 * He thong quan ly ket qua hoc tap hoc sinh THPT
 * ===================================================
 *
 * Muc tieu:
 * 1. Tim du lieu TR26.
 * 2. Tim tai khoan KHAO_THI thu nghiem.
 * 3. Chuyen hoc sinh tu lop A sang lop B.
 * 4. Kiem tra Enrollment cu duoc bao toan.
 * 5. Kiem tra Enrollment moi duoc tao.
 * 6. Kiem tra diem cu khong bi thay doi.
 * 7. Kiem tra chi con mot Enrollment hien tai.
 */

const {
    sql,
    connectDatabase
} = require("../src/config/database");

const {
    transferStudentWithTransaction
} = require("../src/services/enrollment-transaction");

async function testEnrollmentCommit() {
    let pool = null;

    try {
        // 1. Ket noi SQL Server
        pool = await connectDatabase();

        console.log("Da ket noi SQL Server.");

        // 2. Tim du lieu TR26 da tao o buoc 26.2.1
        const sampleResult = await pool.request().query(`
            SELECT TOP (1)
                e.enrollment_id,
                e.student_id,
                e.academic_year_id,
                e.class_id AS old_class_id,
                s.student_code,
                c.code AS old_class_code,
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
              AND s.student_code LIKE 'TR26S[_]%'
              AND c.code LIKE 'TR26A[_]%'
              AND e.end_date IS NULL
              AND sc.component_type = 'QT1'
              AND sc.score_status = 'SCORED'
              AND sc.score_value = 6
            ORDER BY e.enrollment_id DESC
        `);

        if (sampleResult.recordset.length !== 1) {
            throw new Error(
                "Khong tim thay Enrollment TR26 tai lop A."
            );
        }

        const sample = sampleResult.recordset[0];

        const token = sample.student_code.substring(6);

        if (
            !/^[0-9A-F]{8}$/i.test(token) ||
            sample.old_class_code !== "TR26A_" + token
        ) {
            throw new Error(
                "Ma du lieu TR26 khong khop."
            );
        }

        console.log(
            "PASS 1: Tim thay hoc sinh TR26 tai lop A."
        );

        // 3. Tim lop B co cung ma kiem thu
        const classResult = await pool.request()
            .input(
                "yearId",
                sql.BigInt,
                sample.academic_year_id
            )
            .input(
                "classCode",
                sql.VarChar(20),
                "TR26B_" + token
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
                "Khong tim thay lop B cua du lieu TR26."
            );
        }

        const newClassId =
            classResult.recordset[0].class_id;

        console.log(
            "PASS 2: Tim thay lop B cung nien khoa."
        );

        // 4. Tim tai khoan KHAO_THI thu nghiem
        const userResult = await pool.request().query(`
            SELECT TOP (1)
                u.user_id
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
            userResult.recordset[0].user_id;

        console.log(
            "PASS 3: Tim thay tai khoan KHAO_THI."
        );

        // 5. Goi ham chuyen lop thuc te
        const result = await transferStudentWithTransaction({
            studentId: Number(sample.student_id),
            academicYearId: Number(
                sample.academic_year_id
            ),
            newClassId: Number(newClassId),
            transferDate: "2090-10-01",
            performedBy: Number(performedBy)
        });

        if (
            !result ||
            result.success !== true ||
            String(result.oldEnrollmentId) !==
                String(sample.enrollment_id)
        ) {
            throw new Error(
                "Ham chuyen lop tra ve ket qua khong hop le."
            );
        }

        console.log(
            "PASS 4: Transaction chuyen lop da COMMIT."
        );

        // 6. Doc lai ca hai Enrollment
        const historyResult = await pool.request()
            .input(
                "oldId",
                sql.BigInt,
                sample.enrollment_id
            )
            .input(
                "newId",
                sql.BigInt,
                result.newEnrollmentId
            )
            .query(`
                SELECT
                    enrollment_id,
                    student_id,
                    class_id,
                    academic_year_id,
                    CONVERT(
                        VARCHAR(10),
                        start_date,
                        23
                    ) AS start_date_text,
                    CONVERT(
                        VARCHAR(10),
                        end_date,
                        23
                    ) AS end_date_text,
                    exit_reason
                FROM dbo.enrollment
                WHERE enrollment_id IN (@oldId, @newId)
            `);

        const history = historyResult.recordset;

        const oldEnrollment = history.find(
            item =>
                String(item.enrollment_id) ===
                String(sample.enrollment_id)
        );

        const newEnrollment = history.find(
            item =>
                String(item.enrollment_id) ===
                String(result.newEnrollmentId)
        );

        if (!oldEnrollment || !newEnrollment) {
            throw new Error(
                "Thieu Enrollment cu hoac Enrollment moi."
            );
        }

        // 7. Kiem tra Enrollment cu
        if (
            String(oldEnrollment.class_id) !==
                String(sample.old_class_id) ||
            oldEnrollment.start_date_text !==
                "2090-09-01" ||
            oldEnrollment.end_date_text !==
                "2090-10-01" ||
            oldEnrollment.exit_reason !== "TRANSFER"
        ) {
            throw new Error(
                "Enrollment cu khong duoc bao toan dung."
            );
        }

        console.log(
            "PASS 5: Enrollment cu duoc giu lai, " +
            "end_date = 2090-10-01."
        );

        // 8. Kiem tra Enrollment moi
        if (
            String(newEnrollment.class_id) !==
                String(newClassId) ||
            String(newEnrollment.student_id) !==
                String(sample.student_id) ||
            String(newEnrollment.academic_year_id) !==
                String(sample.academic_year_id) ||
            newEnrollment.start_date_text !==
                "2090-10-01" ||
            newEnrollment.end_date_text !== null ||
            newEnrollment.exit_reason !== null
        ) {
            throw new Error(
                "Enrollment moi khong hop le."
            );
        }

        console.log(
            "PASS 6: Enrollment moi duoc tao tai lop B."
        );

        // 9. Kiem tra diem lich su
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
                "Diem lich su da bi thay doi."
            );
        }

        console.log(
            "PASS 7: Diem QT1 = 6 van thuoc lop A."
        );

        // 10. Kiem tra Enrollment hien tai
        const activeResult = await pool.request()
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
                SELECT COUNT_BIG(*) AS total
                FROM dbo.enrollment
                WHERE student_id = @studentId
                  AND academic_year_id = @yearId
                  AND end_date IS NULL
            `);

        if (
            Number(activeResult.recordset[0].total) !== 1
        ) {
            throw new Error(
                "So Enrollment hien tai khong bang 1."
            );
        }

        console.log(
            "PASS 8: Chi co mot Enrollment hien tai."
        );

        console.log("");
        console.log("=====================================");
        console.log("TRANSFER COMMIT THANH CONG!");
        console.log("=====================================");
        console.log(
            "Ma hoc sinh:",
            sample.student_code
        );
        console.log("Lop cu: TR26A_" + token);
        console.log("Lop moi: TR26B_" + token);
        console.log("Ngay chuyen: 2090-10-01");
        console.log("Diem lich su QT1: 6.00");

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

testEnrollmentCommit();
