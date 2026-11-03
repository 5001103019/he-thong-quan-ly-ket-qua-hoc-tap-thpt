
const classRepository = require("../repositories/class.repository");

const academicYearRepository = require(
    "../repositories/academic-year.repository"
);

const gradeRepository = require(
    "../repositories/grade.repository"
);

/*
 * Lay danh sach lop hoc.
 * Co the loc theo nien khoa va khoi.
 */
async function getAllClasses(req, res) {
    // Lay dieu kien loc tu URL
    const { academicYearId, gradeId } = req.query;

    // Chuyen ID sang so neu nguoi dung cung cap
    const yearId = academicYearId === undefined
        ? null
        : Number(academicYearId);

    const grade = gradeId === undefined
        ? null
        : Number(gradeId);

    // Kiem tra ID nien khoa neu co
    if (
        yearId !== null &&
        (!Number.isSafeInteger(yearId) || yearId <= 0)
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "ID nien khoa khong hop le"
            }
        });
    }

    // Kiem tra ID khoi neu co
    if (
        grade !== null &&
        (
            !Number.isInteger(grade) ||
            grade <= 0 ||
            grade > 32767
        )
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "ID khoi khong hop le"
            }
        });
    }

    try {
        // Goi Repository de lay danh sach lop
        const classes = await classRepository.getAllClasses(
            yearId,
            grade
        );

        // Tra ve danh sach lop
        return res.status(200).json({
            success: true,
            data: classes
        });

    } catch (error) {
        // Xu ly loi truy van co so du lieu
        console.error("Loi lay danh sach lop:", error);

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
 * Lay thong tin mot lop hoc theo ID.
 */
async function getClassById(req, res) {
    // Lay ID lop tu duong dan
    const id = Number(req.params.id);

    // Kiem tra ID lop hop le
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "ID lop hoc khong hop le"
            }
        });
    }

    try {
        // Goi Repository de tim lop
        const classData = await classRepository.getClassById(id);

        // Khong tim thay lop hoc
        if (!classData) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Khong tim thay lop hoc"
                }
            });
        }

        // Tra ve thong tin lop
        return res.status(200).json({
            success: true,
            data: classData
        });

    } catch (error) {
        // Xu ly loi khi tim lop hoc
        console.error("Loi tim lop hoc:", error);

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
 * Them lop hoc moi.
 * Kiem tra du lieu truoc khi luu vao SQL Server.
 */
async function createClass(req, res) {
    // Kiem tra du lieu gui len
    const data = req.body;

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Du lieu lop hoc khong hop le"
            }
        });
    }

    // Chi chap nhan cac truong duoc quy dinh
    const allowedFields = [
        "academicYearId",
        "gradeId",
        "code",
        "name",
        "status"
    ];

    const fields = Object.keys(data);

    if (
        fields.some(field => !allowedFields.includes(field))
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Truong du lieu khong hop le"
            }
        });
    }

    // Lay thong tin lop hoc can them
    const {
        academicYearId,
        gradeId,
        code,
        name,
        status = "ACTIVE"
    } = data;

    // Kiem tra ID nien khoa
    if (
        !Number.isSafeInteger(academicYearId) ||
        academicYearId <= 0
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "ID nien khoa khong hop le"
            }
        });
    }

    // Kiem tra ID khoi
    if (
        !Number.isInteger(gradeId) ||
        gradeId <= 0 ||
        gradeId > 32767
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "ID khoi khong hop le"
            }
        });
    }

    // Kiem tra ma lop
    if (
        typeof code !== "string" ||
        code.trim().length === 0 ||
        code.trim().length > 20 ||
        !/^[A-Za-z0-9_-]+$/.test(code.trim())
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Ma lop khong hop le"
            }
        });
    }

    // Kiem tra ten lop
    if (
        typeof name !== "string" ||
        name.trim().length === 0 ||
        name.trim().length > 100
    ) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Ten lop khong hop le"
            }
        });
    }

    // Kiem tra trang thai lop
    const validStatuses = ["ACTIVE", "INACTIVE"];

    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "Trang thai lop khong hop le"
            }
        });
    }

    try {
        // Kiem tra nien khoa co ton tai khong
        const academicYear =
            await academicYearRepository.getAcademicYearById(
                academicYearId
            );

        if (!academicYear) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Khong tim thay nien khoa"
                }
            });
        }

        // Kiem tra khoi co ton tai khong
        const grade = await gradeRepository.getGradeById(
            gradeId
        );

        if (!grade) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Khong tim thay khoi"
                }
            });
        }

        // Kiem tra ma lop phu hop voi so khoi
        // Vi du: khoi 10 thi ma lop bat dau bang 10
        const normalizedCode = code.trim();
        const gradePrefix = String(grade.gradeNumber);

        if (
            !normalizedCode.startsWith(gradePrefix) ||
            normalizedCode.length <= gradePrefix.length
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Ma lop khong phu hop voi khoi"
                }
            });
        }

        // Goi Repository de them lop hoc
        const newClass = await classRepository.createClass({
            academicYearId,
            gradeId,
            code: normalizedCode,
            name: name.trim(),
            status
        });

        // Them lop thanh cong
        return res.status(201).json({
            success: true,
            data: newClass
        });

    } catch (error) {
        // Lay ma loi SQL Server
        const errorNumber =
            error.number ?? error.originalError?.info?.number;

        // Xu ly loi trung ma lop
        if (errorNumber === 2627 || errorNumber === 2601) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "CONFLICT",
                    message: "Ma lop da ton tai trong nien khoa"
                }
            });
        }

        // Xu ly loi khoa ngoai
        if (errorNumber === 547) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Nien khoa hoac khoi khong hop le"
                }
            });
        }

        // Xu ly loi may chu
        console.error("Loi them lop hoc:", error);

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
 * Cap nhat mot phan thong tin lop hoc.
 * Bao ve lich su phan lop cua hoc sinh.
 */
