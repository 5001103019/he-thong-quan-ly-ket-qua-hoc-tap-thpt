
/*
 * VT1-05 - RESET DIEM VA TRANG THAI KHOA DEMO
 *
 * Muc dich:
 * - Khoi phuc diem mau cua 12 hoc sinh.
 * - Khoi phuc 90 trang thai khoa/chua khoa.
 * - Khong xoa hoc sinh, lop, tai khoan.
 * - Khong xoa AuditLog cu.
 * - Chi thao tac voi du lieu demo.
 *
 * Mac dinh: DRY RUN (chi kiem tra).
 * Tham so --apply: Thuc hien reset.
 *
 * CHI SU DUNG TREN DATABASE PHAT TRIEN CUC BO.
 */

"use strict";

const {
    sql,
    connectDatabase
} = require("../src/config/database");

// =============================================
// 1. CAU HINH DU LIEU DEMO
// =============================================

const YEARS = [
    { code: "2025-2026", tag: "2526" },
    { code: "2026-2027", tag: "2627" }
];

const GRADES = [10, 11, 12];

const SUBJECTS = [
    "TOAN",
    "NGUVAN",
    "TINHOC"
];

const TYPES = [
    "QT1",
    "QT2",
    "QT3",
    "GK",
    "CK"
];

const BASE = {
    TOAN: [8, 7, 9, 8, 8.5],
    NGUVAN: [7, 8, 8, 7.25, 8],
    TINHOC: [8, 9, 8, 7.5, 9]
};

// Hai cot diem duoc khoa trong bo demo.
const LOCKED_KEYS = new Set([
    "2026-2027|DEMO_10A1|TINHOC|QT1",
    "2025-2026|DEMO_11A1|TOAN|GK"
]);

const REASON =
    "VT1-05: khoi phuc du lieu demo cuc bo";

// =============================================
// 2. XAC DINH 12 HOC SINH DEMO
// =============================================

function expectedStudents() {
    const result = new Map();

    for (const year of YEARS) {
        for (const grade of GRADES) {
            for (let n = 1; n <= 2; n++) {
                const studentCode =
                    "DEMO_G05_" +
                    year.tag +
                    "_G" + grade +
                    "_S" + String(n).padStart(2, "0");

                result.set(studentCode, {
                    yearCode: year.code,
                    classCode: "DEMO_" + grade + "A1"
                });
            }
        }
    }

    return result;
}

// =============================================
// 3. XAC DINH BO DIEM GOC
// =============================================

function expectedComponents(studentCode, subjectCode) {
    const values = [...BASE[subjectCode]];

    const statuses = TYPES.map(
        () => "SCORED"
    );

    // Diem 0 la gia tri hop le.
    if (
        studentCode === "DEMO_G05_2627_G10_S01" &&
        subjectCode === "TINHOC"
    ) {
        values[0] = 0;
    }

    // QT3 chua duoc nhap.
    if (
        studentCode === "DEMO_G05_2627_G10_S02" &&
        subjectCode === "TINHOC"
    ) {
        values[2] = null;
        statuses[2] = "NOT_ENTERED";
    }

    // Vang giua ky.
    if (
        studentCode === "DEMO_G05_2526_G10_S01" &&
        subjectCode === "TOAN"
    ) {
        values[3] = null;
        statuses[3] = "ABSENT";
    }

    // Mien cuoi ky.
    if (
        studentCode === "DEMO_G05_2526_G11_S02" &&
        subjectCode === "NGUVAN"
    ) {
        values[4] = null;
        statuses[4] = "EXEMPT";
    }

    return TYPES.map((type, index) => ({
        type: type,
        value: values[index],
        status: statuses[index]
    }));
}

// =============================================
// 4. TIM TAI KHOAN KHAO THI DEMO
// =============================================

async function getDemoAdmin(transaction) {
    const result = await new sql.Request(transaction)
        .query(`
            SELECT
                u.user_id AS userId,
                u.username,
                r.code AS roleCode,
                u.is_active AS isActive
            FROM dbo.app_user u
            JOIN dbo.[role] r
                ON r.role_id = u.role_id
            WHERE u.username IN (
                'DEMO_G05_KT',
                'DEMO_G05_HS'
            );
        `);

    if (result.recordset.length !== 2) {
        throw new Error(
            "Phai co dung 2 tai khoan demo."
        );
    }

    const admin = result.recordset.find(
        row => row.username === "DEMO_G05_KT"
    );

    const student = result.recordset.find(
        row => row.username === "DEMO_G05_HS"
    );

    if (
        !admin ||
        !student ||
        admin.roleCode !== "KHAO_THI" ||
        student.roleCode !== "HOC_SINH" ||
        !admin.isActive ||
        !student.isActive
    ) {
        throw new Error(
            "Tai khoan demo khong dung vai tro."
        );
    }

    return Number(admin.userId);
}

