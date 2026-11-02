
/*
 * VT1-05 - SEED DIEM MAU
 *
 * Tao diem cho:
 * - 12 hoc sinh demo
 * - 3 mon: TOAN, NGUVAN, TINHOC
 * - 5 thanh phan: QT1, QT2, QT3, GK, CK
 *
 * Nguyen tac:
 * - Khong xoa du lieu.
 * - Khong ghi de diem da ton tai.
 * - Chay lai khong tao trung.
 * - Dung transaction de rollback khi loi.
 * - Chi chay tren database phat trien.
 */

"use strict";

const {
    sql,
    connectDatabase
} = require("../src/config/database");

const SUBJECT_CODES = ["TOAN", "NGUVAN", "TINHOC"];

const COMPONENT_TYPES = [
    "QT1", "QT2", "QT3", "GK", "CK"
];

// Gia tri diem mac dinh theo tung mon.
const SAMPLE_SCORES = {
    TOAN: [8, 7, 9, 8, 8.5],
    NGUVAN: [7, 8, 8, 7.25, 8],
    TINHOC: [8, 9, 8, 7.5, 9]
};

// ==========================================
// 1. TAO BO DIEM MAU
// ==========================================

function buildSampleScores(studentCode, subjectCode) {
    const values = [...SAMPLE_SCORES[subjectCode]];

    const statuses = [
        "SCORED", "SCORED", "SCORED",
        "SCORED", "SCORED"
    ];

    // Truong hop diem 0 hop le.
    if (
        studentCode === "DEMO_G05_2627_G10_S01" &&
        subjectCode === "TINHOC"
    ) {
        values[0] = 0;
    }

    // Truong hop chua nhap QT3.
    if (
        studentCode === "DEMO_G05_2627_G10_S02" &&
        subjectCode === "TINHOC"
    ) {
        values[2] = null;
        statuses[2] = "NOT_ENTERED";
    }

    // Truong hop vang giua ky.
    if (
        studentCode === "DEMO_G05_2526_G10_S01" &&
        subjectCode === "TOAN"
    ) {
        values[3] = null;
        statuses[3] = "ABSENT";
    }

    // Truong hop mien cuoi ky.
    if (
        studentCode === "DEMO_G05_2526_G11_S02" &&
        subjectCode === "NGUVAN"
    ) {
        values[4] = null;
        statuses[4] = "EXEMPT";
    }

    return COMPONENT_TYPES.map((type, index) => ({
        type,
        value: values[index],
        status: statuses[index]
    }));
}

// ==========================================
// 2. LAY DANH SACH HOC SINH DEMO
// ==========================================

async function getDemoEnrollments(transaction) {
    const result = await new sql.Request(transaction)
        .query(`
            SELECT
                e.enrollment_id AS enrollmentId,
                s.student_code AS studentCode
            FROM dbo.enrollment e
            JOIN dbo.student s
                ON s.student_id = e.student_id
            JOIN dbo.academic_year a
                ON a.academic_year_id =
                   e.academic_year_id
            JOIN dbo.[class] c
                ON c.class_id = e.class_id
               AND c.academic_year_id =
                   e.academic_year_id
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
            ORDER BY s.student_code;
        `);

    if (result.recordset.length !== 12) {
        throw new Error(
            "Can dung 12 hoc sinh demo. " +
            "Hien co: " + result.recordset.length
        );
    }

    return result.recordset;
}

// ==========================================
// 3. LAY 3 MON HOC
// ==========================================

async function getDemoSubjects(transaction) {
    const result = await new sql.Request(transaction)
        .query(`
            SELECT
                subject_id AS subjectId,
                code
            FROM dbo.subject
            WHERE code IN (
                'TOAN', 'NGUVAN', 'TINHOC'
            );
        `);

    const subjects = new Map();

    for (const row of result.recordset) {
        subjects.set(row.code, Number(row.subjectId));
    }

    if (
        SUBJECT_CODES.some(
            code => !subjects.has(code)
        )
    ) {
        throw new Error(
            "Thieu mon hoc demo. " +
            "Can chay seed-demo.js truoc."
        );
    }

    return subjects;
}

// ==========================================
// 4. DAM BAO SCORE_RECORD TON TAI
// ==========================================

/*
 * Dam bao ScoreRecord ton tai.
 *
 * Neu da ton tai:
 * - Chap nhan version >= 1.
 * - Khong thay doi version.
 * - Khong ghi de du lieu cu.
 *
 * Neu chua ton tai:
 * - Tao ban ghi voi version = 1.
 *
 * Gia tri diem se duoc kiem tra rieng
 * trong ham ensureScoreComponent().
 */

