# THIET KE DU LIEU DIEM VA API CONTRACT

## 1. Muc tieu

### 1.1. Muc tieu thiet ke

Thiet ke du lieu quan ly ket qua hoc tap cua hoc sinh THPT, bao gom 5 thanh phan diem:

- QT1: Diem qua trinh 1.
- QT2: Diem qua trinh 2.
- QT3: Diem qua trinh 3.
- GK: Diem giua ky.
- CK: Diem cuoi ky.

Thiet ke phai bao dam:

- Lien ket dung hoc sinh, lan phan lop, nien khoa va mon hoc.
- Ho tro xem, nhap va chinh sua diem.
- Phan biet diem 0 voi diem chua nhap.
- Ho tro tinh diem tong ket theo cong thuc duoc phe duyet.
- Tich hop kiem tra trang thai khoa diem qua module LockStatus.
- Ghi nhan lich su thay doi diem theo yeu cau nghiep vu.
- Bao toan ket qua hoc tap khi hoc sinh chuyen lop, nghi hoc hoac chuyen truong.
- Ho tro nhap du lieu diem tu CSV va phat hien du lieu khong hop le.

### 1.2. Cong nghe va quy uoc

- Backend: Node.js, Express.
- Database: PostgreSQL.
- API: REST.
- Dinh dang du lieu: JSON.
- Base URL: http://localhost:3000/api/v1
- Ten bang va cot database: snake_case.
- Ten thuoc tinh JSON: camelCase.
- Ten endpoint: chu thuong, kebab-case va danh tu so nhieu.

Tai lieu tuan thu quy chuan cua nhom tai docs/api-conventions.md.

### 1.3. Tai lieu tham chieu

- Bao cao khao sat va dac ta Use Case cua Nhom 5.
- UC06: Xem bang diem.
- UC07: Nhap va chinh sua diem.
- UC08: Khoa diem.
- UC09: Mo khoa diem va ghi nhan nhat ky.
- UC10: Xem diem tong ket va cong thuc tinh.
- UC11: Nhap du lieu tu CSV.
- UC13: Hoc sinh xem ket qua hoc tap cua chinh minh.
- docs/vt3-data-model.md.
- docs/api-conventions.md.
- Bang phan cong cong viec cua nhom.
Trang thai: Ban thiet ke de xuat, duoc quan ly va cap nhat tren Pull Request #3.

## 2. Cac thuc the

### 2.1. Danh sach thuc the

1. ScoreRecord - Ban ghi diem theo lan phan lop va mon hoc.
2. ScoreComponent - Thanh phan diem QT1, QT2, QT3, GK, CK.
Bang cau hinh bo sung:

- ScoreFormulaPolicy: Luu cong thuc, he so, quy tac lam tron, phien ban va thong tin phe duyet.
### 2.2. Cac thuc the lien quan

Su dung cac thuc the thuoc module quan ly hoc sinh, lop va mon hoc:

- AcademicYear: Nien khoa.
- Grade: Khoi lop.
- Class: Lop hoc.
- Student: Hoc sinh.
- Enrollment: Lich su phan lop.
- Subject: Mon hoc.

Su dung cac thuc the thuoc module khoa diem va nhat ky thao tac:

- LockStatus: Trang thai khoa diem.
- AuditLog: Lich su thao tac.

Khong tu y thay doi schema cua cac module lien quan.

### 2.3. Quan he du lieu de xuat

- Mot Enrollment co the co nhieu ScoreRecord theo cac mon hoc.
- Mot Subject co the duoc tham chieu boi nhieu ScoreRecord.
- Moi ScoreRecord thuoc mot Enrollment va mot Subject.
- Moi ScoreRecord co toi da 5 ScoreComponent.
- Moi ScoreComponent thuoc mot ScoreRecord.
- Moi loai thanh phan diem chi xuat hien mot lan trong mot ScoreRecord.

De xuat lien ket:

Enrollment -> ScoreRecord -> ScoreComponent

Subject -> ScoreRecord

Viec lien ket khoa diem va AuditLog tuan theo thiet ke cua cac module lien quan.
## 3. Thiet ke thuoc tinh va rang buoc

### 3.1. ScoreRecord

Muc dich: Luu ban ghi ket qua hoc tap cua mot hoc sinh theo lan phan lop va mon hoc.

