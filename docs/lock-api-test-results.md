# KET QUA KIEM THU API KHOA DIEM

## 1. Thong tin kiem thu

- Chuc nang: Khoa diem theo tung cot QT1, QT2, QT3, GK, CK.
- Moi truong: Node.js, Express, SQL Server.
- Database: `thpt_grade_management`.
- Cach kiem thu: Goi API bang PowerShell, kiem tra du lieu trong SSMS.
- Du lieu thu: Nien khoa 2026-2027, lop DEMO_10A1, mon TINHOC.

## 2. Ket qua kiem thu

| STT | Truong hop kiem thu | Ket qua | Trang thai |
|---|---|---|---|
| 1 | Lay trang thai 5 cot diem | Tra ve day du 5 cot, ban dau deu UNLOCKED | PASS |
| 2 | Khoa cot QT1 | QT1 chuyen sang LOCKED, version = 2 | PASS |
| 3 | Kiem tra cac cot con lai | QT2, QT3, GK, CK van UNLOCKED | PASS |
| 4 | Khoa lai cot QT1 | Tra ve CONFLICT | PASS |
| 5 | Khoa QT2 khi con thieu diem, chua xac nhan | Canh bao thieu 2 diem, QT2 van UNLOCKED | PASS |
| 6 | Xac nhan khoa QT2 | QT2 chuyen sang LOCKED, missingCount = 2 | PASS |
| 7 | Kiem tra khoa doc lap | QT1, QT2 LOCKED; ba cot con lai UNLOCKED | PASS |
| 8 | Goi API khi chua dang nhap | Tu choi truy cap | PASS |
| 9 | Hoc sinh goi API GET va POST | Tu choi do khong du quyen | PASS |
| 10 | Sua diem QT1 da khoa | Tra ve SCORE_LOCKED | PASS |
| 11 | Kiem tra AuditLog | Co ban ghi LOCK/SUCCESS cho QT1 va QT2 | PASS |
| 12 | Truy van voi ID khong ton tai | Tra ve NOT_FOUND | PASS |

## 3. Nhan xet

Da kiem thu thu cong 12 truong hop, ket qua deu dat.

API hoat dong dung trong cac truong hop da thu: khoa doc lap theo tung cot, canh bao khi thieu diem, kiem tra quyen truy cap va chan sua diem da khoa.

## 4. File lien quan

- `backend/src/routes/lockRoutes.js`
- `backend/src/server.js`
- `backend/src/services/scoreEntryService.js`

## 5. Kiem thu bo sung cac tinh huong ngoai le

### 5.1. Ket qua kiem thu

| STT | Truong hop kiem thu | Ket qua thuc te | Trang thai |
|---|---|---|---|
| 13 | Mo khoa QT1 lap lai | Lan dau UNLOCK thanh cong, version = 11; lan thu hai tra HTTP 409 CONFLICT | PASS |
| 14 | Mo khoa voi version cu | Gui expectedVersion = 11 khi version hien tai = 12; API tra HTTP 409 VERSION_CONFLICT | PASS |
| 15 | Luu diem va khoa lai gan nhu dong thoi | SAVE_SCORE tra 409 SCORE_LOCKED; RELOCK tra 200, QT1 LOCKED version = 14 | PASS |
| 16 | Loi ghi AuditLog khi LOCK | API tra HTTP 500; transaction rollback, khong tao ban ghi khoa QT3 | PASS |
| 17 | UNLOCK chi nhap reason, khong gui requestedBy/requestedByName | HTTP 200, QT1 chuyen UNLOCKED, version 14 -> 15, unlockedBy = 1, AuditLog ID 17 | PASS |
| 18 | RELOCK sau khi UNLOCK thanh cong | HTTP 200, QT1 chuyen LOCKED, version 15 -> 16, lockedBy = 1, AuditLog ID 18 | PASS |
| 19 | LOCK QT3 khi thieu 2 diem du gui confirmed = true | API tra success = false, missingCount = 2; QT3 van UNLOCKED, version = 1; khong phat sinh AuditLog LOCK moi | PASS |

### 5.2. Minh chung kiem tra du lieu

**Truong hop mo khoa lap lai:**

- Lan UNLOCK dau tien thanh cong, QT1 chuyen sang UNLOCKED.
- Goi UNLOCK lan hai tra HTTP 409 CONFLICT.
- Trang thai va version khong bi thay doi boi lan goi thu hai.
- Khong phat sinh AuditLog UNLOCK cho lan bi tu choi.

**Truong hop xung dot version:**

- QT1 dang LOCKED, version = 12.
- Goi UNLOCK voi expectedVersion = 11.
- API tra HTTP 409 VERSION_CONFLICT.
- QT1 van LOCKED, version = 12.
- Khong phat sinh AuditLog cho thao tac that bai.

**Truong hop tranh chap giua khoa va luu diem:**

- Gui hai yeu cau SAVE_SCORE va RELOCK gan nhu dong thoi.
- SAVE_SCORE tra HTTP 409 SCORE_LOCKED.
- RELOCK tra HTTP 200, QT1 LOCKED, version = 14.
- Kiem tra SSMS: diem QT1 van la 8.00, trang thai SCORED.
- AuditLog co UNLOCK ID 14 va RELOCK ID 15.
- Khong phat sinh SCORE_EDIT tu yeu cau bi tu choi.

