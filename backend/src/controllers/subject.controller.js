
const subjectRepository = require(
    "../repositories/subject.repository"
);

/*
 * Tra ve loi theo quy chuan API cua nhom.
 */
function sendError(res, status, code, message) {
    return res.status(status).json({
        success: false,
        error: {
            code,
            message
        }
    });
}

/*
 * Kiem tra cac truong duoc phep gui len.
 * isPatch = true: cho phep cap nhat mot phan.
 */
function validateSubjectPayload(data, isPatch = false) {
    // Body phai la object, khong phai mang
    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        return "Du lieu mon hoc khong hop le";
    }

    // Chi cho phep ba truong du lieu
    const allowedFields = ["code", "name", "status"];
    const fields = Object.keys(data);

    // Khong chap nhan body rong
    if (fields.length === 0) {
        return "Du lieu mon hoc khong duoc rong";
    }

    // Khong chap nhan truong khong duoc quy dinh
    if (
        fields.some(
            field => !allowedFields.includes(field)
        )
    ) {
        return "Truong du lieu khong hop le";
    }

    // Khi them moi, code va name la bat buoc
    if (
        !isPatch &&
        (data.code === undefined ||
         data.name === undefined)
    ) {
        return "Ma mon hoc va ten mon hoc la bat buoc";
    }

    return null;
}

/*
 * Chuan hoa va kiem tra du lieu mon hoc.
 * Ma mon duoc chuyen thanh chu in hoa.
 */
function prepareSubjectData(data) {
    // Chuan hoa ma mon hoc
    const code = typeof data.code === "string"
        ? data.code.trim().toUpperCase()
        : "";

    // Chuan hoa ten mon hoc
    const name = typeof data.name === "string"
        ? data.name.trim()
        : "";

    // Mac dinh ACTIVE khi tao mon moi
    const status = data.status === undefined
        ? "ACTIVE"
        : data.status;

    // Kiem tra ma mon hoc
    if (code.length === 0 || code.length > 20) {
        return {
            error: "Ma mon hoc khong hop le"
        };
    }

    // Kiem tra ten mon hoc
    if (name.length === 0 || name.length > 100) {
        return {
            error: "Ten mon hoc khong hop le"
        };
    }

    // Kiem tra trang thai
    if (!["ACTIVE", "INACTIVE"].includes(status)) {
        return {
            error: "Trang thai mon hoc khong hop le"
        };
    }

    // Tra ve du lieu da kiem tra
    return {
        value: {
            code,
            name,
            status
        }
    };
}

/*
 * Lay danh sach tat ca mon hoc.
 * Bao gom mon ACTIVE va INACTIVE.
 */
async function getAllSubjects(req, res) {
    try {
        // Goi Repository lay danh sach
        const subjects =
            await subjectRepository.getAllSubjects();

        return res.status(200).json({
            success: true,
            data: subjects
        });

    } catch (error) {
        // Xu ly loi may chu
        console.error("Loi lay danh sach mon hoc:", error);

        return sendError(
            res, 500, "INTERNAL_ERROR", "Loi may chu"
        );
    }
}

/*
 * Lay thong tin mot mon hoc theo ID.
 */
async function getSubjectById(req, res) {
    // Lay ID mon hoc tu URL
    const id = Number(req.params.id);

    // Kiem tra ID hop le
    if (!Number.isSafeInteger(id) || id <= 0) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "ID mon hoc khong hop le"
        );
    }

    try {
        // Tim mon hoc trong co so du lieu
        const subject =
            await subjectRepository.getSubjectById(id);

        // Khong tim thay mon hoc
        if (!subject) {
            return sendError(
                res, 404, "NOT_FOUND",
                "Khong tim thay mon hoc"
            );
        }

        // Tra ve mon hoc tim duoc
        return res.status(200).json({
            success: true,
            data: subject
        });

    } catch (error) {
        console.error("Loi tim mon hoc:", error);

        return sendError(
            res, 500, "INTERNAL_ERROR", "Loi may chu"
        );
    }
}

/*
 * Them mon hoc moi.
 * Kiem tra ma mon, ten va trang thai.
 */
async function createSubject(req, res) {
    // Kiem tra cac truong du lieu dau vao
    const validationError =
        validateSubjectPayload(req.body);

    if (validationError) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            validationError
        );
    }

    // Chuan hoa va kiem tra du lieu
    const prepared = prepareSubjectData(req.body);

    if (prepared.error) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            prepared.error
        );
    }

    try {
        // Them mon hoc vao SQL Server
        const subject =
            await subjectRepository.createSubject(
                prepared.value
            );

        // Them thanh cong
        return res.status(201).json({
            success: true,
            data: subject
        });

    } catch (error) {
        // Lay ma loi SQL Server
        const errorNumber =
            error.number ?? error.originalError?.info?.number;

        // Xu ly loi trung ma mon hoc
        if (errorNumber === 2627 || errorNumber === 2601) {
            return sendError(
                res, 409, "CONFLICT",
                "Ma mon hoc da ton tai"
            );
        }

        // Xu ly loi may chu
        console.error("Loi them mon hoc:", error);

        return sendError(
            res, 500, "INTERNAL_ERROR", "Loi may chu"
        );
    }
}

/*
 * Cap nhat mot phan thong tin mon hoc.
 * Khong xoa mon hoc hay du lieu diem lich su.
 */
async function updateSubject(req, res) {
    // Lay ID mon hoc tu URL
    const id = Number(req.params.id);

    // Kiem tra ID hop le
    if (!Number.isSafeInteger(id) || id <= 0) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "ID mon hoc khong hop le"
        );
    }

    // Kiem tra du lieu PATCH
    const validationError =
        validateSubjectPayload(req.body, true);

    if (validationError) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            validationError
        );
    }

    try {
        // Lay thong tin mon hoc hien tai
        const current =
            await subjectRepository.getSubjectById(id);

        if (!current) {
            return sendError(
                res, 404, "NOT_FOUND",
                "Khong tim thay mon hoc"
            );
        }

        // Giu du lieu cu neu khong duoc gui len
        const mergedData = {
            code: current.code,
            name: current.name,
            status: current.status,
            ...req.body
        };

        // Kiem tra du lieu sau khi ghep
        const prepared = prepareSubjectData(mergedData);

        if (prepared.error) {
            return sendError(
                res, 400, "VALIDATION_ERROR",
                prepared.error
            );
        }

        // Cap nhat mon hoc trong SQL Server
        const updated =
            await subjectRepository.updateSubject(
                id,
                prepared.value
            );

        // Mon hoc khong con ton tai
        if (!updated) {
            return sendError(
                res, 404, "NOT_FOUND",
                "Khong tim thay mon hoc"
            );
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

        // Xu ly loi trung ma mon hoc
        if (errorNumber === 2627 || errorNumber === 2601) {
            return sendError(
                res, 409, "CONFLICT",
                "Ma mon hoc da ton tai"
            );
        }

        // Xu ly loi may chu
        console.error("Loi cap nhat mon hoc:", error);

        return sendError(
            res, 500, "INTERNAL_ERROR", "Loi may chu"
        );
    }
}

// Xuat cac ham de Routes su dung
module.exports = {
    getAllSubjects,
    getSubjectById,
    createSubject,
    updateSubject
};