| Thuoc tinh | Kieu PostgreSQL | Rang buoc de xuat | Mo ta |
|---|---|---|---|
| score_record_id | BIGSERIAL | PRIMARY KEY | Ma ban ghi diem |
| enrollment_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu Enrollment |
| subject_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu Subject |
| version | INTEGER | NOT NULL, DEFAULT 1 | Phien ban kiem tra xung dot |

Rang buoc de xuat:

- score_record_id la khoa chinh.
- enrollment_id tham chieu Enrollment(enrollment_id).
- subject_id tham chieu Subject(subject_id).
- UNIQUE (enrollment_id, subject_id).
- version phai lon hon hoac bang 1.
- Khong tao hai ban ghi diem trung lan phan lop va mon hoc.
- Khong xoa du lieu diem lich su khi hoc sinh chuyen lop.
- Can kiem tra tinh hop le cua Enrollment va Subject truoc khi tao ban ghi diem.

Luu y:

- Quy tac su dung diem cu khi chuyen lop trong cung nien khoa can duoc nhom xac nhan.
- Truong version la de xuat ky thuat de ho tro phat hien xung dot khi nhieu nguoi cung sua diem.
- Cau truc nay chua phai database chinh thuc.

### 3.2. ScoreComponent

Muc dich: Luu gia tri tung thanh phan diem cua ScoreRecord.

| Thuoc tinh | Kieu PostgreSQL | Rang buoc de xuat | Mo ta |
|---|---|---|---|
| score_component_id | BIGSERIAL | PRIMARY KEY | Ma thanh phan diem |
| score_record_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu ScoreRecord |
| component_type | VARCHAR(10) | NOT NULL | QT1, QT2, QT3, GK, CK |
| score_value | NUMERIC | Cho phep NULL | Gia tri diem |
| score_status | VARCHAR(15) | NOT NULL, DEFAULT 'NOT_ENTERED' | Trang thai diem: NOT_ENTERED, SCORED, ABSENT, EXEMPT |
Rang buoc de xuat:

- score_component_id la khoa chinh.
- score_record_id tham chieu ScoreRecord(score_record_id).
- UNIQUE (score_record_id, component_type).
- component_type IN ('QT1', 'QT2', 'QT3', 'GK', 'CK').
- score_value co the la NULL neu chua nhap diem.
- Diem 0 la gia tri hop le va khac NULL.
- Mien diem hop le tu 0 den 10, bao gom ca 0 va 10.
- QT1, QT2, QT3 chi chap nhan diem nguyen; neu nhap so co phan thap phan thi bao loi, khong tu dong lam tron.
- Rang buoc de xuat cho cot QT: `CHECK (component_type NOT IN ('QT1', 'QT2', 'QT3') OR score_value IS NULL OR score_value = TRUNC(score_value))`.
- GK va CK chi chap nhan diem tu 0 den 10 theo buoc 0.25. Du lieu khong hop le phai bi tu choi, khong tu dong lam tron.
- Khong duoc tu dong chuyen NULL thanh 0.
- Rang buoc trang thai: `CHECK (score_status IN ('NOT_ENTERED', 'SCORED', 'ABSENT', 'EXEMPT'))`.
- Rang buoc gia tri va trang thai: `CHECK ((score_status = 'SCORED' AND score_value IS NOT NULL) OR (score_status IN ('NOT_ENTERED', 'ABSENT', 'EXEMPT') AND score_value IS NULL))`.
- Rang buoc mien diem: `CHECK (score_value IS NULL OR score_value BETWEEN 0 AND 10)`.
- Rang buoc GK/CK: `CHECK (component_type NOT IN ('GK', 'CK') OR score_value IS NULL OR MOD(score_value * 4, 1) = 0)`.
Vi du:

| Thanh phan | Gia tri | Y nghia |
|---|---|---|
| QT1 | 0 | Da nhap diem, gia tri bang 0 |
| QT2 | 8 | Da nhap diem, gia tri bang 8 |
| QT3 | NULL | Chua nhap diem |
| GK | 7.5 |  Diem hop le theo buoc 0.25 |
| CK | NULL | Chua nhap diem |

Luu y:

