
# BAO CAO KIEM THU CHUC NANG DIEM VA TONG KET

## 1. Muc tieu

Thuc hien 5 test case TC16-TC20 theo bang phan cong
cong viec cua do an Quan ly ket qua hoc tap THPT.

Pham vi:
- Kiem thu diem bien 0 va 10.
- Kiem thu diem ngoai mien va sai dinh dang.
- Kiem thu o diem trong khong tinh tong ket.
- Doi chieu cong thuc tinh diem bang tay.
- Kiem thu Import CSV khong ghi de cot da khoa.

Moi truong:
- Backend Node.js va Express.
- Microsoft SQL Server.
- Visual Studio 2022, Developer PowerShell va SSMS.

## 2. Tong hop ket qua

| Ma TC | Noi dung | Ket qua |
|---|---|---|
| TC16 | Diem bien 0 va 10 | PASS |
| TC17 | Diem ngoai mien, sai dinh dang | PASS |
| TC18 | O trong khong tinh tong ket | PASS |
| TC19 | Doi chieu cong thuc tinh tay | PASS (Unit Test) |
| TC20 | Import ghi de cot LOCKED bi tu choi | PASS |

## 3. Chi tiet kiem thu

### TC16 - Kiem thu diem bien 0 va 10

Muc tieu:
Xac nhan he thong chap nhan diem 0 va 10,
phan biet diem 0 voi NULL.

API:
PATCH /api/v1/score-records/1/components/QT1

Du lieu va ket qua:
- Nhap diem 0: Thanh cong.
- Version: 11 -> 12.
- AuditLog ID: 29.
- Doc lai diem 0 voi trang thai SCORED: Thanh cong.
- Nhap diem 10: Thanh cong.
- Version: 12 -> 13.
- AuditLog ID: 30.

Doi chieu SQL Server:
- AuditLog 29: SCORE_EDIT, 8.00 -> 0.00, SUCCESS.
- AuditLog 30: SCORE_EDIT, 0.00 -> 10.00, SUCCESS.

File doi chieu:
- backend/src/services/scoreValidation.js
- backend/src/services/scoreEntryService.js
- backend/tests/scoreValidation.test.js

Ket luan: PASS.

### TC17 - Kiem thu diem ngoai mien va sai dinh dang

Muc tieu:
Xac nhan he thong tu choi diem khong hop le,
khong thay doi du lieu da luu.

Du lieu kiem thu:
- Diem -1.
- Diem 11.
- Chuoi "abc".
- Chuoi "8,5".
- Gia tri true.

Ket qua:
- Ca 5 truong hop deu bi tu choi voi HTTP 400.
- Diem QT1 giu nguyen 10.
- Version giu nguyen 13.
- Khong ghi de diem da luu.

File doi chieu:
- backend/src/services/scoreValidation.js
- backend/src/services/scoreEntryService.js
- backend/tests/scoreValidation.test.js

Ket luan: PASS.

### TC18 - O trong khong tinh tong ket

Muc tieu:
Xac nhan he thong khong tinh diem tong ket
neu chua du cac thanh phan diem hop le.

API:
GET /api/v1/score-records/1/summary

Dieu kien:
- Co cong thuc APPROVED trong moi truong kiem thu.
- QT2 = 0, trang thai SCORED.
- QT3 va GK chua co diem hop le.

Ket qua API:
- calculationStatus = INCOMPLETE.
- finalScore = null.
- missingComponents = ["QT3", "GK"].
- Diem 0 cua QT2 van duoc xem la hop le.

Kiem thu bo sung truong hop NOT_ENTERED:
- QT3 = null.
- scoreStatus = NOT_ENTERED.
- calculationStatus = INCOMPLETE.
- finalScore = null.
- missingComponents = ["QT3"].

File doi chieu:
- backend/src/services/scoreSummaryService.js
- backend/tests/cv6-score-summary.test.js