async function updateClass(req, res) {
    // Lay ID lop tu duong dan API
    const id = Number(req.params.id);

    // Kiem tra ID lop
    if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: "ID lop hoc khong hop le"
            }
        });
    }

    // Lay du lieu cap nhat
    const data = req.body;

    // Kiem tra body phai la object
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

    // Chi cho phep cap nhat cac truong hop le
    const allowedFields = [
        "academicYearId",
        "gradeId",
        "code",
        "name",
        "status"
    ];

    const fields = Object.keys(data);

    // Khong nhan body rong hoac truong la
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
        // Lay thong tin lop hien tai
        const current = await classRepository.getClassById(id);

        // Khong tim thay lop
        if (!current) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Khong tim thay lop hoc"
                }
            });
        }

        // Giu du lieu cu neu khong duoc gui len
        const updated = {
            academicYearId: Number(current.academicYearId),
            gradeId: current.gradeId,
            code: current.code,
            name: current.name,
            status: current.status,
            ...data
        };

        // Kiem tra ID nien khoa
        if (
            !Number.isSafeInteger(updated.academicYearId) ||
            updated.academicYearId <= 0
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "ID nien khoa khong hop le"
                }
            });
        }

        // Kiem tra ID khoi
        if (
            !Number.isInteger(updated.gradeId) ||
            updated.gradeId <= 0 ||
            updated.gradeId > 32767
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "ID khoi khong hop le"
                }
            });
        }

        // Kiem tra ma lop
        if (
            typeof updated.code !== "string" ||
            updated.code.trim().length === 0 ||
            updated.code.trim().length > 20 ||
            !/^[A-Za-z0-9_-]+$/.test(updated.code.trim())
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Ma lop khong hop le"
                }
            });
        }

        // Kiem tra ten lop
        if (
            typeof updated.name !== "string" ||
            updated.name.trim().length === 0 ||
            updated.name.trim().length > 100
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Ten lop khong hop le"
                }
            });
        }

        // Kiem tra trang thai lop
        const validStatuses = ["ACTIVE", "INACTIVE"];

        if (!validStatuses.includes(updated.status)) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Trang thai lop khong hop le"
                }
            });
        }

        // Kiem tra nien khoa co ton tai
        const academicYear =
            await academicYearRepository.getAcademicYearById(
                updated.academicYearId
            );

        if (!academicYear) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Khong tim thay nien khoa"
                }
            });
        }

        // Kiem tra khoi co ton tai
        const grade = await gradeRepository.getGradeById(
            updated.gradeId
        );

        if (!grade) {
            return res.status(404).json({
                success: false,
                error: {
                    code: "NOT_FOUND",
                    message: "Khong tim thay khoi"
                }
            });
        }

        // Kiem tra ma lop phu hop voi khoi
        const normalizedCode = updated.code.trim();
        const gradePrefix = String(grade.gradeNumber);

        if (
            !normalizedCode.startsWith(gradePrefix) ||
            normalizedCode.length <= gradePrefix.length
        ) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Ma lop khong phu hop voi khoi"
                }
            });
        }

        // Chuan hoa du lieu truoc khi cap nhat
        updated.code = normalizedCode;
        updated.name = updated.name.trim();

        // Goi Repository cap nhat lop hoc
        const result = await classRepository.updateClass(
            id,
            updated
        );

        // Khong cap nhat duoc
        if (!result) {
            // Kiem tra lop con ton tai hay khong
            const stillExists =
                await classRepository.getClassById(id);

            if (!stillExists) {
                return res.status(404).json({
                    success: false,
                    error: {
                        code: "NOT_FOUND",
                        message: "Khong tim thay lop hoc"
                    }
                });
            }

            // Lop co the da co lich su phan lop
            return res.status(409).json({
                success: false,
                error: {
                    code: "CONFLICT",
                    message: "Khong the doi nien khoa hoac khoi cua lop dang co du lieu phan lop"
                }
            });
        }

        // Cap nhat thanh cong
        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        // Lay ma loi tu SQL Server
        const errorNumber =
            error.number ?? error.originalError?.info?.number;

        // Loi trung ma lop trong nien khoa
        if (errorNumber === 2627 || errorNumber === 2601) {
            return res.status(409).json({
                success: false,
                error: {
                    code: "CONFLICT",
                    message: "Ma lop da ton tai trong nien khoa"
                }
            });
        }

        // Loi rang buoc khoa ngoai
        if (errorNumber === 547) {
            return res.status(400).json({
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "Nien khoa hoac khoi khong hop le"
                }
            });
        }

        // Loi may chu
        console.error("Loi cap nhat lop hoc:", error);

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
    getAllClasses,
    getClassById,
    createClass,
    updateClass
};
