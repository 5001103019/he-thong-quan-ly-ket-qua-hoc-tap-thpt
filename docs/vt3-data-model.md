
# VT3-01 - THIET KE DU LIEU QUAN LY HOC SINH THPT

## 1. Muc tieu
Thiet ke du lieu quan ly nien khoa, khoi, lop, hoc sinh, phan lop va mon hoc.

## 2. Cac thuc the
1. AcademicYear - Nien khoa
2. Grade - Khoi lop
3. Class - Lop hoc
4. Student - Hoc sinh
5. Enrollment - Lich su phan lop
6. Subject - Mon hoc

## 3. Thuoc tinh va rang buoc du lieu

### 3.1. AcademicYear - Nien khoa

Muc dich: Luu thong tin cac nien khoa trong he thong.

| Thuoc tinh | Kieu du lieu PostgreSQL | Rang buoc | Mo ta |
|---|---|---|---|
| academic_year_id | BIGSERIAL | PRIMARY KEY | Ma dinh danh nien khoa |
| code | VARCHAR(9) | NOT NULL, UNIQUE | Ma nien khoa, VD: 2025-2026 |
| start_year | SMALLINT | NOT NULL | Nam bat dau |
| end_year | SMALLINT | NOT NULL | Nam ket thuc |
| status | VARCHAR(20) | NOT NULL | PLANNED, ACTIVE hoac CLOSED |

Quy tac du lieu du kien:
- Moi nien khoa co mot ma duy nhat.
- end_year = start_year + 1.
- Ma nien khoa phai khop voi start_year va end_year.
- Khong cho phep tao hai nien khoa trung ma.
- Khong xoa cung nien khoa da co lop, hoc sinh hoac diem lien quan.
- Cac gia tri status la de xuat, can VT1 xac nhan truoc khi tao database.

Du lieu minh hoa:
- 2025-2026 | 2025 | 2026 | CLOSED
- 2026-2027 | 2026 | 2027 | ACTIVE

Luu y: Trang thai minh hoa can duoc nhom xac nhan.


### 3.2. Grade - Khoi lop

Muc dich: Luu thong tin cac khoi lop 10, 11, 12 trong truong THPT.

| Thuoc tinh | Kieu du lieu PostgreSQL | Rang buoc | Mo ta |
|---|---|---|---|
| grade_id | SMALLSERIAL | PRIMARY KEY | Ma dinh danh khoi lop |
| grade_number | SMALLINT | NOT NULL, UNIQUE, CHECK (grade_number IN (10, 11, 12)) | So khoi: 10, 11 hoac 12 |

Quy tac du lieu du kien:
- He thong chi quan ly 3 khoi: 10, 11 va 12.
- Moi khoi co mot ma dinh danh duy nhat.
- Khong cho phep tao hai khoi co cung grade_number.
- Moi khoi co the duoc su dung trong nhieu nien khoa.
- Khong xoa khoi neu da co lop hoc tham chieu den khoi do.
- Grade la danh muc dung chung, khong luu academic_year_id trong bang Grade.
- Bang Class se lien ket voi Grade va AcademicYear.

Du lieu minh hoa:
- grade_id = 1 | grade_number = 10
- grade_id = 2 | grade_number = 11
- grade_id = 3 | grade_number = 12

Luu y: Day la schema de xuat cho VT3-01, can VT1 xac nhan truoc khi tao database.



### 3.3. Class - Lop hoc

Muc dich: Luu thong tin cac lop hoc theo tung nien khoa va khoi lop.

| Thuoc tinh | Kieu du lieu PostgreSQL | Rang buoc | Mo ta |
|---|---|---|---|
| class_id | BIGSERIAL | PRIMARY KEY | Ma dinh danh lop hoc |
| academic_year_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu AcademicYear |
| grade_id | SMALLINT | NOT NULL, FOREIGN KEY | Tham chieu Grade |
| code | VARCHAR(20) | NOT NULL | Ma lop, VD: 10A1 |
| name | VARCHAR(100) | NOT NULL | Ten lop, VD: Lop 10A1 |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Trang thai lop |

Rang buoc du lieu du kien:
- academic_year_id tham chieu academic_year(academic_year_id).
- grade_id tham chieu grade(grade_id).
- UNIQUE (academic_year_id, code).
- status IN ('ACTIVE', 'INACTIVE').
- Moi lop thuoc dung mot nien khoa va mot khoi.
- Khong duoc trung ma lop trong cung mot nien khoa.
- Cho phep trung ma lop o hai nien khoa khac nhau.
- Ma lop phai phu hop voi khoi lop duoc chon.
- Khong xoa cung lop da co hoc sinh, lich su phan lop hoac diem lien quan.
- Khi hoc sinh chuyen lop, khong ghi de lich su lop cu.
- Quan he hoc sinh va lop duoc quan ly qua bang Enrollment.

Du lieu minh hoa:
- 2025-2026 | 10 | 10A1 | Lop 10A1 | ACTIVE
- 2025-2026 | 11 | 11A1 | Lop 11A1 | ACTIVE
- 2025-2026 | 12 | 12A1 | Lop 12A1 | ACTIVE
- 2026-2027 | 10 | 10A1 | Lop 10A1 | ACTIVE
- 2026-2027 | 11 | 11A1 | Lop 11A1 | ACTIVE
- 2026-2027 | 12 | 12A1 | Lop 12A1 | ACTIVE

Luu y:
- Day la schema de xuat cho VT3-01.
- Gia tri status va quy tac chuyen lop can VT1 xac nhan.
- Pham vi demo moi khoi co mot lop; schema van ho tro nhieu lop.
- Khong tu y tao database truoc khi schema duoc nhom thong nhat.



### 3.4. Student - Hoc sinh

Muc dich: Luu thong tin ho so hoc sinh trong truong THPT.

| Thuoc tinh | Kieu du lieu PostgreSQL | Rang buoc | Mo ta |
|---|---|---|---|
| student_id | BIGSERIAL | PRIMARY KEY | Ma dinh danh noi bo cua hoc sinh |
| student_code | VARCHAR(30) | NOT NULL, UNIQUE | Ma hoc sinh, VD: HS0001 |
| full_name | VARCHAR(150) | NOT NULL | Ho va ten hoc sinh |
| date_of_birth | DATE | NOT NULL | Ngay sinh hoc sinh |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Trang thai ho so hoc sinh |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thoi diem tao ho so |

Rang buoc du lieu du kien:
- Moi hoc sinh co mot student_id duy nhat.
- student_code la duy nhat trong toan he thong, khong trung giua cac nien khoa.
- student_code khong duoc rong va phai theo quy tac ma do nhom thong nhat.
- full_name khong duoc rong hoac chi chua khoang trang.
- date_of_birth phai la ngay hop le, khong nam trong tuong lai.
- status chi nhan ACTIVE hoac INACTIVE trong ban de xuat.
- Khong xoa cung hoc sinh da co lich su phan lop hoac ket qua hoc tap.
- Khi hoc sinh ngung hoat dong, cap nhat status thay vi xoa ho so.
- Mot hoc sinh co the hoc qua nhieu nien khoa va nhieu lop khac nhau.
- Khong luu class_id va academic_year_id truc tiep trong bang Student.
- Quan he hoc sinh, lop va nien khoa duoc quan ly qua Enrollment.
- Khi chuyen lop, giu nguyen student_id va student_code.
- Viec lien ket tai khoan dang nhap voi hoc sinh can thong nhat voi VT1.

