# VT4-01 - THIET KE DU LIEU DIEM VA API CONTRACT

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
- Tich hop kiem tra trang thai khoa diem cua VT5.
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
- Bang phan cong cong viec VT4-01.

Trang thai: Ban thiet ke de xuat, cho VT1 va cac thanh vien lien quan review, xac nhan.

## 2. Cac thuc the

### 2.1. Danh sach thuc the

1. ScoreRecord - Ban ghi diem theo lan phan lop va mon hoc.
2. ScoreComponent - Thanh phan diem QT1, QT2, QT3, GK, CK.

### 2.2. Cac thuc the lien quan

Su dung cac thuc the do VT3-01 thiet ke:

- AcademicYear: Nien khoa.
- Grade: Khoi lop.
- Class: Lop hoc.
- Student: Hoc sinh.
- Enrollment: Lich su phan lop.
- Subject: Mon hoc.

Su dung cac thuc the do VT5 thiet ke:

- LockStatus: Trang thai khoa diem.
- AuditLog: Lich su thao tac.

Khong tu y thay doi schema cua VT3 va VT5.

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

Viec lien ket khoa diem va AuditLog se duoc thong nhat voi VT5.

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

Rang buoc de xuat:

- score_component_id la khoa chinh.
- score_record_id tham chieu ScoreRecord(score_record_id).
- UNIQUE (score_record_id, component_type).
- component_type IN ('QT1', 'QT2', 'QT3', 'GK', 'CK').
- score_value co the la NULL neu chua nhap diem.
- Diem 0 la gia tri hop le va khac NULL.
- De xuat mien diem tu 0 den 10.
- So chu so thap phan va kieu NUMERIC cu the can nhom xac nhan.
- Khong duoc tu dong chuyen NULL thanh 0.

Vi du:

| Thanh phan | Gia tri | Y nghia |
|---|---|---|
| QT1 | 0 | Da nhap diem, gia tri bang 0 |
| QT2 | 8 | Da nhap diem, gia tri bang 8 |
| QT3 | NULL | Chua nhap diem |
| GK | 7.5 | Diem minh hoa, phu thuoc quy tac thap phan duoc duyet |
| CK | NULL | Chua nhap diem |

Luu y:

- Cac gia tri 8 va 7.5 chi la du lieu minh hoa.
- Khong tu y ap dung quy tac lam tron khi chua duoc phe duyet.
- Truong hop vang kiem tra, mien kiem tra hoac trang thai dac biet can thiet ke theo quy tac rieng sau khi nhom xac nhan.
- Khong tu y quy doi cac trang thai dac biet thanh diem so.

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

BR-S04: Gia tri diem phai dap ung mien gia tri va quy tac so chu so thap phan duoc nhom thong nhat. De xuat mien diem tu 0 den 10; can xac nhan truoc khi chot schema.

BR-S05: Diem 0 la gia tri hop le. Gia tri NULL bieu thi diem chua duoc nhap.

BR-S06: Khong duoc tu dong thay the diem chua nhap bang diem 0.

### 4.2. Quy tac nhap va chinh sua diem

BR-S07: Chi tai khoan co role KHAO_THI moi duoc nhap va chinh sua diem.

BR-S08: He thong phai kiem tra du lieu hop le truoc khi luu.

BR-S09: Khi chinh sua diem da co, phai cung cap ly do chinh sua.

BR-S10: Moi thao tac nhap moi va chinh sua diem phai duoc ghi nhan lich su theo UC07. Phan lich su audit mo rong duoc doi chieu them voi G5-FR12.

BR-S11: Khong cho phep chinh sua diem thuoc cot dang khoa.

BR-S12: Backend phai kiem tra quyen, trang thai khoa va xung dot du lieu ngay truoc khi ghi diem.

BR-S13: Viec cap nhat diem va ghi nhat ky bat buoc phai dam bao tinh nhat quan. Neu mot buoc that bai, khong duoc xac nhan luu thanh cong hoac de lai thay doi mot phan.