// =============================================
// 5. DOC DU LIEU DIEM DEMO
// =============================================

async function loadScoreData(transaction) {
    const result = await new sql.Request(transaction)
        .query(`
            SELECT
                s.student_code AS studentCode,
                a.code AS yearCode,
                c.code AS classCode,

                e.academic_year_id AS academicYearId,
                e.class_id AS classId,

                s.student_id AS studentId,

                sub.code AS subjectCode,
                sub.subject_id AS subjectId,

                sr.score_record_id AS scoreRecordId,
                sr.version,

                sc.score_component_id AS scoreComponentId,
                sc.component_type AS componentType,
                sc.score_value AS scoreValue,
                sc.score_status AS scoreStatus

            FROM dbo.score_component sc
                WITH (UPDLOCK, HOLDLOCK)

            JOIN dbo.score_record sr
                ON sr.score_record_id =
                   sc.score_record_id

            JOIN dbo.enrollment e
                ON e.enrollment_id =
                   sr.enrollment_id

            JOIN dbo.student s
                ON s.student_id = e.student_id

            JOIN dbo.academic_year a
                ON a.academic_year_id =
                   e.academic_year_id

            JOIN dbo.[class] c
                ON c.class_id = e.class_id
               AND c.academic_year_id =
                   e.academic_year_id

            JOIN dbo.subject sub
                ON sub.subject_id = sr.subject_id

            WHERE s.student_code LIKE
                  'DEMO[_]G05[_]%'

              AND a.code IN (
                  '2025-2026',
                  '2026-2027'
              )

              AND c.code IN (
                  'DEMO_10A1',
                  'DEMO_11A1',
                  'DEMO_12A1'
              )

              AND sub.code IN (
                  'TOAN',
                  'NGUVAN',
                  'TINHOC'
              );
        `);

    const expected = expectedStudents();
    const records = new Map();

    for (const row of result.recordset) {
        const student = expected.get(
            row.studentCode
        );

        if (
            !student ||
            student.yearCode !== row.yearCode ||
            student.classCode !== row.classCode ||
            !SUBJECTS.includes(row.subjectCode) ||
            !TYPES.includes(row.componentType)
        ) {
            throw new Error(
                "Phat hien diem ngoai pham vi demo."
            );
        }

        const key =
            row.studentCode +
            "|" +
            row.subjectCode;

        if (!records.has(key)) {
            records.set(key, {
                studentCode: row.studentCode,
                subjectCode: row.subjectCode,
                yearCode: row.yearCode,
                classCode: row.classCode,

                academicYearId: Number(
                    row.academicYearId
                ),

                classId: Number(row.classId),
                subjectId: Number(row.subjectId),
                studentId: Number(row.studentId),

                recordId: Number(
                    row.scoreRecordId
                ),

                components: new Map()
            });
        }

        const record = records.get(key);

        if (
            record.recordId !==
                Number(row.scoreRecordId) ||
            record.components.has(
                row.componentType
            )
        ) {
            throw new Error(
                "Ban ghi diem demo bi trung."
            );
        }

        record.components.set(
            row.componentType,
            {
                id: Number(
                    row.scoreComponentId
                ),

                type: row.componentType,

                value:
                    row.scoreValue === null
                        ? null
                        : Number(row.scoreValue),

                status: row.scoreStatus
            }
        );
    }

    if (
        records.size !== 36 ||
        result.recordset.length !== 180
    ) {
        throw new Error(
            "Can dung 36 ScoreRecord va " +
            "180 ScoreComponent."
        );
    }

    for (const studentCode of expected.keys()) {
        for (const subjectCode of SUBJECTS) {
            const key =
                studentCode + "|" + subjectCode;

            const record = records.get(key);

            if (
                !record ||
                record.components.size !== 5
            ) {
                throw new Error(
                    "Thieu diem demo: " + key
                );
            }
        }
    }

    return records;
}

// =============================================
// 6. DOC TRANG THAI KHOA DIEM
// =============================================