Du lieu minh hoa:
- HS0001 | Nguyen Minh An | 2010-07-15 | ACTIVE
- HS0002 | Tran Gia Bao | 2010-03-20 | ACTIVE
- HS0003 | Le Hoang Nam | 2009-11-10 | INACTIVE

Luu y:
- Day la schema de xuat cho VT3-01.
- Quy tac ma hoc sinh, truong bat buoc va cac gia tri status can VT1 xac nhan.
- Khong tu y xoa hoc sinh hoac lich su hoc tap da ton tai.
- Khong tu y tao database truoc khi schema duoc nhom thong nhat.



### 3.5. Enrollment - Lich su phan lop

Muc dich: Luu lich su hoc sinh duoc phan vao lop hoc theo tung nien khoa, bao toan du lieu khi chuyen lop hoac len lop.

| Thuoc tinh | Kieu du lieu PostgreSQL | Rang buoc | Mo ta |
|---|---|---|---|
| enrollment_id | BIGSERIAL | PRIMARY KEY | Ma dinh danh lan phan lop |
| student_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu Student |
| class_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu Class |
| academic_year_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu AcademicYear |
| start_date | DATE | NOT NULL | Ngay bat dau hoc tai lop |
| end_date | DATE | NULL | Ngay ket thuc hoc tai lop, moc ket thuc khong bao gom ngay nay |
| exit_reason | VARCHAR(20) | NULL | Ly do ket thuc: TRANSFER, COMPLETED, WITHDRAWN |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thoi diem tao ban ghi |

Rang buoc du lieu du kien:
- student_id tham chieu student(student_id).
- class_id tham chieu class(class_id).
- academic_year_id tham chieu academic_year(academic_year_id).
- academic_year_id phai trung voi nien khoa cua Class duoc tham chieu.
- Can bo sung UNIQUE (class_id, academic_year_id) trong Class de ho tro khoa ngoai kep tu Enrollment.
- Su dung FOREIGN KEY (class_id, academic_year_id) tham chieu Class (class_id, academic_year_id).
- end_date co the NULL neu hoc sinh dang hoc tai lop.
- Neu end_date khac NULL thi end_date > start_date.
- Neu end_date khac NULL, exit_reason phai duoc ghi nhan.
- Mot hoc sinh chi co toi da mot ban ghi phan lop dang hoat dong trong mot nien khoa.
- De xuat unique index tren (student_id, academic_year_id) voi dieu kien end_date IS NULL.
- Khong cho phep cac khoang thoi gian phan lop cua cung hoc sinh trong mot nien khoa chong lan nhau.
- Khong xoa ban ghi phan lop cu khi hoc sinh chuyen lop.
- Khong duoc ghi de class_id cua ban ghi lich su.
- Diem cua hoc sinh phai gan dung voi lan phan lop va nien khoa tuong ung.

Quy tac khi chuyen lop:
1. Tim ban ghi Enrollment dang hoat dong cua hoc sinh trong nien khoa.
2. Ket thuc ban ghi cu bang cach cap nhat end_date va exit_reason = TRANSFER.
3. Tao ban ghi Enrollment moi voi class_id cua lop moi.
4. Giu nguyen student_id va student_code.
5. Khong thay doi hoac xoa lich su diem cua lop cu.
6. Thuc hien cac thay doi trong mot transaction de tranh du lieu khong nhat quan.

Quy tac khi len lop o nien khoa moi:
- Giu nguyen ho so Student.
- Tao Enrollment moi cho nien khoa moi.
- Lien ket voi Class thuoc khoi lop moi.
- Bao toan toan bo Enrollment va diem cua nien khoa truoc.

Du lieu minh hoa:
- HS0001 | 2025-2026 | 10A1 | 2025-09-05 | 2026-06-01 | COMPLETED
- HS0001 | 2026-2027 | 11A1 | 2026-09-05 | NULL | NULL
- HS0002 | 2026-2027 | 10A1 | 2026-09-05 | NULL | NULL

Luu y:
- Khong luu class_id truc tiep trong Student.
- Enrollment la bang trung gian giua Student va Class.
- Trang thai dang hoc tai lop duoc xac dinh qua end_date IS NULL.
- Quy tac chuyen lop va pham vi bao toan diem can thong nhat voi VT1 va VT4.
- Day la schema de xuat cho VT3-01, chua phai database chinh thuc.


### 3.5.1. Rang buoc thoi gian Enrollment

Quy uoc khoang thoi gian:
- Su dung khoang [start_date, end_date).
- start_date la ngay bat dau, duoc bao gom.
- end_date la ngay ket thuc, khong duoc bao gom.
- end_date = NULL nghia la chua ghi nhan ngay ket thuc.
- Neu end_date khac NULL thi bat buoc end_date > start_date.
- Khong cho phep mot hoc sinh co hai khoang thoi gian phan lop chong lan trong cung nien khoa.

Rang buoc CHECK de xuat:

    CHECK (end_date IS NULL OR end_date > start_date)

Rang buoc tinh nhat quan:
- Neu end_date IS NULL thi exit_reason phai NULL.
- Neu end_date IS NOT NULL thi exit_reason phai co gia tri hop le.
- Khi chuyen lop, end_date cua Enrollment cu bang start_date cua Enrollment moi.
- Enrollment co start_date trong tuong lai chua duoc xem la dang hoc tai ngay hien tai.

Vi du hop le:
- Lop 10A1: 2026-09-05 den 2026-10-20.
- Lop 10A2: 2026-10-20 den NULL.
- Hai khoang thoi gian lien tiep, khong chong lan.

Vi du khong hop le:
- Lop 10A1: 2026-09-05 den 2026-10-25.
- Lop 10A2: 2026-10-20 den NULL.
- Hai khoang thoi gian chong lan tu 20/10 den truoc 25/10.

### 3.5.2. Co che ngan chong lan thoi gian

Phuong an PostgreSQL de xuat:

1. Su dung CHECK de dam bao end_date > start_date khi co ngay ket thuc.
2. Su dung EXCLUDE CONSTRAINT voi GiST va daterange de ngan cac khoang thoi gian chong lan.
3. So sanh theo student_id va academic_year_id.
4. Su dung khoang thoi gian [start_date, end_date).
5. end_date NULL duoc hieu la khoang chua co gioi han ket thuc.
6. Thao tac chuyen lop phai duoc thuc hien trong transaction.
7. Khong chi dua vao validation cua API vi hai request dong thoi co the gay xung dot.

SQL minh hoa, chua thuc thi:

    CREATE EXTENSION IF NOT EXISTS btree_gist;

    ALTER TABLE enrollment
    ADD CONSTRAINT enrollment_valid_dates
    CHECK (end_date IS NULL OR end_date > start_date);

    ALTER TABLE enrollment
    ADD CONSTRAINT enrollment_no_overlap
    EXCLUDE USING gist (
        student_id WITH =,
        academic_year_id WITH =,
        daterange(start_date, end_date, '[)') WITH &&
    );

Giai thich:
- btree_gist ho tro so sanh bang tren cac cot ID trong GiST.
- daterange tao khoang thoi gian tu start_date den end_date.
- [) la quy uoc bao gom ngay dau, khong bao gom ngay cuoi.
- Toan tu && kiem tra hai khoang thoi gian co giao nhau hay khong.
- Khi end_date NULL, daterange co can tren mo rong.
- EXCLUDE ngan hai ban ghi cung hoc sinh va nien khoa co khoang thoi gian giao nhau.

Co the duy tri them partial unique index:

    CREATE UNIQUE INDEX enrollment_one_open_per_year
    ON enrollment (student_id, academic_year_id)
    WHERE end_date IS NULL;