### 4.3. Quy tac tinh diem tong ket

BR-S14: Diem tong ket chi duoc tinh khi co day du cac thanh phan diem bat buoc va du lieu hop le.

BR-S15: Neu con thieu diem, he thong khong tinh diem tong ket va phai thong bao du lieu chua day du.

BR-S16: Cong thuc, he so va quy tac lam tron phai duoc nhom thong nhat va giang vien phe duyet.

BR-S17: Khi cong thuc chua duoc phe duyet, he thong khong duoc tu dong ap dung cong thuc khac.

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

BR-S30: Co che khoa diem va ghi nhat ky can duoc phoi hop voi VT5. Khong tu y trien khai tu dong khoa theo thoi han neu chua co xac nhan thay doi pham vi.

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

### 5.2. Cong thuc

Trang thai: CHUA DUOC PHE DUYET.

Cong thuc tinh diem tong ket, he so, quy tac lam tron va cach xu ly trang thai dac biet chua duoc xac dinh cu the trong bao cao khao sat.

Khong tu y ap dung cong thuc khi chua duoc nhom va giang vien xac nhan.

### 5.3. Xu ly du lieu thieu

Neu mot hoac nhieu thanh phan diem bat buoc chua co du lieu:

- Khong tinh diem tong ket.
- Khong thay the NULL bang 0.
- Giu nguyen cac diem da duoc luu hop le.
- Tra ve trang thai chua du du lieu.
- Thong bao thanh phan diem con thieu.

### 5.4. Trang thai phe duyet cong thuc

Tai lieu thiet ke can ghi nhan:

- Cong thuc duoc de xuat.
- He so cua tung thanh phan.
- Quy tac lam tron.
- Cach xu ly diem dac biet.
- Nguoi hoac ben xac nhan.
- Trang thai duyet.
- Thoi diem duyet.

Hinh thuc luu cac thong tin nay trong database hoac tai lieu cau hinh can duoc VT1 xac nhan.

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
- Hoc sinh xem diem ca nhan qua API /me/scores do VT1 phu trach xac thuc.
- Backend phai kiem tra quyen va trang thai khoa truoc khi ghi diem.

Cac endpoint duoi day la de xuat, can VT1, VT2 va VT5 xac nhan truoc khi lap trinh.

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
- Hien thi trang thai khoa cua tung cot diem khi da tich hop VT5.
- Hien thi canh bao neu con thieu diem.

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

Cau truc JSON chi tiet can duoc VT1 va VT2 xac nhan.

### 6.5. API nhap va chinh sua diem

Endpoint de xuat:

PATCH /score-records/:id/components/:type

Du lieu gui len du kien:

- scoreValue: Gia tri diem.
- expectedVersion: Phien ban du lieu ma nguoi dung da doc.
- reason: Ly do chinh sua diem da co, khi bat buoc.

Xu ly:

1. Kiem tra dang nhap.
2. Kiem tra role KHAO_THI.
3. Kiem tra ScoreRecord ton tai.
4. Kiem tra thanh phan diem hop le.
5. Kiem tra gia tri diem.
6. Kiem tra ly do neu sua diem da co.
7. Kiem tra trang thai khoa qua module VT5.
8. Kiem tra xung dot du lieu.
9. Luu diem va nhat ky bat buoc trong transaction.
10. Cap nhat version neu thao tac thanh cong.
11. Tra ve diem va phien ban moi.

Luu y:

- expectedVersion va cach cap nhat version la phuong an de xuat.
- Can thong nhat voi VT1 va VT5 ve cach kiem tra khoa va ghi AuditLog.
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

- Dinh dang file, cach dinh danh lan preview va hinh thuc xac nhan can thong nhat voi parser CSV cua VT3.
- API import diem phai su dung chung quy tac validation va khoa diem voi API nhap diem truc tiep.

### 6.8. Quy uoc ma loi

