
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
- Chi tinh DTK khi co phien ban cong thuc APPROVED.
- Neu co nhieu phien ban APPROVED, su dung phien ban co version lon nhat.
- Phien ban moi PENDING hoac REJECTED khong thay the phien ban APPROVED truoc do.
- Neu khong co phien ban APPROVED, tra FORMULA_NOT_APPROVED va finalScore = null.
- Ham tinh diem hien ap dung cong thuc va he so co dinh da thong nhat; bang score_formula_policy dung de kiem tra phe duyet, khong thuc thi truc tiep bieu thuc cong thuc luu trong bang.

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

Cac file kiem thu:

- backend/tests/scoreSummaryService.test.js
- backend/tests/scoreFormulaPolicy.test.js

Ket qua:
- Tong so bai kiem thu: 9.
- PASS: 9.
- FAIL: 0.

Phan bo:
- 8 bai kiem thu cong thuc, tinh toan va dieu kien tinh tong ket.
- 1 bai kiem thu Repository ve lua chon phien ban cong thuc APPROVED, gom 3 tinh huong.

Cac noi dung da kiem tra:

1. Cong thuc, he so va lam tron 2 chu so thap phan.
2. Diem 0 la gia tri hop le.
3. Khong tinh khi thieu thanh phan diem.
4. Khong tinh khi co trang thai ABSENT, EXEMPT.
5. Tinh lai diem tong ket sau khi thay doi diem.
6. Khong tinh tong ket khi chua co cong thuc APPROVED.
7. Phien ban 1 APPROVED, phien ban 2 PENDING: tiep tuc su dung phien ban 1.
8. Khi phien ban 2 duoc APPROVED: lua chon phien ban 2.
9. Khong co phien ban APPROVED: Repository khong tra ve cong thuc duoc duyet.

Ket luan: PASS 9/9, 0 FAIL.

### 4.2. Kiem thu API tren SQL Server

API: GET /api/v1/score-records/:id/summary

Co so du lieu: thpt_grade_management.

Da kiem thu:

- PASS: Khi co cong thuc APPROVED nhung thieu diem, API tra INCOMPLETE va finalScore = null.
- PASS: Ban ghi khong ton tai tra HTTP 404.
- PASS: Ma ban ghi diem khong hop le tra HTTP 400 - VALIDATION_ERROR.
- PASS: Khi co cong thuc APPROVED va du 5 diem hop le, API tra CALCULATED.
- PASS: Diem tong ket trung voi ket qua tinh tay.

Kiem thu phe duyet cong thuc:

Truong hop 1: Chua co cong thuc APPROVED.
- calculationStatus = FORMULA_NOT_APPROVED.
- finalScore = null.
- weightedSum = null.
- Ket qua: PASS.

Truong hop 2: Co cong thuc APPROVED.
- calculationStatus = CALCULATED.
- weightedSum = 61.5.
- finalScore = 7.69.
- Ket qua: PASS.

Truong hop 3: Nhieu phien ban cong thuc.
- Phien ban 1: APPROVED.
- Phien ban 2: PENDING.
- API tiep tuc su dung phien ban 1.
- calculationStatus = CALCULATED.
- finalScore = 7.69.
- Ket qua: PASS.

Kiem thu tu dong tai Repository da xac nhan:
- Phien ban 2 APPROVED duoc uu tien khi co version cao hon.
- Khong co phien ban APPROVED thi khong lua chon cong thuc.

Sau kiem thu, da xoa cac ban ghi chinh sach cong thuc gia lap.
Bang score_formula_policy tro ve 0 dong.

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

- PASS: 9/9 bai kiem thu tu dong, 0 FAIL.
- PASS: Cong thuc, he so va quy tac lam tron.
- PASS: Diem 0 hop le, khac voi null.
- PASS: Khong tinh tong ket khi thieu diem hoac co trang thai ABSENT, EXEMPT.
- PASS: Khong tinh tong ket khi chua co cong thuc APPROVED.
- PASS: Lua chon phien ban APPROVED moi nhat.
- PASS: Phien ban PENDING khong thay the phien ban APPROVED truoc do.
- PASS: Lua chon cong thuc khi co nhieu phien ban duoc kiem thu tu dong.
- PASS: API tinh dung diem tong ket 7.69 tren SQL Server.
- PASS: Tu choi ban ghi khong ton tai (HTTP 404).
- PASS: Tu choi ma ban ghi khong hop le (HTTP 400).
- PASS: Tinh lai diem tong ket 7.81 sau khi sua QT1.
- PASS: Diem tong ket tro ve 7.69 sau khi khoi phuc QT1.

Ket qua kiem thu xac nhan chuc nang tinh diem tong ket dap ung cong thuc va quy tac phe duyet da thong nhat.

Ham tinh diem su dung cong thuc co dinh da duoc nhom chot. Bang score_formula_policy duoc su dung de kiem tra va lua chon phien ban APPROVED, khong thuc thi cong thuc dong.

Du lieu chinh sach cong thuc gia lap da duoc xoa sau kiem thu.

API va bang doi chieu tinh tay da san sang de nhom review va merge PR #19.
