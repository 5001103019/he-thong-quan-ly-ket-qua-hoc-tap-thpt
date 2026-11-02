
"use strict";

const assert = require("node:assert/strict");

/*
 * Du lieu gia lap.
 * Khong ket noi SQL Server that.
 */
const academicYear = {
    academicYearId: 1,
    code: "2026-2027",
    startYear: 2026,
    endYear: 2027,
    status: "PLANNED"
};

const grade = {
    gradeId: 1,
    gradeNumber: 10
};

const classData = {
    classId: 1,
    academicYearId: 1,
    gradeId: 1,
    code: "10A1",
    name: "Lop 10A1",
    status: "ACTIVE"
};

// Gia lap loi trung du lieu cua SQL Server
function duplicateError() {
    const error = new Error("Duplicate key");
    error.number = 2627;
    return error;
}

/*
 * Repository gia lap cho nien khoa.
 */
const academicYearRepository = {
    getAllAcademicYears: async () => [academicYear],

    getAcademicYearById: async (id) => {
        return id === 1 ? academicYear : null;
    },

    createAcademicYear: async (data) => {
        if (data.code === "2026-2027") {
            throw duplicateError();
        }

        return {
            academicYearId: 2,
            ...data
        };
    },

    updateAcademicYear: async (id, data) => {
        return id === 1
            ? { ...academicYear, ...data }
            : null;
    }
};

/*
 * Repository gia lap cho khoi.
 */
const gradeRepository = {
    getAllGrades: async () => [grade],

    getGradeById: async (id) => {
        if (id === 1) {
            return grade;
        }

        if (id === 2) {
            return {
                gradeId: 2,
                gradeNumber: 11
            };
        }

        return null;
    },

    createGrade: async (gradeNumber) => {
        if (gradeNumber === 10) {
            throw duplicateError();
        }

        return {
            gradeId: 3,
            gradeNumber
        };
    },

    updateGrade: async (id, gradeNumber) => {
        // Gia lap khoi da duoc lop hoc su dung
        if (id === 1 && gradeNumber !== 10) {
            return null;
        }

        return { gradeId: id, gradeNumber };
    }
};

/*
 * Repository gia lap cho lop hoc.
 */
const classRepository = {
    getAllClasses: async () => [classData],

    getClassById: async (id) => {
        return id === 1 ? classData : null;
    },

    createClass: async (data) => {
        if (data.code === "10A1") {
            throw duplicateError();
        }

        return {
            classId: 2,
            ...data
        };
    },

    updateClass: async (id, data) => {
        // Gia lap lop da co lich su phan lop
        if (
            data.academicYearId !== 1 ||
            data.gradeId !== 1
        ) {
            return null;
        }

        return {
            ...classData,
            ...data
        };
    }
};

/*
 * Thay Repository that bang Repository gia lap.
 * Chi co tac dung trong file kiem thu nay.
 */
function mockModule(path, mock) {
    const resolved = require.resolve(path);

    require.cache[resolved] = {
        id: resolved,
        filename: resolved,
        loaded: true,
        exports: mock
    };
}

mockModule(
    "../src/repositories/academic-year.repository",
    academicYearRepository
);

mockModule(
    "../src/repositories/grade.repository",
    gradeRepository
);

mockModule(
    "../src/repositories/class.repository",
    classRepository
);

/*
 * Nap cac Controller that can kiem thu.
 */
const academicYearController = require(
    "../src/controllers/academic-year.controller"
);

const gradeController = require(
    "../src/controllers/grade.controller"
);

const classController = require(
    "../src/controllers/class.controller"
);

/*
 * Gia lap Response cua Express.
 */
function createResponse() {
    return {
        statusCode: 200,
        body: null,

        status(code) {
            this.statusCode = code;
            return this;
        },

        json(data) {
            this.body = data;
            return this;
        }
    };
}

/*
 * Chay mot bai kiem thu.
 */
let passed = 0;

async function check(
    name,
    controller,
    request,
    expectedStatus,
    verify = () => {}
) {
    const res = createResponse();

    await controller(request, res);

    // Kiem tra ma HTTP
    assert.equal(
        res.statusCode,
        expectedStatus,
        name
    );

    // Kiem tra noi dung ket qua neu can
    verify(res.body);

    passed++;
    console.log(`PASS ${passed}: ${name}`);
}

/*
 * Thuc hien 18 bai kiem thu.
 */