Chi muc nay ngan hai Enrollment chua ket thuc trong cung nien khoa.
EXCLUDE CONSTRAINT moi la co che ngan chong lan lich su day du.

Luu y:
- SQL tren la phuong an thiet ke de xuat.
- Ten bang va ten cot phai thong nhat voi VT1.
- VT1 phu trach review, dua rang buoc vao database migrations va kiem thu.
- VT3 khong tu y chay ALTER TABLE tren database chung.


### 3.6. Subject - Mon hoc

Muc dich: Luu thong tin danh muc cac mon hoc trong truong THPT, phuc vu quan ly va nhap ket qua hoc tap.

| Thuoc tinh | Kieu du lieu PostgreSQL | Rang buoc | Mo ta |
|---|---|---|---|
| subject_id | BIGSERIAL | PRIMARY KEY | Ma dinh danh noi bo cua mon hoc |
| code | VARCHAR(20) | NOT NULL, UNIQUE | Ma mon hoc, VD: TOAN |
| name | VARCHAR(100) | NOT NULL | Ten mon hoc |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Trang thai mon hoc |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thoi diem tao mon hoc |

Rang buoc du lieu du kien:
- Moi mon hoc co mot subject_id duy nhat.
- code la duy nhat trong toan he thong.
- code khong duoc rong hoac chi chua khoang trang.
- name khong duoc rong hoac chi chua khoang trang.
- Khong cho phep tao hai mon hoc co cung code.
- De xuat chuan hoa code thanh chu in hoa truoc khi luu.
- Can dam bao ma mon hoc khong trung khi khac chu hoa/thuong.
- status chi nhan ACTIVE hoac INACTIVE.
- Moi mon hoc co the duoc su dung trong nhieu nien khoa.
- Moi mon hoc co the duoc giang day o nhieu khoi lop.
- Khong luu truc tiep academic_year_id hoac grade_id trong Subject.
- Neu can quan ly mon hoc duoc mo cho tung khoi/nien khoa, phai thong nhat them bang lien ket voi VT1.
- Khong xoa cung mon hoc da co ket qua hoc tap lien quan.
- Khi ngung su dung mon hoc, cap nhat status = INACTIVE.
- Mon hoc INACTIVE khong duoc chon cho viec tao du lieu diem moi, nhung van phai hien thi duoc trong lich su.
- Subject se duoc tham chieu boi phan quan ly diem cua VT4.

Du lieu minh hoa:
- TOAN | Toan | ACTIVE
- NGUVAN | Ngu van | ACTIVE
- TIENGANH | Tieng Anh | ACTIVE

Quy tac nghiep vu de xuat:
1. Phong Khao thi co quyen them, sua va tra cuu mon hoc.
2. Khi them mon hoc, he thong kiem tra ma trung.
3. Khi sua mon hoc, khong duoc lam sai lech du lieu diem da luu.
4. Khong xoa cung mon hoc neu da duoc tham chieu.
5. Mon hoc ngung hoat dong van duoc hien thi khi tra cuu lich su.
6. Hoc sinh chi duoc xem ket qua cac mon hoc cua chinh minh theo quyen truy cap.

Luu y:
- Day la schema de xuat cho VT3-01.
- Quy tac ma mon hoc, trang thai va pham vi theo khoi can VT1 xac nhan.
- Can thong nhat voi VT4 ve khoa ngoai subject_id trong bang diem.
- Khong tu y tao database truoc khi schema duoc nhom thong nhat.

## 4. Quan he giua cac thuc the

### 4.1. Tong quan cac moi quan he

| Thuc the cha | Thuc the con | Quan he | Khoa ngoai |
|---|---|---|---|
| AcademicYear | Class | 1 - N | Class.academic_year_id |
| Grade | Class | 1 - N | Class.grade_id |
| AcademicYear | Enrollment | 1 - N | Enrollment.academic_year_id |
| Class | Enrollment | 1 - N | Enrollment.class_id |
| Student | Enrollment | 1 - N | Enrollment.student_id |

Giai thich:
- Mot AcademicYear co the co nhieu Class.
- Mot Grade co the duoc su dung boi nhieu Class.
- Moi Class thuoc dung mot AcademicYear va mot Grade.
- Mot Student co the co nhieu Enrollment.
- Moi Enrollment lien ket voi dung mot Student va mot Class.
- Mot AcademicYear co the co nhieu Enrollment.
- Subject la danh muc mon hoc, se lien ket voi bang diem do VT4 thiet ke.

### 4.2. Quan he AcademicYear - Class

Loai quan he: 1 - N.

- Mot nien khoa co the co nhieu lop hoc.
- Moi lop hoc chi thuoc mot nien khoa.
- Khoa chinh cua AcademicYear: academic_year_id.
- Khoa ngoai cua Class: academic_year_id.

Vi du:
- Nien khoa 2025-2026 co lop 10A1, 11A1, 12A1.
- Nien khoa 2026-2027 co lop 10A1, 11A1, 12A1.
- Hai lop 10A1 thuoc hai nien khoa khac nhau la hai ban ghi Class khac nhau.

Rang buoc:
UNIQUE (academic_year_id, code).

### 4.3. Quan he Grade - Class

Loai quan he: 1 - N.

- Mot khoi lop co the co nhieu lop.
- Moi lop hoc chi thuoc mot khoi.
- Khoa chinh cua Grade: grade_id.
- Khoa ngoai cua Class: grade_id.

Vi du:
- Grade 10 co the co lop 10A1, 10A2.
- Grade 11 co the co lop 11A1, 11A2.
- Grade 12 co the co lop 12A1, 12A2.

Pham vi demo cua nhom: moi khoi co mot lop trong tung nien khoa.

### 4.4. Quan he Student - Enrollment

Loai quan he: 1 - N.

- Mot hoc sinh co the co nhieu lan phan lop.
- Moi lan phan lop chi thuoc mot hoc sinh.
- Khoa chinh cua Student: student_id.
- Khoa ngoai cua Enrollment: student_id.

Vi du:
- HS0001 hoc lop 10A1 trong nien khoa 2025-2026.
- HS0001 hoc lop 11A1 trong nien khoa 2026-2027.

Hai lan phan lop la hai ban ghi Enrollment khac nhau.

Khi hoc sinh chuyen lop, khong xoa lich su phan lop cu.

### 4.5. Quan he Class - Enrollment

Loai quan he: 1 - N.

- Mot lop hoc co the co nhieu hoc sinh.
- Moi Enrollment chi lien ket voi mot lop.
- Khoa chinh cua Class: class_id.
- Khoa ngoai cua Enrollment: class_id.

Vi du:
- Lop 10A1 co HS0001, HS0002, HS0003.
- Moi hoc sinh co mot ban ghi Enrollment rieng.

Student va Class co quan he nhieu - nhieu theo thoi gian, duoc quan ly thong qua Enrollment.

### 4.6. Quan he AcademicYear - Enrollment

Loai quan he: 1 - N.

- Mot nien khoa co the co nhieu ban ghi Enrollment.
- Moi Enrollment thuoc mot nien khoa.
- Khoa ngoai: Enrollment.academic_year_id.

Rang buoc nhat quan:
- Enrollment.academic_year_id phai trung voi Class.academic_year_id.
- Can thiet ke rang buoc khoa ngoai kep de tranh phan lop sai nien khoa.
- Class can co UNIQUE (class_id, academic_year_id) de ho tro khoa ngoai kep.
- FOREIGN KEY (class_id, academic_year_id) REFERENCES Class(class_id, academic_year_id).

