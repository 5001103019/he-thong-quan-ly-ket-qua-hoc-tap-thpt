
"use strict";

const {
    transferStudentWithTransaction
} = require("../services/enrollment-transaction");

const studentRepository = require(
    "../repositories/student.repository"
);

const studentEnrollmentService = require(
    "../services/student-enrollment-service"
);

// Tra loi loi theo quy uoc API cua nhom
function sendError(res, status, code, message) {
    return res.status(status).json({
        success: false,
        error: { code, message }
    });
}

// Kiem tra ID nguyen duong, an toan voi JavaScript
function parseId(value) {
    if (
        typeof value !== "string" ||
        !/^[1-9][0-9]*$/.test(value)
    ) {
        return null;
    }

    const id = Number(value);

    return Number.isSafeInteger(id) ? id : null;
}

// Kiem tra chuoi loc khong bat buoc
function parseOptionalText(value, maxLength) {
    if (value === undefined) {
        return null;
    }

    if (typeof value !== "string") {
        return undefined;
    }

    const text = value.trim();

    if (text.length === 0 || text.length > maxLength) {
        return undefined;
    }

    return text;
}

// GET /api/v1/students
async function getAllStudents(req, res) {
    const allowedFields = [
        "studentCode",
        "fullName",
        "status",
        "academicYearId",
        "classId"
    ];

    if (
        Object.keys(req.query).some(
            key => !allowedFields.includes(key)
        )
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Dieu kien tim kiem khong hop le"
        );
    }

    const studentCode = parseOptionalText(
        req.query.studentCode, 30
    );

    const fullName = parseOptionalText(
        req.query.fullName, 150
    );

    const status = parseOptionalText(
        req.query.status, 20
    );

    if (
        studentCode === undefined ||
        fullName === undefined ||
        status === undefined
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Thong tin tim kiem khong hop le"
        );
    }

    if (
        status !== null &&
        !["ACTIVE", "INACTIVE"].includes(status)
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Trang thai hoc sinh khong hop le"
        );
    }

    let academicYearId = null;
    let classId = null;

    if (req.query.academicYearId !== undefined) {
        academicYearId = parseId(
            req.query.academicYearId
        );

        if (academicYearId === null) {
            return sendError(
                res, 400, "VALIDATION_ERROR",
                "ID nien khoa khong hop le"
            );
        }
    }

    if (req.query.classId !== undefined) {
        classId = parseId(req.query.classId);

        if (classId === null) {
            return sendError(
                res, 400, "VALIDATION_ERROR",
                "ID lop hoc khong hop le"
            );
        }
    }

    try {
        const students =
            await studentRepository.getAllStudents({
                studentCode,
                fullName,
                status,
                academicYearId,
                classId
            });

        return res.status(200).json({
            success: true,
            data: students
        });

    } catch (error) {
        console.error("Loi tra cuu hoc sinh:", error);

        return sendError(
            res, 500, "INTERNAL_ERROR",
            "Loi may chu"
        );
    }
}

// GET /api/v1/students/:id
async function getStudentById(req, res) {
    const studentId = parseId(req.params.id);

    if (studentId === null) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "ID hoc sinh khong hop le"
        );
    }

    try {
        const student =
            await studentRepository.getStudentById(
                studentId
            );

        if (!student) {
            return sendError(
                res, 404, "NOT_FOUND",
                "Khong tim thay hoc sinh"
            );
        }

        return res.status(200).json({
            success: true,
            data: student
        });

    } catch (error) {
        console.error("Loi tim hoc sinh:", error);

        return sendError(
            res, 500, "INTERNAL_ERROR",
            "Loi may chu"
        );
    }
}

// GET /api/v1/students/:id/enrollments
async function getStudentEnrollmentHistory(req, res) {
    const studentId = parseId(req.params.id);

    if (studentId === null) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "ID hoc sinh khong hop le"
        );
    }

    try {
        const student =
            await studentRepository.getStudentById(
                studentId
            );

        if (!student) {
            return sendError(
                res, 404, "NOT_FOUND",
                "Khong tim thay hoc sinh"
            );
        }

        const history =
            await studentRepository
                .getStudentEnrollmentHistory(studentId);

        return res.status(200).json({
            success: true,
            data: history
        });

    } catch (error) {
        console.error("Loi tra cuu phan lop:", error);

        return sendError(
            res, 500, "INTERNAL_ERROR",
            "Loi may chu"
        );
    }
}