- Cac gia tri 8 va 7.5 chi la du lieu minh hoa.
- Quy tac DTK lam tron 2 chu so sau dau phay da duoc nhom thong nhat; khong tu dong lam tron diem QT khi nhap.
- NOT_ENTERED, ABSENT va EXEMPT co score_value = NULL; SCORED co score_value hop le tu 0 den 10.
- Khong quy doi ABSENT hoac EXEMPT thanh diem 0. Khong tinh DTK khi co thanh phan ABSENT hoac EXEMPT.

### 3.3. Quy tac toan ven du lieu

- ScoreRecord khong duoc tham chieu Enrollment khong ton tai.
- ScoreRecord khong duoc tham chieu Subject khong ton tai.
- ScoreComponent khong duoc tham chieu ScoreRecord khong ton tai.
- Khong tao trung loai thanh phan diem trong cung ScoreRecord.
- Khong cap nhat diem thuoc cot dang khoa.
- Khong xoa du lieu diem da phat sinh neu viec xoa lam mat lich su can bao toan.
- Moi thay doi diem phai tuan thu quy tac kiem tra quyen, khoa diem va ghi nhat ky.

## 4. Quy tac nghiep vu (Business Rules)

### 4.1. Quy tac quan ly diem

BR-S01: Moi ScoreRecord phai lien ket voi mot Enrollment va mot Subject hop le.

BR-S02: Moi ScoreRecord co toi da 5 thanh phan diem: QT1, QT2, QT3, GK, CK.

BR-S03: Moi loai thanh phan diem chi duoc xuat hien mot lan trong cung ScoreRecord.

BR-S04: Tat ca thanh phan diem nhan gia tri tu 0 den 10. QT1, QT2, QT3 co he so 1 va chi nhan so nguyen; GK co he so 2, CK co he so 3, nhan diem theo buoc 0.25. Du lieu nhap khong hop le phai bi tu choi, khong tu dong lam tron.

BR-S05: Diem 0 la gia tri hop le va khac NULL. Gia tri NULL duoc phan biet thanh chua nhap, vang hoac mien dua tren score_status.

BR-S06: Khong duoc tu dong thay the diem chua nhap bang diem 0.

### 4.2. Quy tac nhap va chinh sua diem

BR-S07: Chi tai khoan co role KHAO_THI moi duoc nhap va chinh sua diem.

BR-S08: Backend phai kiem tra mien diem, kieu du lieu, buoc diem, score_status va tinh nhat quan voi score_value truoc khi luu.

BR-S09: Khi chinh sua diem da co, phai cung cap ly do chinh sua.

BR-S10: Moi thao tac nhap moi va chinh sua diem phai duoc ghi nhan lich su theo UC07. Phan lich su audit mo rong duoc doi chieu them voi G5-FR12.

BR-S11: Khong cho phep chinh sua diem thuoc cot dang khoa.

BR-S12: Backend phai kiem tra quyen, trang thai khoa va xung dot du lieu ngay truoc khi ghi diem.

BR-S13: Viec cap nhat diem va ghi nhat ky bat buoc phai dam bao tinh nhat quan. Neu mot buoc that bai, khong duoc xac nhan luu thanh cong hoac de lai thay doi mot phan.

### 4.3. Quy tac tinh diem tong ket

BR-S14: Diem tong ket chi duoc tinh khi ca 5 thanh phan diem deu co score_status = SCORED va gia tri diem hop le. Neu thieu diem hoac co trang thai ABSENT, EXEMPT thi khong tinh DTK.

BR-S15: Neu con thieu diem, he thong khong tinh diem tong ket va phai thong bao du lieu chua day du.

BR-S16: Cong thuc DTK = (QT1 + QT2 + QT3 + 2 * GK + 3 * CK) / 8. QT1, QT2, QT3 he so 1; GK he so 2; CK he so 3. DTK lam tron 2 chu so sau dau phay. Thong tin phe duyet cong thuc duoc luu tap trung trong ScoreFormulaPolicy, khong luu lap lai trong ScoreComponent.

BR-S17: Khong tu y ap dung cong thuc, he so hoac quy tac lam tron khac voi quy tac da duoc nhom thong nhat; khi co thay doi duoc phe duyet phai cap nhat tai lieu va he thong.

BR-S18: Khi diem thanh phan duoc chinh sua hop le, diem tong ket phai duoc xac dinh lai dua tren du lieu moi nhat.

### 4.4. Quy tac bao toan lich su

BR-S19: Diem da phat sinh phai duoc bao toan khi hoc sinh chuyen lop, nghi hoc hoac chuyen truong.