### 4.7. Quan he Subject voi du lieu diem

Subject luu danh muc mon hoc dung chung.

- Mot mon hoc co the duoc su dung trong nhieu nien khoa.
- Mot mon hoc co the co nhieu ban ghi ket qua hoc tap.
- Khoa chinh cua Subject: subject_id.
- Bang diem do VT4 thiet ke se tham chieu subject_id.

De xuat:
- Khong xoa cung mon hoc da co diem.
- Subject INACTIVE van phai tra cuu duoc diem lich su.
- VT3 can thong nhat voi VT4 ve khoa ngoai subject_id.

### 4.8. Quy tac bao toan lich su phan lop

BR-01: Moi hoc sinh co mot student_code duy nhat.

BR-02: Moi lop thuoc mot nien khoa va mot khoi lop.

BR-03: Khong trung ma lop trong cung nien khoa.

BR-04: Mot hoc sinh chi co toi da mot Enrollment dang hoat dong trong moi nien khoa.

BR-05: Khong cho phep cac khoang thoi gian phan lop cua mot hoc sinh chong lan nhau trong cung nien khoa.

BR-06: Khi chuyen lop, ket thuc Enrollment cu va tao Enrollment moi.

BR-07: Khong xoa Enrollment cu khi chuyen lop.

BR-08: Khong xoa cung Student, Class hoac Subject neu da co du lieu diem lien quan.

BR-09: Moi lan phan lop phai dung nien khoa cua Class.

BR-10: Thay doi Enrollment phai duoc xu ly trong transaction.

### 4.9. Cac diem can thong nhat voi VT1 va VT4

- Ten bang PostgreSQL chinh thuc va quy uoc dat ten khoa.
- Quy tac chuyen lop khi hoc sinh da co diem.
- Rang buoc ngan khoang thoi gian Enrollment chong lan.
- Co can them bang lien ket Subject voi khoi/nien khoa hay khong.
- Bang diem cua VT4 se lien ket voi enrollment_id hay cac khoa tuong ung.
- Quy tac trang thai ACTIVE/INACTIVE cua Student, Class va Subject.

Ket luan:
Day la thiet ke quan he de xuat cua VT3-01.
Can VT1, VT4 va VT5 xem xet truoc khi chot schema database.

### 4.10. Phan hoi VT4 - Lien ket du lieu diem

#### 4.10.1. Phuong an lien ket

Theo phan hoi thiet ke VT4-01, de xuat cac quan he:

| Thuc the cha | Thuc the con | Quan he | Khoa ngoai |
|---|---|---|---|
| Enrollment | ScoreRecord | 1 - N | ScoreRecord.enrollment_id |
| Subject | ScoreRecord | 1 - N | ScoreRecord.subject_id |
| ScoreRecord | ScoreComponent | 1 - N | ScoreComponent.score_record_id |

Giai thich:
- ScoreRecord tham chieu enrollment_id de xac dinh lan phan lop cua hoc sinh.
- ScoreRecord tham chieu subject_id de xac dinh mon hoc.
- ScoreComponent tham chieu score_record_id de luu diem thanh phan.
- Cac thanh phan diem gom QT1, QT2, QT3, GK va CK.
- Student, Class va AcademicYear duoc xac dinh thong qua Enrollment.
- Khong can thay doi student_id khi hoc sinh chuyen lop.

#### 4.10.2. Rang buoc khoa ngoai de xuat

- ScoreRecord.enrollment_id tham chieu Enrollment.enrollment_id.
- ScoreRecord.subject_id tham chieu Subject.subject_id.
- ScoreComponent.score_record_id tham chieu ScoreRecord.score_record_id.
- Khong xoa cung Enrollment neu da co ScoreRecord tham chieu.
- Khong xoa cung Subject neu da co ScoreRecord tham chieu.
- Khong xoa ScoreRecord hoac ScoreComponent chi vi hoc sinh chuyen lop.
- Can thong nhat quy tac UNIQUE cho ScoreRecord theo pham vi bang diem thuc te.
- Neu quan ly diem theo hoc ky, can xac dinh them hoc ky trong khoa dinh danh phu hop.
- Khong tu y chot cau truc bang diem thay VT4.

#### 4.10.3. Bao toan diem khi chuyen lop

Vi du:
- HS0001 dang hoc lop 10A1 trong nien khoa 2025-2026.
- Hoc sinh da co diem mon Toan tai lop 10A1.
- Hoc sinh chuyen sang lop 10A2 trong cung nien khoa.

Phuong an bao toan du lieu:
1. Giu nguyen Student va student_id.
2. Ket thuc Enrollment cua lop 10A1.
3. Tao Enrollment moi cho lop 10A2.
4. Giu nguyen ScoreRecord da lien ket voi Enrollment cu.
5. Giu nguyen cac ScoreComponent da phat sinh.
6. Khong tu dong chuyen khoa ngoai enrollment_id cua diem cu sang Enrollment moi.
7. Khong tu dong sao chep hoac ghi de diem cu.
8. Viec su dung diem cu tai lop moi can nhom thong nhat.
9. Phai xem xet trang thai khoa diem truoc khi cho phep sua.
10. Thao tac chuyen lop phai bao dam tinh nhat quan du lieu.

#### 4.10.4. Bao toan diem khi chuyen nien khoa

- Tao Enrollment moi cho nien khoa moi.
- Giu nguyen Enrollment va ScoreRecord cua nien khoa truoc.
- Khong tu dong sao chep diem cua nien khoa cu sang nien khoa moi.
- Hoc sinh van co the tra cuu ket qua hoc tap lich su theo quyen.
- Cach tinh tong ket phai dua tren quy tac duoc nhom phe duyet.

#### 4.10.5. Noi dung can VT1, VT4 va VT5 xac nhan

VT1:
- Xac nhan cac khoa ngoai va migration.
- Xac nhan rang buoc UNIQUE cua ScoreRecord.
- Xac nhan transaction khi chuyen lop.

VT4:
- Xac nhan cau truc ScoreRecord va ScoreComponent.
- Xac nhan cach su dung diem lop cu tai lop moi.
- Xac nhan cach tinh diem tong ket khi chuyen lop.

VT5:
- Xac nhan trang thai khoa diem cua lop cu.
- Xac nhan co che khoa diem tai lop moi.
- Xac nhan viec chuyen lop khong vuot qua kiem tra khoa diem.

Ket luan:
VT3 ghi nhan va dong y ve mat dinh huong voi de xuat lien ket cua VT4.
Cac quan he va quy tac chua duoc xem la schema chinh thuc cho den khi nhom phe duyet.


## 5. Quy tac nghiep vu

### 5.1. Quy tac quan ly nien khoa

BR-11: Moi nien khoa phai co ma duy nhat.

BR-12: Nam ket thuc phai bang nam bat dau cong 1.

BR-13: Ma nien khoa phai phu hop voi nam bat dau va nam ket thuc.

BR-14: Khong duoc tao nien khoa trung ma.

BR-15: Khong xoa cung nien khoa da co lop, hoc sinh hoac ket qua hoc tap lien quan.

### 5.2. Quy tac quan ly khoi lop

BR-16: He thong chi cho phep cac khoi 10, 11 va 12.

BR-17: Khong cho phep tao hai khoi co cung grade_number.

BR-18: Moi khoi co the duoc su dung trong nhieu nien khoa.

BR-19: Khong xoa khoi da duoc lop hoc tham chieu.

### 5.3. Quy tac quan ly lop hoc

