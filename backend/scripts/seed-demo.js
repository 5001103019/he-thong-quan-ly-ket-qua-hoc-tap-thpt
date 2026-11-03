
/*
 * VT1-05 - SEED DU LIEU DEMO
 * Giai doan 1: Nien khoa, khoi, lop, mon hoc.
 *
 * Nguyen tac:
 * - Chi su dung database phat trien.
 * - Khong xoa du lieu.
 * - Khong ghi de du lieu da ton tai.
 * - Chay nhieu lan khong tao ban ghi trung.
 * - Loi xay ra thi ROLLBACK transaction.
 */

"use strict";

const {
    sql,
    connectDatabase
} = require("../src/config/database");

// ==========================================
// 1. DU LIEU DEMO CO DINH
// ==========================================

const ACADEMIC_YEARS = [
    {
        code: "2025-2026",
        startYear: 2025,
        endYear: 2026,
        status: "CLOSED"
    },
    {
        code: "2026-2027",
        startYear: 2026,
        endYear: 2027,
        status: "ACTIVE"
    }
];

const GRADES = [10, 11, 12];

const SUBJECTS = [
    { code: "TOAN", name: "Toán" },
    { code: "NGUVAN", name: "Ngữ văn" },
    { code: "TINHOC", name: "Tin học" }
];

// ==========================================
// 2. DAM BAO NIEN KHOA TON TAI
// ==========================================

async function ensureAcademicYear(transaction, year) {
    const existing = await new sql.Request(transaction)
        .input("code", sql.VarChar(9), year.code)
        .query(`
            SELECT
                academic_year_id AS id,
                start_year AS startYear,
                end_year AS endYear
            FROM dbo.academic_year WITH (UPDLOCK, HOLDLOCK)
            WHERE code = @code;
        `);

    if (existing.recordset.length > 0) {
        const row = existing.recordset[0];

        if (
            Number(row.startYear) !== year.startYear ||
            Number(row.endYear) !== year.endYear
        ) {
            throw new Error(
                "Nien khoa ton tai nhung sai thong tin: " +
                year.code
            );
        }

        console.log("[DA CO] Nien khoa " + year.code);
        return Number(row.id);
    }

    const created = await new sql.Request(transaction)
        .input("code", sql.VarChar(9), year.code)
        .input("startYear", sql.SmallInt, year.startYear)
        .input("endYear", sql.SmallInt, year.endYear)
        .input("status", sql.VarChar(20), year.status)
        .query(`
            INSERT INTO dbo.academic_year (
                code,
                start_year,
                end_year,
                status
            )
            OUTPUT INSERTED.academic_year_id AS id
            VALUES (
                @code,
                @startYear,
                @endYear,
                @status
            );
        `);

    console.log("[TAO MOI] Nien khoa " + year.code);
    return Number(created.recordset[0].id);
}

// ==========================================
// 3. DAM BAO KHOI TON TAI
// ==========================================

async function ensureGrade(transaction, gradeNumber) {
    const existing = await new sql.Request(transaction)
        .input("gradeNumber", sql.SmallInt, gradeNumber)
        .query(`
            SELECT grade_id AS id
            FROM dbo.grade WITH (UPDLOCK, HOLDLOCK)
            WHERE grade_number = @gradeNumber;
        `);

    if (existing.recordset.length > 0) {
        console.log("[DA CO] Khoi " + gradeNumber);
        return Number(existing.recordset[0].id);
    }

    const created = await new sql.Request(transaction)
        .input("gradeNumber", sql.SmallInt, gradeNumber)
        .query(`
            INSERT INTO dbo.grade (grade_number)
            OUTPUT INSERTED.grade_id AS id
            VALUES (@gradeNumber);
        `);

    console.log("[TAO MOI] Khoi " + gradeNumber);
    return Number(created.recordset[0].id);
}

// ==========================================
// 4. DAM BAO MON HOC TON TAI
// ==========================================

async function ensureSubject(transaction, subject) {
    const existing = await new sql.Request(transaction)
        .input("code", sql.VarChar(20), subject.code)
        .query(`
            SELECT subject_id AS id
            FROM dbo.subject WITH (UPDLOCK, HOLDLOCK)
            WHERE code = @code;
        `);

    if (existing.recordset.length > 0) {
        console.log("[DA CO] Mon " + subject.code);
        return Number(existing.recordset[0].id);
    }

    const created = await new sql.Request(transaction)
        .input("code", sql.VarChar(20), subject.code)
        .input("name", sql.NVarChar(100), subject.name)
        .query(`
            INSERT INTO dbo.subject (
                code,
                name,
                status
            )
            OUTPUT INSERTED.subject_id AS id
            VALUES (
                @code,
                @name,
                'ACTIVE'
            );
        `);

    console.log("[TAO MOI] Mon " + subject.code);
    return Number(created.recordset[0].id);
}