Ket luan: PASS.

### TC19 - Doi chieu cong thuc tinh tay

Muc tieu:
Xac nhan ket qua tinh tong ket khop voi
phep tinh thu cong.

Du lieu:
- QT1 = 8.
- QT2 = 7.
- QT3 = 9.
- GK = 7.5.
- CK = 8.25.

Cong thuc:
DTK = (QT1 + QT2 + QT3 + 2*GK + 3*CK) / 8

Tinh tay:
DTK = (8 + 7 + 9 + 2*7.5 + 3*8.25) / 8
DTK = 63.75 / 8
DTK = 7.96875

Lam tron 2 chu so thap phan:
DTK = 7.97

Ket qua Unit Test:
- calculationStatus = CALCULATED.
- weightedSum = 63.75.
- finalScore = 7.97.
- missingComponents = [].

File doi chieu:
- backend/src/services/scoreSummaryService.js
- backend/tests/cv6-score-summary.test.js

Ket luan: PASS (Unit Test).

Ghi chu:
Da doi chieu ham tinh diem voi ket qua tinh tay.
Chua thuc hien truong hop API voi ban ghi SQL Server
co day du 5 thanh phan diem.

### TC20 - Import ghi de cot da khoa bi tu choi

Muc tieu:
Xac nhan Import CSV khong duoc ghi de
du lieu tai cot diem dang LOCKED.

Du lieu kiem thu:
- scoreRecordId = 38.
- Cot diem = QT1.
- Trang thai = LOCKED.
- Diem hien tai = 8.
- Diem muon Import = 10.
- Version ban dau = 4.

Ket qua Preview:
- Phat hien loi SCORE_LOCKED.
- eligibleRows = 0.
- readyToImport = false.

Ket qua Confirm:
- importedRows = 0.
- skippedRows = 1.
- changedComponents = 0.
- Dong CSV bi tu choi do cot diem da khoa.

Kiem tra sau Confirm:
- QT1 van bang 8.
- Version van bang 4.
- lockStatus van la LOCKED.

Doi chieu SQL Server:
Khong tim thay ban ghi SCORE_IMPORT cho
scoreRecordId = 38 va component = QT1.

File doi chieu:
- backend/src/services/scoreCsvImportService.js
- backend/src/services/scoreCsvImportConfirmService.js
- backend/tests/check-score-csv-locked.js

Ghi chu:
File check-score-csv-locked.js su dung Repository mock.
Ket qua API va SQL Server duoc kiem thu rieng.

Ket luan: PASS.

## 4. Minh chung kiem thu tu dong

| File test | Ket qua |
|---|---|
| scoreValidation.test.js | 21/21 PASS |
| cv6-score-summary.test.js | 2/2 PASS |
| check-score-csv-locked.js | 7/7 PASS |
| Tong cong | 30/30 PASS |

Lenh chay tai thu muc backend:

    node .\tests\scoreValidation.test.js

    node --test .\tests\cv6-score-summary.test.js

    node .\tests\check-score-csv-locked.js

Luu y:
Cac ma TC noi bo trong file test khong phai
ma TC16-TC20 cua bang phan cong.

## 5. Ket luan

Da thuc hien du 5 test case TC16-TC20.

Ket qua:
- TC16: PASS.
- TC17: PASS.
- TC18: PASS.
- TC19: PASS (Unit Test).
- TC20: PASS.

Ket qua kiem thu tu dong bo sung: 30/30 PASS.

Da co minh chung tu:
- Ket qua API trong Developer PowerShell.
- Du lieu va AuditLog trong SQL Server.
- Cac file kiem thu trong thu muc backend/tests.

Du lieu cong thuc CV6_TEST_ONLY da duoc don
sau khi hoan thanh kiem thu.

Phan nghiep vu SCORE_EDIT va Import CSV thuoc
PR #24 va PR #25, khong gop vao pham vi CV6.
