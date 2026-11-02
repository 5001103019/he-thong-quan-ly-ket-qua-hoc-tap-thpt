
/*
 * VT1-05 - SEED HOC SINH VA PHAN LOP DEMO
 *
 * - Tao 12 hoc sinh cho 6 lop demo.
 * - Moi lop co 2 hoc sinh.
 * - Bao toan quan he Student - Enrollment - Class.
 * - Chay nhieu lan khong tao trung.
 * - Khong xoa hoac ghi de du lieu cu.
 * - Dung transaction de rollback khi loi.
 */

"use strict";

const {
    sql,
    connectDatabase
} = require("../src/config/database");

// 1. DU LIEU DEMO

const YEARS = [
    {
        code: "2025-2026",
        tag: "2526",
        startYear: 2025,
        completed: true
    },
    {
        code: "2026-2027",
        tag: "2627",
        startYear: 2026,
        completed: false
    }
];

const GRADES = [10, 11, 12];
const STUDENTS_PER_CLASS = 2;

// 2. TIM LOP THEO NIEN KHOA VA KHOI

async function findDemoClass(transaction, year, grade) {
    const classCode = "DEMO_" + grade + "A1";

    const result = await new sql.Request(transaction)
        .input("yearCode", sql.VarChar(9), year.code)
        .input("classCode", sql.VarChar(20), classCode)
        .input("gradeNumber", sql.SmallInt, grade)
        .query(`
            SELECT
                a.academic_year_id AS academicYearId,
                c.class_id AS classId
            FROM dbo.academic_year a
            JOIN dbo.[class] c
                ON c.academic_year_id = a.academic_year_id
            JOIN dbo.grade g
                ON g.grade_id = c.grade_id
            WHERE a.code = @yearCode
              AND c.code = @classCode
              AND g.grade_number = @gradeNumber;
        `);

    if (result.recordset.length !== 1) {
        throw new Error(
            "Khong tim thay lop " +
            classCode + " - " + year.code +
            ". Can chay seed-demo.js truoc."
        );
    }

    return result.recordset[0];
}

// 3. TAO HOC SINH NEU CHUA TON TAI

async function ensureStudent(
    transaction,
    studentCode,
    fullName,
    birthDate
) {
    const existing = await new sql.Request(transaction)
        .input("studentCode", sql.VarChar(30), studentCode)
        .query(`
            SELECT
                student_id AS studentId,
                full_name AS fullName,
                CONVERT(VARCHAR(10), date_of_birth, 23)
                    AS birthDate
            FROM dbo.student WITH (UPDLOCK, HOLDLOCK)
            WHERE student_code = @studentCode;
        `);

    if (existing.recordset.length > 0) {
        const student = existing.recordset[0];

        // Khong tu dong ghi de neu ma bi trung
        // nhung thong tin khac voi du lieu demo.
        if (
            student.fullName !== fullName ||
            student.birthDate !== birthDate
        ) {
            throw new Error(
                "Hoc sinh da ton tai nhung sai thong tin: " +
                studentCode
            );
        }

        console.log("[DA CO] Hoc sinh " + studentCode);
        return Number(student.studentId);
    }

    const created = await new sql.Request(transaction)
        .input("studentCode", sql.VarChar(30), studentCode)
        .input("fullName", sql.NVarChar(150), fullName)
        .input("birthDate", sql.VarChar(10), birthDate)
        .query(`
            INSERT INTO dbo.student (
                student_code,
                full_name,
                date_of_birth,
                status
            )
            OUTPUT INSERTED.student_id AS studentId
            VALUES (
                @studentCode,
                @fullName,
                CONVERT(DATE, @birthDate, 23),
                'ACTIVE'
            );
        `);

    console.log("[TAO MOI] Hoc sinh " + studentCode);
    return Number(created.recordset[0].studentId);
}

// 4. DAM BAO HOC SINH DUOC PHAN DUNG LOP


/*
 * Dam bao hoc sinh duoc phan dung lop.
 * Neu da ton tai thi kiem tra va su dung lai.
 * Neu chua co thi tao moi trong transaction.
 *
 * Su dung SCOPE_IDENTITY() de lay ID moi,
 * tranh loi OUTPUT khong co INTO khi bang
 * enrollment co trigger.
 */