// ==========================================
// 5. DAM BAO LOP HOC DEMO TON TAI
// ==========================================

async function ensureClass(
    transaction,
    academicYearId,
    gradeId,
    gradeNumber
) {
    const code = "DEMO_" + gradeNumber + "A1";
    const name = "Lớp demo " + gradeNumber + "A1";

    const existing = await new sql.Request(transaction)
        .input("academicYearId", sql.BigInt, academicYearId)
        .input("code", sql.VarChar(20), code)
        .query(`
            SELECT
                class_id AS id,
                grade_id AS gradeId
            FROM dbo.[class] WITH (UPDLOCK, HOLDLOCK)
            WHERE academic_year_id = @academicYearId
              AND code = @code;
        `);

    if (existing.recordset.length > 0) {
        const row = existing.recordset[0];

        if (Number(row.gradeId) !== gradeId) {
            throw new Error(
                "Lop demo da ton tai nhung sai khoi: " +
                code
            );
        }

        console.log("[DA CO] Lop " + code);
        return Number(row.id);
    }

    const created = await new sql.Request(transaction)
        .input("academicYearId", sql.BigInt, academicYearId)
        .input("gradeId", sql.SmallInt, gradeId)
        .input("code", sql.VarChar(20), code)
        .input("name", sql.NVarChar(100), name)
        .query(`
            INSERT INTO dbo.[class] (
                academic_year_id,
                grade_id,
                code,
                name,
                status
            )
            OUTPUT INSERTED.class_id AS id
            VALUES (
                @academicYearId,
                @gradeId,
                @code,
                @name,
                'ACTIVE'
            );
        `);

    console.log("[TAO MOI] Lop " + code);
    return Number(created.recordset[0].id);
}

// ==========================================
// 6. CHUONG TRINH CHINH
// ==========================================

async function main() {
    let pool = null;
    let transaction = null;
    let started = false;

    try {
        // Khong cho chay tren production.
        if (
            String(process.env.NODE_ENV).toLowerCase() ===
            "production"
        ) {
            throw new Error(
                "Khong duoc chay seed demo tren production."
            );
        }

        // Ket noi database.
        pool = await connectDatabase();

        // Kiem tra dung ten database phat trien.
        const dbResult = await pool.request().query(`
            SELECT DB_NAME() AS database_name;
        `);

        const databaseName =
            dbResult.recordset[0].database_name;

        if (databaseName !== "thpt_grade_management") {
            throw new Error(
                "Sai database: " + databaseName
            );
        }

        console.log("Ket noi database thanh cong.");
        console.log("Database: " + databaseName);
        console.log("");

        // Bat dau transaction.
        transaction = new sql.Transaction(pool);

        await transaction.begin(
            sql.ISOLATION_LEVEL.SERIALIZABLE
        );

        started = true;

        // Tao hoac su dung 3 khoi.
        const gradeIds = new Map();

        for (const gradeNumber of GRADES) {
            const gradeId = await ensureGrade(
                transaction,
                gradeNumber
            );

            gradeIds.set(gradeNumber, gradeId);
        }

        // Tao hoac su dung 3 mon hoc.
        for (const subject of SUBJECTS) {
            await ensureSubject(transaction, subject);
        }

        // Tao 2 nien khoa va 6 lop demo.
        for (const year of ACADEMIC_YEARS) {
            const academicYearId =
                await ensureAcademicYear(transaction, year);

            for (const gradeNumber of GRADES) {
                await ensureClass(
                    transaction,
                    academicYearId,
                    gradeIds.get(gradeNumber),
                    gradeNumber
                );
            }
        }

        // Luu tat ca thay doi.
        await transaction.commit();
        started = false;

        console.log("");
        console.log("==================================");
        console.log("SEED DANH MUC THANH CONG");
        console.log("==================================");
        console.log("Da dam bao:");
        console.log("- 2 nien khoa demo");
        console.log("- 3 khoi: 10, 11, 12");
        console.log("- 6 lop demo");
        console.log("- 3 mon hoc");
        console.log("");
        console.log("Khong xoa du lieu cu.");
        console.log("Khong tao ban ghi trung khi chay lai.");

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
