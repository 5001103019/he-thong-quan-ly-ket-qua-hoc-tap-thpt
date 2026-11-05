# BAN GIAO CV8 - SRS/NFR, API DIEM VA MINH CHUNG KIEM THU

**Du an:** He thong quan ly ket qua hoc tap hoc sinh THPT - Nhom 5

**Nguoi thuc hien:** Chau

**Nguoi tiep nhan:** Giang (bao cao va SRS), Yen (slide thuyet trinh)

**Trang thai:** Ban giao noi dung de doi chieu va tich hop. Chua thay the SRS chung.

---

## 1. Muc dich ban giao

CV8 tong hop va doi chieu cac yeu cau ve quan ly diem, cong thuc, validation, 0/NULL, toan ven du lieu va AuditLog.

Tai lieu su dung ket qua tu cac cong viec da thuc hien, dac biet la bo test CV6 va quy trinh E2E CV7 da duoc nhom truong chap nhan.

CV8 khong thay doi code nghiep vu va khong yeu cau chay lai cac test CV7 da nghiem thu.

## 2. Danh sach san pham

| Tai lieu | Noi dung | Nguoi su dung |
|---|---|---|
| `docs/cv8-score-srs-nfr-review.md` | Doi chieu SRS/NFR, de xuat noi dung can dong bo | Giang |
| `docs/cv8-score-api-test-report.md` | Bao cao API diem, kiem thu va nguon minh chung | Giang |
| `docs/cv8-handoff-giang-yen.md` | Noi dung ban giao bao cao va slide | Giang, Yen |

Tai lieu tham chieu co san trong repository:

- `docs/srs.md`
- `docs/score-api-contract.md`
- `docs/cv6-score-test-evidence.md`
- `docs/cv7-score-e2e-evidence.md`

Bo PDF minh chung E2E CV7 gom 22 trang da duoc gui rieng cho nhom truong, khong bat buoc dua anh vao Pull Request CV8.

## 3. Noi dung ban giao cho Giang

### 3.1. Yeu cau chuc nang

Cac phan SRS can doi chieu khi tich hop:

| Yeu cau | Noi dung | Ket qua doi chieu |
|---|---|---|
| G5-FR05 | Nhap va sua diem | Co quy tac validation, 0/NULL, trang thai diem va version |
| G5-FR06 | Khoa diem doc lap | Co minh chung LOCK va chan PATCH khi LOCKED |
| G5-FR07 | Mo khoa va AuditLog | Co minh chung UNLOCK, SCORE_EDIT, RELOCK va lien ket log |
| G5-FR09 | Tinh diem tong ket | Co minh chung FORMULA_NOT_APPROVED va CALCULATED |
| G5-FR10 | Import CSV | Co quy tac preview, validation va chan ghi de diem khoa; can doi chieu minh chung E2E import rieng |

### 3.2. Quy tac diem va validation

- Nam thanh phan diem: QT1, QT2, QT3, GK, CK.
- Mien diem hop le: 0 den 10.
- QT1/QT2/QT3 nhan so nguyen; GK/CK nhan theo buoc 0.25.
- Diem 0 hop le va khac NULL.
- NOT_ENTERED, ABSENT, EXEMPT khong duoc tu dong quy doi thanh diem 0.
- Khong ghi diem neu sai pham vi, sai quyen hoac cot dang LOCKED.
- API PATCH su dung `expectedVersion`; sai version tra `VERSION_CONFLICT`.
- Ly do chinh sua duoc kiem tra theo quy tac trong API Contract.

### 3.3. Cong thuc DTK

Cong thuc cua nhom:

`DTK = (QT1 + QT2 + QT3 + 2*GK + 3*CK)/8`

Quy tac tinh:

- Du nam thanh phan SCORED hop le.
- Su dung phien ban cong thuc APPROVED moi nhat.
- PENDING hoac REJECTED moi hon khong thay the phien ban APPROVED da co.
- Khong co APPROVED thi khong tinh DTK.
- Ket qua lam tron hai chu so thap phan.
- Khong hien thi `finalScore = null` thanh diem 0.

Luu y: Ban ghi APPROVED tam thoi trong qua trinh test khong phai bang chung giang vien da phe duyet cong thuc.

### 3.4. Integrity va AuditLog

- Backend kiem tra session va vai tro KHAO_THI cho thao tac quan ly diem.
- Cap nhat diem hoac khoa diem va ghi AuditLog phai bao dam tinh nhat quan transaction.
- Neu ghi AuditLog that bai, giao dich nghiep vu tuong ung phai rollback.
- Luu vet LOCK, UNLOCK, RELOCK, SCORE_EDIT va SCORE_IMPORT theo pham vi ap dung.
- Thao tac sua diem sau UNLOCK phai truy vet duoc lan mo khoa hop le.
- Khong tai su dung tham chieu UNLOCK cu sau RELOCK.
- Khong sua hoac xoa AuditLog bang chuc nang thong thuong.

## 4. Ket qua kiem thu da co

### 4.1. Bo kiem thu CV6

| Nhom kiem thu | Ket qua |
|---|---|
| Validation diem | 21/21 PASS |
| Summary TC18/TC19 cua CV6 | 2/2 PASS |
| Khoa diem va CSV theo bo test mock | 7/7 PASS |

Can phan biet test mock voi E2E SQL Server va khong dong nhat ma test CV6 voi TC-01 den TC-29 cua SRS.

### 4.2. Kiem thu E2E CV7

Da duoc nhom truong chap nhan:

