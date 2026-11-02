
/*
 * VT1-05 - SEED TRANG THAI KHOA DIEM DEMO
 *
 * Tao du lieu LOCKED va UNLOCKED cho:
 * - 2 nien khoa
 * - 6 lop demo
 * - 3 mon hoc
 * - 5 thanh phan diem
 *
 * Tong cong: 90 trang thai.
 *
 * Nguyen tac:
 * - Khong xoa du lieu cu.
 * - Khong ghi de trang thai da thay doi.
 * - Khong tao ban ghi trung khi chay lai.
 * - Khong sua cac lop khong thuoc bo demo.
 * - Su dung transaction va rollback.
 */

"use strict";

const {
    sql,
    connectDatabase
} = require("../src/config/database");

// ==========================================
// 1. CAU HINH DU LIEU DEMO
// ==========================================

const YEARS = [
    "2025-2026",
    "2026-2027"
];

const CLASS_CODES = [
    "DEMO_10A1",
    "DEMO_11A1",
    "DEMO_12A1"
];

const SUBJECT_CODES = [
    "TOAN",
    "NGUVAN",
    "TINHOC"
];

const COMPONENT_TYPES = [
    "QT1",
    "QT2",
    "QT3",
    "GK",
    "CK"
];

// Hai cot duoc khoa san de phuc vu demo.
const LOCKED_KEYS = new Set([
    "2026-2027|DEMO_10A1|TINHOC|QT1",
    "2025-2026|DEMO_11A1|TOAN|GK"
]);

// ==========================================
// 2. TIM TAI KHOAN KHAO THI DEMO
// ==========================================

async function getDemoAdmin(transaction) {
    const result = await new sql.Request(transaction)
        .query(`
            SELECT u.user_id AS userId
            FROM dbo.app_user u
            JOIN dbo.[role] r
                ON r.role_id = u.role_id
            WHERE u.username = 'DEMO_G05_KT'
              AND u.is_active = 1
              AND r.code = 'KHAO_THI';
        `);

    if (result.recordset.length !== 1) {
        throw new Error(
            "Khong tim thay tai khoan DEMO_G05_KT. " +
            "Can chay seed-demo-accounts.js truoc."
        );
    }

    return Number(result.recordset[0].userId);
}

// ==========================================
// 3. LAY DANH SACH 6 LOP DEMO
// ==========================================

async function getDemoClasses(transaction) {
    const result = await new sql.Request(transaction)
        .query(`
            SELECT
                a.academic_year_id AS academicYearId,
                a.code AS yearCode,
                c.class_id AS classId,
                c.code AS classCode,
                g.grade_number AS gradeNumber
            FROM dbo.[class] c
            JOIN dbo.academic_year a
                ON a.academic_year_id =
                   c.academic_year_id
            JOIN dbo.grade g
                ON g.grade_id = c.grade_id
            WHERE a.code IN (
                '2025-2026',
                '2026-2027'
            )
            AND c.code IN (
                'DEMO_10A1',
                'DEMO_11A1',
                'DEMO_12A1'
            )
            ORDER BY
                a.code,
                g.grade_number;
        `);

    if (result.recordset.length !== 6) {
        throw new Error(
            "Can dung 6 lop demo. Hien co: " +
            result.recordset.length
        );
    }

    for (const row of result.recordset) {
        const expectedClassCode =
            "DEMO_" + row.gradeNumber + "A1";

        if (
            !YEARS.includes(row.yearCode) ||
            !CLASS_CODES.includes(row.classCode) ||
            row.classCode !== expectedClassCode
        ) {
            throw new Error(
                "Thong tin lop demo khong khop: " +
                row.classCode
            );
        }
    }

    return result.recordset;
}

// ==========================================
// 4. LAY DANH SACH 3 MON HOC
// ==========================================

async function getDemoSubjects(transaction) {
    const result = await new sql.Request(transaction)
        .query(`
            SELECT
                subject_id AS subjectId,
                code
            FROM dbo.subject
            WHERE code IN (
                'TOAN',
                'NGUVAN',
                'TINHOC'
            );
        `);

    if (result.recordset.length !== 3) {
        throw new Error(
            "Can co du 3 mon hoc demo."
        );
    }

    return result.recordset;
}

// ==========================================
// 5. TAO TRANG THAI KHOA NEU CHUA CO
// ==========================================