async function ensureEnrollment(
    transaction,
    studentId,
    academicYearId,
    classId,
    startDate,
    endDate,
    exitReason
) {
    // 1. Kiem tra phan lop da ton tai hay chua.
    const existing = await new sql.Request(transaction)
        .input("studentId", sql.BigInt, studentId)
        .input("academicYearId", sql.BigInt, academicYearId)
        .query(`
            SELECT
                enrollment_id AS enrollmentId,
                class_id AS classId,
                CONVERT(VARCHAR(10), start_date, 23)
                    AS startDate,
                CONVERT(VARCHAR(10), end_date, 23)
                    AS endDate,
                exit_reason AS exitReason
            FROM dbo.enrollment WITH (UPDLOCK, HOLDLOCK)
            WHERE student_id = @studentId
              AND academic_year_id = @academicYearId;
        `);

    // 2. Neu da co thi khong tao trung.
    if (existing.recordset.length > 0) {
        if (existing.recordset.length !== 1) {
            throw new Error(
                "Hoc sinh co nhieu ban ghi phan lop. " +
                "Can kiem tra lich su."
            );
        }

        const row = existing.recordset[0];

        // Khong ghi de lich su phan lop.
        if (
            Number(row.classId) !== classId ||
            row.startDate !== startDate ||
            row.endDate !== endDate ||
            row.exitReason !== exitReason
        ) {
            throw new Error(
                "Phan lop demo da bi thay doi. " +
                "Khong tu dong ghi de."
            );
        }

        console.log(
            "[DA CO] Phan lop hoc sinh " + studentId
        );

        return Number(row.enrollmentId);
    }

    // 3. Tao phan lop moi neu chua ton tai.
    const created = await new sql.Request(transaction)
        .input("studentId", sql.BigInt, studentId)
        .input("classId", sql.BigInt, classId)
        .input("academicYearId", sql.BigInt, academicYearId)
        .input("startDate", sql.VarChar(10), startDate)
        .input("endDate", sql.VarChar(10), endDate)
        .input("exitReason", sql.VarChar(20), exitReason)
        .query(`
            INSERT INTO dbo.enrollment (
                student_id,
                class_id,
                academic_year_id,
                start_date,
                end_date,
                exit_reason
            )
            VALUES (
                @studentId,
                @classId,
                @academicYearId,
                CONVERT(DATE, @startDate, 23),
                CONVERT(DATE, @endDate, 23),
                @exitReason
            );

            -- Lay ID vua duoc tao.
            -- Tuong thich voi bang co trigger.
            SELECT CAST(SCOPE_IDENTITY() AS BIGINT)
                AS enrollmentId;
        `);

    // 4. Kiem tra ID vua tao.
    if (
        !created.recordset ||
        created.recordset.length !== 1 ||
        created.recordset[0].enrollmentId === null
    ) {
        throw new Error(
            "Khong lay duoc enrollmentId vua tao."
        );
    }

    const enrollmentId = Number(
        created.recordset[0].enrollmentId
    );

    if (
        !Number.isSafeInteger(enrollmentId) ||
        enrollmentId <= 0
    ) {
        throw new Error(
            "enrollmentId vua tao khong hop le."
        );
    }

    console.log(
        "[TAO MOI] Phan lop hoc sinh " + studentId
    );

    return enrollmentId;
}


// 5. CHUONG TRINH CHINH

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

        const result = await pool.request().query(`
            SELECT DB_NAME() AS databaseName;
        `);

        const databaseName =
            result.recordset[0].databaseName;

        if (databaseName !== "thpt_grade_management") {
            throw new Error(
                "Dang ket noi sai database: " + databaseName
            );
        }

        console.log(
            "Ket noi database: " + databaseName
        );

        transaction = new sql.Transaction(pool);

        await transaction.begin(
            sql.ISOLATION_LEVEL.SERIALIZABLE
        );

        started = true;

        let studentCount = 0;
        let enrollmentCount = 0;

        for (const year of YEARS) {
            for (const grade of GRADES) {
                const demoClass =
                    await findDemoClass(
                        transaction,
                        year,
                        grade
                    );

                for (
                    let number = 1;
                    number <= STUDENTS_PER_CLASS;
                    number++
                ) {
                    const studentCode =
                        "DEMO_G05_" +
                        year.tag +
                        "_G" + grade +
                        "_S" +
                        String(number).padStart(2, "0");

                    const fullName =
                        "Học sinh demo " +
                        grade + "A1 - " +
                        number + " (" + year.code + ")";

                    const birthYear =
                        year.startYear - grade - 5;

                    const birthDate =
                        birthYear +
                        "-02-" +
                        String(10 + number)
                            .padStart(2, "0");

                    const startDate =
                        year.startYear + "-09-01";

                    // Nien khoa cu la du lieu lich su.
                    const endDate = year.completed
                        ? (year.startYear + 1) + "-06-01"
                        : null;

                    const exitReason = year.completed
                        ? "COMPLETED"
                        : null;

                    const studentId =
                        await ensureStudent(
                            transaction,
                            studentCode,
                            fullName,
                            birthDate
                        );

                    studentCount++;

                    await ensureEnrollment(
                        transaction,
                        studentId,
                        Number(demoClass.academicYearId),
                        Number(demoClass.classId),
                        startDate,
                        endDate,
                        exitReason
                    );

                    enrollmentCount++;
                }
            }
        }

        await transaction.commit();
        started = false;

        console.log("");
        console.log("============================");
        console.log("SEED HOC SINH THANH CONG");
        console.log("============================");
        console.log("Hoc sinh: " + studentCount);
        console.log("Ban ghi phan lop: " + enrollmentCount);
        console.log("Khong xoa du lieu cu.");
        console.log("Khong tao du lieu trung.");

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

        console.error("SEED THAT BAI!");
        console.error(error.message);
        process.exitCode = 1;

    } finally {
        if (pool) {
            await pool.close();
        }
    }
}

main();
