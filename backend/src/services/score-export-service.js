"use strict";

const {
    calculateScoreSummary
} = require("./scoreSummaryService");

// Chuyen danh sach diem sang du lieu de xuat CSV.
// Khong thay doi du lieu trong SQL Server.
function buildScoreDetails(students, subject, formulaPolicy) {
    if (!Array.isArray(students)) {
        throw new TypeError("Danh sach hoc sinh khong hop le.");
    }

    if (!subject || typeof subject !== "object") {
        throw new TypeError("Thong tin mon hoc khong hop le.");
    }

    return students.map(student => {
        // Su dung cong thuc tong ket da duoc nhom duyet.
        const summary = calculateScoreSummary(
            {
                scoreRecordId: student.scoreRecordId ?? null,
                version: student.version ?? null,
                components: student.components ?? []
            },
            formulaPolicy
        );

        const row = {
            enrollmentId: student.enrollmentId,
            studentId: student.studentId,
            studentCode: student.studentCode,
            fullName: student.fullName,
            subjectId: subject.subjectId,
            subjectCode: subject.code,
            subjectName: subject.name
        };

        // Lay du 5 thanh phan diem.
        // Giu rieng trang thai de phan biet
        // diem 0, chua nhap, vang va mien.
        for (const component of summary.components) {
            const type = component.componentType;

            row[type] =
                component.scoreStatus === "SCORED"
                    ? component.scoreValue
                    : null;

            row[type + "Status"] = component.scoreStatus;
        }

        row.finalScore = summary.finalScore;
        row.calculationStatus = summary.calculationStatus;

        return row;
    });
}

module.exports = {
    buildScoreDetails
};