BR-S20: Khong duoc xoa ScoreRecord hoac ScoreComponent neu viec xoa lam mat du lieu lich su can bao toan.

BR-S21: Quy tac su dung diem cua lop cu khi hoc sinh chuyen lop trong cung nien khoa can duoc nhom xac nhan.

### 4.5. Quy tac phan quyen

BR-S22: Tai khoan KHAO_THI duoc quan ly diem theo pham vi quyen da thong nhat.

BR-S23: Tai khoan HOC_SINH chi duoc xem ket qua hoc tap cua chinh minh.

BR-S24: Backend phai xac dinh hoc sinh tu phien dang nhap, khong tin vao Student ID tuy y duoc gui tu frontend.

BR-S25: Moi API quan ly diem phai tuan thu quy uoc JSON va ma loi trong docs/api-conventions.md.

### 4.6. Quy tac khoa diem

BR-S26: Moi cot diem co trang thai khoa doc lap theo nien khoa, lop va mon hoc.

BR-S27: Khoa mot cot diem khong duoc tu dong thay doi trang thai khoa cua cac cot diem khac.

BR-S28: Khong duoc chinh sua diem thuoc cot dang khoa neu chua thuc hien quy trinh mo khoa hop le.

BR-S29: Sau khi mo khoa, chinh sua va kiem tra hoan tat, cot diem phai duoc khoa lai theo quy trinh cua nhom.

BR-S30: Co che khoa diem va ghi nhat ky tuan theo thiet ke cua module LockStatus va AuditLog. Khong tu dong khoa diem theo thoi han neu chuc nang nay khong thuoc pham vi SRS.

### 4.7. Quy tac import CSV

BR-S31: Du lieu CSV phai duoc kiem tra cau truc va tung dong truoc khi ghi vao database.

BR-S32: He thong phai phan loai dong hop le, dong loi va dong co xung dot.

BR-S33: Ket qua kiem tra phai hien thi vi tri dong loi va nguyen nhan.

BR-S34: Khong duoc tu dong ghi de du lieu diem dang khoa.

BR-S35: Chi duoc ghi nhan du lieu hop le sau khi nguoi dung xac nhan theo quy trinh.

## 5. Quy tac tinh diem tong ket

### 5.1. Nguyen tac

- Moi mon hoc co 5 thanh phan diem QT1, QT2, QT3, GK, CK.
- Diem tong ket chi duoc tinh khi du cac thanh phan bat buoc va hop le.
- Diem 0 la diem hop le va phai duoc su dung trong phep tinh.
- Neu thieu diem bat buoc, khong duoc tu dong tinh tren cac diem con lai.
- Khi diem thanh phan thay doi hop le, ket qua tong ket phai phan anh du lieu moi nhat.
- He thong phai hien thi ro cong thuc va cac gia tri duoc su dung de tinh.

### 5.2. Cong thuc tinh diem tong ket

Quy tac tinh diem duoc cap nhat:

- QT1: He so 1, chi chap nhan so nguyen.
- QT2: He so 1, chi chap nhan so nguyen.
- QT3: He so 1, chi chap nhan so nguyen.
- GK: He so 2, diem tu 0 den 10 theo buoc 0.25.
- CK: He so 3, diem tu 0 den 10 theo buoc 0.25.

Tong he so: 1 + 1 + 1 + 2 + 3 = 8.

Cong thuc:

DTK = (QT1 + QT2 + QT3 + 2 * GK + 3 * CK) / 8

Quy tac lam tron:
- Diem tong ket duoc lam tron 2 chu so sau dau phay.
- Cac diem QT1, QT2, QT3 phai la so nguyen.
- Khong tu dong lam tron diem QT co phan thap phan khi nhap.
- Diem 0 la gia tri hop le.
- Neu thieu bat ky diem bat buoc nao thi khong tinh DTK.

Vi du:

QT1 = 8
QT2 = 9
QT3 = 10
GK = 7.5
CK = 8

DTK = (8 + 9 + 10 + 2 * 7.5 + 3 * 8) / 8
DTK = 8.25

Trang thai: Cong thuc tinh DTK, he so cua tung thanh phan va quy tac lam tron 2 chu so sau dau phay da duoc nhom thong nhat.

### 5.3. Xu ly du lieu thieu