Luu y: Ket qua PASS cho kich ban da chay, chua chung minh
tat ca truong hop tranh chap dong thoi.

**Truong hop rollback khi ghi AuditLog cua LOCK that bai:**

- Su dung cot QT3, ban dau chua co ban ghi lock_status.
- Tam thoi gia lap loi SQL TEST_LOCK_AUDIT_FAILURE
  truoc lenh INSERT AuditLog, trong cung transaction.
- API tra HTTP 500.
- Kiem tra SSMS sau loi:
  + Khong co ban ghi khoa QT3.
  + So AuditLog LOCK cua QT3 bang 0.
- Da xoa lenh gia lap loi va khoi dong lai backend thanh cong.
- Ket luan: Transaction rollback thanh cong.

**Kiem thu UNLOCK chi nhap ly do va RELOCK:**

- Pham vi: nien khoa 2, lop 4, mon 3, cot QT1.
- Dang nhap bang tai khoan KHAO_THI, userId = 1.
- UNLOCK chi gui reason va cac tham so xac dinh cot diem; khong gui requestedBy/requestedByName.
- UNLOCK thanh cong, version 14 -> 15, AuditLog ID 17.
- RELOCK thanh cong, version 15 -> 16, AuditLog ID 18.
- Doi chieu SSMS: hai ban ghi deu co performed_by = 1, requested_by = NULL, requested_by_name = NULL, result = SUCCESS.
- AuditLog UNLOCK luu dung ly do mo khoa.
- QT1 da duoc khoa lai sau kiem thu.
- Ket luan: PASS cho luong UNLOCK -> RELOCK da thu.

**Kiem thu khoa diem khi con thieu du lieu:**

- Pham vi: nien khoa 2, lop 4, mon 3, cot QT3.
- So hoc sinh hien tai: 2.
- So hoc sinh thieu diem QT3: 2.
- Gui yeu cau LOCK voi expectedVersion = 1 va confirmed = true.
- API tra success = false, hasMissingScores = true, missingCount = 2.
- GET /locks xac nhan QT3 van UNLOCKED, version = 1.
- Truy van SSMS khong co AuditLog LOCK moi cua QT3 voi audit_log_id > 18.
- Ket luan: PASS. Backend tu choi khoa khi thieu diem, khong cho phep confirmed = true bo qua dieu kien.

### 5.3. Ra soat quy tac tinh diem thieu

Da doi chieu cau SQL tinh missingCount trong lockRoutes.js:

| Trang thai | Tinh la thieu diem |
|---|---|
| NOT_ENTERED | Co |
| SCORED | Khong |
| ABSENT | Khong |
| EXEMPT | Khong |
| Chua co ban ghi score_component | Co |

Ket luan: Dat khi ra soat ma nguon.
Chua kiem thu API rieng cho tung trang thai diem.

### 5.4. Nhan xet

Cac tinh huong ngoai le da kiem thu cho thay:

- API tu choi mo khoa lap lai va thao tac dung version cu.
- API ngan cap nhat diem sau khi cot diem da bi khoa.
- Trang thai khoa va diem duoc giu nhat quan trong
  kich ban gui yeu cau gan nhu dong thoi.
- Khi ghi AuditLog cua LOCK that bai, transaction rollback,
  khong de lai ban ghi khoa chua hoan tat.

Phan gia lap loi chi phuc vu kiem thu tren moi truong phat trien.
Ma nguon da duoc khoi phuc sau khi kiem thu.

## 6. Gioi han kiem thu

Cac noi dung duoi day chua duoc kiem thu API hoac moi kiem thu mot phan:

- Tranh chap giua khoa va luu diem: moi thu thu tu RELOCK thang. Thu tu SAVE_SCORE thang roi RELOCK chay sau chua thu.
- Rollback khi ghi AuditLog loi: moi thu voi LOCK. UNLOCK va RELOCK chua thu.
- missingCount: da kiem thu API voi QT3 thieu 2 diem (PASS); chua kiem thu rieng cho tung trang thai NOT_ENTERED, SCORED, ABSENT va EXEMPT.
- Tu dong khoa theo thoi han: chua lap trinh, cho CR duoc duyet.
- Kiem tra du lieu QT2: nien khoa 2, lop 4, mon 3 co 2 hoc sinh, ca 2 deu thieu diem QT2.
- QT2 dang LOCKED tu lan kiem thu theo quy tac cu cho phep khoa khi thieu diem.
- Chua thuc hien UNLOCK -> RELOCK tren QT2 vi neu mo khoa, quy tac moi se khong cho RELOCK khi con thieu diem.
- Da bo sung kiem tra missingCount trong ma nguon API RELOCK; chua xac nhan PASS bang kiem thu API thuc te cho tinh huong nay.
- Can kiem thu rieng tren du lieu thu co the khoi phuc, khong thay doi diem hoac trang thai khoa hien tai cua nhom.