async function loadLockData(transaction) {
    const result = await new sql.Request(transaction)
        .query(`
            SELECT
                a.code AS yearCode,
                c.code AS classCode,
                sub.code AS subjectCode,

                ls.lock_status_id AS lockId,
                ls.academic_year_id AS academicYearId,
                ls.class_id AS classId,
                ls.subject_id AS subjectId,

                ls.component AS componentType,
                ls.status

            FROM dbo.lock_status ls
                WITH (UPDLOCK, HOLDLOCK)

            JOIN dbo.[class] c
                ON c.class_id = ls.class_id
               AND c.academic_year_id =
                   ls.academic_year_id

            JOIN dbo.academic_year a
                ON a.academic_year_id =
                   ls.academic_year_id

            JOIN dbo.subject sub
                ON sub.subject_id = ls.subject_id

            WHERE a.code IN (
                '2025-2026',
                '2026-2027'
            )

              AND c.code IN (
                  'DEMO_10A1',
                  'DEMO_11A1',
                  'DEMO_12A1'
              )

              AND sub.code IN (
                  'TOAN',
                  'NGUVAN',
                  'TINHOC'
              );
        `);

    const locks = new Map();

    for (const row of result.recordset) {
        const key = [
            row.yearCode,
            row.classCode,
            row.subjectCode,
            row.componentType
        ].join("|");

        if (
            !TYPES.includes(row.componentType) ||
            !["LOCKED", "UNLOCKED"].includes(
                row.status
            ) ||
            locks.has(key)
        ) {
            throw new Error(
                "Trang thai khoa demo khong hop le."
            );
        }

        locks.set(key, {
            key: key,

            lockId: Number(row.lockId),

            academicYearId: Number(
                row.academicYearId
            ),

            classId: Number(row.classId),
            subjectId: Number(row.subjectId),

            componentType: row.componentType,
            status: row.status
        });
    }

    for (const year of YEARS) {
        for (const grade of GRADES) {
            for (const subject of SUBJECTS) {
                for (const type of TYPES) {
                    const key = [
                        year.code,
                        "DEMO_" + grade + "A1",
                        subject,
                        type
                    ].join("|");

                    if (!locks.has(key)) {
                        throw new Error(
                            "Thieu khoa demo: " + key
                        );
                    }
                }
            }
        }
    }

    if (locks.size !== 90) {
        throw new Error(
            "Can dung 90 trang thai khoa demo."
        );
    }

    return locks;
}

// =============================================
// 7. GHI AUDIT LOG MOI
// =============================================

async function addAudit(
    transaction,
    adminId,
    scope,
    action,
    oldValue,
    newValue,
    reason
) {
    await new sql.Request(transaction)
        .input(
            "action",
            sql.VarChar(50),
            action
        )
        .input(
            "adminId",
            sql.BigInt,
            adminId
        )
        .input(
            "yearId",
            sql.BigInt,
            scope.academicYearId
        )
        .input(
            "classId",
            sql.BigInt,
            scope.classId
        )
        .input(
            "subjectId",
            sql.BigInt,
            scope.subjectId
        )
        .input(
            "component",
            sql.VarChar(10),
            scope.componentType
        )
        .input(
            "studentId",
            sql.BigInt,
            scope.studentId ?? null
        )
        .input(
            "recordId",
            sql.BigInt,
            scope.recordId ?? null
        )
        .input(
            "componentId",
            sql.BigInt,
            scope.scoreComponentId ?? null
        )
        .input(
            "oldValue",
            sql.Decimal(4, 2),
            oldValue
        )
        .input(
            "newValue",
            sql.Decimal(4, 2),
            newValue
        )
        .input(
            "reason",
            sql.NVarChar(sql.MAX),
            reason
        )
        .query(`
            INSERT INTO dbo.audit_log (
                action_type,
                performed_by,
                academic_year_id,
                class_id,
                subject_id,
                component,
                student_id,
                score_record_id,
                score_component_id,
                old_value,
                new_value,
                reason,
                result
            )
            VALUES (
                @action,
                @adminId,
                @yearId,
                @classId,
                @subjectId,
                @component,
                @studentId,
                @recordId,
                @componentId,
                @oldValue,
                @newValue,
                @reason,
                'SUCCESS'
            );
        `);
}

// =============================================
// 8. THAY DOI TRANG THAI KHOA
// =============================================