Neu mot hoac nhieu thanh phan diem bat buoc chua co du lieu:

- Khong tinh diem tong ket.
- Khong thay the NULL bang 0.
- Giu nguyen cac diem da duoc luu hop le.
- Tra ve trang thai chua du du lieu.
- Thong bao thanh phan diem con thieu.

### 5.4. Trang thai phe duyet cong thuc

Thong tin cong thuc va phe duyet duoc luu tap trung trong bang cau hinh `ScoreFormulaPolicy`, khong luu lap lai trong `ScoreComponent`.

| Thuoc tinh | Kieu PostgreSQL | Rang buoc | Mo ta |
|---|---|---|---|
| formula_policy_id | BIGSERIAL | PRIMARY KEY | Ma chinh sach tinh diem |
| formula_expression | TEXT | NOT NULL | Cong thuc tinh DTK |
| weight_qt1 | SMALLINT | NOT NULL, DEFAULT 1 | He so QT1 |
| weight_qt2 | SMALLINT | NOT NULL, DEFAULT 1 | He so QT2 |
| weight_qt3 | SMALLINT | NOT NULL, DEFAULT 1 | He so QT3 |
| weight_gk | SMALLINT | NOT NULL, DEFAULT 2 | He so GK |
| weight_ck | SMALLINT | NOT NULL, DEFAULT 3 | He so CK |
| rounding_digits | SMALLINT | NOT NULL, DEFAULT 2 | So chu so lam tron |
| version | INTEGER | NOT NULL, UNIQUE, CHECK (version >= 1) | Phien ban cong thuc |
| approval_status | VARCHAR(10) | NOT NULL, DEFAULT 'PENDING' | Trang thai phe duyet |
| approved_by | VARCHAR(150) | Cho phep NULL | Thong tin nguoi phe duyet |
| approved_at | TIMESTAMPTZ | Cho phep NULL | Thoi diem phe duyet |

Rang buoc bo sung:

- `CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED'))`.
- `CHECK ((approval_status = 'APPROVED' AND approved_by IS NOT NULL AND approved_at IS NOT NULL) OR (approval_status IN ('PENDING', 'REJECTED') AND approved_by IS NULL AND approved_at IS NULL))`.
- He so QT1, QT2, QT3 bang 1; GK bang 2; CK bang 3; rounding_digits bang 2 theo cong thuc hien tai.
Quy tac:

- `PENDING`: Chua co thong tin phe duyet.
- `APPROVED`: Da duoc phe duyet.
- `REJECTED`: Khong duoc phe duyet.
- `approval_status` chi nhan PENDING, APPROVED hoac REJECTED.
- Khi APPROVED, approved_by va approved_at bat buoc co gia tri.
- Khi PENDING hoac REJECTED, approved_by va approved_at de NULL theo thiet ke nay.
- Chi ghi nhan APPROVED khi co thong tin phe duyet thuc te.
- Moi phien ban cong thuc duoc luu rieng de bao toan lich su thay doi.
- Khong xay dung chuc nang hoac API phe duyet rieng trong pham vi cong viec nay.

## 6. Hop dong API (API Contract)

### 6.1. Quy uoc chung

Base URL:

http://localhost:3000/api/v1

Quy uoc:

- GET: Lay du lieu.
- POST: Tao du lieu hoac thuc hien nghiep vu.
- PATCH: Cap nhat du lieu.
- Endpoint su dung chu thuong va kebab-case.
- JSON su dung camelCase.
- Cac API quan ly diem yeu cau role KHAO_THI.
- Hoc sinh xem diem ca nhan qua API /me/scores; viec xac thuc va phan quyen do module xac thuc xu ly.
- Backend phai kiem tra quyen va trang thai khoa truoc khi ghi diem.

Cac endpoint duoi day mo ta API Contract cua module quan ly diem va cac yeu cau tich hop lien quan.

### 6.2. Danh sach API de xuat

| Method | Endpoint | Chuc nang |
|---|---|---|
| GET | /scores | Lay bang diem theo nien khoa, lop va mon |
| GET | /score-records/:id | Lay chi tiet ban ghi diem |
| PATCH | /score-records/:id/components/:type | Nhap hoac chinh sua mot thanh phan diem |
| GET | /score-records/:id/summary | Lay diem tong ket va cong thuc |
| POST | /score-imports/preview | Kiem tra truoc file CSV |
| POST | /score-imports/confirm | Xac nhan import du lieu hop le |