async function ensureLockStatus(
    transaction,
    demoClass,
    subject,
    componentType,
    adminId,
    counters
) {
    const key = [
        demoClass.yearCode,
        demoClass.classCode,
        subject.code,
        componentType
    ].join("|");

    const expectedStatus = LOCKED_KEYS.has(key)
        ? "LOCKED"
        : "UNLOCKED";

    const yearId = Number(
        demoClass.academicYearId
    );

    const classId = Number(
        demoClass.classId
    );

    const subjectId = Number(
        subject.subjectId
    );

    // Kiem tra trang thai hien co.
    const existing = await new sql.Request(transaction)
        .input("yearId", sql.BigInt, yearId)
        .input("classId", sql.BigInt, classId)
        .input("subjectId", sql.BigInt, subjectId)
        .input(
            "component",
            sql.VarChar(10),
            componentType
        )
        .query(`
            SELECT
                lock_status_id AS lockStatusId,
                status,
                locked_by AS lockedBy,
                locked_at AS lockedAt
            FROM dbo.lock_status
                WITH (UPDLOCK, HOLDLOCK)
            WHERE academic_year_id = @yearId
              AND class_id = @classId
              AND subject_id = @subjectId
              AND component = @component;
        `);

    // Neu da co thi khong ghi de.
    if (existing.recordset.length > 0) {
        const row = existing.recordset[0];

        if (row.status !== expectedStatus) {
            throw new Error(
                "Trang thai khoa da thay doi: " +
                key +
                ". Khong tu dong ghi de."
            );
        }

        if (expectedStatus === "LOCKED") {
            if (
                Number(row.lockedBy) !== adminId ||
                row.lockedAt == null
            ) {
                throw new Error(
                    "Thong tin khoa demo khong khop: " +
                    key
                );
            }
        }

        counters.existing++;

        return;
    }

    // Chi ghi du lieu moi neu chua ton tai.
    const lockedBy = expectedStatus === "LOCKED"
        ? adminId
        : null;

    await new sql.Request(transaction)
        .input("yearId", sql.BigInt, yearId)
        .input("classId", sql.BigInt, classId)
        .input("subjectId", sql.BigInt, subjectId)
        .input(
            "component",
            sql.VarChar(10),
            componentType
        )
        .input(
            "status",
            sql.VarChar(20),
            expectedStatus
        )
        .input(
            "lockedBy",
            sql.BigInt,
            lockedBy
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
            VALUES (
                @yearId,
                @classId,
                @subjectId,
                @component,
                @status,
                @lockedBy,
                CASE
                    WHEN @status = 'LOCKED'
                    THEN SYSDATETIMEOFFSET()
                    ELSE NULL
                END
            );
        `);

    counters.created++;

    if (expectedStatus === "LOCKED") {
        counters.locked++;
    } else {
        counters.unlocked++;
    }

    console.log(
        "[TAO MOI] " +
        key + " = " + expectedStatus
    );
}

// ==========================================
// 6. CHUONG TRINH CHINH
// ==========================================

async function main() {
    let pool = null;
    let transaction = null;
    let started = false;

    try {
        // Khong chay tren production.
        if (
            String(process.env.NODE_ENV).toLowerCase() ===
            "production"
        ) {
            throw new Error(
                "Khong duoc seed tren production."
            );
        }

        pool = await connectDatabase();

        const dbResult = await pool.request().query(`
            SELECT DB_NAME() AS databaseName;
        `);

        if (
            dbResult.recordset[0].databaseName !==
            "thpt_grade_management"
        ) {
            throw new Error(
                "Dang ket noi sai database."
            );
        }

        console.log(
            "Ket noi database: thpt_grade_management"
        );

        // Bat dau transaction.
        transaction = new sql.Transaction(pool);

        await transaction.begin(
            sql.ISOLATION_LEVEL.SERIALIZABLE
        );

        started = true;

        // Lay du lieu demo da seed truoc.
        const adminId = await getDemoAdmin(
            transaction
        );

        const classes = await getDemoClasses(
            transaction
        );

        const subjects = await getDemoSubjects(
            transaction
        );

        const counters = {
            created: 0,
            existing: 0,
            locked: 0,
            unlocked: 0
        };

        // 6 lop x 3 mon x 5 thanh phan.
        for (const demoClass of classes) {
            for (const subject of subjects) {
                for (const componentType of COMPONENT_TYPES) {
                    await ensureLockStatus(
                        transaction,
                        demoClass,
                        subject,
                        componentType,
                        adminId,
                        counters
                    );
                }
            }

            console.log(
                "[PASS] " +
                demoClass.yearCode +
                " - " +
                demoClass.classCode
            );
        }

        // Luu du lieu khi tat ca thanh cong.
        await transaction.commit();
        started = false;

        console.log("");
        console.log("==============================");
        console.log("SEED KHOA DIEM THANH CONG");
        console.log("==============================");

        console.log(
            "So lop demo: " + classes.length
        );

        console.log(
            "So mon hoc: " + subjects.length
        );

        console.log(
            "Trang thai tao moi: " +
            counters.created
        );

        console.log(
            "Trang thai da co: " +
            counters.existing
        );

        console.log(
            "LOCKED tao moi: " +
            counters.locked
        );

        console.log(
            "UNLOCKED tao moi: " +
            counters.unlocked
        );

        console.log("");
        console.log(
            "Khong xoa hoac ghi de du lieu cu."
        );

    } catch (error) {
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

        console.error("SEED KHOA DIEM THAT BAI!");
        console.error(error.message);
        process.exitCode = 1;

    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

main();