async function changeLock(
    transaction,
    lock,
    nextStatus,
    adminId
) {
    if (lock.status === nextStatus) {
        return false;
    }

    const action =
        nextStatus === "LOCKED"
            ? "LOCK"
            : "UNLOCK";

    let sqlText;

    if (nextStatus === "LOCKED") {
        sqlText = `
            UPDATE dbo.lock_status
            SET
                status = 'LOCKED',

                locked_by = @adminId,
                locked_at = SYSDATETIMEOFFSET(),

                unlocked_by = NULL,
                unlocked_at = NULL,

                requested_by = NULL,
                requested_by_name = NULL,
                unlock_reason = NULL,

                version = version + 1,
                updated_at = SYSDATETIMEOFFSET()

            WHERE lock_status_id = @lockId;
        `;
    } else {
        sqlText = `
            UPDATE dbo.lock_status
            SET
                status = 'UNLOCKED',

                locked_by = NULL,
                locked_at = NULL,

                unlocked_by = @adminId,
                unlocked_at = SYSDATETIMEOFFSET(),

                requested_by = @adminId,

                requested_by_name =
                    N'Tai khoan Khao thi demo',

                unlock_reason = @reason,

                version = version + 1,
                updated_at = SYSDATETIMEOFFSET()

            WHERE lock_status_id = @lockId;
        `;
    }

    await new sql.Request(transaction)
        .input(
            "lockId",
            sql.BigInt,
            lock.lockId
        )
        .input(
            "adminId",
            sql.BigInt,
            adminId
        )
        .input(
            "reason",
            sql.NVarChar(sql.MAX),
            REASON
        )
        .query(sqlText);

    await addAudit(
        transaction,
        adminId,
        lock,
        action,
        null,
        null,
        REASON
    );

    lock.status = nextStatus;

    return true;
}

// =============================================
// 9. CHUONG TRINH CHINH
// =============================================

