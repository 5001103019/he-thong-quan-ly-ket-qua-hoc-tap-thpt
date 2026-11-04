
const assert = require("node:assert/strict");

// Du lieu mon hoc gia lap
const mockSubject = {
    subjectId: 1,
    code: "TOAN",
    name: "Toán",
    status: "ACTIVE"
};

// Gia lap cac ham Repository
const mockRepository = {
    getAllSubjects: async () => [mockSubject],

    getSubjectById: async (id) => {
        return id === 1 ? mockSubject : null;
    },

    createSubject: async (data) => {
        return { subjectId: 2, ...data };
    },

    updateSubject: async (id, data) => {
        return { subjectId: id, ...data };
    }
};

// Thay Repository that bang Repository gia lap
// Chi ap dung trong chuong trinh kiem thu nay
const repositoryPath = require.resolve(
    "../src/repositories/subject.repository"
);

require.cache[repositoryPath] = {
    id: repositoryPath,
    filename: repositoryPath,
    loaded: true,
    exports: mockRepository
};

// Su dung Controller that da lap trinh
const controller = require(
    "../src/controllers/subject.controller"
);

// Gia lap doi tuong Response cua Express
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

// Chay cac truong hop kiem thu
async function main() {
    let res;

    // Test 1: Lay danh sach mon hoc
    res = createResponse();
    await controller.getAllSubjects({}, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.length, 1);
    console.log("PASS 1: Lay danh sach mon hoc");

    // Test 2: Tim mon hoc khong ton tai
    res = createResponse();
    await controller.getSubjectById(
        { params: { id: "99" } }, res
    );
    assert.equal(res.statusCode, 404);
    console.log("PASS 2: Mon hoc khong ton tai");

    // Test 3: Them mon hoc hop le
    res = createResponse();
    await controller.createSubject({
        body: {
            code: "toan",
            name: "Toán"
        }
    }, res);
    assert.equal(res.statusCode, 201);
    assert.equal(res.body.data.code, "TOAN");
    console.log("PASS 3: Them mon hoc hop le");

    // Test 4: Them mon hoc thieu ma
    res = createResponse();
    await controller.createSubject({
        body: { name: "Toán" }
    }, res);
    assert.equal(res.statusCode, 400);
    console.log("PASS 4: Tu choi thieu ma mon hoc");

    // Test 5: Cap nhat trang thai mon hoc
    res = createResponse();
    await controller.updateSubject({
        params: { id: "1" },
        body: { status: "INACTIVE" }
    }, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.status, "INACTIVE");
    console.log("PASS 5: Cap nhat trang thai mon hoc");

    console.log("HOAN THANH: 5/5 TEST PASS");
}

main().catch((error) => {
    console.error("TEST FAILED:", error);
    process.exitCode = 1;
});
