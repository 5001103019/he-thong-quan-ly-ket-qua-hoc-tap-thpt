
"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
    calculateScoreSummary
} = require("../src/services/scoreSummaryService");

 // Gia lap cong thuc da duoc phe duyet.
 // Chi su dung trong Unit Test, khong sua database.
 const congThucDaDuyet = {
     approvalStatus: "APPROVED"
 };

// Tao ban ghi diem gia lap de kiem thu.
// Khong ket noi hay thay doi database.
function taoBanGhi(
    diem = {
        QT1: 8,
        QT2: 7,
        QT3: 9,
        GK: 8,
        CK: 9
    },
    trangThai = {}
) {
    const components = ["QT1", "QT2", "QT3", "GK", "CK"]
        .map(loai => ({
            componentType: loai,
            scoreValue: diem[loai] ?? null,
            scoreStatus: trangThai[loai] ??
                (diem[loai] == null
                    ? "NOT_ENTERED"
                    : "SCORED")
        }));

    return {
        scoreRecordId: 1,
        version: 1,
        components: components
    };
}

// 1. Kiem tra cong thuc va he so.
test("Tinh DTK dung cong thuc va lam tron", () => {
    const banGhi = taoBanGhi();

    const ketQua = calculateScoreSummary(banGhi, congThucDaDuyet);

    // (8 + 7 + 9 + 2*8 + 3*9) / 8
    // = 67 / 8 = 8.375 => 8.38
    assert.equal(ketQua.calculationStatus, "CALCULATED");
    assert.equal(ketQua.weightedSum, 67);
    assert.equal(ketQua.totalWeight, 8);
    assert.equal(ketQua.finalScore, 8.38);
    assert.deepEqual(ketQua.missingComponents, []);
});

// 2. Diem 0 la diem hop le.
test("Diem 0 van duoc tinh tong ket", () => {
    const banGhi = taoBanGhi({
        QT1: 0,
        QT2: 0,
        QT3: 0,
        GK: 0,
        CK: 0
    });

    const ketQua = calculateScoreSummary(banGhi, congThucDaDuyet);

    assert.equal(ketQua.calculationStatus, "CALCULATED");
    assert.equal(ketQua.finalScore, 0);
    assert.deepEqual(ketQua.missingComponents, []);
});

// 3. Thieu diem thi khong tinh DTK.
test("Thieu diem thi khong tinh tong ket", () => {
    const banGhi = taoBanGhi({
        QT1: 8,
        QT2: 7,
        QT3: null,
        GK: 8,
        CK: 9
    });

    const ketQua = calculateScoreSummary(banGhi, congThucDaDuyet);

    assert.equal(ketQua.calculationStatus, "INCOMPLETE");
    assert.equal(ketQua.finalScore, null);
    assert.deepEqual(
        ketQua.missingComponents,
        ["QT3"]
    );
});

// 4. Vang hoac mien khong duoc xem la diem so.
test("Vang va mien khong du dieu kien tinh", () => {
    const banGhi = taoBanGhi(
        {
            QT1: 8,
            QT2: 7,
            QT3: null,
            GK: null,
            CK: 9
        },
        {
            QT3: "ABSENT",
            GK: "EXEMPT"
        }
    );

    const ketQua = calculateScoreSummary(banGhi, congThucDaDuyet);

    assert.equal(ketQua.calculationStatus, "INCOMPLETE");
    assert.equal(ketQua.finalScore, null);
    assert.deepEqual(
        ketQua.missingComponents,
        ["QT3", "GK"]
    );
});

// 5. Sau khi sua diem, ket qua phai duoc tinh lai.
test("Tinh lai tong ket sau khi sua diem", () => {
    const banGhi = taoBanGhi({
        QT1: 8,
        QT2: 7,
        QT3: 9,
        GK: 8,
        CK: 7
    });

    const truocKhiSua = calculateScoreSummary(banGhi, congThucDaDuyet);

    // (8 + 7 + 9 + 16 + 21) / 8
    // = 61 / 8 = 7.625 => 7.63
    assert.equal(truocKhiSua.finalScore, 7.63);

    // Gia lap sua diem CK tu 7 thanh 9.
    const ck = banGhi.components.find(
        item => item.componentType === "CK"
    );

    ck.scoreValue = 9;
    banGhi.version = 2;

    const sauKhiSua = calculateScoreSummary(banGhi, congThucDaDuyet);

    assert.equal(sauKhiSua.finalScore, 8.38);
    assert.equal(sauKhiSua.version, 2);

    // Ban ghi cu khong bi thay doi ket qua da tra.
    assert.equal(truocKhiSua.finalScore, 7.63);
});

 // 6. Chua co cong thuc thi khong tinh tong ket.
 test("Khong tinh khi chua co cong thuc", () => {
     const banGhi = taoBanGhi();

     const ketQua = calculateScoreSummary(banGhi, null);

     assert.equal(
         ketQua.calculationStatus,
         "FORMULA_NOT_APPROVED"
     );
     assert.equal(ketQua.finalScore, null);
 });

 // 7. Cong thuc PENDING thi khong tinh tong ket.
 test("Khong tinh khi cong thuc dang cho duyet", () => {
     const banGhi = taoBanGhi();

     const congThuc = {
         approvalStatus: "PENDING"
     };

     const ketQua = calculateScoreSummary(
         banGhi,
         congThuc
     );

     assert.equal(
         ketQua.calculationStatus,
         "FORMULA_NOT_APPROVED"
     );
     assert.equal(ketQua.finalScore, null);
 });

 // 8. Cong thuc REJECTED thi khong tinh tong ket.
 test("Khong tinh khi cong thuc bi tu choi", () => {
     const banGhi = taoBanGhi();

     const congThuc = {
         approvalStatus: "REJECTED"
     };

     const ketQua = calculateScoreSummary(
         banGhi,
         congThuc
     );

     assert.equal(
         ketQua.calculationStatus,
         "FORMULA_NOT_APPROVED"
     );
     assert.equal(ketQua.finalScore, null);
 });