/*
 * Kiem tra ngay sinh theo dinh dang YYYY-MM-DD.
 * Ngay sinh phai ton tai va khong o tuong lai.
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
 * POST /api/v1/students
 * Tao ho so hoc sinh moi.
 * Khong tu dong tao tai khoan hoac phan lop.
 */
async function createStudent(req, res) {
    const data = req.body;

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Du lieu hoc sinh khong hop le"
        );
    }

    const allowedFields = [
        "studentCode",
        "fullName",
        "dateOfBirth",
        "status"
    ];

    if (
        Object.keys(data).some(
            field => !allowedFields.includes(field)
        )
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Truong du lieu khong duoc phep"
        );
    }

    // Kiem tra ma hoc sinh
    if (
        typeof data.studentCode !== "string" ||
        data.studentCode.trim().length === 0 ||
        data.studentCode.trim().length > 30
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Ma hoc sinh khong hop le"
        );
    }

    // Kiem tra ho ten
    if (
        typeof data.fullName !== "string" ||
        data.fullName.trim().length === 0 ||
        data.fullName.trim().length > 150
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Ho ten hoc sinh khong hop le"
        );
    }

    // Kiem tra ngay sinh
    if (!validDateOfBirth(data.dateOfBirth)) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Ngay sinh khong hop le"
        );
    }

    // Trang thai mac dinh ACTIVE
    const status =
        data.status === undefined
            ? "ACTIVE"
            : data.status;

    if (!["ACTIVE", "INACTIVE"].includes(status)) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Trang thai hoc sinh khong hop le"
        );
    }

    const studentData = {
        studentCode: data.studentCode.trim(),
        fullName: data.fullName.trim(),
        dateOfBirth: data.dateOfBirth,
        status
    };

    try {
        const student =
            await studentRepository.createStudent(
                studentData
            );

        return res.status(201).json({
            success: true,
            data: student
        });

    } catch (error) {
        // SQL Server: trung ma hoc sinh (UNIQUE)
        const errorNumber =
            error.number ??
            error.originalError?.info?.number;

        if (
            errorNumber === 2627 ||
            errorNumber === 2601
        ) {
            return sendError(
                res, 409, "CONFLICT",
                "Ma hoc sinh da ton tai"
            );
        }

        console.error("Loi tao hoc sinh:", error);

        return sendError(
            res, 500, "INTERNAL_ERROR",
            "Loi may chu"
        );
    }
}

/*
 * PATCH /api/v1/students/:id
 * Cap nhat thong tin ho so hoc sinh.
 *
 * Chi cho phep sua:
 * - studentCode
 * - fullName
 * - dateOfBirth
 *
 * Khong sua status, Enrollment hoac bang diem.
 */
async function updateStudentProfile(req, res) {
    const studentId = parseId(req.params.id);

    if (studentId === null) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "ID hoc sinh khong hop le"
        );
    }

    const data = req.body;

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Du lieu cap nhat khong hop le"
        );
    }

    const allowedFields = [
        "studentCode",
        "fullName",
        "dateOfBirth"
    ];

    const fields = Object.keys(data);

    if (
        fields.length === 0 ||
        fields.some(field => !allowedFields.includes(field))
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Truong cap nhat khong hop le"
        );
    }

    const updateData = {};

    // Kiem tra ma hoc sinh neu duoc cung cap
    if (fields.includes("studentCode")) {
        if (
            typeof data.studentCode !== "string" ||
            data.studentCode.trim().length === 0 ||
            data.studentCode.trim().length > 30
        ) {
            return sendError(
                res, 400, "VALIDATION_ERROR",
                "Ma hoc sinh khong hop le"
            );
        }

        updateData.studentCode = data.studentCode.trim();
    }

    // Kiem tra ho ten neu duoc cung cap
    if (fields.includes("fullName")) {
        if (
            typeof data.fullName !== "string" ||
            data.fullName.trim().length === 0 ||
            data.fullName.trim().length > 150
        ) {
            return sendError(
                res, 400, "VALIDATION_ERROR",
                "Ho ten hoc sinh khong hop le"
            );
        }

        updateData.fullName = data.fullName.trim();
    }

    // Kiem tra ngay sinh neu duoc cung cap
    if (fields.includes("dateOfBirth")) {
        if (!validDateOfBirth(data.dateOfBirth)) {
            return sendError(
                res, 400, "VALIDATION_ERROR",
                "Ngay sinh khong hop le"
            );
        }

        updateData.dateOfBirth = data.dateOfBirth;
    }

    try {
        const student =
            await studentRepository.updateStudentProfile(
                studentId,
                updateData
            );

        if (!student) {
            return sendError(
                res, 404, "NOT_FOUND",
                "Khong tim thay hoc sinh"
            );
        }

        return res.status(200).json({
            success: true,
            data: student
        });

    } catch (error) {
        // SQL Server: vi pham rang buoc UNIQUE
        const errorNumber =
            error.number ??
            error.originalError?.info?.number;

        if (
            errorNumber === 2627 ||
            errorNumber === 2601
        ) {
            return sendError(
                res, 409, "CONFLICT",
                "Ma hoc sinh da ton tai"
            );
        }

        console.error("Loi cap nhat hoc sinh:", error);

        return sendError(
            res, 500, "INTERNAL_ERROR",
            "Loi may chu"
        );
    }
}

