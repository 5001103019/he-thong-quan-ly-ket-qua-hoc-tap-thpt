"use strict";

// Thong ke theo mon hoc trong pham vi nien khoa/lop da loc.
// Du lieu dau vao la ket qua tu buildScoreDetails().

function buildScoreStatistics(details) {
    if (!Array.isArray(details)) {
        throw new TypeError(
            "Du lieu bang diem khong hop le."
        );
    }

    const groups = new Map();

    for (const row of details) {
        if (
            !row ||
            row.subjectId == null ||
            row.studentId == null
        ) {
            throw new TypeError(
                "Thieu ma mon hoc hoac ma hoc sinh."
            );
        }

        const subjectKey = String(row.subjectId);

        if (!groups.has(subjectKey)) {
            groups.set(subjectKey, {
                subjectId: row.subjectId,
                subjectCode: row.subjectCode,
                subjectName: row.subjectName,
                studentCount: 0,
                calculatedCount: 0,
                notCalculatedCount: 0,
                scoreSum: 0,
                studentIds: new Set()
            });
        }

        const group = groups.get(subjectKey);
        const studentKey = String(row.studentId);

        // Phat hien du lieu trung do lich su phan lop.
        // Khong tu chon mot ban ghi de thong ke sai.
        if (group.studentIds.has(studentKey)) {
            throw new Error(
                "Hoc sinh bi trung trong cung mon hoc: " +
                studentKey
            );
        }

        group.studentIds.add(studentKey);
        group.studentCount++;

        if (row.calculationStatus === "CALCULATED") {
            if (
                typeof row.finalScore !== "number" ||
                !Number.isFinite(row.finalScore) ||
                row.finalScore < 0 ||
                row.finalScore > 10
            ) {
                throw new TypeError(
                    "Diem tong ket khong hop le."
                );
            }

            group.calculatedCount++;
            group.scoreSum += row.finalScore;
        } else if (
            row.calculationStatus === "INCOMPLETE" ||
            row.calculationStatus === "FORMULA_NOT_APPROVED"
        ) {
            group.notCalculatedCount++;
        } else {
            throw new TypeError(
                "Trang thai tinh tong ket khong hop le."
            );
        }
    }

    return Array.from(groups.values()).map(group => ({
        subjectId: group.subjectId,
        subjectCode: group.subjectCode,
        subjectName: group.subjectName,
        studentCount: group.studentCount,
        calculatedCount: group.calculatedCount,
        notCalculatedCount: group.notCalculatedCount,
        averageFinalScore:
            group.calculatedCount === 0
                ? null
                : Math.round(
                    (group.scoreSum / group.calculatedCount) * 100
                ) / 100
    }));
}

module.exports = {
    buildScoreStatistics
};