async function ensureScoreRecord(
    transaction,
    enrollmentId,
    subjectId,
    counters
) {
    const findRecord = async () => {
        const result = await new sql.Request(transaction)
            .input(
                "enrollmentId",
                sql.BigInt,
                enrollmentId
            )
            .input(
                "subjectId",
                sql.BigInt,
                subjectId
            )
            .query(`
                SELECT
                    score_record_id AS recordId,
                    version
                FROM dbo.score_record
                    WITH (UPDLOCK, HOLDLOCK)
                WHERE enrollment_id = @enrollmentId
                  AND subject_id = @subjectId;
            `);

        return result.recordset[0] || null;
    };

    let record = await findRecord();

    // Neu da ton tai, khong tao trung.
    if (record) {
        const version = Number(record.version);

        // Kiem tra version hop le.
        if (
            !Number.isInteger(version) ||
            version < 1
        ) {
            throw new Error(
                "ScoreRecord co version khong hop le: " +
                record.recordId
            );
        }

        // Version co the tang sau khi reset
        // hoac cap nhat diem hop le.
        // Khong yeu cau version phai bang 1.
        counters.recordsExisting++;

        return Number(record.recordId);
    }

    // Chi tao khi ScoreRecord chua ton tai.
    await new sql.Request(transaction)
        .input(
            "enrollmentId",
            sql.BigInt,
            enrollmentId
        )
        .input(
            "subjectId",
            sql.BigInt,
            subjectId
        )
        .query(`
            INSERT INTO dbo.score_record (
                enrollment_id,
                subject_id,
                version
            )
            VALUES (
                @enrollmentId,
                @subjectId,
                1
            );
        `);

    // Doc lai ban ghi vua tao.
    record = await findRecord();

    if (!record) {
        throw new Error(
            "Khong tim thay ScoreRecord vua tao."
        );
    }

    counters.recordsCreated++;

    return Number(record.recordId);
}

// ==========================================
// 5. DAM BAO SCORE_COMPONENT TON TAI
// ==========================================

async function ensureScoreComponent(
    transaction,
    scoreRecordId,
    component,
    counters
) {
    const existing = await new sql.Request(transaction)
        .input(
            "recordId",
            sql.BigInt,
            scoreRecordId
        )
        .input(
            "type",
            sql.VarChar(10),
            component.type
        )
        .query(`
            SELECT
                score_value AS scoreValue,
                score_status AS scoreStatus
            FROM dbo.score_component
                WITH (UPDLOCK, HOLDLOCK)
            WHERE score_record_id = @recordId
              AND component_type = @type;
        `);

    if (existing.recordset.length > 0) {
        const row = existing.recordset[0];

        const currentValue =
            row.scoreValue === null
                ? null
                : Number(row.scoreValue);

        if (
            currentValue !== component.value ||
            row.scoreStatus !== component.status
        ) {
            throw new Error(
                "Diem demo da bi thay doi. " +
                "Khong tu ghi de: " +
                scoreRecordId + "/" +
                component.type
            );
        }

        counters.componentsExisting++;
        return;
    }

    await new sql.Request(transaction)
        .input(
            "recordId",
            sql.BigInt,
            scoreRecordId
        )
        .input(
            "type",
            sql.VarChar(10),
            component.type
        )
        .input(
            "scoreValue",
            sql.Decimal(4, 2),
            component.value
        )
        .input(
            "scoreStatus",
            sql.VarChar(15),
            component.status
        )
        .query(`
            INSERT INTO dbo.score_component (
                score_record_id,
                component_type,
                score_value,
                score_status
            )
            VALUES (
                @recordId,
                @type,
                @scoreValue,
                @scoreStatus
            );
        `);

    counters.componentsCreated++;
}

// ==========================================
// 6. CHUONG TRINH CHINH
// ==========================================

async function main() {
    let pool = null;
    let transaction = null;
    let started = false;

    try {
        if (
            String(process.env.NODE_ENV).toLowerCase() ===
            "production"
        ) {
            throw new Error(
                "Khong duoc seed tren production."
            );
        }

        pool = await connectDatabase();

        const database = await pool.request().query(`
            SELECT DB_NAME() AS databaseName;
        `);

        if (
            database.recordset[0].databaseName !==
            "thpt_grade_management"
        ) {
            throw new Error(
                "Dang ket noi sai database."
            );
        }

        console.log(
            "Ket noi database: thpt_grade_management"
        );

        transaction = new sql.Transaction(pool);

        await transaction.begin(
            sql.ISOLATION_LEVEL.SERIALIZABLE
        );

        started = true;

        const students =
            await getDemoEnrollments(transaction);

        const subjects =
            await getDemoSubjects(transaction);

        const counters = {
            recordsCreated: 0,
            recordsExisting: 0,
            componentsCreated: 0,
            componentsExisting: 0
        };

        for (const student of students) {
            for (const subjectCode of SUBJECT_CODES) {
                const recordId = await ensureScoreRecord(
                    transaction,
                    Number(student.enrollmentId),
                    subjects.get(subjectCode),
                    counters
                );

                const components = buildSampleScores(
                    student.studentCode,
                    subjectCode
                );

                for (const component of components) {
                    await ensureScoreComponent(
                        transaction,
                        recordId,
                        component,
                        counters
                    );
                }
            }

            console.log(
                "[PASS] " + student.studentCode
            );
        }

        await transaction.commit();
        started = false;

        console.log("");
        console.log("==============================");
        console.log("SEED DIEM MAU THANH CONG");
        console.log("==============================");
        console.log("Hoc sinh: " + students.length);
        console.log("Mon hoc: " + SUBJECT_CODES.length);

        console.log(
            "ScoreRecord tao moi: " +
            counters.recordsCreated
        );

        console.log(
            "ScoreRecord da co: " +
            counters.recordsExisting
        );

        console.log(
            "ScoreComponent tao moi: " +
            counters.componentsCreated
        );

        console.log(
            "ScoreComponent da co: " +
            counters.componentsExisting
        );

        console.log("");
        console.log(
            "Khong xoa hoac ghi de diem da ton tai."
        );

    } catch (error) {
        if (started && transaction) {
            try {
                await transaction.rollback();
            } catch (rollbackError) {
                console.error(
                    "Khong rollback duoc:",
                    rollbackError.message
                );
            }
        }

        console.error("SEED DIEM MAU THAT BAI!");
        console.error(error.message);
        process.exitCode = 1;

    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

main();
