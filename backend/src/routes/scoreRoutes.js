
const express = require("express");

// Tao API lay bang diem
// requireKhaoThi: middleware kiem tra quyen cua VT1
// getScores: ham lay du lieu tu database
function createScoreRouter(requireKhaoThi, getScores) {

    // Khong cho tao API khi chua co bao ve
    if (typeof requireKhaoThi !== "function" ||
        typeof getScores !== "function") {
        throw new Error("Thieu middleware hoac ham lay diem");
    }

    const router = express.Router();

    // GET /api/v1/scores
    router.get("/", requireKhaoThi, async (req, res, next) => {
        try {
            const { academicYearId, classId, subjectId } = req.query;

            // Kiem tra cac ma duoc cung cap
            const ids = [academicYearId, classId, subjectId];

            const valid = ids.every(id => {
                const number = Number(id);
                return id !== undefined &&
                    Number.isSafeInteger(number) &&
                    number > 0;
            });

            if (!valid) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Ma nien khoa, lop hoac mon khong hop le"
                    }
                });
            }

            // Goi ham lay diem duoc cung cap khi tich hop
            const data = await getScores({
                academicYearId: Number(academicYearId),
                classId: Number(classId),
                subjectId: Number(subjectId)
            });

            return res.status(200).json({
                success: true,
                data: data
            });

        } catch (error) {
            next(error);
        }
    });

    return router;
}

module.exports = createScoreRouter;
