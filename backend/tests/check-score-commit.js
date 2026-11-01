
/*
 * =====================================================
 * BUOC 23 - KIEM THU TRANSACTION COMMIT
 * He thong quan ly ket qua hoc tap hoc sinh THPT
 * =====================================================
 *
 * Muc tieu:
 * 1. Tim du lieu kiem thu da tao truoc do.
 * 2. Cap nhat diem QT1 tu 6.00 thanh 8.00.
 * 3. Kiem tra diem duoc luu trong database.
 * 4. Kiem tra AuditLog ghi lai thao tac SCORE_EDIT.
 * 5. Xac nhan COMMIT thanh cong.
 *
 * Chi su dung du lieu kiem thu co ma TX.
 */

const {
    sql,
    connectDatabase
} = require("../src/config/database");

const {
    updateScoreWithAudit
} = require("../src/services/score-transaction");

// =====================================================
// HAM KIEM THU COMMIT
// =====================================================

async function testCommit() {
    let pool;

    try {
        // -------------------------------------------------
        // 1. KET NOI DATABASE
        // -------------------------------------------------

        pool = await connectDatabase();

        console.log("Da ket noi SQL Server.");

        // -------------------------------------------------
        // 2. TIM DU LIEU KIEM THU DA TAO O BUOC 22
        // -------------------------------------------------

        const sampleResult = await pool.request().query(`
            SELECT TOP (1)
                sc.score_component_id,
                sc.score_value,
                sc.score_status,

                u.user_id AS performed_by,

                s.student_code,
                sub.code AS subject_code

            FROM dbo.score_component sc

            JOIN dbo.score_record sr
                ON sr.score_record_id = sc.score_record_id

            JOIN dbo.enrollment e
                ON e.enrollment_id = sr.enrollment_id

            JOIN dbo.student s
                ON s.student_id = e.student_id

            JOIN dbo.subject sub
                ON sub.subject_id = sr.subject_id

            JOIN dbo.[class] c
                ON c.class_id = e.class_id

            JOIN dbo.academic_year ay
                ON ay.academic_year_id = e.academic_year_id

            JOIN dbo.app_user u
                ON u.username COLLATE DATABASE_DEFAULT = CONCAT(
                    'TXK_',
                    SUBSTRING(s.student_code, 5, 10)
                )

            JOIN dbo.[role] r
                ON r.role_id = u.role_id

            WHERE ay.code = '2090-2091'

              AND s.student_code LIKE 'TXS[_]%'

              AND sub.code COLLATE DATABASE_DEFAULT = CONCAT(
                    'TXM_',
                    SUBSTRING(s.student_code, 5, 10)
                )

              AND c.code = CONCAT(
                    'TXC_',
                    SUBSTRING(s.student_code, 5, 10)
                )

              AND sc.component_type = 'QT1'

              AND sc.score_status = 'SCORED'

              AND sc.score_value = 6

              AND r.code = 'KHAO_THI'

              AND u.is_active = 1

            ORDER BY sc.score_component_id DESC
        `);

        if (sampleResult.recordset.length !== 1) {
            throw new Error(
                "Khong tim thay du lieu TX co diem QT1 = 6."
            );
        }

        const sample = sampleResult.recordset[0];

        console.log(
            "PASS 1: Tim thay du lieu kiem thu."
        );

        console.log(
            "Ma hoc sinh:",
            sample.student_code
        );

        console.log(
            "Diem ban dau:",
            sample.score_value
        );

        // -------------------------------------------------
        // 3. THUC HIEN TRANSACTION CAP NHAT DIEM
        // -------------------------------------------------

        const result = await updateScoreWithAudit({
            scoreComponentId: Number(
                sample.score_component_id
            ),

            scoreValue: 8,

            performedBy: Number(
                sample.performed_by
            ),

            reason: "Kiem thu transaction COMMIT"
        });

        if (!result || result.success !== true) {
            throw new Error(
                "Ham cap nhat diem khong tra ve thanh cong."
            );
        }

        // -------------------------------------------------
        // 4. DOC LAI DIEM VA AUDIT LOG SAU COMMIT
        // -------------------------------------------------

        const verifyResult = await pool.request()

            .input(
                "componentId",
                sql.BigInt,
                sample.score_component_id
            )

            .input(
                "auditId",
                sql.BigInt,
                result.auditLogId
            )

            .query(`
                SELECT
                    sc.score_component_id,
                    sc.score_value,
                    sc.score_status,

                    a.audit_log_id,
                    a.action_type,
                    a.old_value,
                    a.new_value,
                    a.result AS audit_result,
                    a.score_component_id AS audit_component_id

                FROM dbo.score_component sc

                JOIN dbo.audit_log a
                    ON a.audit_log_id = @auditId

                WHERE sc.score_component_id = @componentId
            `);

        if (verifyResult.recordset.length !== 1) {
            throw new Error(
                "Khong tim thay diem hoac AuditLog sau COMMIT."
            );
        }

        const data = verifyResult.recordset[0];

        // -------------------------------------------------
        // 5. KIEM TRA DIEM MOI
        // -------------------------------------------------

        if (
            Number(data.score_value) !== 8 ||
            data.score_status !== "SCORED"
        ) {
            throw new Error(
                "FAIL: Diem QT1 khong duoc cap nhat thanh 8."
            );
        }

        console.log(
            "PASS 2: Diem QT1 da duoc luu thanh 8."
        );

        // -------------------------------------------------
        // 6. KIEM TRA AUDIT LOG
        // -------------------------------------------------

        if (
            data.action_type !== "SCORE_EDIT" ||
            data.audit_result !== "SUCCESS" ||
            String(data.audit_component_id) !==
                String(sample.score_component_id)
        ) {
            throw new Error(
                "FAIL: AuditLog khong ghi dung thao tac."
            );
        }

        console.log(
            "PASS 3: AuditLog da ghi SCORE_EDIT."
        );

        // -------------------------------------------------
        // 7. KIEM TRA GIA TRI DIEM CU VA DIEM MOI
        // -------------------------------------------------

        if (Number(data.old_value) !== 6) {
            throw new Error(
                "FAIL: AuditLog khong luu diem cu = 6."
            );
        }

        console.log(
            "PASS 4: AuditLog luu diem cu = 6."
        );

        if (Number(data.new_value) !== 8) {
            throw new Error(
                "FAIL: AuditLog khong luu diem moi = 8."
            );
        }

        console.log(
            "PASS 5: AuditLog luu diem moi = 8."
        );

        // -------------------------------------------------
        // 8. THONG BAO KET QUA
        // -------------------------------------------------

        console.log("");
        console.log("====================================");
        console.log("COMMIT THANH CONG!");
        console.log("====================================");

        console.log(
            "Database: thpt_grade_management"
        );

        console.log(
            "ScoreComponent ID:",
            sample.score_component_id
        );

        console.log(
            "Diem truoc: 6.00"
        );

        console.log(
            "Diem sau: 8.00"
        );

        console.log(
            "AuditLog ID:",
            result.auditLogId
        );

    } catch (error) {

        // -------------------------------------------------
        // 9. XU LY KHI KIEM THU THAT BAI
        // -------------------------------------------------

        console.error("");
        console.error("KIEM THU THAT BAI!");
        console.error(error.message);

        process.exitCode = 1;

    } finally {

        // -------------------------------------------------
        // 10. DONG KET NOI DATABASE
        // -------------------------------------------------

        if (pool) {
            await pool.close();
        }
    }
}

// =====================================================
// CHAY KIEM THU
// =====================================================

testCommit();
