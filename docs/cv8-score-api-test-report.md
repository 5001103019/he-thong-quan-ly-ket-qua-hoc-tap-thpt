# BAO CAO API DIEM, KIEM THU VA MINH CHUNG - CV8
**Du an:** He thong quan ly ket qua hoc tap hoc sinh THPT - Nhom 5
**Nguon:** `docs/srs.md`, `docs/score-api-contract.md`, CV6, `docs/cv7-score-e2e-evidence.md`.
**Trang thai:** Tong hop minh chung da co; khong thay doi code nghiep vu.

## 1. API diem

| Method | Endpoint | Chuc nang |
|---|---|---|
| GET | `/api/v1/scores` | Danh sach diem theo nien khoa/lop/mon |
| GET | `/api/v1/score-records/:id` | Chi tiet ScoreRecord |
| PATCH | `/api/v1/score-records/:id/components/:type` | Nhap va sua thanh phan diem |
| GET | `/api/v1/score-records/:id/summary` | Trang thai va ket qua DTK |

PATCH yeu cau ScoreRecord da ton tai; khong tu tao ScoreRecord. Endpoint LOCK, UNLOCK, RELOCK va Import CSV can doi chieu route/tai lieu rieng; khong tu dat duong dan.

## 2. Hop dong PATCH va validation

| Truong | Quy tac theo API Contract |
|---|---|
| `scoreValue` | Bat buoc co truong; gia tri diem hoac null |
| `scoreStatus` | Bat buoc; NOT_ENTERED/SCORED/ABSENT/EXEMPT |
| `expectedVersion` | Bat buoc; lay tu ScoreRecord moi nhat |
| `reason` | Bat buoc khi sua diem/trang thai da co va thuc su thay doi; toi da 1000 ky tu |

Diem 0 khi SCORED la diem hop le, khac null. QT1/QT2/QT3 nhan so nguyen tu 0 den 10; GK/CK theo buoc 0.25. Payload vi du: `{"scoreValue":0,"scoreStatus":"SCORED","expectedVersion":2}`.

| HTTP | Error code | Y nghia |
|---|---|---|
| 400 | `REASON_REQUIRED` | Thieu ly do khi bat buoc |
| 404 | `NOT_FOUND` | Khong co ScoreRecord |
| 409 | `VERSION_CONFLICT` | Version da thay doi |
| 409 | `SCORE_LOCKED` | Cot diem dang khoa |
| 409 | `LOCK_TIMEOUT` | Khong lay duoc khoa giao dich |
| 409 | `SCOPE_CHANGED` | Pham vi ban ghi thay doi |

Response PATCH co `oldValue`, `scoreValue`, `scoreStatus`, `version`, `auditLogId`. Danh tinh nguoi thuc hien lay tu session.

## 3. Cong thuc DTK

`DTK = (QT1 + QT2 + QT3 + 2*GK + 3*CK)/8`, lam tron 2 chu so. Chi tinh khi du 5 thanh phan SCORED va co cong thuc APPROVED du dieu kien.

| calculationStatus | finalScore | Y nghia |
|---|---|---|
| CALCULATED | Diem 2 chu so thap phan | Du dieu kien |
| INCOMPLETE | null | Chua du diem |
| FORMULA_NOT_APPROVED | null | Chua co APPROVED |

APPROVED version moi nhat duoc su dung; PENDING/REJECTED moi hon khong thay the APPROVED truoc do. Khong hien thi null thanh 0.

API Contract da ghi nhan test summary rieng voi `weightedSum=61.5`, DTK=7.69 va sau sua QT1 DTK=7.81. Day la test duoc mo ta trong Contract, khac du lieu dot CV7.

## 4. Ket qua E2E CV7 da duoc nhom truong chap nhan

**Moi truong:** Backend API va SQL Server that. **Du lieu thu:** ScoreRecord ID 40 (ID thuoc dot test, khong co dinh tren moi moi truong).