| Noi dung | Ket qua |
|---|---|
| Dang nhap KHAO_THI | PASS |
| Nhap du 5 thanh phan diem | PASS |
| LOCK rieng QT1 | PASS |
| Chan sua diem da khoa | PASS - HTTP 409 SCORE_LOCKED |
| UNLOCK co ly do | PASS |
| Sua QT1 tu 8 thanh 9 | PASS |
| Truy vet SCORE_EDIT voi UNLOCK | PASS |
| RELOCK QT1 | PASS |
| Kiem tra AuditLog trong SQL Server | PASS |
| Khong co cong thuc APPROVED | PASS - FORMULA_NOT_APPROVED |
| Tinh DTK voi cong thuc thu nghiem | PASS - 8.09 |
| Xoa cong thuc thu nghiem | PASS |

Minh chung AuditLog: SCORE_EDIT #38 co `related_log_id=37` va `related_action=UNLOCK`.

Phep tinh tay sau khi sua QT1:

`(9+7+9+2*7.5+3*8.25)/8 = 8.09375`

Lam tron hai chu so: **8.09**, trung voi API.

### 4.3. Noi dung chua duoc ket luan tu bo minh chung nay

| Noi dung | Trang thai |
|---|---|
| Kiem thu import CSV E2E voi SQL Server | Can doi chieu minh chung rieng |
| Tu dong khoa lan dau theo thoi han | Can kiem tra implementation va test |
| Muc tieu hieu nang 3 giay | Chua co so lieu do trong bo tong hop |
| Phe duyet cong thuc boi giang vien | Can bang chung phe duyet thuc te |
| Toan bo 29 test case trong SRS | Chua doi chieu xong tung test |

Khong danh PASS cho cac noi dung tren khi chua co bang chung.

## 5. Cac viec Giang can thuc hien khi tich hop

| Uu tien | Cong viec |
|---|---|
| 1 | Giu quy tac khoa thu cong la MUST; chi xem xet tu dong khoa khi co quyet dinh va CR duoc duyet || 2 | Bo sung lua chon phien ban cong thuc APPROVED moi nhat vao FR09/Business Rules |
| 3 | Doi chieu validation, expectedVersion va reason voi API Contract |
| 4 | Lam ro tham chieu AuditLog khi sua diem sau mo khoa |
| 5 | Map minh chung CV6-CV7 voi TC-01 den TC-29 theo noi dung, khong theo so thu tu |
| 6 | Cap nhat bang RTM va ket qua PASS/FAIL chi voi test co minh chung |
| 7 | Dong bo SRS, Data Dictionary, API Contract neu phat sinh thay doi lien quan |

Tai lieu CV8 la co so de Giang review, khong tu dong xac nhan SRS 1.1 da duoc cap nhat.

## 6. Noi dung de Yen dua vao slide

### Slide 1 - Chuc nang quan ly diem

- Quan ly nam cot diem QT1, QT2, QT3, GK, CK.
- Nhap va sua diem theo hoc sinh, mon hoc, nien khoa.
- Kiem tra mien diem, buoc diem va trang thai diem.
- Phan biet diem 0 va chua nhap.

**Minh hoa de xuat:** Giao dien bang diem hoac so do luong nhap diem.

### Slide 2 - Khoa, mo khoa va AuditLog

- Khoa doc lap tung cot diem.
- Dang LOCKED thi khong sua duoc.
- Mo khoa can quyen va ly do.
- Sua diem va khoa lai, luu nhat ky thao tac.

**Minh hoa de xuat:** So do `LOCK -> UNLOCK -> SCORE_EDIT -> RELOCK` va anh ket qua 409 SCORE_LOCKED.

### Slide 3 - Cong thuc va diem tong ket

- Trong so QT1/QT2/QT3/GK/CK la 1/1/1/2/3.
- Chi tinh khi du diem va co cong thuc APPROVED hop le.
- Ket qua doi chieu E2E: 8.09.
- Khong co APPROVED thi finalScore la null.

**Minh hoa de xuat:** Cong thuc va ket qua API tinh diem.

### Slide 4 - Ket qua kiem thu

- CV6: 21/21 validation PASS; 2/2 summary PASS; 7/7 mock PASS.
- CV7: quy trinh E2E tren API va SQL Server da duoc chap nhan.
- AuditLog truy vet duoc thao tac sau UNLOCK.
- Phan biet kiem thu mock va kiem thu E2E.

**Minh hoa de xuat:** Bang PASS va anh API/SQL Server da co.

### Slide 5 - Ket luan va gioi han

- Cac luong nhap diem, khoa/mo khoa, ghi log va tinh DTK co minh chung.
- Tiep tuc dong bo SRS, RTM va cac quy tac nghiep vu moi nhat.
- Khong coi ket qua test cong thuc la bang chung giang vien phe duyet.
- Nhung chuc nang chua co minh chung can duoc kiem tra rieng.

**Minh hoa de xuat:** Bang tong ket yeu cau va trang thai minh chung.

## 7. Ket luan ban giao

CV8 da tong hop noi dung SRS/NFR phan diem, hop dong API, validation, cong thuc DTK, toan ven du lieu va AuditLog. Tai lieu dan chieu cac ket qua test CV6 va E2E CV7 da co.

Giang su dung bo tai lieu de review va cap nhat SRS/RTM chung; Yen su dung phan tom tat de xay dung slide. Viec tich hop va xac nhan nghiem thu cuoi ky thuoc qua trinh review cua nhom.

**Pham vi thay doi cua CV8:** Chi bo sung tai lieu Markdown, khong thay doi code nghiep vu.