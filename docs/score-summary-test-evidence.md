
# BANG DOI CHIEU KIEM THU DIEM TONG KET

## 1. Muc dich

Kiem tra tinh dung dan cua chuc nang tinh diem tong ket
dua tren cong thuc, he so va quy tac lam tron da thong nhat.

Cong thuc:

DTK = (QT1 + QT2 + QT3 + 2 * GK + 3 * CK) / 8

Quy tac:
- QT1, QT2, QT3 co he so 1.
- GK co he so 2.
- CK co he so 3.
- Tong he so bang 8.
- Lam tron ket qua den 2 chu so thap phan.
- Diem 0 la hop le, khac voi null.
- Chua du 5 thanh phan diem hop le thi khong tinh DTK.

## 2. Bang du lieu tinh tay

| Truong hop | QT1 | QT2 | QT3 | GK | CK | Ket qua mong doi |
|---|---:|---:|---:|---:|---:|---|
| Du 5 diem | 8 | 7 | 9 | 8 | 9 | 8.38 |
| Tat ca diem bang 0 | 0 | 0 | 0 | 0 | 0 | 0.00 |
| Thieu QT3 | 8 | 7 | null | 8 | 9 | Khong tinh |
| QT3 vang, GK mien | 8 | 7 | null | null | 9 | Khong tinh |
| Truoc khi sua CK | 8 | 7 | 9 | 8 | 7 | 7.63 |
| Sau khi sua CK | 8 | 7 | 9 | 8 | 9 | 8.38 |

## 3. Dien giai ket qua tinh tay

### 3.1. Truong hop du 5 diem

DTK = (8 + 7 + 9 + 2*8 + 3*9) / 8

DTK = 67 / 8 = 8.375

Lam tron 2 chu so thap phan: 8.38.

### 3.2. Truong hop tat ca diem bang 0

DTK = (0 + 0 + 0 + 2*0 + 3*0) / 8

DTK = 0.00.

Diem 0 van duoc tinh, khong xem la thieu diem.

### 3.3. Truong hop thieu QT3

QT3 co gia tri null va trang thai NOT_ENTERED.

Ket qua:
- calculationStatus = INCOMPLETE.
- finalScore = null.
- missingComponents = ["QT3"].

### 3.4. Truong hop vang va mien

QT3 co trang thai ABSENT.
GK co trang thai EXEMPT.

Ket qua:
- calculationStatus = INCOMPLETE.
- finalScore = null.
- missingComponents = ["QT3", "GK"].

### 3.5. Truong hop tinh lai sau khi sua diem

Truoc khi sua CK:

DTK = (8 + 7 + 9 + 2*8 + 3*7) / 8

DTK = 61 / 8 = 7.625

Lam tron: 7.63.

Sau khi thay doi CK tu 7 thanh 9:

DTK = 67 / 8 = 8.375

Lam tron: 8.38.

Ket qua tong ket phai thay doi theo diem moi.

## 4. Ket qua kiem thu

### 4.1. Kiem thu tu dong

File: backend/tests/scoreSummaryService.test.js

Ket qua:
- Tong so bai kiem thu: 5.
- PASS: 5.
- FAIL: 0.

Cac truong hop da kiem tra:
1. Cong thuc, he so va lam tron.
2. Diem 0 hop le.
3. Khong tinh khi thieu diem.
4. Khong tinh khi co trang thai ABSENT, EXEMPT.
5. Tinh lai sau khi thay doi diem trong du lieu gia lap.


### 4.2. Kiem thu API tren SQL Server

API: GET /api/v1/score-records/:id/summary

Da kiem thu:
- PASS: Ban ghi thieu diem tra INCOMPLETE.
- PASS: finalScore bang null khi thieu diem.
- PASS: Ban ghi khong ton tai tra HTTP 404.
- PASS: API tra CALCULATED khi du 5 diem hop le.
- PASS: Diem tong ket trung voi ket qua tinh tay.
- PASS: API tra HTTP 400 - VALIDATION_ERROR khi ma ban ghi diem khong hop le.

### 4.3. Doi chieu ket qua thuc te

Ban ghi kiem thu:
- score_record_id: 3.
- Mon hoc: NGUVAN.
- QT1: 7.
- QT2: 8.
- QT3: 8.
- GK: 7.25.
- CK: 8.

Tinh tay:

DTK = (7 + 8 + 8 + 2*7.25 + 3*8) / 8

DTK = 61.5 / 8 = 7.6875

Lam tron 2 chu so thap phan: 7.69.

Ket qua API:
- calculationStatus: CALCULATED.
- weightedSum: 61.5.
- finalScore: 7.69.
- So thanh phan: 5.

Ket luan: PASS - Ket qua API trung voi ket qua tinh tay.


### 4.4. Kiem thu tinh lai sau khi sua diem

Ban ghi kiem thu: score_record_id = 3.

Truoc khi sua:
- QT1 = 7.
- version = 1.
- weightedSum = 61.5.
- finalScore = 7.69.

Sau khi sua QT1 tu 7 thanh 8 qua API PATCH:
- changed = true.
- version = 2.
- weightedSum = 62.5.
- finalScore = 7.81.

Sau khi khoi phuc QT1 tu 8 ve 7 qua API PATCH:
- changed = true.
- version = 3.
- finalScore = 7.69.

Ket qua: PASS.

API da doc du lieu diem moi nhat tu SQL Server va tinh lai
diem tong ket dung sau moi lan thay doi hop le.

Gia tri QT1 da duoc khoi phuc ve 7.
Version va AuditLog van ghi nhan lich su chinh sua.

## 5. Ket luan

- PASS: 5/5 bai kiem thu tu dong.
- PASS: Khong tinh tong ket khi chua du diem.
- PASS: Tinh dung diem tong ket 7.69 khi du 5 diem.
- PASS: Tu choi ban ghi khong ton tai (HTTP 404).
- PASS: Tu choi ma ban ghi khong hop le (HTTP 400).
- PASS: Tinh lai diem tong ket 7.81 sau khi sua QT1.
- PASS: Diem tong ket tro ve 7.69 sau khi khoi phuc QT1.

Cong thuc, he so, quy tac lam tron va tinh lai sau khi sua diem
da duoc kiem thu thanh cong tren SQL Server.

API va bang doi chieu tinh tay da san sang de nhom review.