async function main() {
    // Mac dinh khong thuc hien reset.
    const apply = process.argv.includes(
        "--apply"
    );

    // Khong cho phep tham so khong hop le.
    if (
        process.argv.slice(2).some(
            arg => arg !== "--apply"
        )
    ) {
        throw new Error(
            "Chi chap nhan tham so --apply."
        );
    }

    // Khong cho phep chay tren production.
    if (
        String(process.env.NODE_ENV).toLowerCase() ===
        "production"
    ) {
        throw new Error(
            "Cam reset demo tren production."
        );
    }

    let pool = null;
    let transaction = null;
    let started = false;

    try {
        pool = await connectDatabase();

        // Xac minh database va may chu.
        const db = await pool.request().query(`
            SELECT
                DB_NAME() AS databaseName,

                CONVERT(
                    NVARCHAR(128),
                    SERVERPROPERTY('MachineName')
                ) AS machineName;
        `);

        const databaseName =
            db.recordset[0].databaseName;

        if (
            databaseName !==
            "thpt_grade_management"
        ) {
            throw new Error(
                "Sai database. Huy reset."
            );
        }

        const sqlMachine = String(
            db.recordset[0].machineName || ""
        ).trim().toUpperCase();

        const localMachine = String(
            process.env.COMPUTERNAME || ""
        ).trim().toUpperCase();

        // Chi chap nhan SQL Server tren may cuc bo.
        if (
            !localMachine ||
            !sqlMachine ||
            sqlMachine !== localMachine
        ) {
            throw new Error(
                "Khong xac minh duoc SQL Server " +
                "cuc bo. Huy reset."
            );
        }

        // Bat dau transaction.
        transaction = new sql.Transaction(pool);

        await transaction.begin(
            sql.ISOLATION_LEVEL.SERIALIZABLE
        );

        started = true;

        // Kiem tra tai khoan demo.
        const adminId = await getDemoAdmin(
            transaction
        );

        // Doc du lieu hien tai.
        const records = await loadScoreData(
            transaction
        );

        const locks = await loadLockData(
            transaction
        );

        let changedScores = 0;
        let differentLocks = 0;

        // Kiem tra diem khac mau.
        for (const record of records.values()) {
            const sample = expectedComponents(
                record.studentCode,
                record.subjectCode
            );

            for (const expected of sample) {
                const current =
                    record.components.get(
                        expected.type
                    );

                if (
                    current.value !== expected.value ||
                    current.status !== expected.status
                ) {
                    changedScores++;
                }
            }
        }

        // Kiem tra trang thai khoa khac mau.
        for (const lock of locks.values()) {
            const expected = LOCKED_KEYS.has(
                lock.key
            )
                ? "LOCKED"
                : "UNLOCKED";

            if (lock.status !== expected) {
                differentLocks++;
            }
        }

        console.log(
            "Database: thpt_grade_management"
        );

        console.log(
            "ScoreRecord: 36; " +
            "ScoreComponent: 180; " +
            "LockStatus: 90"
        );

        console.log(
            "Diem can khoi phuc: " +
            changedScores
        );

        console.log(
            "Cot khoa khac mau: " +
            differentLocks
        );

        // =====================================
        // CHE DO DRY RUN: KHONG SUA DU LIEU
        // =====================================

        if (!apply) {
            await transaction.commit();
            started = false;

            console.log(
                "DRY RUN THANH CONG - " +
                "KHONG SUA DU LIEU."
            );

            console.log(
                "Chi su dung --apply sau khi " +
                "sao luu database, dung backend " +
                "va doi chieu schema AuditLog."
            );

            return;
        }

        // =====================================
        // CHE DO APPLY: KHOI PHUC DU LIEU
        // =====================================

        let updatedScores = 0;
        let lockTransitions = 0;

        for (const record of records.values()) {
            let recordChanged = false;

            const expectedList = expectedComponents(
                record.studentCode,
                record.subjectCode
            );

            for (const sample of expectedList) {
                const current =
                    record.components.get(
                        sample.type
                    );

                // Neu dung mau thi bo qua.
                if (
                    current.value === sample.value &&
                    current.status === sample.status
                ) {
                    continue;
                }

                const lockKey = [
                    record.yearCode,
                    record.classCode,
                    record.subjectCode,
                    sample.type
                ].join("|");

                const lock = locks.get(lockKey);

                if (!lock) {
                    throw new Error(
                        "Khong tim thay khoa: " +
                        lockKey
                    );
                }

                // Mo khoa truoc khi sua diem.
                if (lock.status === "LOCKED") {
                    const changed = await changeLock(
                        transaction,
                        lock,
                        "UNLOCKED",
                        adminId
                    );

                    if (changed) {
                        lockTransitions++;
                    }
                }

                // Khoi phuc gia tri va trang thai.
                await new sql.Request(transaction)
                    .input(
                        "componentId",
                        sql.BigInt,
                        current.id
                    )
                    .input(
                        "value",
                        sql.Decimal(4, 2),
                        sample.value
                    )
                    .input(
                        "status",
                        sql.VarChar(15),
                        sample.status
                    )
                    .query(`
                        UPDATE dbo.score_component

                        SET
                            score_value = @value,
                            score_status = @status

                        WHERE score_component_id =
                              @componentId;
                    `);

                // Luu nhat ky thay doi diem.
                await addAudit(
                    transaction,
                    adminId,
                    {
                        ...record,

                        componentType: sample.type,
                        scoreComponentId: current.id
                    },
                    "SCORE_EDIT",
                    current.value,
                    sample.value,
                    REASON +
                    "; status " +
                    current.status +
                    " -> " +
                    sample.status
                );

                recordChanged = true;
                updatedScores++;
            }

            // Cap nhat version neu diem thay doi.
            if (recordChanged) {
                await new sql.Request(transaction)
                    .input(
                        "recordId",
                        sql.BigInt,
                        record.recordId
                    )
                    .query(`
                        UPDATE dbo.score_record
                        SET version = version + 1
                        WHERE score_record_id =
                              @recordId;
                    `);
            }
        }

        // Khoi phuc trang thai khoa cuoi cung.
        for (const lock of locks.values()) {
            const expected = LOCKED_KEYS.has(
                lock.key
            )
                ? "LOCKED"
                : "UNLOCKED";

            const changed = await changeLock(
                transaction,
                lock,
                expected,
                adminId
            );

            if (changed) {
                lockTransitions++;
            }
        }

        // Luu ket qua reset.
        await transaction.commit();
        started = false;

        console.log("");
        console.log(
            "RESET DIEM VA KHOA THANH CONG!"
        );

        console.log(
            "Thanh phan diem da khoi phuc: " +
            updatedScores
        );

        console.log(
            "Lan chuyen trang thai khoa: " +
            lockTransitions
        );

        console.log(
            "Da ghi AuditLog moi; " +
            "giu nguyen AuditLog cu."
        );

    } catch (error) {
        // Rollback neu co loi.
        if (started && transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error(
                    "Loi rollback:",
                    rollbackError.message
                );
            }
        }

        console.error(
            "RESET THAT BAI: " +
            error.message
        );

        process.exitCode = 1;

    } finally {
        // Dong ket noi database.
        if (pool) {
            await pool.close();
        }
    }
}

main().catch(error => {
    console.error(
        "LOI: " + error.message
    );

    process.exitCode = 1;
});