async function main() {

    console.log("\n=== KIEM THU NIEN KHOA ===");

    // Test 1: Lay danh sach nien khoa
    await check(
        "Lay danh sach nien khoa",
        academicYearController.getAllAcademicYears,
        {},
        200,
        body => assert.equal(body.data.length, 1)
    );

    // Test 2: Nien khoa khong ton tai
    await check(
        "Nien khoa khong ton tai",
        academicYearController.getAcademicYearById,
        { params: { id: "99" } },
        404
    );

    // Test 3: Them nien khoa hop le
    await check(
        "Them nien khoa hop le",
        academicYearController.createAcademicYear,
        {
            body: {
                code: "2027-2028",
                startYear: 2027,
                endYear: 2028
            }
        },
        201,
        body => assert.equal(body.data.status, "PLANNED")
    );

    // Test 4: Nam hoc khong hop le
    await check(
        "Tu choi nam hoc sai",
        academicYearController.createAcademicYear,
        {
            body: {
                code: "2027-2029",
                startYear: 2027,
                endYear: 2029
            }
        },
        400
    );

    // Test 5: Trung ma nien khoa
    await check(
        "Tu choi ma nien khoa trung",
        academicYearController.createAcademicYear,
        {
            body: {
                code: "2026-2027",
                startYear: 2026,
                endYear: 2027
            }
        },
        409
    );

    // Test 6: Cap nhat trang thai nien khoa
    await check(
        "Cap nhat trang thai nien khoa",
        academicYearController.updateAcademicYear,
        {
            params: { id: "1" },
            body: { status: "ACTIVE" }
        },
        200,
        body => assert.equal(body.data.status, "ACTIVE")
    );

    console.log("\n=== KIEM THU KHOI ===");

    // Test 7: Lay danh sach khoi
    await check(
        "Lay danh sach khoi",
        gradeController.getAllGrades,
        {},
        200,
        body => assert.equal(body.data[0].gradeNumber, 10)
    );

    // Test 8: Khoi khong ton tai
    await check(
        "Khoi khong ton tai",
        gradeController.getGradeById,
        { params: { id: "99" } },
        404
    );

    // Test 9: Them khoi 11
    await check(
        "Them khoi hop le",
        gradeController.createGrade,
        { body: { gradeNumber: 11 } },
        201
    );

    // Test 10: Tu choi khoi 9
    await check(
        "Tu choi so khoi sai",
        gradeController.createGrade,
        { body: { gradeNumber: 9 } },
        400
    );

    // Test 11: Trung khoi 10
    await check(
        "Tu choi khoi trung",
        gradeController.createGrade,
        { body: { gradeNumber: 10 } },
        409
    );

    // Test 12: Khong duoc doi khoi dang su dung
    await check(
        "Bao ve khoi da co lop",
        gradeController.updateGrade,
        {
            params: { id: "1" },
            body: { gradeNumber: 11 }
        },
        409
    );

    console.log("\n=== KIEM THU LOP HOC ===");

    // Test 13: Lay danh sach lop
    await check(
        "Lay danh sach lop",
        classController.getAllClasses,
        { query: {} },
        200,
        body => assert.equal(body.data.length, 1)
    );

    // Test 14: Lop khong ton tai
    await check(
        "Lop khong ton tai",
        classController.getClassById,
        { params: { id: "99" } },
        404
    );

    // Test 15: Them lop 10A2
    await check(
        "Them lop hop le",
        classController.createClass,
        {
            body: {
                academicYearId: 1,
                gradeId: 1,
                code: "10A2",
                name: "Lop 10A2",
                status: "ACTIVE"
            }
        },
        201
    );

    // Test 16: Trung ma lop 10A1
    await check(
        "Tu choi ma lop trung",
        classController.createClass,
        {
            body: {
                academicYearId: 1,
                gradeId: 1,
                code: "10A1",
                name: "Lop 10A1",
                status: "ACTIVE"
            }
        },
        409
    );

    // Test 17: Cap nhat ten lop
    await check(
        "Cap nhat ten lop",
        classController.updateClass,
        {
            params: { id: "1" },
            body: { name: "Lop 10A1 moi" }
        },
        200,
        body => assert.equal(
            body.data.name,
            "Lop 10A1 moi"
        )
    );

    // Test 18: Khong cho doi khoi khi da phan lop
    await check(
        "Bao ve lich su phan lop",
        classController.updateClass,
        {
            params: { id: "1" },
            body: {
                gradeId: 2,
                code: "11A1"
            }
        },
        409
    );

    // Test 19: Tu choi tao nien khoa thu ba theo UC02
    // Gia lap Repository tra ve null khi da co du 2 nien khoa
    const originalCreateAcademicYear =
        academicYearRepository.createAcademicYear;

    try {
        academicYearRepository.createAcademicYear =
            async (data) => {
                // Kiem tra du lieu Controller truyen xuong
                assert.equal(data.code, "2028-2029");
                assert.equal(data.startYear, 2028);
                assert.equal(data.endYear, 2029);

                // Gia lap he thong da co du 2 nien khoa
                return null;
            };

        await check(
            "Tu choi tao nien khoa thu ba",
            academicYearController.createAcademicYear,
            {
                body: {
                    code: "2028-2029",
                    startYear: 2028,
                    endYear: 2029,
                    status: "PLANNED"
                }
            },
            409,
            body => {
                // Kiem tra ket qua tra ve
                assert.equal(body.success, false);
                assert.equal(body.error.code, "CONFLICT");
                assert.equal(
                    body.error.message,
                    "He thong chi cho phep toi da 2 nien khoa"
                );
            }
        );
    } finally {
        // Khoi phuc Repository gia lap ban dau
        academicYearRepository.createAcademicYear =
            originalCreateAcademicYear;
    }

    // Tong ket ket qua kiem thu
    console.log(
        `\nHOAN THANH: ${passed}/19 TEST PASS`
    );
}

// Neu co loi, bao TEST FAILED
main().catch(error => {
    console.error("TEST FAILED:", error);
    process.exitCode = 1;
});