/*
 * POST /api/v1/students/:id/enrollments
 * Phan hoc sinh vao lop theo nien khoa.
 * Khong ghi de lich su phan lop cu.
 */
async function assignStudentToClass(req, res) {
    const studentId = parseId(req.params.id);

    if (studentId === null) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "ID hoc sinh khong hop le"
        );
    }

    const data = req.body;

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Du lieu phan lop khong hop le"
        );
    }

    const allowedFields = [
        "academicYearId",
        "classId",
        "startDate"
    ];

    const fields = Object.keys(data);

    if (
        fields.length !== 3 ||
        fields.some(field => !allowedFields.includes(field))
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Thieu hoac sai truong du lieu phan lop"
        );
    }

    try {
        const enrollment =
            await studentEnrollmentService.assignStudentToClass({
                studentId,
                academicYearId: data.academicYearId,
                classId: data.classId,
                startDate: data.startDate
            });

        return res.status(201).json({
            success: true,
            data: enrollment
        });

    } catch (error) {
        // Loi nghiep vu tu Service
        if (
            error.status === 400 ||
            error.status === 404 ||
            error.status === 409
        ) {
            return sendError(
                res,
                error.status,
                error.code,
                error.message
            );
        }

        // Loi rang buoc SQL Server
        const errorNumber =
            error.number ??
            error.originalError?.info?.number;

        if (
            [2601, 2627, 51060, 547].includes(errorNumber)
        ) {
            return sendError(
                res, 409, "CONFLICT",
                "Phan lop vi pham rang buoc du lieu"
            );
        }

        console.error("Loi phan lop hoc sinh:", error);

        return sendError(
            res, 500, "INTERNAL_ERROR",
            "Loi may chu"
        );
    }
}

/*
 * POST /api/v1/students/:id/transfers
 * Chuyen hoc sinh sang lop moi.
 *
 * Giu nguyen lich su lop cu va diem da phat sinh.
 * Su dung transaction da co.
 */