BR-20: Moi lop phai thuoc dung mot nien khoa va mot khoi.

BR-21: Khong duoc trung ma lop trong cung nien khoa.

BR-22: Cho phep trung ma lop o hai nien khoa khac nhau.

BR-23: Ma lop phai phu hop voi khoi lop duoc chon.

BR-24: Khong xoa cung lop da co lich su phan lop hoac diem.

BR-25: Khi ngung su dung lop, he thong cap nhat trang thai thay vi xoa lich su.

### 5.4. Quy tac quan ly hoc sinh

BR-26: Moi hoc sinh phai co student_code duy nhat trong toan he thong.

BR-27: Ho ten hoc sinh khong duoc rong hoac chi chua khoang trang.

BR-28: Ngay sinh phai hop le va khong nam trong tuong lai.

BR-29: Khi sua thong tin hoc sinh, khong duoc tu dong thay doi ma dinh danh noi bo student_id.

BR-30: Khong xoa cung hoc sinh da co lich su phan lop hoac ket qua hoc tap.

BR-31: Khi hoc sinh ngung hoat dong, cap nhat status = INACTIVE va bao toan lich su.

BR-32: Thong tin lop hoc khong luu truc tiep trong Student ma duoc quan ly thong qua Enrollment.

### 5.5. Quy tac phan lop va chuyen lop

BR-33: Enrollment phai tham chieu den Student va Class ton tai.

BR-34: Nien khoa trong Enrollment phai trung voi nien khoa cua Class.

BR-35: Moi hoc sinh chi co toi da mot Enrollment dang hoat dong trong mot nien khoa.

BR-36: Khong cho phep cac khoang thoi gian phan lop cua cung mot hoc sinh trong cung nien khoa chong lan nhau. Su dung khoang [start_date, end_date) va EXCLUDE CONSTRAINT duoc de xuat tai muc 3.5.2.

BR-37: Khi chuyen lop, ket thuc Enrollment cu va tao Enrollment moi.

BR-38: Khong xoa hoac ghi de ban ghi Enrollment cu khi chuyen lop.

BR-39: Khi len lop o nien khoa moi, giu nguyen Student va tao Enrollment moi.

BR-40: Cap nhat chuyen lop phai duoc thuc hien trong transaction.

BR-41: Neu mot buoc trong qua trinh chuyen lop that bai, phai rollback toan bo thao tac.

BR-42: Ket qua hoc tap truoc khi chuyen lop phai duoc bao toan.

### 5.6. Quy tac quan ly mon hoc

BR-43: Moi mon hoc phai co subject_id va code duy nhat.

BR-44: Khong cho phep ma mon hoc rong hoac trung ma.

BR-45: Ten mon hoc khong duoc rong.

BR-46: Mot mon hoc co the duoc su dung trong nhieu nien khoa va khoi lop.

BR-47: Khong xoa cung mon hoc da co diem.

BR-48: Mon hoc INACTIVE van phai tra cuu duoc trong lich su.

BR-49: Mon hoc INACTIVE khong duoc su dung de tao du lieu diem moi theo quy tac de xuat.

### 5.7. Quy tac phan quyen

BR-50: Chi vai tro Phong Khao thi duoc them, sua va quan ly danh muc, ho so hoc sinh va phan lop.

BR-51: Hoc sinh khong duoc goi API quan tri de thay doi thong tin hoc sinh, lop hoac mon hoc.

BR-52: Hoc sinh chi duoc xem ket qua hoc tap cua chinh minh thong qua phien dang nhap hop le.

BR-53: Backend phai kiem tra quyen truy cap, khong chi dua vao giao dien de an chuc nang.

### 5.8. Quy tac kiem tra du lieu va xu ly loi

BR-54: Du lieu dau vao phai duoc kiem tra truoc khi ghi vao database.

BR-55: Khi trung ma dinh danh, API phai tra ve loi theo quy chuan chung cua VT1.

BR-56: Khi tham chieu niên khoa, lop hoac hoc sinh khong ton tai, API phai tra ve loi phu hop.

BR-57: Khi thao tac bi tu choi do vi pham quy tac nghiep vu, khong duoc ghi du lieu mot phan.

BR-58: Response API phai su dung cau truc JSON va quy uoc ma loi do VT1 da thong nhat.

### 5.9. Cac quy tac can nhom xac nhan

Cac noi dung sau chua duoc xem la quy tac chinh thuc neu nhom chua duyet:

1. Cac gia tri status cua AcademicYear, Class, Student va Subject.
2. Dinh dang ma hoc sinh va ma mon hoc.
3. Quy trinh xu ly diem khi hoc sinh chuyen lop giua nien khoa.
4. Co cho phep chuyen lop khac khoi trong cung nien khoa hay khong.
5. Quy tac thoi gian bat dau, ket thuc Enrollment.
6. Mon hoc duoc ap dung cho tat ca khoi hay can bang lien ket rieng.
7. Pham vi chinh sua ho so hoc sinh da co ket qua hoc tap.
8. Co cho phep khoi phuc ho so INACTIVE ve ACTIVE hay khong.

Cac quy tac tren can duoc VT1, VT4 va VT5 thong nhat truoc khi trien khai.

### 5.10. Ket luan

Bo quy tac nghiep vu nay la co so de:
- VT1 thiet ke database va middleware phan quyen.
- VT3 lap trinh API danh muc, Student va Enrollment.
- VT4 lien ket du lieu hoc sinh, lop va mon voi bang diem.
- VT5 thiet ke rang buoc khoa diem va lich su thao tac.
- VT2 thiet ke giao dien quan ly phu hop voi cac trang thai du lieu.

Day la ban de xuat VT3-01, can duoc nhom review truoc khi chot.

### 5.11. Bo sung Business Rules theo phan hoi VT4

BR-59: ScoreRecord phai tham chieu den Enrollment hop le.

BR-60: ScoreRecord phai tham chieu den Subject hop le.

BR-61: ScoreComponent phai lien ket voi ScoreRecord tuong ung.

BR-62: Khi hoc sinh chuyen lop, khong xoa hoac ghi de diem da phat sinh tai Enrollment cu.

BR-63: Khi hoc sinh chuyen nien khoa, giu nguyen lich su phan lop va ket qua hoc tap cu.

BR-64: Khong tu dong sao chep diem sang Enrollment moi neu chua co quy tac duoc nhom phe duyet.

BR-65: Viec su dung diem lop cu khi tinh tong ket tai lop moi phai theo quy tac do VT1 va VT4 thong nhat.

BR-66: Viec chuyen lop khong duoc tu dong mo khoa, xoa khoa hoac bo qua trang thai khoa diem.

BR-67: Cac thao tac anh huong den Enrollment va du lieu diem phai dam bao tinh nhat quan va khong lam mat lich su.

Ghi chu:
- BR-59 den BR-67 la cac quy tac de xuat.
- Cac quy tac lien quan den diem va khoa diem can VT1, VT4, VT5 xac nhan.
- VT3 khong tu y trien khai thay phan nghiep vu cua VT4 hoac VT5.

### 5.12. Lam ro quy tac trang thai theo phan hoi VT1

#### 5.12.1. AcademicYear

Trang thai de xuat:

- PLANNED: Nien khoa duoc tao de chuan bi, chua bat dau su dung chinh thuc.
- ACTIVE: Nien khoa dang duoc su dung.
- CLOSED: Nien khoa da ket thuc va duoc dong.

