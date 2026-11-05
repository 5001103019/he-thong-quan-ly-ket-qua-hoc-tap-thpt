# DOI CHIEU VA DE XUAT HOAN THIEN SRS/NFR PHAN DIEM - CV8

**Du an:** He thong quan ly ket qua hoc tap hoc sinh THPT - Nhom 5

**Nguon doi chieu:** `docs/srs.md` ban 1.1, `docs/score-api-contract.md`, minh chung CV6-CV7.

**Trang thai:** Tai lieu de xuat cho Giang review; chua sua SRS goc.

## 1. Nguyen tac

- Khong thay doi muc uu tien MUST, SHOULD, COULD hoac quy tac nhom da chot.
- Phan biet quy tac SRS, hop dong API, ket qua kiem thu va nhung diem can doi chieu them.
- Khong danh dong trang thai APPROVED trong SQL Server thu nghiem voi bang chung giang vien da phe duyet cong thuc.

## 2. Doi chieu yeu cau

| Noi dung | Vi tri trong SRS | Nhan xet |
|---|---|---|
| Nhap va sua 5 cot diem | FR05, BR17-BR27 | Da co mien diem, buoc diem, 0 khac NULL |
| Khoa va mo khoa | FR06-FR07, BR28-BR35 | Da co khoa doc lap, ly do, AuditLog; can dong bo quy tac khoa lan dau |
| Cong thuc DTK | FR09, BR36-BR41 | Da co trong so 1,1,1,2,3; can noi ro lua chon phien ban APPROVED |
| Import CSV | FR10, BR42-BR44 | Da co preview, loi tung dong, chan ghi de cot khoa |
| Security | NFR-SE01-SE04 | Da co xac thuc, kiem tra quyen backend, validation input |
| Integrity | NFR-DI01-DI04 | Da co PK/FK, transaction/rollback, bao toan lich su |
| Logging | NFR-AU01-AU04 | Da co log bat buoc; can noi ro lien ket SCORE_EDIT va UNLOCK |
| Kiem thu/RTM | Muc 10 va 13 | Bang TC van CHUA_CHAY; can map lai theo noi dung test thuc te |

## 3. Noi dung de xuat bo sung

### 3.1. Validation, 0 va NULL

- `SCORED` chi chap nhan diem hop le tu 0 den 10. QT1/QT2/QT3 la so nguyen; GK/CK nhan gia tri theo buoc 0.25.
- Diem `0` khi `SCORED` la diem hop le, khac voi chua nhap (`null`). Khong tu dong bien `NOT_ENTERED`, `ABSENT`, `EXEMPT` thanh diem 0.
- Backend khong tu dong lam tron diem nhap sai buoc. Khong ghi diem neu sai Enrollment, Subject, pham vi hoac thieu quyen.
- PATCH diem co `scoreValue`, `scoreStatus`, `expectedVersion`. Truong `reason` bat buoc neu chinh sua diem/trang thai da co va thay doi thuc su; API Contract quy dinh toi da 1000 ky tu.

### 3.2. Khoa va mo khoa

- LockStatus doc lap theo nien khoa, lop, mon, cot; backend tu choi PATCH cot dang LOCKED bang `409 SCORE_LOCKED`.
- UNLOCK can quyen, nguoi yeu cau, ly do va AuditLog; sau sua diem ghi SCORE_EDIT va RELOCK theo quy tac.
- Khoa diem thu cong la luong MUST. Nguoi co quyen thuc hien khoa tung cot diem theo nien khoa, lop va mon hoc.
- Neu cot con thieu diem, he thong hien thi canh bao va yeu cau xac nhan; van cho phep khoa thu cong theo quy tac nhom da thong nhat.
- Tu dong khoa diem theo thoi han khong thuoc pham vi MUST hien tai. Chi bo sung khi co quyet dinh cua nhom va Change Request (CR) duoc duyet.
- RELOCK sau khi mo khoa va chinh sua diem la thao tac thu cong, phai ghi AuditLog.


### 3.3. Cong thuc DTK va phien ban

