
cd "E:\SPTINHOC\CNPM_CV7"

@'
# BAO CAO KIEM THU E2E NHAP DIEM VA KHOA DIEM

## 1. Muc tieu

Kiem thu quy trinh nhap diem, khoa diem, tu choi sua diem da khoa, mo khoa hop le, chinh sua diem, khoa lai, ghi AuditLog va tinh diem tong ket.

Kiem thu tren backend Node.js, Microsoft SQL Server va cac API thuc te cua du an.

## 2. Moi truong kiem thu

- Nhanh: feature/Chau-07-score-e2e
- Backend: http://localhost:3001
- Database: thpt_grade_management
- Vai tro thuc hien: KHAO_THI
- AcademicYear ID: 1
- Class ID: 10
- Subject ID: 4
- Student Code: CV7_E2E_ST_001
- Enrollment ID: 16
- ScoreRecord ID: 40

Du lieu kiem thu duoc tao rieng cho CV7.

## 3. Du lieu diem

| Thanh phan | Diem ban dau | Diem sau chinh sua |
|---|---:|---:|
| QT1 | 8 | 9 |
| QT2 | 7 | 7 |
| QT3 | 9 | 9 |
| GK | 7.5 | 7.5 |
| CK | 8.25 | 8.25 |

Quy tac:
- QT1, QT2, QT3 co he so 1.
- GK co he so 2.
- CK co he so 3.
- Tong he so la 8.
- Ket qua lam tron 2 chu so thap phan.

## 4. Ket qua kiem thu E2E

| Noi dung | Ket qua thuc te | Danh gia |
|---|---|---|
| Dang nhap vai tro KHAO_THI | API tra success = true | PASS |
| Nhap du 5 thanh phan diem | ScoreRecord version 1 -> 6 | PASS |
| Doi chieu SQL Server | 5 thanh phan SCORED, dung gia tri | PASS |
| LOCK QT1 | UNLOCKED -> LOCKED, lock version 1 -> 2 | PASS |
| Thu sua QT1 khi LOCKED | HTTP 409, SCORE_LOCKED | PASS |
| Kiem tra du lieu sau khi bi tu choi | QT1 = 8, score version = 6 | PASS |
| UNLOCK co ly do | UNLOCKED, lock version = 3 | PASS |
| Sua QT1 sau UNLOCK | 8 -> 9, score version 6 -> 7 | PASS |
| Lien ket AuditLog | SCORE_EDIT #38 lien ket UNLOCK #37 | PASS |
| RELOCK thu cong | LOCKED, lock version = 4 | PASS |
| Kiem tra diem sau RELOCK | QT1 = 9, score version = 7 | PASS |
| Chua co cong thuc APPROVED | FORMULA_NOT_APPROVED, finalScore = NULL | PASS |
| Co cong thuc APPROVED | CALCULATED, finalScore = 8.09 | PASS |
| Don cong thuc thu nghiem | Da xoa formula_policy_id = 5 | PASS |

## 5. Minh chung AuditLog

| AuditLog ID | Hanh dong | Noi dung | Ket qua |
|---|---|---|---|
| 31 | SCORE_EDIT | Nhap QT1 = 8 | SUCCESS |
| 32 | SCORE_EDIT | Nhap QT2 = 7 | SUCCESS |
| 33 | SCORE_EDIT | Nhap QT3 = 9 | SUCCESS |
| 34 | SCORE_EDIT | Nhap GK = 7.5 | SUCCESS |
| 35 | SCORE_EDIT | Nhap CK = 8.25 | SUCCESS |
| 36 | LOCK | Khoa cot QT1 | SUCCESS |
| 37 | UNLOCK | Mo khoa QT1 co ly do | SUCCESS |
| 38 | SCORE_EDIT | Sua QT1 tu 8 thanh 9 | SUCCESS |
| 39 | RELOCK | Khoa lai cot QT1 | SUCCESS |

Doi chieu tren SQL Server:
- AuditLog #38 co related_log_id = 37.
- Hanh dong duoc lien ket la UNLOCK.
- Ly do mo khoa va ly do chinh sua deu duoc ghi nhan.
- Cac ban ghi AuditLog tren deu co result = SUCCESS.

## 6. Minh chung khoa diem

API:
POST /api/v1/score-records/40/components/QT1

Khi cot QT1 dang LOCKED, yeu cau sua diem tu 8 thanh 9 tra ve:
- HTTP: 409
- Error code: SCORE_LOCKED
- ScoreRecord version: giu nguyen 6
- Gia tri QT1: giu nguyen 8

Sau khi UNLOCK hop le:
- API cho phep sua QT1 tu 8 thanh 9.
- ScoreRecord version tang len 7.
- AuditLog SCORE_EDIT lien ket dung UNLOCK.

Sau RELOCK:
- Trang thai cot QT1 la LOCKED.
- Lock version la 4.
- ScoreRecord version van la 7.
- Diem QT1 van la 9.

## 7. Kiem thu diem tong ket

Cong thuc:

DTK = (QT1 + QT2 + QT3 + 2 * GK + 3 * CK) / 8

Du lieu sau khi sua:

DTK = (9 + 7 + 9 + 2 * 7.5 + 3 * 8.25) / 8

Tong co trong so = 64.75.

DTK = 64.75 / 8 = 8.09375.

Lam tron 2 chu so thap phan: 8.09.

Ket qua API khi chua co cong thuc APPROVED:
- calculationStatus: FORMULA_NOT_APPROVED
- finalScore: NULL

Ket qua API khi co cong thuc APPROVED:
- calculationStatus: CALCULATED
- weightedSum: 64.75
- finalScore: 8.09
- missingComponents: rong
- ScoreRecord version: 7

Ket qua API khop voi phep tinh tay: PASS.

## 8. Xu ly du lieu kiem thu

Cong thuc thu nghiem:
- Formula Policy ID: 5
- Version: 1
- approval_status: APPROVED
- approved_by: CV7_TEST_ONLY

Sau khi doi chieu diem tong ket thanh cong, da xoa cong thuc thu nghiem ID 5.

Truy van kiem tra sau khi xoa tra ve 0 dong.

Khong sua ma nguon nghiep vu trong qua trinh kiem thu.

Du lieu diem va AuditLog cua hoc sinh kiem thu duoc giu lai lam minh chung.

## 9. Ket luan

Quy trinh E2E nhap diem, khoa diem, mo khoa, chinh sua diem, khoa lai va tinh diem tong ket da kiem thu thanh cong tren backend va SQL Server thuc te.

Cac ket qua quan trong:
- Khong cho sua cot diem dang LOCKED.
- Mo khoa yeu cau ly do hop le.
- Sua diem sau mo khoa duoc ghi AuditLog.
- SCORE_EDIT lien ket dung UNLOCK tuong ung.
- RELOCK khong lam thay doi diem.
- Khong tinh tong ket khi chua co cong thuc APPROVED.
- Tinh dung diem tong ket 8.09 khi co cong thuc APPROVED.

Ket qua: PASS.

Minh chung anh chup PowerShell va SSMS duoc luu rieng de doi chieu khi review Pull Request.
