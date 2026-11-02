
const { sql, connectDatabase } = require("../config/database");

// Lay bang diem theo nien khoa, lop va mon hoc.
async function getScores({
    academicYearId,
    classId,
    subjectId
}) {
    const pool = await connectDatabase();

    // Su dung tham so de truy van SQL Server an toan.
    const result = await pool.request()
        .input("academicYearId", sql.BigInt, academicYearId)
        .input("classId", sql.BigInt, classId)
        .input("subjectId", sql.BigInt, subjectId)
        .query(`
            SELECT
                e.enrollment_id,
                e.student_id,
                s.student_code,
                s.full_name,
                sr.score_record_id,
                sr.version,
                t.component_type,
                sc.score_component_id,
                sc.score_value,
                sc.score_status,
                ls.status AS lock_status
            FROM dbo.enrollment e
            JOIN dbo.student s
                ON e.student_id = s.student_id
            CROSS JOIN (
                VALUES ('QT1'), ('QT2'), ('QT3'),
                       ('GK'), ('CK')
            ) AS t(component_type)
            LEFT JOIN dbo.score_record sr
                ON sr.enrollment_id = e.enrollment_id
                AND sr.subject_id = @subjectId
            LEFT JOIN dbo.score_component sc
                ON sc.score_record_id = sr.score_record_id
                AND sc.component_type = t.component_type
            LEFT JOIN dbo.lock_status ls
                ON ls.academic_year_id = e.academic_year_id
                AND ls.class_id = e.class_id
                AND ls.subject_id = @subjectId
                AND ls.component = t.component_type
            WHERE e.academic_year_id = @academicYearId
              AND e.class_id = @classId
              AND EXISTS (
                  SELECT 1
                  FROM dbo.subject sub
                  WHERE sub.subject_id = @subjectId
              )
            ORDER BY
                e.enrollment_id,
                CASE t.component_type
                    WHEN 'QT1' THEN 1
                    WHEN 'QT2' THEN 2
                    WHEN 'QT3' THEN 3
                    WHEN 'GK' THEN 4
                    WHEN 'CK' THEN 5
                END
        `);

    const students = new Map();

    for (const row of result.recordset) {
        const key = String(row.enrollment_id);

        if (!students.has(key)) {
            students.set(key, {
                enrollmentId: Number(row.enrollment_id),
                studentId: Number(row.student_id),
                studentCode: row.student_code,
                fullName: row.full_name,
                scoreRecordId: row.score_record_id == null
                    ? null
                    : Number(row.score_record_id),
                version: row.version ?? null,
                components: []
            });
        }

        students.get(key).components.push({
            componentType: row.component_type,
            scoreComponentId: row.score_component_id == null
                ? null
                : Number(row.score_component_id),
            scoreValue: row.score_value == null
                ? null
                : Number(row.score_value),
            scoreStatus: row.score_status ?? "NOT_ENTERED",
            lockStatus: row.lock_status ?? "UNLOCKED"
        });
    }

    return Array.from(students.values());
}

module.exports = { getScores };