- `DTK = (QT1 + QT2 + QT3 + 2*GK + 3*CK)/8`; lam tron 2 chu so thap phan.
- Chi tinh khi co du 5 diem `SCORED` hop le va cong thuc du dieu kien ap dung.
- Su dung phien ban ScoreFormulaPolicy `APPROVED` co version lon nhat trong pham vi ap dung.
- Phien ban moi `PENDING` hoac `REJECTED` khong thay the ban APPROVED truoc.
- Khong co cong thuc APPROVED: `FORMULA_NOT_APPROVED`, `finalScore = null`, khong hien thi thanh diem 0.
- Phan biet APPROVED trong database thu nghiem va bang chung giang vien phe duyet thuc te.

### 3.4. Version, transaction va integrity

- Frontend phai gui `expectedVersion` lay tu ScoreRecord moi nhat.
- Neu sai version: `409 VERSION_CONFLICT`; phai tai lai du lieu truoc khi sua.
- Cap nhat ScoreComponent/LockStatus va AuditLog tuong ung phai cung transaction.
- Neu ghi AuditLog that bai thi rollback thay doi nghiep vu.
- Khong bo qua kiem tra session, quyen, pham vi va khoa diem.
- Khong xoa lich su Enrollment, ScoreRecord, AuditLog.

### 3.5. Audit va truy vet

- Ghi `LOCK`, `UNLOCK`, `RELOCK`, `SCORE_EDIT`, `SCORE_IMPORT` theo thao tac thuc te.
- Danh tinh nguoi thuc hien lay tu session dang nhap hop le.
- Sua/import diem sau mo khoa phai truy vet duoc den lan UNLOCK hop le.
- Neu code/schema su dung `related_log_id` va `related_action` thi ghi dung tham chieu.
- Khong tai su dung UNLOCK cu sau RELOCK.
- CV7 da xac nhan `SCORE_EDIT #38` lien ket `UNLOCK #37`.
- Chua tu suy ra luong SCORE_IMPORT da duoc kiem thu E2E.
- FR12 COULD la giao dien lich su chi tiet, khong thay the AuditLog bat buoc cua FR07.

### 3.6. Import CSV

- Preview va kiem tra tung dong: cau truc cot, hoc sinh, pham vi nien khoa/lop/mon, diem, buoc diem, trung lap, quyen va trang thai khoa.
- Chi ghi dong hop le sau khi xac nhan.
- Khong ghi de cot LOCKED.
- Thay doi diem va AuditLog phai dam bao tinh nhat quan.
- Ket qua test mock/validation khong thay the bang chung import E2E SQL Server.
- Can dan chieu tai lieu CV5 va code truoc khi danh PASS cho tung truong hop.

## 4. Viec Giang can doi chieu khi dong bo SRS

| Uu tien | Noi dung | Yeu cau |
|---|---|---|
| Cao | Khoa diem thu cong va canh bao thieu diem | Giu luong MUST; chi bo sung tu dong khoa khi co CR duoc duyet || Cao | FR09/BR36-BR41 | Bo sung version APPROVED moi nhat va PENDING/REJECTED |
| Cao | SRS muc 10.2, RTM, muc 13 | Map tung TC theo noi dung, khong theo so TC cua bo test khac |
| Trung binh | FR05/NFR-DI02 | Dan chieu expectedVersion va reason theo API Contract |
| Trung binh | NFR-AU02-AU04 | Lam ro lien ket UNLOCK va SCORE_EDIT |
| Trung binh | FR10/NFR-AU01 | Kiem tra bang chung SCORE_IMPORT va CSV E2E truoc khi danh PASS |

## 5. Pham vi minh chung va gioi han

- CV7 da co minh chung API va SQL Server that cho nhap diem, LOCK, UNLOCK, sua diem, RELOCK, AuditLog va DTK.
- CV6 co ket qua test validation, summary va mock; phai phan biet test mock voi E2E.
- Muc tieu Performance 3 giay trong SRS chua co ket qua do tu bo minh chung dang doi chieu, khong danh dau PASS.
- Khong su dung cong thuc test APPROVED de khang dinh da co phe duyet giang vien.

**Ket luan:** Tai lieu nay de xuat nhung noi dung can dong bo cho Giang, khong tu thay doi SRS goc hoac quy tac nghiep vu cua nhom.