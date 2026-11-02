
const academicYearRepository = require(
    "../repositories/academic-year.repository"
);

// Lay danh sach tat ca nien khoa
async function getAllAcademicYears(req, res) {
    try {
        const academicYears =
            await academicYearRepository.getAllAcademicYears();

        return res.status(200).json({
            success: true,
            data: academicYears
        });

    } catch (error) {
        console.error("Loi lay danh sach nien khoa:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Loi may chu"
            }
        });
    }
}

// Lay thong tin mot nien khoa theo ID
async function getAcademicYearById(req, res) {
    const id = Number(req.params.id);

    // Kiem tra ID hop le
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "ID nien khoa khong hop le"
            }
        });
    }

    try {
        const academicYear =
            await academicYearRepository.getAcademicYearById(id);

        // Khong tim thay nien khoa
        if (!academicYear) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Khong tim thay nien khoa"
                }
            });
        }

        return res.status(200).json({
            success: true,
            data: academicYear
        });

    } catch (error) {
        console.error("Loi tim nien khoa:", error);

        return res.status(500).json({
            success: false,
            error: {
                code: "INTERNAL_ERROR",
                message: "Loi may chu"
            }
        });
    }
}

// Tao nien khoa moi
async function createAcademicYear(req, res) {
    const {
        code,
        startYear,
        endYear,
        status = "PLANNED"
    } = req.body || {};

    // Kiem tra nam bat dau va nam ket thuc
    if (
        !Number.isInteger(startYear) ||
        startYear < 1000 ||
        startYear > 9998 ||
        endYear !== startYear + 1
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Nam hoc khong hop le"
            }
        });
    }

    // Kiem tra ma nien khoa
    const expectedCode = `${startYear}-${endYear}`;

    if (typeof code !== "string" || code !== expectedCode) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Ma nien khoa khong hop le"
            }
        });
    }

    // Kiem tra trang thai
    const validStatuses = [
        "PLANNED",
        "ACTIVE",
        "CLOSED"
    ];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Trang thai nien khoa khong hop le"
            }
        });
    }

    try {
        // Goi Repository de them nien khoa
        const academicYear =
            await academicYearRepository.createAcademicYear({
                code,
                startYear,
                endYear,
                status
            });

        // Theo UC02, he thong chi duoc co toi da 2 nien khoa.
        // Repository tra ve null khi da du 2 nien khoa.
        if (!academicYear) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "CONFLICT",
                    message: "He thong chi cho phep toi da 2 nien khoa"
                }
            });
        }

        // Them nien khoa thanh cong
        return res.status(201).json({
            success: true,
            data: academicYear
        });

    } catch (error) {
        // Xu ly loi trung du lieu UNIQUE
        const errorNumber =
            error.number ?? error.originalError?.info?.number;

        if (errorNumber === 2627 || errorNumber === 2601) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "CONFLICT",
                    message: "Ma nien khoa da ton tai"
                }
            });
        }

        console.error("Loi tao nien khoa:", error);

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
 * Cap nhat mot phan thong tin nien khoa.
 * Chi thay doi cac truong duoc gui len.
 */
async function updateAcademicYear(req, res) {
    const id = Number(req.params.id);

    // Kiem tra ID nien khoa
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "ID nien khoa khong hop le"
            }
        });
    }

    // Lay du lieu can cap nhat
    const data = req.body;

    // Kiem tra du lieu dau vao
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

    // Chi chap nhan cac truong cho phep
    const allowedFields = [
        "code",
        "startYear",
        "endYear",
        "status"
    ];

    const fields = Object.keys(data);

    // Khong chap nhan du lieu rong hoac truong la
    if (
        fields.length === 0 ||
        fields.some(field => !allowedFields.includes(field))
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Truong cap nhat khong hop le"
            }
        });
    }

    try {
        // Lay thong tin nien khoa hien tai
        const current =
            await academicYearRepository.getAcademicYearById(id);

        // Khong tim thay nien khoa
        if (!current) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Khong tim thay nien khoa"
                }
            });
        }

        // Ghep du lieu cu va du lieu moi
        const updated = {
            code: current.code,
            startYear: current.startYear,
            endYear: current.endYear,
            status: current.status,
            ...data
        };

        // Kiem tra nam bat dau va nam ket thuc
        if (
            !Number.isInteger(updated.startYear) ||
            updated.startYear < 1000 ||
            updated.startYear > 9998 ||
            updated.endYear !== updated.startYear + 1
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Nam hoc khong hop le"
                }
            });
        }

        // Kiem tra ma nien khoa
        const expectedCode =
            `${updated.startYear}-${updated.endYear}`;

        if (updated.code !== expectedCode) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Ma nien khoa khong hop le"
                }
            });
        }

        // Kiem tra trang thai
        const validStatuses = [
            "PLANNED",
            "ACTIVE",
            "CLOSED"
        ];

        if (!validStatuses.includes(updated.status)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Trang thai nien khoa khong hop le"
                }
            });
        }

        // Cap nhat thong tin vao co so du lieu
        const result =
            await academicYearRepository.updateAcademicYear(
                id,
                updated
            );

        // Truong hop ban ghi khong con ton tai
        if (!result) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Khong tim thay nien khoa"
                }
            });
        }

        // Tra ve du lieu sau khi cap nhat
        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        // Xu ly loi trung ma UNIQUE
        const errorNumber =
            error.number ?? error.originalError?.info?.number;

        if (errorNumber === 2627 || errorNumber === 2601) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "CONFLICT",
                    message: "Ma nien khoa da ton tai"
                }
            });
        }

        console.error("Loi cap nhat nien khoa:", error);

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
    getAllAcademicYears,
    getAcademicYearById,
    createAcademicYear,
    updateAcademicYear
};