Su dung ma loi chung do VT1 da quy dinh:

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
5. Xac nhan cach lien ket voi LockStatus va AuditLog cua VT5.

### 7.2. Quy tac diem

1. Xac nhan mien gia tri diem.
2. Xac nhan so chu so thap phan.
3. Xac nhan cach xu ly diem vang, mien hoac trang thai dac biet.
4. Xac nhan cong thuc tinh tong ket.
5. Xac nhan he so va quy tac lam tron.
6. Xac nhan trang thai phe duyet cong thuc.

### 7.3. Lich su hoc tap

1. Xac nhan cach xu ly diem khi hoc sinh chuyen lop trong cung nien khoa.
2. Xac nhan cach hien thi diem cua lop cu va lop moi.
3. Xac nhan xu ly diem da khoa khi hoc sinh chuyen lop.
4. Bao dam khong mat du lieu diem lich su.

### 7.4. Tich hop API

1. VT1 xac nhan endpoint va quy uoc JSON.
2. VT1 xac nhan middleware KHAO_THI.
3. VT2 xac nhan du lieu can hien thi tren giao dien.
4. VT3 xac nhan lien ket Enrollment va Subject.
5. VT5 xac nhan co che kiem tra khoa, mo khoa va AuditLog.
6. Nhom xac nhan pham vi khoa diem truoc khi lap trinh.

## 8. Noi dung ban giao VT4-01

### 8.1. Thong tin cong viec

- Ma cong viec: VT4-01.
- Du an: He thong quan ly ket qua hoc tap hoc sinh THPT.
- Ten tai lieu: vt4-score-design.md.
- Duong dan: docs/vt4-score-design.md.
- Branch: feature/vt4-01-score-design.

### 8.2. Noi dung da thiet ke

1. Xac dinh hai thuc the ScoreRecord va ScoreComponent.
2. De xuat thuoc tinh, kieu du lieu va rang buoc.
3. Xac dinh quan he voi Enrollment va Subject cua VT3.
4. Xay dung Business Rules quan ly diem.
5. Xac dinh quy tac 0/NULL, validation va bao toan lich su.
6. Mo ta nguyen tac tinh diem tong ket.
7. Thiet ke API Contract de xuat.
8. Xac dinh cac noi dung can VT1, VT2, VT3 va VT5 xac nhan.

### 8.3. Noi dung ban giao cho cac thanh vien

VT1:

- Su dung schema ScoreRecord va ScoreComponent de tong hop ERD.
- Review khoa chinh, khoa ngoai va rang buoc.
- Xac nhan API Contract.
- Xac nhan co che transaction va version.
- Tong hop cac quy tac can phe duyet.

VT2:

- Su dung API Contract de thiet ke bang diem theo Figma.
- Thiet ke giao dien hien thi 5 thanh phan diem.
- Hien thi diem 0, diem chua nhap va canh bao.
- Hien thi trang thai khoa va loi nhap diem.
- Thiet ke giao dien diem tong ket va import CSV.

VT3:

- Xac nhan lien ket Enrollment va Subject.
- Thong nhat xu ly diem khi hoc sinh chuyen lop.
- Bao toan lich su hoc tap theo nien khoa.
- Ban giao parser CSV cho cong viec VT4-05.

VT5:

- Xac nhan pham vi khoa diem theo nien khoa, lop, mon hoc va thanh phan.
- Thong nhat co che kiem tra khoa truoc khi ghi diem.
- Thong nhat transaction va AuditLog.
- Kiem tra quy tac mo khoa, chinh sua va khoa lai.

### 8.4. Tieu chi hoan thanh VT4-01

- Da thiet ke ScoreRecord va ScoreComponent.
- Da mo ta quan he voi du lieu VT3.
- Da de xuat cac rang buoc PostgreSQL.
- Da xay dung Business Rules.
- Da mo ta quy tac tinh diem tong ket.
- Da thiet ke API Contract de xuat.
- Da ghi ro cac noi dung chua duoc phe duyet.
- Tai lieu duoc dua len branch rieng.
- Pull Request duoc tao de VT1 review.
- Tai lieu duoc ban giao cho cac thanh vien lien quan.

