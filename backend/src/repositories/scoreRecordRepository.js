
"use strict";

const {
    sql,
    connectDatabase
} = require("../config/database");

// Lay chi tiet ban ghi diem theo scoreRecordId.
async function getScoreRecordById(scoreRecordId) {
    const pool = await connectDatabase();

    const result = await pool.request()
        .input("scoreRecordId", sql.BigInt, scoreRecordId)
        .query(`
            SELECT
                sr.score_record_id,
                sr.enrollment_id,
                sr.subject_id,
                sr.version,
                t.component_type,
                sc.score_component_id,
                sc.score_value,
                sc.score_status,
                ls.status AS lock_status
            FROM dbo.score_record sr
            JOIN dbo.enrollment e
                ON e.enrollment_id = sr.enrollment_id
            CROSS JOIN (
                VALUES ('QT1'), ('QT2'), ('QT3'),
                       ('GK'), ('CK')
            ) AS t(component_type)
            LEFT JOIN dbo.score_component sc
                ON sc.score_record_id = sr.score_record_id
                AND sc.component_type = t.component_type
            LEFT JOIN dbo.lock_status ls
                ON ls.academic_year_id = e.academic_year_id
                AND ls.class_id = e.class_id
                AND ls.subject_id = sr.subject_id
                AND ls.component = t.component_type
            WHERE sr.score_record_id = @scoreRecordId
            ORDER BY
                CASE t.component_type
                    WHEN 'QT1' THEN 1
                    WHEN 'QT2' THEN 2
                    WHEN 'QT3' THEN 3
                    WHEN 'GK' THEN 4
                    WHEN 'CK' THEN 5
                END
        `);

    const rows = result.recordset;

    // Khong tim thay ban ghi diem.
    if (rows.length === 0) {
        return null;
    }

    // Chuyen du lieu SQL Server thanh JSON.
    const components = rows.map(row => ({
        componentType: row.component_type,
        scoreComponentId: row.score_component_id == null
            ? null
            : Number(row.score_component_id),
        scoreValue: row.score_value == null
            ? null
            : Number(row.score_value),
        scoreStatus: row.score_status ?? "NOT_ENTERED",
        lockStatus: row.lock_status ?? "UNLOCKED"
    }));

    const first = rows[0];

    return {
        scoreRecordId: Number(first.score_record_id),
        enrollmentId: Number(first.enrollment_id),
        subjectId: Number(first.subject_id),
        version: first.version,
        components: components
    };
}


 // Lay phien ban cong thuc moi nhat tu SQL Server.
 // Khong tu dong phe duyet cong thuc.
 async function getLatestFormulaPolicy() {
     const pool = await connectDatabase();

     const result = await pool.request().query(`
         SELECT TOP (1)
             formula_policy_id,
             version,
             approval_status,
             approved_by,
             approved_at
         FROM dbo.score_formula_policy
         ORDER BY version DESC
     `);

     const policy = result.recordset[0];

     // Chua co cong thuc trong database.
     if (!policy) {
         return null;
     }

     return {
         formulaPolicyId: String(policy.formula_policy_id),
         version: policy.version,
         approvalStatus: policy.approval_status,
         approvedBy: policy.approved_by,
         approvedAt: policy.approved_at
     };
 }

 module.exports = {
     getScoreRecordById,
     getLatestFormulaPolicy
 };

