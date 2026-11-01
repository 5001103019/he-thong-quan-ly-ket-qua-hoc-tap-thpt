
const gradeRepository = require("../repositories/grade.repository");

// Lay danh sach tat ca cac khoi
async function getAllGrades(req, res) {
    try {
        // Goi Repository de lay danh sach khoi
        const grades = await gradeRepository.getAllGrades();

        // Tra ve danh sach khoi
        return res.status(200).json({
            success: true,
            data: grades
        });

    } catch (error) {
        // Xu ly loi khi truy van du lieu
        console.error("Loi lay danh sach khoi:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Loi may chu"
            }
        });
    }
}

// Lay thong tin mot khoi theo ID
async function getGradeById(req, res) {
    // Lay ID tu duong dan API
    const id = Number(req.params.id);

    // Kiem tra ID hop le
    if (!Number.isInteger(id) || id <= 0 || id > 32767) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "ID khoi khong hop le"
            }
        });
    }

    try {
        // Goi Repository de tim khoi theo ID
        const grade = await gradeRepository.getGradeById(id);

        // Khong tim thay khoi
        if (!grade) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Khong tim thay khoi"
                }
            });
        }

        // Tra ve thong tin khoi
        return res.status(200).json({
            success: true,
            data: grade
        });

    } catch (error) {
        // Xu ly loi khi tim khoi
        console.error("Loi tim khoi:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Loi may chu"
            }
        });
    }
}

// Them khoi moi
async function createGrade(req, res) {
    // Lay so khoi tu du lieu nguoi dung gui len
    const { gradeNumber } = req.body || {};

    // Chi cho phep khoi 10, 11, 12
    if (
        !Number.isInteger(gradeNumber) ||
        ![10, 11, 12].includes(gradeNumber)
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "So khoi phai la 10, 11 hoac 12"
            }
        });
    }

    try {
        // Goi Repository de them khoi
        const grade = await gradeRepository.createGrade(
            gradeNumber
        );

        // Tra ve thong tin khoi vua tao
        return res.status(201).json({
            success: true,
            data: grade
        });

    } catch (error) {
        // Lay ma loi SQL Server
        const errorNumber =
            error.number ?? error.originalError?.info?.number;

        // Xu ly loi trung so khoi
        if (errorNumber === 2627 || errorNumber === 2601) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "CONFLICT",
                    message: "Khoi nay da ton tai"
                }
            });
        }

        // Xu ly loi may chu
        console.error("Loi them khoi:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Loi may chu"
            }
        });
    }
}

/*
 * Cap nhat so khoi theo ID.
 * Khong cho doi so khoi neu da co lop hoc su dung.
 */
async function updateGrade(req, res) {
    // Lay ID khoi tu duong dan API
    const id = Number(req.params.id);

    // Kiem tra ID hop le
    if (!Number.isInteger(id) || id <= 0 || id > 32767) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "ID khoi khong hop le"
            }
        });
    }

    // Lay du lieu cap nhat tu request
    const data = req.body;

    // Kiem tra body phai la mot object hop le
    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Du lieu cap nhat khong hop le"
            }
        });
    }

    // Chi cho phep cap nhat gradeNumber
    const fields = Object.keys(data);

    if (
        fields.length !== 1 ||
        fields[0] !== "gradeNumber"
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Chi duoc cap nhat truong gradeNumber"
            }
        });
    }

    const gradeNumber = data.gradeNumber;

    // Chi chap nhan so khoi 10, 11, 12
    if (
        !Number.isInteger(gradeNumber) ||
        ![10, 11, 12].includes(gradeNumber)
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "So khoi phai la 10, 11 hoac 12"
            }
        });
    }

    try {
        // Tim thong tin khoi hien tai
        const current = await gradeRepository.getGradeById(id);

        // Khong tim thay khoi
        if (!current) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Khong tim thay khoi"
                }
            });
        }

        // So khoi khong thay doi thi khong can ghi lai
        if (current.gradeNumber === gradeNumber) {
            return res.status(200).json({
                success: true,
                data: current
            });
        }

        // Goi Repository de cap nhat so khoi
        const updated = await gradeRepository.updateGrade(
            id,
            gradeNumber
        );

        // Khong cap nhat duoc do rang buoc du lieu
        if (!updated) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "CONFLICT",
                    message: "Khong the doi so khoi dang duoc su dung"
                }
            });
        }

        // Cap nhat thanh cong
        return res.status(200).json({
            success: true,
            data: updated
        });

    } catch (error) {
        // Lay ma loi SQL Server
        const errorNumber =
            error.number ?? error.originalError?.info?.number;

        // Xu ly loi trung so khoi
        if (errorNumber === 2627 || errorNumber === 2601) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "CONFLICT",
                    message: "So khoi moi da ton tai"
                }
            });
        }

        // Xu ly loi may chu
        console.error("Loi cap nhat khoi:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Loi may chu"
            }
        });
    }
}

// Xuat cac ham de Routes su dung
module.exports = {
    getAllGrades,
    getGradeById,
    createGrade,
    updateGrade
};