| TT | Tinh huong | Ket qua | Bang chung |
|---|---|---|---|
| 1 | Dang nhap KHAO_THI | PASS | Session API |
| 2 | Nhap QT1=8, QT2=7, QT3=9, GK=7.5, CK=8.25 | PASS | API + SQL Server |
| 3 | Ghi 5 SCORE_EDIT ban dau | PASS | AuditLog #31-35 |
| 4 | LOCK rieng QT1 | PASS | AuditLog #36 |
| 5 | PATCH QT1 khi LOCKED | PASS | HTTP 409 SCORE_LOCKED, diem khong doi |
| 6 | UNLOCK QT1 co ly do | PASS | AuditLog #37 |
| 7 | Sua QT1 tu 8 thanh 9 | PASS | SCORE_EDIT #38; ScoreRecord version 6->7 |
| 8 | Truy vet lan mo khoa | PASS | SCORE_EDIT #38 co related_log_id=37, related_action=UNLOCK |
| 9 | RELOCK QT1 | PASS | AuditLog #39; lock version 3->4 |
| 10 | Khong co APPROVED | PASS | FORMULA_NOT_APPROVED, finalScore=null |
| 11 | Dung cong thuc APPROVED thu nghiem | PASS | weightedSum=64.75, finalScore=8.09 |
| 12 | Don cong thuc thu nghiem | PASS | Da xoa ban ghi tam ID 5 |

**Phep tinh tay sau sua QT1:** `(9+7+9+2*7.5+3*8.25)/8 = 64.75/8 = 8.09375`, lam tron **8.09**, khop API.

Cac AuditLog #31-39 noi tren duoc doi chieu trong SQL Server, trang thai SUCCESS. Sau RELOCK, ScoreRecord version=7 va LockStatus version=4 la hai gia tri version cua hai doi tuong khac nhau.

## 5. Ket qua bo test CV6 da co

| Nhom test | Ket qua ghi nhan | Pham vi |
|---|---|---|
| Validation diem | 21/21 PASS | Bo test validation CV6 |
| Summary TC18/TC19 | 2/2 PASS | Ma TC cua bo CV6, khong phai TC-18/TC-19 trong SRS |
| Khoa diem/CSV | 7/7 PASS | Mock/repository test; khong phai E2E SQL Server |

Khi dua vao bao cao cuoi ky, Giang can kiem tra `docs/cv6-score-test-evidence.md` va code test goc; khong danh PASS cho toan bo 29 TC cua SRS chi dua tren cac con so nay.

## 6. Ma tran truy vet de xuat

| Yeu cau | Nguon minh chung | Ket luan |
|---|---|---|
| FR05, BR21-BR27, NFR-DI02 | CV6 validation; CV7 nhap diem | Co minh chung, can map tung TC SRS |
| FR06 | CV7 LOCK QT1 va HTTP 409 SCORE_LOCKED | PASS cho luong da test |
| FR07, NFR-AU01-AU04 | CV7 UNLOCK, SCORE_EDIT, RELOCK, AuditLog | PASS cho luong da test |
| FR09, BR36-BR41 | CV7 FORMULA_NOT_APPROVED va CALCULATED=8.09 | PASS cho tinh huong da test |
| FR10 | Tai lieu CV5/CV6 ve CSV | Can doi chieu test import thuc te rieng |
| NFR-DI04 | Minh chung rollback cua module lock/audit da bao cao | Can gan dung link bang chung goc |
| NFR-PE01 | SRS de xuat nguong 3 giay | Chua co ket qua do trong tai lieu dang tong hop |
| Tu dong khoa theo han | Quy tac nhom va SRS hien tai chua dong bo | Chua xac nhan code/test |

## 7. Anh va tai lieu minh chung

- `docs/cv7-score-e2e-evidence.md`: test E2E CV7, da merge qua PR #31.
- `Minh_chung_kiem_thu_E2E_CV7.pdf`: bo PDF 22 trang, gui rieng cho nhom truong, gom anh API/SQL Server/AuditLog/DTK/Git.
- `docs/cv6-score-test-evidence.md`: bo test module CV6; can doi chieu truoc khi gan TC SRS.
- `docs/score-api-contract.md`: du lieu request/response, ma loi, ket qua test summary.
- Chua tu khang dinh co bang chung E2E cho import CSV, auto-lock theo han hoac Performance neu chua gan duoc nguon test tuong ung.

## 8. Ket luan

Ket qua E2E CV7 da duoc nhom truong chap nhan va khong can chay lai. Bao cao nay chi tong hop nhung thong tin da co; phan biet kiem thu SQL Server that, unit/mock test va nhung muc can bo sung minh chung. Khong thay doi SRS goc hay code nghiep vu.