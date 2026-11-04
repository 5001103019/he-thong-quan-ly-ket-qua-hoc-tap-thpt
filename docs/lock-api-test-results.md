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