Quy tac de xuat:
- PLANNED: Cho phep cau hinh danh muc phuc vu chuan bi.
- ACTIVE: Cho phep quan ly phan lop theo quyen.
- CLOSED: Khong cho phep tao phan lop moi hoac thay doi du lieu lich su thong thuong.
- CLOSED van cho phep tra cuu du lieu cu.
- Viec mo lai nien khoa CLOSED phai theo quy trinh duoc phe duyet.
- Truoc khi dong nien khoa, can kiem tra cac Enrollment chua co ngay ket thuc.
- Khong dong nghia trang thai CLOSED voi viec da khoa tat ca cac cot diem.

#### 5.12.2. Class

Trang thai de xuat:

- ACTIVE: Lop duoc phep su dung trong cac nghiep vu phan lop hop le.
- INACTIVE: Lop ngung nhan phan lop moi.

Quy tac:
- Lop INACTIVE van duoc tra cuu trong lich su.
- Khong xoa Enrollment va diem cua lop INACTIVE.
- Khong cho phep chuyen hoc sinh vao lop INACTIVE theo quy tac mac dinh de xuat.
- Trang thai Class va AcademicYear la hai thuoc tinh doc lap.

#### 5.12.3. Student

Trang thai de xuat:

- ACTIVE: Ho so hoc sinh dang hoat dong.
- INACTIVE: Ho so hoc sinh ngung hoat dong.

Quy tac:
- Student INACTIVE van giu ma hoc sinh va lich su.
- Khong xoa diem va Enrollment khi doi trang thai Student.
- Viec phan lop moi cho Student INACTIVE can bi chan hoac duoc xu ly theo quy trinh duoc duyet.
- Thay doi status khong tu dong xoa hay ket thuc Enrollment.
- Khi hoc sinh ngung hoc, can thuc hien nghiep vu ket thuc Enrollment rieng.

#### 5.12.4. Subject

Trang thai de xuat:

- ACTIVE: Mon hoc dang duoc su dung.
- INACTIVE: Mon hoc ngung duoc su dung de tao du lieu diem moi.

Quy tac:
- Mon hoc INACTIVE van duoc tra cuu diem lich su.
- Khong xoa ScoreRecord hoac ScoreComponent da co.
- Viec sua diem cu phai theo quy tac khoa diem cua VT5.

#### 5.12.5. Enrollment

Enrollment khong co cot status rieng trong schema VT3 hien tai.

Quy tac:
- start_date xac dinh ngay bat dau phan lop.
- end_date NULL nghia la chua ghi nhan ngay ket thuc.
- end_date khac NULL nghia la lan phan lop da ket thuc vao moc end_date.
- De xac dinh hoc sinh dang hoc tai mot ngay, can kiem tra start_date <= ngay tra cuu va end_date NULL hoac ngay tra cuu < end_date.
- Trang thai nien khoa va lop cung can duoc xem xet theo nghiep vu.

#### 5.12.6. Nguyen tac chung

- ACTIVE/INACTIVE cua Student, Class va Subject khong phai trang thai khoa diem.
- CLOSED la trang thai du kien cua AcademicYear.
- Khoa diem theo tung cot QT1, QT2, QT3, GK, CK do VT5 phu trach.
- Khong xoa du lieu lich su khi thay doi trang thai.
- Cac chuyen doi trang thai va phan quyen can VT1 phe duyet.

Trang thai: De xuat lam ro, cho nhom xac nhan.


## 6. Hop dong API

### 6.1. Quy uoc chung

Base URL:
http://localhost:3000/api/v1

Phuong thuc HTTP:
- GET: Lay danh sach hoac chi tiet.
- POST: Tao du lieu hoac thuc hien nghiep vu.
- PATCH: Cap nhat mot phan du lieu.
- DELETE: Chi su dung khi du lieu duoc phep xoa.

Quy tac:
- Duong dan API dung chu thuong, kebab-case.
- Ten tai nguyen dung danh tu so nhieu.
- Thuoc tinh JSON su dung camelCase.
- Ten bang va cot database su dung snake_case.
- API quan tri yeu cau dang nhap va role KHAO_THI.
- HOC_SINH khong duoc su dung API quan tri VT3.
- Khong xoa cung du lieu da co lich su hoc tap.
- API tra loi phai theo quy chuan cua VT1.

Day la API contract de xuat, can VT1 va cac thanh vien lien quan xac nhan.

### 6.2. API quan ly nien khoa (AcademicYear)

| Method | Endpoint | Chuc nang |
|---|---|---|
| GET | /academic-years | Lay danh sach nien khoa |
| GET | /academic-years/:id | Lay chi tiet nien khoa |
| POST | /academic-years | Tao nien khoa moi |
| PATCH | /academic-years/:id | Cap nhat nien khoa |

Du lieu POST/PATCH de xuat:
- code: Ma nien khoa, VD 2025-2026.
- startYear: Nam bat dau.
- endYear: Nam ket thuc.
- status: PLANNED, ACTIVE hoac CLOSED.

Validation:
- Khong cho phep trung code.
- endYear phai bang startYear + 1.
- Code phai phu hop startYear va endYear.
- Khong xoa cung nien khoa da co du lieu lien quan.
- PATCH chi cho phep sua cac truong duoc nhom quy dinh.

### 6.3. API quan ly khoi lop (Grade)

| Method | Endpoint | Chuc nang |
|---|---|---|
| GET | /grades | Lay danh sach khoi |
| GET | /grades/:id | Lay chi tiet khoi |
| POST | /grades | Tao khoi lop |
| PATCH | /grades/:id | Cap nhat khoi lop |

Du lieu de xuat:
- gradeNumber: 10, 11 hoac 12.

Validation:
- Chi chap nhan khoi 10, 11, 12.
- Khong trung gradeNumber.
- Khong sua so khoi neu lam sai du lieu lop da tham chieu.
- Khong xoa khoi da co lop hoc.

Ghi chu:
Du lieu demo chi can 3 khoi.
VT1 can xac nhan co cho phep CRUD khoi hay chi quan ly danh muc co dinh.

### 6.4. API quan ly lop hoc (Class)

| Method | Endpoint | Chuc nang |
|---|---|---|
| GET | /classes | Lay danh sach lop |
| GET | /classes/:id | Lay chi tiet lop |
| POST | /classes | Tao lop hoc |
| PATCH | /classes/:id | Cap nhat lop |
| GET | /classes/:id/students | Lay danh sach hoc sinh trong lop |

Query GET /classes:
- academicYearId: Loc theo nien khoa.
- gradeId: Loc theo khoi.
- status: Loc theo trang thai.

Du lieu POST/PATCH de xuat:
- academicYearId
- gradeId
- code
- name
- status

Validation:
- AcademicYear va Grade phai ton tai.
- Khong trung code trong cung academicYearId.
- Ma lop phai phu hop gradeId.
- Khong xoa lop da co Enrollment hoac diem.
- Khong thay doi nien khoa/khoi neu lam sai lich su.

GET /classes/:id/students:
- Chi lay hoc sinh thuoc pham vi lop duoc yeu cau.
- Cho phep loc theo ngay hoac tinh trang phan lop.
- Mac dinh lay hoc sinh dang duoc phan vao lop.
- Khong truy van truc tiep classId trong Student.
- Phai dua tren Enrollment.

### 6.5. API quan ly mon hoc (Subject)

| Method | Endpoint | Chuc nang |
|---|---|---|
| GET | /subjects | Lay danh sach mon hoc |
| GET | /subjects/:id | Lay chi tiet mon |
| POST | /subjects | Tao mon hoc |
| PATCH | /subjects/:id | Cap nhat mon hoc |