### 6.3. API lay bang diem

Endpoint de xuat:

GET /scores

Query parameters:

- academicYearId: Ma nien khoa.
- classId: Ma lop hoc.
- subjectId: Ma mon hoc.

Chuc nang:

- Lay danh sach hoc sinh thuoc pham vi duoc chon.
- Tra ve QT1, QT2, QT3, GK, CK.
- Tra ve diem 0 dung gia tri.
- Tra ve NULL neu chua nhap diem.
- Tra ve trang thai khoa cua tung cot diem thong qua module LockStatus.
- Hien thi canh bao neu con thieu diem.
- Tra ve scoreStatus cua tung thanh phan diem de phan biet trang thai chua nhap, vang va mien.
Quyen truy cap:

KHAO_THI.

### 6.4. API xem chi tiet diem

Endpoint de xuat:

GET /score-records/:id

Du lieu tra ve du kien:

- scoreRecordId.
- enrollmentId.
- subjectId.
- version.
- components.

Moi components gom:

- componentType.
- scoreValue.
- scoreStatus.

Cau truc JSON tuan thu quy uoc trong docs/api-conventions.md.

### 6.5. API nhap va chinh sua diem

Endpoint de xuat:

PATCH /score-records/:id/components/:type

Du lieu gui len du kien:

- scoreValue: Gia tri diem.
- scoreStatus: NOT_ENTERED, SCORED, ABSENT hoac EXEMPT; phai phu hop voi scoreValue.
- expectedVersion: Phien ban du lieu ma nguoi dung da doc.
- reason: Ly do chinh sua diem da co, khi bat buoc.

Xu ly:

1. Kiem tra dang nhap.
2. Kiem tra role KHAO_THI.
3. Kiem tra ScoreRecord ton tai.
4. Kiem tra thanh phan diem hop le.
5. Kiem tra scoreValue, scoreStatus va cac rang buoc mien diem, so nguyen, buoc 0.25 va 0/NULL.
6. Kiem tra ly do neu sua diem da co.
7. Kiem tra trang thai khoa qua module LockStatus.
8. Kiem tra xung dot du lieu.
9. Luu diem va nhat ky bat buoc trong transaction.
10. Cap nhat version neu thao tac thanh cong.
11. Tra ve diem va phien ban moi.

Luu y:

- expectedVersion va cach cap nhat version la phuong an de xuat.
- Kiem tra trang thai khoa va ghi AuditLog theo hop dong tich hop cua cac module lien quan.
- Khong duoc luu diem neu khong luu duoc nhat ky bat buoc.

### 6.6. API diem tong ket

Endpoint de xuat:

GET /score-records/:id/summary

Chuc nang:

- Lay 5 thanh phan diem.
- Kiem tra du lieu bat buoc.
- Kiem tra trang thai phe duyet cong thuc.
- Tinh ket qua theo cong thuc da duyet neu du dieu kien.
- Tra ve cong thuc va cac gia tri duoc su dung.
- Thong bao neu thieu diem hoac cong thuc chua duyet.

Khong tu dong tinh tong ket khi chua du dieu kien.

### 6.7. API import diem CSV

Endpoint de xuat:

POST /score-imports/preview

Chuc nang:

- Nhan file CSV.
- Kiem tra cau truc file.
- Kiem tra ma hoc sinh, nien khoa, lop, mon hoc va cot diem.
- Kiem tra gia tri diem.
- Kiem tra du lieu trung va xung dot.
- Kiem tra trang thai khoa.
- Tra ve danh sach dong hop le, dong loi va nguyen nhan.
- Chua ghi du lieu vao database.

Endpoint de xuat:

POST /score-imports/confirm

Chuc nang:

- Xac nhan nhap du lieu da duoc kiem tra.
- Kiem tra lai quyen, khoa va xung dot truoc khi ghi.
- Chi luu cac dong du dieu kien.
- Ghi nhat ky cho cac thay doi hop le.
- Khong ghi de diem dang khoa.
- Thong bao so dong thanh cong va that bai.

Luu y:

- Dinh dang file, cach dinh danh lan preview va hinh thuc xac nhan tuan theo quy uoc cua parser CSV dung chung.
- API import diem phai su dung chung quy tac validation va khoa diem voi API nhap diem truc tiep.

