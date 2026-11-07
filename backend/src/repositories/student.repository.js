"use strict";

const { sql, connectDatabase } = require("../config/database");

/*
 * Lay danh sach hoc sinh.
 * Ho tro tim kiem va loc theo:
 * - Ma hoc sinh
 * - Ho ten
 * - Trang thai
 * - Nien khoa
 * - Lop hoc
 *
 * Khong loc bo hoc sinh INACTIVE neu khong yeu cau.
 * Khong JOIN truc tiep Enrollment de tranh trung hoc sinh.
 */
async function getAllStudents(filters = {}) {
    const pool = await connectDatabase();

    const {
        studentCode = null,
        fullName = null,
        status = null,
        academicYearId = null,
        classId = null
    } = filters;

    const result = await pool.request()
        .input("studentCode", sql.VarChar(30), studentCode)
        .input("fullName", sql.NVarChar(150), fullName)
        .input("status", sql.VarChar(20), status)
        .input("academicYearId", sql.BigInt, academicYearId)
        .input("classId", sql.BigInt, classId)
        .query(`
            SELECT
                s.student_id AS studentId,
                s.student_code AS studentCode,
                s.full_name AS fullName,
                CONVERT(
                    VARCHAR(10),
                    s.date_of_birth,
                    23
                ) AS dateOfBirth,
                s.status
            FROM dbo.student AS s
            WHERE
                (
                    @studentCode IS NULL
                    OR s.student_code LIKE '%' + @studentCode + '%'
                )
                AND (
                    @fullName IS NULL
                    OR s.full_name LIKE N'%' + @fullName + N'%'
                )
                AND (
                    @status IS NULL
                    OR s.status = @status
                )
                AND (
                    (
                        @academicYearId IS NULL
                        AND @classId IS NULL
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM dbo.enrollment AS e
                        WHERE e.student_id = s.student_id
                          AND (
                              @academicYearId IS NULL
                              OR e.academic_year_id = @academicYearId
                          )
                          AND (
                              @classId IS NULL
                              OR e.class_id = @classId
                          )
                          AND (
                              @classId IS NULL
                              OR e.end_date IS NULL
                          )
                    )
                )
            ORDER BY
                s.student_code ASC
        `);

    return result.recordset;
}

/*
 * Lay thong tin mot hoc sinh theo ID.
 * Khong thay doi du lieu hoc sinh.
 */
async function getStudentById(studentId) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("studentId", sql.BigInt, String(studentId))
        .query(`
            SELECT
                student_id AS studentId,
                student_code AS studentCode,
                full_name AS fullName,
                CONVERT(
                    VARCHAR(10),
                    date_of_birth,
                    23
                ) AS dateOfBirth,
                status
            FROM dbo.student
            WHERE student_id = @studentId
        `);

    return result.recordset[0] || null;
}

/*
 * Lay lich su phan lop cua hoc sinh.
 *
 * Giu ca Enrollment da ket thuc.
 * Khong chi tra ve lop dang hoc.
 */
async function getStudentEnrollmentHistory(studentId) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("studentId", sql.BigInt, String(studentId))
        .query(`
            SELECT
                e.enrollment_id AS enrollmentId,
                e.student_id AS studentId,
                e.class_id AS classId,
                c.code AS classCode,
                e.academic_year_id AS academicYearId,
                a.code AS academicYearCode,
                g.grade_number AS gradeNumber,
                CONVERT(
                    VARCHAR(10),
                    e.start_date,
                    23
                ) AS startDate,
                CONVERT(
                    VARCHAR(10),
                    e.end_date,
                    23
                ) AS endDate,
                e.exit_reason AS exitReason
            FROM dbo.enrollment AS e
            INNER JOIN dbo.[class] AS c
                ON c.class_id = e.class_id
            INNER JOIN dbo.academic_year AS a
                ON a.academic_year_id = e.academic_year_id
            INNER JOIN dbo.grade AS g
                ON g.grade_id = c.grade_id
            WHERE e.student_id = @studentId
            ORDER BY
                e.start_date DESC,
                e.enrollment_id DESC
        `);

    return result.recordset;
}

/*
 * Tao ho so hoc sinh moi.
 * Chi ghi thong tin Student.
 * Khong tu dong tao Enrollment hoac tai khoan.
 *
 * Du lieu dau vao phai duoc Controller kiem tra.
 * student_code duoc rang buoc UNIQUE tai SQL Server.
 */
async function createStudent(data) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("studentCode", sql.VarChar(30), data.studentCode)
        .input("fullName", sql.NVarChar(150), data.fullName)
        .input("dateOfBirth", sql.VarChar(10), data.dateOfBirth)
        .input("status", sql.VarChar(20), data.status)
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
                CONVERT(DATE, @dateOfBirth, 23),
                @status
            )
        `);

    const studentId = result.recordset[0].studentId;

    return getStudentById(studentId);
}


/*
 * Kiem tra ngay sinh YYYY-MM-DD.
 * Phai la ngay ton tai va khong trong tuong lai.
 */
function validDateOfBirth(value) {
    if (
        typeof value !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        value.startsWith("0000-")
    ) {
        return false;
    }

    const date = new Date(value + "T00:00:00Z");

    if (
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== value
    ) {
        return false;
    }

    // Lay ngay hien tai theo gio Viet Nam
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
    }).formatToParts(new Date());

    const getPart = type =>
        parts.find(part => part.type === type).value;

    const today =
        getPart("year") + "-" +
        getPart("month") + "-" +
        getPart("day");

    return value <= today;
}


/*
 * Cap nhat thong tin ho so hoc sinh.
 * Chi cap nhat nhung truong duoc cung cap.
 *
 * Khong thay doi trang thai hoc sinh.
 * Khong thay doi Enrollment hoac bang diem.
 */
async function updateStudentProfile(studentId, data) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("studentId", sql.BigInt, String(studentId))
        .input(
            "studentCode",
            sql.VarChar(30),
            data.studentCode ?? null
        )
        .input(
            "fullName",
            sql.NVarChar(150),
            data.fullName ?? null
        )
        .input(
            "dateOfBirth",
            sql.VarChar(10),
            data.dateOfBirth ?? null
        )
        .query(`
            UPDATE dbo.student
            SET
                student_code = COALESCE(
                    @studentCode, student_code
                ),
                full_name = COALESCE(
                    @fullName, full_name
                ),
                date_of_birth = COALESCE(
                    CONVERT(DATE, @dateOfBirth, 23),
                    date_of_birth
                )
            OUTPUT INSERTED.student_id AS studentId
            WHERE student_id = @studentId
        `);

    if (result.recordset.length === 0) {
        return null;
    }

    return getStudentById(studentId);
}


/*
 * Cap nhat trang thai ho so hoc sinh.
 * Khong xoa hoc sinh, Enrollment hoac diem.
 */
async function updateStudentStatus(studentId, status) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("studentId", sql.BigInt, String(studentId))
        .input("status", sql.VarChar(20), status)
        .query(`
            UPDATE dbo.student
            SET status = @status
            WHERE student_id = @studentId
        `);

    if (result.rowsAffected[0] === 0) {
        return null;
    }

    return getStudentById(studentId);
}

module.exports = {
    getAllStudents,
    getStudentById,
    getStudentEnrollmentHistory,
    createStudent,
    updateStudentProfile,
    updateStudentStatus
};