Du lieu de xuat:
- code
- name
- status

Validation:
- Khong trung ma mon.
- Ma va ten mon khong duoc rong.
- status de xuat ACTIVE hoac INACTIVE.
- Mon INACTIVE van hien thi trong lich su.
- Khong xoa cung mon hoc da co ket qua hoc tap.
- Subject ID phai thong nhat voi VT4.

### 6.6. API quan ly hoc sinh (Student)

| Method | Endpoint | Chuc nang |
|---|---|---|
| GET | /students | Lay danh sach hoc sinh |
| GET | /students/:id | Lay chi tiet hoc sinh |
| POST | /students | Them hoc sinh |
| PATCH | /students/:id | Cap nhat ho so |
| PATCH | /students/:id/status | Cap nhat trang thai |
| GET | /students/:id/enrollments | Lay lich su phan lop |

Query GET /students de xuat:
- studentCode
- keyword
- academicYearId
- classId
- status

Du lieu POST de xuat:
- studentCode
- fullName
- dateOfBirth
- status

Validation:
- studentCode phai duy nhat.
- fullName khong duoc rong.
- dateOfBirth la ngay hop le, khong o tuong lai.
- Khong xoa cung hoc sinh da co lich su.
- Khong cho phep sua studentId.
- Loc theo lop/nien khoa phai dua vao Enrollment.
- Khong lay hoc sinh cua lop khac khi da chi dinh classId.

Cap nhat trang thai:
- ACTIVE: Ho so dang hoat dong.
- INACTIVE: Ho so ngung hoat dong.
- Khong xoa Enrollment hoac diem khi doi trang thai.

### 6.7. API phan lop (Enrollment)

| Method | Endpoint | Chuc nang |
|---|---|---|
| GET | /enrollments | Tra cuu phan lop |
| POST | /enrollments | Phan lop hoc sinh |
| GET | /enrollments/:id | Xem chi tiet lan phan lop |
| POST | /students/:id/transfers | Chuyen lop hoc sinh |

POST /enrollments de xuat:
- studentId
- classId
- academicYearId
- startDate

Validation:
- Hoc sinh phai ton tai va du dieu kien phan lop.
- Lop va nien khoa phai ton tai.
- Nien khoa phai khop voi nien khoa cua lop.
- Khong tao hai Enrollment dang hoat dong
  trong cung nien khoa cho mot hoc sinh.
- Khong cho phep cac khoang thoi gian chong lan.

POST /students/:id/transfers de xuat:
- fromEnrollmentId
- toClassId
- transferDate

Xu ly:
1. Kiem tra quyen KHAO_THI.
2. Kiem tra hoc sinh va Enrollment hien tai.
3. Kiem tra lop dich hop le.
4. Kiem tra quy tac khong chong lan thoi gian.
5. Ket thuc Enrollment cu.
6. Tao Enrollment moi.
7. Giu nguyen lich su diem va phan lop cu.
8. Xu ly trong database transaction.
9. Neu co loi, rollback toan bo.

Luu y:
- API chuyen lop phai duoc VT1 va VT4 duyet.
- Khong tu y thay doi lien ket diem lich su.
- Quy tac chuyen khac khoi va chuyen giua nien khoa
  can nhom xac nhan.

#### 6.7.1. Bo sung xu ly diem khi chuyen lop

Endpoint:
POST /students/:id/transfers

Quy tac bo sung:
- Kiem tra hoc sinh, Enrollment cu va lop dich.
- Kiem tra rang buoc phan lop va nien khoa.
- Kiem tra anh huong den diem va trang thai khoa diem.
- Ket thuc Enrollment cu va tao Enrollment moi.
- Khong xoa hoac thay doi ScoreRecord da phat sinh.
- Khong thay doi ScoreComponent cua Enrollment cu.
- Khong tu dong chuyen diem sang Enrollment moi.
- Khong tu dong mo khoa diem cua lop cu hoac lop moi.
- Neu co loi trong giao dich, phai rollback.

Can xac nhan truoc khi trien khai:
- Diem lop cu co duoc su dung de tinh tong ket tai lop moi khong?
- Neu co, he thong se truy van va tong hop diem theo quy tac nao?
- Truong hop diem da khoa thi xu ly ra sao?
- Co can ghi AuditLog khi chuyen lop hay khong?

Ghi chu:
API nay van thuoc phan nghiep vu cua VT3.
Xu ly diem do VT4 phu trach.
Xu ly khoa diem va AuditLog do VT5 phu trach.
Cac quy tac tren can VT1 phe duyet.

### 6.8. Cau truc JSON thanh cong

Theo quy chuan VT1:

{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Nguyen Van A"
  }
}

Vi du tao hoc sinh thanh cong:
- HTTP 201 Created.
- data chua thong tin hoc sinh vua tao.
- Khong tra ve mat khau hoac thong tin nhay cam
  khong can thiet.

GET/PATCH thanh cong:
- HTTP 200 OK.
- data chua tai nguyen hoac danh sach tuong ung.

### 6.9. Cau truc JSON bao loi

Theo quy chuan VT1:

{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Ma hoc sinh da ton tai"
  }
}

Ma loi su dung:
- 400 VALIDATION_ERROR: Du lieu dau vao sai.
- 401 UNAUTHORIZED: Chua dang nhap.
- 403 FORBIDDEN: Khong co quyen.
- 404 NOT_FOUND: Khong tim thay du lieu.
- 409 CONFLICT: Du lieu trung hoac xung dot.
- 500 INTERNAL_ERROR: Loi may chu.

Vi du:
- Tao hoc sinh trung ma: 409 CONFLICT.
- Nhap ngay sinh sai: 400 VALIDATION_ERROR.
- Student ID khong ton tai: 404 NOT_FOUND.
- Hoc sinh goi API quan tri: 403 FORBIDDEN.

### 6.10. Phan quyen va bao mat

- Cac API quan tri VT3 chi danh cho role KHAO_THI.
- Backend phai kiem tra xac thuc va phan quyen.
- Frontend an nut khong thay the kiem tra backend.
- Hoc sinh chi duoc xem diem ca nhan thong qua
  API do VT1 va VT2 phu trach.
- Khong cho phep hoc sinh sua du lieu bang API.
- Cac tham so ID phai duoc kiem tra hop le.
- Khong tra ve thong tin nhay cam khong can thiet.
- Khong dua thong tin dang nhap hoac mat khau vao Git.

### 6.11. Noi dung can thong nhat truoc khi code

1. VT1 xac nhan duong dan API va JSON fields.
2. VT1 xac nhan middleware KHAO_THI.
3. VT1 xac nhan database schema va migrations.
4. VT4 xac nhan lien ket Enrollment voi diem.
5. VT5 xac nhan anh huong khi chuyen lop da co diem khoa.
6. VT2 xac nhan API phuc vu giao dien theo Figma.
7. Nhom xac nhan quy tac status va soft delete.
8. Nhom xac nhan quy tac chuyen lop va xu ly lich su.

Ket luan:
Day la API Contract de xuat cho VT3-01.
Chi tien hanh code sau khi cac phan phu thuoc
da duoc nhom ban giao va thong nhat.


## 7. Noi dung ban giao

### 7.1. Thong tin cong viec

- Ma cong viec: VT3-01
- Thanh vien thuc hien: VT3
- Du an: He thong quan ly ket qua hoc tap hoc sinh THPT
- Ten tai lieu: vt3-data-model.md
- Trang thai: Hoan thanh ban thiet ke, cho nhom review