### 6.8. Quy uoc ma loi

Su dung ma loi chung theo docs/api-conventions.md:

| HTTP | Error code | Y nghia |
|---|---|---|
| 400 | VALIDATION_ERROR | Du lieu dau vao sai |
| 401 | UNAUTHORIZED | Chua dang nhap |
| 403 | FORBIDDEN | Khong co quyen |
| 404 | NOT_FOUND | Khong tim thay du lieu |
| 409 | CONFLICT | Du lieu xung dot |
| 409 | SCORE_LOCKED | Cot diem da khoa |
| 409 | VERSION_CONFLICT | Du lieu da thay doi |
| 422 | INVALID_SCORE | Diem khong hop le |
| 500 | INTERNAL_ERROR | Loi may chu |

Cau truc JSON bao loi tuan thu docs/api-conventions.md.

## 7. Noi dung can nhom xac nhan

### 7.1. Thiet ke database

1. Xac nhan ten bang ScoreRecord va ScoreComponent.
2. Xac nhan lien ket enrollment_id va subject_id.
3. Xac nhan rang buoc UNIQUE va FOREIGN KEY.
4. Xac nhan cach su dung truong version.
5. Xac dinh lien ket du lieu diem voi LockStatus va AuditLog.

### 7.2. Quy tac diem

Da thong nhat trong nhom:

- QT1, QT2, QT3 he so 1, chi nhan diem nguyen.
- GK he so 2; CK he so 3.
- DTK = (QT1 + QT2 + QT3 + 2 * GK + 3 * CK) / 8.
- Lam tron DTK 2 chu so sau dau phay; khong tinh khi thieu diem bat buoc.

Noi dung da thiet ke:

1. Mien diem tu 0 den 10.
2. QT1, QT2, QT3 nhan so nguyen; GK, CK theo buoc 0.25.
3. Vang, mien duoc bieu dien qua score_status, khong quy doi thanh diem 0.
4. Thong tin phe duyet cong thuc luu trong ScoreFormulaPolicy; khong tu dong gan trang thai APPROVED.

### 7.3. Lich su hoc tap

1. Xac nhan cach xu ly diem khi hoc sinh chuyen lop trong cung nien khoa.
2. Xac nhan cach hien thi diem cua lop cu va lop moi.
3. Xac nhan xu ly diem da khoa khi hoc sinh chuyen lop.
4. Bao dam khong mat du lieu diem lich su.

### 7.4. Tich hop API

1. Endpoint va JSON tuan thu docs/api-conventions.md.
2. API nhap va chinh sua diem yeu cau role KHAO_THI.
3. Du lieu tra ve phuc vu hien thi 5 thanh phan diem va DTK.
4. ScoreRecord lien ket dung Enrollment va Subject.
5. API cap nhat diem phai kiem tra LockStatus va ghi AuditLog.
6. Quy tac khoa diem va pham vi ap dung tuan theo module quan ly khoa diem.

## 8. Noi dung ban giao thiet ke du lieu diem va API Contract

### 8.1. Thong tin cong viec

- Du an: He thong quan ly ket qua hoc tap hoc sinh THPT.
- Ten tai lieu: vt4-score-design.md.
- Duong dan: docs/vt4-score-design.md.
- Branch: feature/vt4-01-score-design.

### 8.2. Noi dung da thiet ke

1. Xac dinh hai thuc the ScoreRecord va ScoreComponent.
2. De xuat thuoc tinh, kieu du lieu va rang buoc.
3. Xac dinh quan he voi Enrollment va Subject trong mo hinh du lieu hoc sinh.
4. Xay dung Business Rules quan ly diem.
5. Xac dinh quy tac 0/NULL, validation va bao toan lich su.
6. Mo ta nguyen tac tinh diem tong ket.
7. Thiet ke API Contract de xuat.
8. Xac dinh cac yeu cau tich hop voi mo hinh du lieu, giao dien, khoa diem va AuditLog.

### 8.3. Noi dung ban giao ky thuat

- Schema ScoreRecord, ScoreComponent va ScoreFormulaPolicy.
- Business Rules ve nhap diem, tinh DTK va phe duyet cong thuc.
- API Contract quan ly diem va diem tong ket.
- Quan he du lieu diem voi Enrollment va Subject.
- Yeu cau tich hop LockStatus, AuditLog va kiem tra quyen.
### 8.4. Tieu chi hoan thanh thiet ke

