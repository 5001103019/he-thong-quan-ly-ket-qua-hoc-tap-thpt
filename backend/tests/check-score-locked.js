
/*
 * BUOC 25 - KIEM THU KHONG CHO SUA DIEM KHI LOCKED
 *
 * 1. Tim du lieu kiem thu TX da COMMIT.
 * 2. Khoa cot diem QT1.
 * 3. Thu sua diem tu 8 thanh 7.
 * 4. Kiem tra ham tu choi cap nhat.
 * 5. Kiem tra diem va AuditLog khong thay doi.
 * 6. Xoa trang thai khoa tam neu test da tao.
 */

const {
    sql,
    connectDatabase
} = require("../src/config/database");

const {
    updateScoreWithAudit
} = require("../src/services/score-transaction");

async function testLockedScore() {
    let pool = null;
    let temporaryLockId = null;

    try {
        pool = await connectDatabase();

        console.log("Da ket noi SQL Server.");

        // 1. Tim diem TX da cap nhat thanh 8.
        const result = await pool.request().query(`
            SELECT TOP (1)
                sc.score_component_id,
                e.academic_year_id,
                e.class_id,
                sr.subject_id,
                a.performed_by
            FROM dbo.audit_log a
            JOIN dbo.score_component sc
                ON sc.score_component_id =
                   a.score_component_id
            JOIN dbo.score_record sr
                ON sr.score_record_id =
                   sc.score_record_id
            JOIN dbo.enrollment e
                ON e.enrollment_id = sr.enrollment_id
            JOIN dbo.student s
                ON s.student_id = e.student_id
            JOIN dbo.subject sub
                ON sub.subject_id = sr.subject_id
            JOIN dbo.[class] c
                ON c.class_id = e.class_id
            JOIN dbo.academic_year ay
                ON ay.academic_year_id =
                   e.academic_year_id
            WHERE ay.code = '2090-2091'
              AND s.student_code LIKE 'TXS[_]%'
              AND sub.code LIKE 'TXM[_]%'
              AND c.code LIKE 'TXC[_]%'
              AND sc.component_type = 'QT1'
              AND sc.score_status = 'SCORED'
              AND sc.score_value = 8
              AND a.action_type = 'SCORE_EDIT'
              AND a.old_value = 6
              AND a.new_value = 8
              AND a.result = 'SUCCESS'
              AND a.reason =
                  N'Kiem thu transaction COMMIT'
            ORDER BY a.audit_log_id DESC
        `);

        if (result.recordset.length !== 1) {
            throw new Error(
                "Khong tim thay diem TX da COMMIT."
            );
        }

        const sample = result.recordset[0];

        console.log("PASS 1: Tim thay diem TX = 8.");

        // 2. Ghi nhan trang thai truoc khi thu.
        async function readState() {
            const r = await pool.request()
                .input(
                    "id",
                    sql.BigInt,
                    sample.score_component_id
                )
                .query(`
                    SELECT
                        sc.score_value,
                        sr.version,
                        (
                            SELECT COUNT_BIG(*)
                            FROM dbo.audit_log a
                            WHERE a.score_component_id =
                                  sc.score_component_id
                        ) AS log_count
                    FROM dbo.score_component sc
                    JOIN dbo.score_record sr
                        ON sr.score_record_id =
                           sc.score_record_id
                    WHERE sc.score_component_id = @id
                `);

            if (r.recordset.length !== 1) {
                throw new Error(
                    "Khong doc duoc trang thai diem."
                );
            }

            return r.recordset[0];
        }

        const before = await readState();

        // 3. Kiem tra cot diem da co LockStatus chua.
        const existing = await pool.request()
            .input(
                "yearId",
                sql.BigInt,
                sample.academic_year_id
            )
            .input(
                "classId",
                sql.BigInt,
                sample.class_id
            )
            .input(
                "subjectId",
                sql.BigInt,
                sample.subject_id
            )
            .query(`
                SELECT lock_status_id, status
                FROM dbo.lock_status
                WHERE academic_year_id = @yearId
                  AND class_id = @classId
                  AND subject_id = @subjectId
                  AND component = 'QT1'
            `);

        if (existing.recordset.length > 0) {
            // Khong tu y thay doi trang thai khoa da co.
            if (existing.recordset[0].status !== "LOCKED") {
                throw new Error(
                    "Cot TX da co trang thai UNLOCKED. " +
                    "Dung kiem thu de tranh sua du lieu cu."
                );
            }
        } else {
            // 4. Tao trang thai LOCKED tam thoi.
            const inserted = await pool.request()
                .input(
                    "yearId",
                    sql.BigInt,
                    sample.academic_year_id
                )
                .input(
                    "classId",
                    sql.BigInt,
                    sample.class_id
                )
                .input(
                    "subjectId",
                    sql.BigInt,
                    sample.subject_id
                )
                .input(
                    "userId",
                    sql.BigInt,
                    sample.performed_by
                )
                .query(`
                    INSERT INTO dbo.lock_status (
                        academic_year_id,
                        class_id,
                        subject_id,
                        component,
                        status,
                        locked_by,
                        locked_at
                    )
                    OUTPUT INSERTED.lock_status_id
                    VALUES (
                        @yearId,
                        @classId,
                        @subjectId,
                        'QT1',
                        'LOCKED',
                        @userId,
                        SYSDATETIMEOFFSET()
                    )
                `);

            temporaryLockId =
                inserted.recordset[0].lock_status_id;
        }

        console.log("PASS 2: Cot QT1 dang LOCKED.");

        // 5. Thu sua diem khi dang LOCKED.
        let rejected = false;

        try {
            await updateScoreWithAudit({
                scoreComponentId: Number(
                    sample.score_component_id
                ),
                scoreValue: 7,
                performedBy: Number(
                    sample.performed_by
                ),
                reason: "Kiem thu tu choi sua diem LOCKED"
            });
        } catch (error) {
            // Chi chap nhan dung loi bi khoa.
            if (
                error.message.includes("Cot diem dang bi khoa") ||
                error.message.includes("Cot diem dang LOCKED")
            ) {
                rejected = true;
            } else {
                throw error;
            }
        }

        if (!rejected) {
            throw new Error(
                "FAIL: Ham khong tu choi sua diem LOCKED."
            );
        }

        console.log("PASS 3: Da tu choi sua diem LOCKED.");

        // 6. Kiem tra diem va nhat ky khong thay doi.
        const after = await readState();

        if (Number(after.score_value) !== 8) {
            throw new Error(
                "FAIL: Diem da bi thay doi."
            );
        }

        console.log("PASS 4: Diem van la 8.");

        if (
            String(after.version) !==
            String(before.version)
        ) {
            throw new Error(
                "FAIL: Version da bi thay doi."
            );
        }

        if (
            String(after.log_count) !==
            String(before.log_count)
        ) {
            throw new Error(
                "FAIL: So luong AuditLog da thay doi."
            );
        }

        console.log(
            "PASS 5: Version va AuditLog khong thay doi."
        );

    } catch (error) {
        console.error("KIEM THU THAT BAI!");
        console.error(error.message);
        process.exitCode = 1;

    } finally {
        // 7. Don trang thai khoa tam.
        // Khong xoa LockStatus da ton tai tu truoc.
        if (pool && temporaryLockId !== null) {
            try {
                await pool.request()
                    .input(
                        "id",
                        sql.BigInt,
                        temporaryLockId
                    )
                    .query(`
                        DELETE FROM dbo.lock_status
                        WHERE lock_status_id = @id
                    `);

                console.log(
                    "PASS 6: Da don trang thai khoa tam."
                );
            } catch (error) {
                console.error(
                    "LOI DON DEP LOCK:",
                    error.message
                );
                process.exitCode = 1;
            }
        }

        if (pool) {
            await pool.close();
        }
    }

    if (process.exitCode !== 1) {
        console.log("");
        console.log("=============================");
        console.log("LOCKED TEST THANH CONG!");
        console.log("=============================");
    }
}

testLockedScore();
