
/*
 * ==================================================
 * BUOC 26.3.2 - KIEM THU CHUYEN LOP DONG THOI
 * He thong quan ly ket qua hoc tap THPT
 * ==================================================
 *
 * Hai yeu cau cung chuyen mot hoc sinh:
 * - Yeu cau 1: Lop A -> Lop B
 * - Yeu cau 2: Lop A -> Lop C
 *
 * Mong doi:
 * - Chi mot giao dich COMMIT.
 * - Giao dich con lai bi tu choi.
 * - Lich su lop A van duoc giu.
 * - Chi co mot Enrollment hien tai.
 */

const {
    sql,
    connectDatabase
} = require("../src/config/database");

const {
    transferStudentWithTransaction
} = require("../src/services/enrollment-transaction");

async function testConcurrentTransfer() {
    let pool = null;

    try {
        // 1. Ket noi database
        pool = await connectDatabase();

        console.log("Da ket noi SQL Server.");

        // 2. Tim hoc sinh CC26 chua chuyen lop
        const sampleResult = await pool.request().query(`
            SELECT TOP (1)
                e.enrollment_id,
                e.student_id,
                e.academic_year_id,
                e.class_id AS old_class_id,
                s.student_code,
                c.code AS old_class_code
            FROM dbo.enrollment e
            JOIN dbo.student s
                ON s.student_id = e.student_id
            JOIN dbo.[class] c
                ON c.class_id = e.class_id
            JOIN dbo.academic_year ay
                ON ay.academic_year_id =
                   e.academic_year_id
            WHERE ay.code = '2090-2091'
              AND s.student_code LIKE 'CC26S[_]%'
              AND c.code LIKE 'CC26A[_]%'
              AND e.start_date = '2090-09-01'
              AND e.end_date IS NULL
            ORDER BY e.enrollment_id DESC
        `);

        if (sampleResult.recordset.length !== 1) {
            throw new Error(
                "Khong tim thay hoc sinh CC26 tai lop A."
            );
        }

        const sample = sampleResult.recordset[0];
        const token = sample.student_code.substring(6);

        if (
            !/^[0-9A-F]{8}$/i.test(token) ||
            sample.old_class_code !== "CC26A_" + token
        ) {
            throw new Error(
                "Ma kiem thu CC26 khong hop le."
            );
        }

        console.log(
            "PASS 1: Tim thay hoc sinh CC26 tai lop A."
        );

        // 3. Tim hai lop dich B va C
        const classResult = await pool.request()
            .input(
                "yearId",
                sql.BigInt,
                sample.academic_year_id
            )
            .input(
                "codeB",
                sql.VarChar(20),
                "CC26B_" + token
            )
            .input(
                "codeC",
                sql.VarChar(20),
                "CC26C_" + token
            )
            .query(`
                SELECT class_id, code
                FROM dbo.[class]
                WHERE academic_year_id = @yearId
                  AND code IN (@codeB, @codeC)
                  AND status = 'ACTIVE'
            `);

        const classes = classResult.recordset;

        const classB = classes.find(
            item => item.code === "CC26B_" + token
        );

        const classC = classes.find(
            item => item.code === "CC26C_" + token
        );

        if (!classB || !classC || classes.length !== 2) {
            throw new Error(
                "Khong tim thay du hai lop B va C."
            );
        }

        console.log(
            "PASS 2: Tim thay hai lop dich B va C."
        );

        // 4. Tim tai khoan KHAO_THI test
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
                "Khong tim thay tai khoan test KHAO_THI."
            );
        }

        const performedBy = Number(
            userResult.recordset[0].user_id
        );

        console.log(
            "PASS 3: Tim thay tai khoan KHAO_THI."
        );

        // 5. Tao hai yeu cau chuyen lop
        const commonArgs = {
            studentId: Number(sample.student_id),
            academicYearId: Number(
                sample.academic_year_id
            ),
            transferDate: "2090-10-01",
            performedBy
        };

        console.log("");
        console.log("Bat dau 2 yeu cau chuyen lop dong thoi...");

        // Gui ca hai yeu cau cung luc.
        const outcomes = await Promise.allSettled([
            transferStudentWithTransaction({
                ...commonArgs,
                newClassId: Number(classB.class_id)
            }),
            transferStudentWithTransaction({
                ...commonArgs,
                newClassId: Number(classC.class_id)
            })
        ]);

        // 6. Dem giao dich thanh cong va that bai
        const successes = outcomes
            .map((item, index) => ({
                ...item,
                index
            }))
            .filter(
                item =>
                    item.status === "fulfilled" &&
                    item.value &&
                    item.value.success === true
            );

        const failures = outcomes
            .map((item, index) => ({
                ...item,
                index
            }))
            .filter(
                item => item.status === "rejected"
            );

        if (
            successes.length !== 1 ||
            failures.length !== 1
        ) {
            const details = outcomes.map(
                item =>
                    item.status === "rejected"
                        ? String(item.reason?.message)
                        : "FULFILLED"
            ).join(" | ");

            throw new Error(
                "So giao dich COMMIT/REJECT khong dung: " +
                details
            );
        }

        console.log(
            "PASS 4: Chi mot giao dich COMMIT."
        );

        // 7. Xac nhan giao dich con lai bi tu choi
        // do ngay chuyen trung ngay bat dau lop moi.
        const failureMessage = String(
            failures[0].reason?.message || ""
        );

        if (
            !failureMessage.includes(
                "Ngay chuyen lop phai sau ngay bat dau lop cu."
            )
        ) {
            throw new Error(
                "Giao dich thu hai that bai vi ly do khac: " +
                failureMessage
            );
        }

        console.log(
            "PASS 5: Giao dich con lai bi tu choi hop le."
        );

        const committed = successes[0].value;

        // 8. Doc lich su sau khi 2 yeu cau ket thuc
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
                WHERE student_id = @studentId
                  AND academic_year_id = @yearId
                ORDER BY start_date, enrollment_id
            `);

        const history = historyResult.recordset;

        const oldEnrollment = history.find(
            item =>
                String(item.enrollment_id) ===
                String(sample.enrollment_id)
        );

        const currentEnrollments = history.filter(
            item => item.end_date_text === null
        );

        if (
            history.length !== 2 ||
            !oldEnrollment ||
            oldEnrollment.end_date_text !==
                "2090-10-01" ||
            oldEnrollment.exit_reason !== "TRANSFER" ||
            String(oldEnrollment.class_id) !==
                String(sample.old_class_id)
        ) {
            throw new Error(
                "Lich su Enrollment khong hop le."
            );
        }

        console.log(
            "PASS 6: Enrollment lop A duoc bao toan."
        );

        if (currentEnrollments.length !== 1) {
            throw new Error(
                "So Enrollment hien tai khong bang 1."
            );
        }

        const active = currentEnrollments[0];

        if (
            String(active.enrollment_id) !==
                String(committed.newEnrollmentId) ||
            active.start_date_text !== "2090-10-01"
        ) {
            throw new Error(
                "Enrollment moi khong khop giao dich COMMIT."
            );
        }

        const activeClassId = String(active.class_id);

        if (
            activeClassId !== String(classB.class_id) &&
            activeClassId !== String(classC.class_id)
        ) {
            throw new Error(
                "Lop hien tai khong thuoc B hoac C."
            );
        }

        console.log(
            "PASS 7: Chi con mot Enrollment hien tai."
        );

        console.log(
            "PASS 8: Khong tao hai phan lop dong thoi."
        );

        const winner =
            activeClassId === String(classB.class_id)
                ? "B"
                : "C";

        console.log("");
        console.log("====================================");
        console.log("CONCURRENT TEST THANH CONG!");
        console.log("====================================");
        console.log(
            "Hoc sinh:",
            sample.student_code
        );
        console.log(
            "Lop sau chuyen:",
            "CC26" + winner + "_" + token
        );
        console.log("Giao dich COMMIT: 1");
        console.log("Giao dich bi tu choi: 1");
        console.log("Enrollment hien tai: 1");

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

testConcurrentTransfer();