- Da thiet ke ScoreRecord va ScoreComponent.
- Da mo ta quan he voi mo hinh du lieu hoc sinh.
- Da de xuat cac rang buoc PostgreSQL.
- Da xay dung Business Rules.
- Da mo ta quy tac tinh diem tong ket.
- Da thiet ke API Contract de xuat.
- Da mo ta trang thai phe duyet cong thuc va cac rang buoc lien quan.
- Tai lieu duoc dua len branch rieng.
- Pull Request duoc tao de review va merge theo quy trinh Git.
- Tai lieu duoc ban giao cho cac thanh vien lien quan.

## 9. Ket luan

Tai lieu cung cap thiet ke du lieu diem, Business Rules va API Contract cho module quan ly diem cua he thong.

Thiet ke tuan thu cac yeu cau nghiep vu trong bao cao khao sat va quy uoc ky thuat cua nhom.

## 10. Dong bo voi mo hinh du lieu hoc sinh

### 10.1. Noi dung da doi chieu

Da doi chieu voi ban cap nhat mo hinh du lieu hoc sinh, commit 35b10fa, bao gom cac Business Rules BR-59 den BR-67.

Thong nhat ve mat dinh huong thiet ke:

- ScoreRecord tham chieu enrollment_id va subject_id.
- ScoreComponent tham chieu score_record_id.
- Bao toan ScoreRecord va ScoreComponent da phat sinh khi hoc sinh chuyen lop.
- Giu nguyen lich su diem cua nien khoa cu khi hoc sinh chuyen nien khoa.
- Khong tu dong sao chep hoac chuyen diem sang Enrollment moi neu chua co quy tac duoc phe duyet.
- Khong tu dong mo khoa, xoa khoa hoac bo qua trang thai khoa diem khi chuyen lop.
- Thao tac thay doi Enrollment phai dam bao tinh nhat quan du lieu.

### 10.2. Noi dung can xac nhan truoc khi chot schema

- Bao dam khoa ngoai, UNIQUE va version cua ScoreRecord.
- Bao toan du lieu diem lich su khi chuyen lop.
- Khong tu dong sao chep diem sang Enrollment moi.
- Tich hop kiem tra khoa diem va ghi AuditLog.
- HK1/HK2 la pham vi bo sung trong SRS, khong phai yeu cau MUST cua de goc. Neu trien khai, ScoreRecord, API va LockStatus phai thong nhat theo hoc ky.
### 10.3. Theo doi phe duyet quy tac diem

| Noi dung | Phuong an thiet ke | Trang thai |
|---|---|---|
| Mien diem | Tu 0 den 10 | DA QUY DINH |
| QT1, QT2, QT3 | So nguyen, he so 1 | DA THONG NHAT |
| GK, CK | Buoc 0.25, he so 2 va 3 | DA QUY DINH |
| Cong thuc DTK | (QT1 + QT2 + QT3 + 2 * GK + 3 * CK) / 8 | DA THONG NHAT |
| Lam tron DTK | 2 chu so thap phan | DA THONG NHAT |
| Thieu diem | Khong tinh DTK | DA QUY DINH |
| Vang, mien | Quan ly qua score_status, khong quy doi thanh 0 | DA THIET KE |
| Chuyen lop | Bao toan lich su, khong tu dong sao chep diem | DA MO TA |
| Khoa diem | Tich hop LockStatus | YEU CAU TICH HOP |
| Phe duyet cong thuc | Luu trong ScoreFormulaPolicy | DA THIET KE |
| HK1/HK2 | Pham vi bo sung trong SRS | KHONG PHAI MUST |


### 10.4. Ket luan ban giao

Tai lieu da mo ta schema diem, Business Rules, API Contract, cong thuc DTK va rang buoc du lieu.

Thong tin phe duyet cong thuc duoc thiet ke luu tap trung trong ScoreFormulaPolicy. Khong mac dinh cong thuc da duoc giang vien phe duyet khi chua co du lieu xac nhan thuc te.

Cac yeu cau tich hop voi mo hinh du lieu hoc sinh, khoa diem va AuditLog duoc mo ta o muc lien quan.

Trang thai: Tai lieu thiet ke du lieu diem va API Contract duoc cap nhat tren Pull Request #3.