### 7.2. Noi dung da thiet ke

1. AcademicYear - Quan ly nien khoa.
2. Grade - Quan ly khoi 10, 11, 12.
3. Class - Quan ly lop theo khoi va nien khoa.
4. Student - Quan ly ho so hoc sinh.
5. Enrollment - Luu lich su phan lop.
6. Subject - Quan ly danh muc mon hoc.

Da mo ta:
- Thuoc tinh va kieu du lieu PostgreSQL.
- Khoa chinh, khoa ngoai va rang buoc.
- Quan he giua cac thuc the.
- Quy tac nghiep vu va kiem tra du lieu.
- Nguyen tac bao toan lich su chuyen lop.
- API Contract cho cac chuc nang quan ly.

### 7.3. Noi dung ban giao cho cac thanh vien

VT1:
- Su dung schema de tong hop ERD.
- Xac nhan ten bang, khoa va rang buoc.
- Tao database migrations.
- Thong nhat middleware va API conventions.

VT2:
- Su dung API Contract de thiet ke giao dien.
- Doi chieu danh sach, form va trang thai voi Figma.
- Thong nhat cac truong du lieu can hien thi.

VT4:
- Lien ket Student, Enrollment, Class va Subject voi bang diem.
- Xac nhan xu ly diem khi hoc sinh chuyen lop.
- Bao toan ket qua hoc tap theo nien khoa.

VT5:
- Doi chieu Class, AcademicYear va Subject voi du lieu khoa diem.
- Xac nhan anh huong khi chuyen lop da co diem khoa.

### 7.4. Cac van de can nhom xac nhan

- Quy uoc trang thai ACTIVE, INACTIVE, CLOSED.
- Quy tac ma hoc sinh va ma mon hoc.
- Cach xu ly diem khi chuyen lop.
- Rang buoc thoi gian trong Enrollment.
- Lien ket Enrollment voi ScoreRecord cua VT4.
- Co can bang Subject theo khoi va nien khoa hay khong.
- Quy tac chuyen lop khac khoi.
- Duong dan API va middleware chinh thuc.

### 7.5. Tieu chi hoan thanh VT3-01

- Da thiet ke du 6 thuc the.
- Da mo ta quan he va rang buoc du lieu.
- Da xay dung Business Rules.
- Da de xuat API Contract.
- Da ghi ro cac van de can nhom xac nhan.
- Tai lieu duoc Commit va Push len branch rieng.
- Tao Pull Request cho VT1 review.
- Ban giao duong dan tai lieu cho VT1, VT4, VT5.

Ket luan:
VT3-01 da hoan thanh ban thiet ke de xuat.
Schema va API can duoc nhom review, thong nhat
truoc khi trien khai database va backend.

### 7.6. Ghi nhan phan hoi thiet ke VT4-01

Nguon phan hoi:
VT4 - Lien ket du lieu diem voi thiet ke VT3-01.

Noi dung da tiep thu:
1. De xuat ScoreRecord tham chieu enrollment_id.
2. De xuat ScoreRecord tham chieu subject_id.
3. ScoreComponent lien ket voi ScoreRecord.
4. Bao toan diem khi hoc sinh chuyen lop va chuyen nien khoa.
5. Khong xoa, ghi de hoac tu dong di chuyen diem lich su.
6. Bo sung cac quy tac can VT1, VT4 va VT5 xac nhan.

Noi dung cho thong nhat:
- Quy tac su dung diem lop cu tai lop moi.
- Cach tinh diem tong ket khi hoc sinh chuyen lop.
- Rang buoc UNIQUE cua ScoreRecord.
- Anh huong cua chuyen lop den trang thai khoa diem.
- Quy tac xu ly AuditLog va transaction.

Ket luan:
VT3 da tiep thu phan hoi so bo cua VT4.
Da bo sung phuong an lien ket du lieu diem vao tai lieu.
Schema chinh thuc can duoc VT1, VT4 va VT5 xac nhan.

Trang thai: Da cap nhat theo phan hoi VT4 - Cho thong nhat schema.

### 7.7. Ghi nhan phan hoi review VT1

Nguon:
VT1 - Review thiet ke VT3-01.

#### 7.7.1. Noi dung da lam ro

1. Dieu chinh rang buoc end_date > start_date.
2. Thong nhat cach bieu dien khoang thoi gian [start_date, end_date).
3. De xuat EXCLUDE CONSTRAINT de ngan chong lan Enrollment.
4. Lam ro trang thai cua AcademicYear, Class, Student, Subject va Enrollment.
5. Bao toan du lieu diem va lich su phan lop.

#### 7.7.2. Quyet dinh de xuat va noi dung cho duyet

A. Chuyen lop trong cung nien khoa

De xuat:
- Ket thuc Enrollment cu.
- Tao Enrollment moi.
- Giu nguyen diem va lien ket Enrollment cu.
- Khong tu dong sao chep diem sang Enrollment moi.

Can xac nhan:
- Diem lop cu co duoc tinh vao tong ket tai lop moi khong?
- Quy tac xu ly cac cot diem da khoa la gi?

Nguoi phoi hop: VT1, VT4, VT5.

Trang thai: CHO XAC NHAN.

B. Chuyen sang nien khoa moi

De xuat:
- Tao Enrollment moi.
- Bao toan ket qua hoc tap nien khoa cu.
- Khong sao chep diem tu nien khoa cu sang nien khoa moi.

Can xac nhan:
- Quy trinh dong Enrollment cu va nien khoa cu.
- Quy tac tra cuu diem lich su.

Nguoi phoi hop: VT1, VT4.

Trang thai: CHO XAC NHAN.

C. Pham vi mon hoc

De xuat:
- Subject la danh muc mon hoc dung chung.
- Subject khong chua truc tiep academic_year_id va grade_id.

Can xac nhan:
- Mon hoc co can cau hinh rieng theo khoi va nien khoa khong?
- Neu can, co bo sung bang lien ket mon hoc voi khoi/nien khoa khong?

Nguoi phoi hop: VT1, VT4.

Trang thai: CHO XAC NHAN.

D. Rang buoc ScoreRecord

De xuat:
- ScoreRecord tham chieu Enrollment va Subject.
- ScoreComponent tham chieu ScoreRecord.

Can xac nhan:
- Khoa UNIQUE cua ScoreRecord.
- Cach xac dinh hoc ky va pham vi diem.
- Cach tinh tong ket sau khi chuyen lop.

Nguoi phoi hop: VT1, VT4.

Trang thai: CHO XAC NHAN.

E. Trang thai va khoa diem

De xuat:
- Trang thai hoc sinh, lop va mon hoc doc lap voi trang thai khoa diem.
- Chuyen lop khong duoc tu dong mo khoa diem.
- Cac thay doi phai bao toan lich su.

Can xac nhan:
- Quy trinh mo khoa diem ngoai le.
- AuditLog khi chuyen lop.
- Quy tac xu ly Enrollment khi nien khoa CLOSED.

Nguoi phoi hop: VT1, VT4, VT5.

Trang thai: CHO XAC NHAN.

#### 7.7.3. Ket luan

VT3 da tiep thu cac nhan xet cua VT1 va bo sung phuong an xu ly.

Cac noi dung lien quan den tinh diem, khoa diem va pham vi mon hoc can duoc VT1, VT4, VT5 thong nhat truoc khi chot schema.

VT3 khong tu y thay doi thiet ke ScoreRecord, ScoreComponent hoac co che khoa diem.

Trang thai: Da bo sung theo review VT1 - Cho xac nhan schema chinh thuc.