## 9. Ket luan

VT4-01 cung cap ban thiet ke de xuat cho module quan ly diem cua he thong.

Thiet ke tuan thu cac yeu cau nghiep vu trong bao cao khao sat va quy uoc ky thuat cua nhom.
## 10. Bo sung dong bo voi VT3-01

### 10.1. Noi dung da doi chieu

Da doi chieu voi ban cap nhat VT3-01, commit 35b10fa, bao gom cac Business Rules BR-59 den BR-67.

Thong nhat ve mat dinh huong thiet ke:

- ScoreRecord tham chieu enrollment_id va subject_id.
- ScoreComponent tham chieu score_record_id.
- Bao toan ScoreRecord va ScoreComponent da phat sinh khi hoc sinh chuyen lop.
- Giu nguyen lich su diem cua nien khoa cu khi hoc sinh chuyen nien khoa.
- Khong tu dong sao chep hoac chuyen diem sang Enrollment moi neu chua co quy tac duoc phe duyet.
- Khong tu dong mo khoa, xoa khoa hoac bo qua trang thai khoa diem khi chuyen lop.
- Thao tac thay doi Enrollment phai dam bao tinh nhat quan du lieu.

### 10.2. Noi dung can xac nhan truoc khi chot schema

- VT1: Xac nhan khoa ngoai, UNIQUE, migration va co che version.
- VT3 va VT4: Thong nhat cach su dung diem lop cu tai lop moi.
- VT4 va VT1: Xac nhan cach tinh diem tong ket khi chuyen lop.
- VT5: Xac nhan anh huong cua chuyen lop den khoa diem va AuditLog.
- Nhom: Xac nhan co quan ly diem theo hoc ky hay khong. Neu co, can xem xet bo sung hoc ky vao pham vi dinh danh ScoreRecord.

### 10.3. Theo doi phe duyet quy tac diem

| Noi dung | Phuong an hien tai | Trang thai |
|---|---|---|
| Mien diem | De xuat 0 den 10 | CHO XAC NHAN |
| So chu so thap phan | Chua chot | CHO XAC NHAN |
| Cong thuc tong ket | Chua co cong thuc duoc duyet | CHO PHE DUYET |
| He so tung cot | Chua chot | CHO PHE DUYET |
| Quy tac lam tron | Chua chot | CHO PHE DUYET |
| Xu ly thieu diem | Khong tinh khi thieu diem bat buoc | DA MO TA |
| Xu ly vang, mien | Chua chot | CHO XAC NHAN |
| Diem khi chuyen lop | Bao toan lich su, chua chot cach su dung lai | CHO XAC NHAN |
| Trang thai khoa diem | Tich hop voi VT5 | CHO XAC NHAN |

Khi co quyet dinh chinh thuc, can cap nhat cong thuc, he so, quy tac lam tron, nguoi phe duyet va thoi diem phe duyet.

### 10.4. Ket luan ban giao

Da hoan thanh ban thiet ke de xuat VT4-01 va bo sung doi chieu voi thiet ke VT3-01.

Tai lieu da co schema diem, API Contract, Business Rules va danh sach cac quy tac chua duoc phe duyet.

Trang thai: HOAN THANH BAN THIET KE DE XUAT - CHO VT1 REVIEW VA NHOM XAC NHAN.

Chua xem cac quy tac dang cho phe duyet la schema hoac cong thuc chinh thuc.

Cac quy tac chua duoc phe duyet duoc ghi ro va khong mac dinh la quy tac chinh thuc.

Trang thai: BAN THIET KE DE XUAT - CHO NHOM REVIEW.

Chi chot database va trien khai API thuc te sau khi cac phan phu thuoc duoc thong nhat.