async function transferStudentToClass(req, res) {
    const studentId = parseId(req.params.id);

    if (studentId === null) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "ID hoc sinh khong hop le"
        );
    }

    const data = req.body;

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data)
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Du lieu chuyen lop khong hop le"
        );
    }

    const allowedFields = [
        "academicYearId",
        "newClassId",
        "transferDate"
    ];

    const fields = Object.keys(data);

    if (
        fields.length !== 3 ||
        fields.some(field => !allowedFields.includes(field))
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Thieu hoac sai truong du lieu chuyen lop"
        );
    }

    if (!req.auth?.userId) {
        return sendError(
            res, 401, "UNAUTHORIZED",
            "Khong xac dinh duoc nguoi thuc hien"
        );
    }

    // Kiem tra dinh dang ngay chuyen lop
    if (
        typeof data.transferDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(data.transferDate) ||
        data.transferDate.startsWith("0000-") ||
        Number.isNaN(
            new Date(
                data.transferDate + "T00:00:00Z"
            ).getTime()
        ) ||
        new Date(data.transferDate + "T00:00:00Z")
            .toISOString().slice(0, 10) !==
            data.transferDate
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Ngay chuyen lop khong hop le"
        );
    }

    try {
        // Chuan hoa ID de tuong thich voi transaction
        const transferIds = {
            studentId: Number(studentId),
            academicYearId: Number(data.academicYearId),
            newClassId: Number(data.newClassId),
            performedBy: Number(req.auth.userId)
        };

        const ids = Object.values(transferIds);

        if (
            !ids.every(
                id => Number.isSafeInteger(id) && id > 0
            )
        ) {
            return sendError(
                res, 400, "VALIDATION_ERROR",
                "Ma dinh danh chuyen lop khong hop le"
            );
        }

        // Kiem tra hoc sinh ton tai
        const student =
            await studentRepository.getStudentById(
                studentId
            );

        if (!student) {
            return sendError(
                res, 404, "NOT_FOUND",
                "Khong tim thay hoc sinh"
            );
        }

        /*
         * Kiem tra trung lop dich.
         * Khong ghi du lieu neu hoc sinh dang o lop nay.
         */
        const enrollmentHistory =
            await studentRepository
                .getStudentEnrollmentHistory(studentId);

        if (!Array.isArray(enrollmentHistory)) {
            throw new Error(
                "Khong doc duoc lich su phan lop."
            );
        }

        const currentEnrollment = enrollmentHistory.find(
            enrollment =>
                String(enrollment.academicYearId) ===
                    String(transferIds.academicYearId) &&
                enrollment.endDate === null
        );

        if (
            currentEnrollment &&
            String(currentEnrollment.classId) ===
                String(transferIds.newClassId)
        ) {
            return sendError(
                res, 409, "CONFLICT",
                "Hoc sinh dang hoc tai lop dich, khong the chuyen trung"
            );
        }

        // Thuc hien chuyen lop bang transaction co san
        const result =
            await transferStudentWithTransaction({
                ...transferIds,
                transferDate: data.transferDate
            });

        return res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        // Ngay chuyen lop khong hop le
        if (
            error.message ===
            "Ngay chuyen lop phai sau ngay bat dau lop cu."
        ) {
            return sendError(
                res, 400, "VALIDATION_ERROR",
                error.message
            );
        }

        // Lop dich khong ton tai hoac khong phu hop
        if (
            error.message ===
            "Lop moi khong ton tai hoac khong hop le."
        ) {
            return sendError(
                res, 409, "CONFLICT",
                error.message
            );
        }

        // Hoc sinh khong co phan lop hien tai trong nien khoa
        if (
            error.message ===
            "Khong tim thay phan lop hien tai."
        ) {
            return sendError(
                res, 409, "CONFLICT",
                error.message
            );
        }

        // Loi nghiep vu co HTTP status
        if (
            [400, 403, 404, 409].includes(error.status)
        ) {
            return sendError(
                res,
                error.status,
                error.code || "CONFLICT",
                error.message
            );
        }

        // Loi rang buoc cua SQL Server
        const errorNumber =
            error.number ??
            error.originalError?.info?.number;

        if (
            [2601, 2627, 51060, 547].includes(errorNumber)
        ) {
            return sendError(
                res, 409, "CONFLICT",
                "Chuyen lop vi pham rang buoc du lieu"
            );
        }

        console.error(
            "Loi chuyen lop hoc sinh:",
            error
        );

        return sendError(
            res, 500, "INTERNAL_ERROR",
            "Loi may chu"
        );
    }
}

/*
 * PATCH /api/v1/students/:id/status
 * Cap nhat trang thai ho so hoc sinh.
 * Khong xoa Enrollment hoac diem.
 */
async function updateStudentStatus(req, res) {
    const studentId = parseId(req.params.id);

    if (studentId === null) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "ID hoc sinh khong hop le"
        );
    }

    const data = req.body;

    if (
        !data ||
        typeof data !== "object" ||
        Array.isArray(data) ||
        Object.keys(data).length !== 1 ||
        !Object.prototype.hasOwnProperty.call(
            data, "status"
        )
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Du lieu cap nhat trang thai khong hop le"
        );
    }

    if (
        data.status !== "ACTIVE" &&
        data.status !== "INACTIVE"
    ) {
        return sendError(
            res, 400, "VALIDATION_ERROR",
            "Trang thai phai la ACTIVE hoac INACTIVE"
        );
    }

    try {
        const student =
            await studentRepository.updateStudentStatus(
                studentId,
                data.status
            );

        if (!student) {
            return sendError(
                res, 404, "NOT_FOUND",
                "Khong tim thay hoc sinh"
            );
        }

        return res.status(200).json({
            success: true,
            data: student
        });

    } catch (error) {
        console.error(
            "Loi cap nhat trang thai hoc sinh:",
            error
        );

        return sendError(
            res, 500, "INTERNAL_ERROR",
            "Loi may chu"
        );
    }
}

// Xuat day du cac ham de Router su dung
module.exports = {
    getAllStudents,
    getStudentById,
    getStudentEnrollmentHistory,
    createStudent,
    updateStudentProfile,
    assignStudentToClass,
    transferStudentToClass,
    updateStudentStatus
};
