
# DATA DICTIONARY - HE THONG QUAN LY KET QUA HOC TAP THPT

## 1. Muc tieu

Tai lieu Data Dictionary mo ta chi tiet cac thuc the, thuoc tinh, kieu du lieu, khoa chinh, khoa ngoai va rang buoc du lieu cua he thong.

Tai lieu duoc tong hop tu thiet ke cua cac thanh vien va su dung lam co so de xay dung database schema, migrations va kiem tra tinh toan ven du lieu.

## 2. Pham vi du lieu

### 2.1. Cac thuc the chinh

He thong gom 12 thuc the chinh:

1. Role
2. User
3. AcademicYear
4. Grade
5. Class
6. Student
7. Enrollment
8. Subject
9. ScoreRecord
10. ScoreComponent
11. LockStatus
12. AuditLog

### 2.2. Thuc the bo sung

13. ScoreFormulaPolicy

ScoreFormulaPolicy duoc bo sung tu thiet ke quan ly diem de luu cong thuc, he so, quy tac lam tron, phien ban cong thuc va trang thai phe duyet cua giang vien.

Day la thuc the cau hinh bo sung, khong phai bang diem moi.

### 2.3. Quy uoc

- PK: Primary Key - Khoa chinh.
- FK: Foreign Key - Khoa ngoai.
- UNIQUE: Gia tri hoac to hop gia tri khong duoc trung.
- NOT NULL: Bat buoc co du lieu.
- NULL: Cho phep chua co gia tri.
- CHECK: Rang buoc kiem tra du lieu.
- DEFAULT: Gia tri mac dinh.
- TIMESTAMPTZ: Thoi diem co thong tin mui gio.
- BIGSERIAL: Dinh danh so nguyen lon tu tang.
- SMALLSERIAL: Dinh danh so nguyen nho tu tang.
- NUMERIC: Kieu du lieu so chinh xac.
- TRANSACTION: Nhom thao tac du lieu duoc thuc hien theo nguyen tac toan ven.

Ten thuc the duoc giu theo mo hinh thiet ke.

Ten bang PostgreSQL chinh thuc su dung quy uoc snake_case va se duoc thong nhat khi tao migrations.

Thuc the User duoc anh xa thanh bang app_user trong PostgreSQL, voi khoa chinh app_user(user_id).

## 3. Chi tiet cac thuc the

### 3.1. Role

**Muc dich:** Luu danh sach vai tro va phan quyen tai khoan trong he thong.

| Thuoc tinh | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| role_id | BIGSERIAL | PRIMARY KEY | Ma vai tro |
| code | VARCHAR(30) | NOT NULL, UNIQUE | Ma vai tro |
| name | VARCHAR(100) | NOT NULL | Ten vai tro |

**Quy tac du lieu:**

- Moi Role co mot role_id duy nhat.
- code khong duoc NULL va khong duoc trung.
- code khong duoc rong hoac chi chua khoang trang.
- name khong duoc NULL, rong hoac chi chua khoang trang.
- He thong su dung hai ma vai tro: KHAO_THI va HOC_SINH.
- Mot Role co the duoc gan cho nhieu User.
- Khong tu y bo sung vai tro ngoai pham vi khi chua duoc nhom thong nhat.

**Quan he:**

- Role (1) - (N) User.
- User.role_id tham chieu Role.role_id.

**Luu y tich hop:**

- Phan quyen phai duoc kiem tra tai backend.
- Khong chi dua vao giao dien de gioi han quyen truy cap.
- Role la danh muc dung chung cho module tai khoan.

### 3.2. User

**Muc dich:** Luu tai khoan dang nhap va lien ket voi vai tro, ho so hoc sinh khi can thiet.

| Thuoc tinh | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| user_id | BIGSERIAL | PRIMARY KEY | Ma tai khoan |
| username | VARCHAR(50) | NOT NULL, UNIQUE | Ten dang nhap |
| password_hash | TEXT | NOT NULL | Mat khau da bam |
| role_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu Role |
| student_id | BIGINT | NULL, UNIQUE, FOREIGN KEY | Tham chieu Student |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Trang thai tai khoan |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thoi diem tao |

**Quy tac du lieu:**

- Moi User co mot user_id duy nhat.
- username khong duoc NULL, rong hoac chi chua khoang trang.
- username phai duy nhat khong phan biet chu hoa va chu thuong.
- Can su dung unique index phu hop hoac citext khi tao migrations.
- Mat khau phai duoc luu duoi dang password_hash.
- Khong luu mat khau dang van ban thuan.
- Khong tra ve password_hash trong API.
- role_id phai tham chieu den Role hop le.
- Tai khoan HOC_SINH phai lien ket voi Student.
- Tai khoan KHAO_THI khong gan voi Student.
- Mot Student co toi da mot tai khoan User.
- Quy tac HOC_SINH phai co student_id va KHAO_THI khong co student_id can duoc kiem tra tai backend hoac bang rang buoc lien bang phu hop.
- Khoa ngoai role_id rieng le khong du de kiem tra quy tac lien ket Student theo vai tro.
- Khi vo hieu hoa User, khong xoa du lieu Student, Enrollment hoac diem.
- Backend xac dinh danh tinh hoc sinh tu tai khoan da xac thuc.
- Hoc sinh chi duoc truy cap du lieu cua chinh minh.

**Quan he:**

- Role (1) - (N) User.
- Student (0..1) - (0..1) User.
- User co the duoc LockStatus tham chieu.
- User co the duoc AuditLog tham chieu.

**Luu y tich hop:**

- Tai khoan thuc hien thao tac phai duoc xac dinh tu phien dang nhap hop le.
- Khong tin ID nguoi thuc hien do client tu khai bao.
- Ten bang PostgreSQL cua thuc the User duoc quy dinh la app_user.
- Cac rang buoc se duoc trien khai trong database schema va backend theo thiet ke da thong nhat.

### 3.3. AcademicYear

**Muc dich:** Luu thong tin nien khoa trong he thong.

| Thuoc tinh | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| academic_year_id | BIGSERIAL | PRIMARY KEY | Ma nien khoa |
| code | VARCHAR(9) | NOT NULL, UNIQUE | Ma nien khoa, VD: 2025-2026 |
| start_year | SMALLINT | NOT NULL | Nam bat dau |
| end_year | SMALLINT | NOT NULL | Nam ket thuc |
| status | VARCHAR(20) | NOT NULL | PLANNED, ACTIVE, CLOSED |

**Quy tac du lieu:**

- Moi AcademicYear co mot academic_year_id duy nhat.
- code phai duy nhat.
- end_year = start_year + 1.
- code phai phu hop voi start_year va end_year.
- status chi nhan PLANNED, ACTIVE hoac CLOSED.
- Khong cho phep tao hai nien khoa trung code.
- Khong xoa cung nien khoa neu da co lop, hoc sinh hoac diem lien quan.
- He thong ho tro quan ly 2 nien khoa theo pham vi demo.

**Quan he:**

- AcademicYear (1) - (N) Class.
- AcademicYear (1) - (N) Enrollment.
- AcademicYear (1) - (N) LockStatus.
- AcademicYear co the duoc AuditLog tham chieu.

**Luu y tich hop:**

- Nien khoa cua Enrollment phai khop voi nien khoa cua Class.
- Du lieu lich su cua nien khoa cu phai duoc bao toan.
- Khong tu dong xoa du lieu khi chuyen sang nien khoa moi.

### 3.4. Grade

**Muc dich:** Luu danh muc cac khoi lop trong truong THPT.

| Thuoc tinh | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| grade_id | SMALLSERIAL | PRIMARY KEY | Ma khoi |
| grade_number | SMALLINT | NOT NULL, UNIQUE, CHECK | So khoi 10, 11 hoac 12 |

**Quy tac du lieu:**

- Moi Grade co mot grade_id duy nhat.
- grade_number chi nhan cac gia tri 10, 11, 12.
- CHECK (grade_number IN (10, 11, 12)).
- Khong cho phep hai Grade trung grade_number.
- Grade la danh muc dung chung cho cac nien khoa.
- Khong luu academic_year_id trong Grade.
- Khong xoa khoi neu da co Class tham chieu.

**Quan he:**

- Grade (1) - (N) Class.
- Class.grade_id tham chieu Grade.grade_id.

### 3.5. Class

**Muc dich:** Luu thong tin lop hoc theo tung nien khoa va khoi.

| Thuoc tinh | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| class_id | BIGSERIAL | PRIMARY KEY | Ma lop |
| academic_year_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu AcademicYear |
| grade_id | SMALLINT | NOT NULL, FOREIGN KEY | Tham chieu Grade |
| code | VARCHAR(20) | NOT NULL | Ma lop, VD: 10A1 |
| name | VARCHAR(100) | NOT NULL | Ten lop |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Trang thai lop |

**Quy tac du lieu:**

- Moi Class co mot class_id duy nhat.
- Moi Class thuoc mot AcademicYear va mot Grade.
- academic_year_id phai tham chieu AcademicYear hop le.
- grade_id phai tham chieu Grade hop le.
- code va name khong duoc NULL, rong hoac chi chua khoang trang.
- UNIQUE (academic_year_id, code).
- Cho phep trung ma lop o hai nien khoa khac nhau.
- status chi nhan ACTIVE hoac INACTIVE.
- Ma lop phai phu hop voi khoi lop da chon.
- Khong xoa cung lop da co lich su hoc sinh hoac diem.
- Khong thay doi nien khoa, khoi cua lop da co du lieu lich su neu khong co quy trinh dieu chinh hop le.
- UNIQUE (class_id, academic_year_id) duoc de xuat de ho tro khoa ngoai kep tu Enrollment va LockStatus.
- Pham vi demo moi khoi co mot lop trong tung nien khoa.

**Quan he:**

- AcademicYear (1) - (N) Class.
- Grade (1) - (N) Class.
- Class (1) - (N) Enrollment.
- Class (1) - (N) LockStatus.
- Class co the duoc AuditLog tham chieu.

### 3.6. Student

**Muc dich:** Luu ho so hoc sinh trong he thong, khong phu thuoc truc tiep vao lop hoc hay nien khoa.

| Thuoc tinh | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| student_id | BIGSERIAL | PRIMARY KEY | Ma dinh danh hoc sinh |
| student_code | VARCHAR(30) | NOT NULL, UNIQUE | Ma hoc sinh |
| full_name | VARCHAR(150) | NOT NULL | Ho va ten hoc sinh |
| date_of_birth | DATE | NOT NULL | Ngay sinh |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Trang thai ho so |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thoi diem tao |

**Quy tac du lieu:**

- Moi Student co mot student_id duy nhat.
- student_code la duy nhat trong toan he thong, khong trung giua cac nien khoa.
- student_code va full_name khong duoc NULL, rong hoac chi chua khoang trang.
- date_of_birth phai la ngay hop le va khong nam trong tuong lai.
- Backend kiem tra ngay sinh truoc khi luu du lieu.
- status chi nhan ACTIVE hoac INACTIVE.
- Khong xoa cung hoc sinh da co lich su phan lop hoac diem.
- Khi hoc sinh ngung hoat dong, cap nhat status thanh INACTIVE.
- Khong luu class_id hoac academic_year_id truc tiep trong Student.
- Quan he hoc sinh, lop va nien khoa duoc quan ly qua Enrollment.
- Khi chuyen lop, giu nguyen student_id va student_code.
- Bao toan ho so hoc sinh va lich su ket qua hoc tap.

**Quan he:**

- Student (1) - (N) Enrollment.
- Student (0..1) - (0..1) User.
- Student co the duoc AuditLog tham chieu.

**Luu y:**

- Student chi luu thong tin ho so hoc sinh.
- Enrollment quan ly lich su phan lop theo nien khoa.
- Khong xoa Student neu viec xoa lam mat du lieu lich su.

### 3.7. Enrollment

**Muc dich:** Luu lich su hoc sinh duoc phan vao lop theo tung nien khoa, bao toan du lieu khi chuyen lop, len lop hoac ngung hoc.

| Thuoc tinh | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| enrollment_id | BIGSERIAL | PRIMARY KEY | Ma dinh danh lan phan lop |
| student_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu Student |
| class_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu Class |
| academic_year_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu AcademicYear |
| start_date | DATE | NOT NULL | Ngay bat dau hoc tai lop |
| end_date | DATE | NULL | Ngay ket thuc, khong bao gom ngay nay |
| exit_reason | VARCHAR(20) | NULL | Ly do ket thuc phan lop |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thoi diem tao ban ghi |

**Quy tac du lieu:**

- Moi Enrollment co mot enrollment_id duy nhat.
- student_id phai tham chieu den Student hop le.
- class_id phai tham chieu den Class hop le.
- academic_year_id phai tham chieu den AcademicYear hop le.
- academic_year_id trong Enrollment phai khop voi nien khoa cua Class.
- Su dung FOREIGN KEY (class_id, academic_year_id) tham chieu Class (class_id, academic_year_id).
- Class can co rang buoc UNIQUE (class_id, academic_year_id) de ho tro khoa ngoai kep.
- start_date la ngay bat dau co hieu luc.
- end_date co the NULL neu chua ghi nhan ngay ket thuc.
- Neu end_date khac NULL thi end_date > start_date.
- Neu end_date la NULL thi exit_reason phai la NULL.
- Neu end_date khac NULL thi exit_reason phai co gia tri hop le.
- exit_reason chi nhan TRANSFER, COMPLETED hoac WITHDRAWN khi ket thuc phan lop.
- Khong cho phep cac khoang thoi gian phan lop cua mot hoc sinh chong lan nhau trong cung nien khoa.
- Khong xoa ban ghi Enrollment cu khi hoc sinh chuyen lop.
- Khong ghi de class_id cua ban ghi lich su.
- Diem phai lien ket voi dung Enrollment va Subject.

**Quy tac thoi gian:**

- Su dung khoang thoi gian [start_date, end_date).
- Ngay start_date duoc bao gom.
- Ngay end_date khong duoc bao gom.
- end_date = NULL nghia la chua co ngay ket thuc.
- Tai ngay D, Enrollment co hieu luc neu start_date <= D va (end_date IS NULL hoac D < end_date).
- Khong chi dua vao end_date IS NULL de xac dinh hoc sinh dang hoc.
- Khong cho phep hai Enrollment cua cung mot hoc sinh va nien khoa co khoang thoi gian giao nhau.

**Rang buoc PostgreSQL de xuat:**

- CHECK (end_date IS NULL OR end_date > start_date).
- CHECK tinh nhat quan giua end_date va exit_reason.
- UNIQUE INDEX tren (student_id, academic_year_id) voi dieu kien end_date IS NULL.
- EXCLUDE CONSTRAINT su dung GiST va daterange de ngan cac khoang thoi gian chong lan.
- Su dung btree_gist de ho tro so sanh student_id va academic_year_id.
- Cac rang buoc SQL cu the se duoc trien khai trong VT1-03 sau khi schema duoc thong nhat.

**Quy tac khi hoc sinh chuyen lop:**

1. Tim Enrollment hien tai cua hoc sinh trong nien khoa.
2. Kiem tra ngay chuyen lop hop le.
3. Cap nhat end_date cua Enrollment cu.
4. Gan exit_reason = TRANSFER cho Enrollment cu.
5. Tao Enrollment moi voi class_id cua lop moi.
6. Giu nguyen student_id va student_code.
7. Khong thay doi hoac xoa ScoreRecord cua Enrollment cu.
8. Thuc hien cap nhat Enrollment cu va tao Enrollment moi trong cung transaction.

**Quy tac khi hoc sinh len lop:**

- Giu nguyen Student.
- Tao Enrollment moi cho nien khoa moi.
- Lien ket Enrollment moi voi Class thuoc khoi lop moi.
- Bao toan Enrollment va ket qua hoc tap cua nien khoa truoc.

**Quan he:**

- Student (1) - (N) Enrollment.
- Class (1) - (N) Enrollment.
- AcademicYear (1) - (N) Enrollment.
- Enrollment (1) - (N) ScoreRecord.

**Luu y tich hop:**

- Enrollment la bang trung gian quan ly quan he Student va Class theo thoi gian.
- Khong luu class_id truc tiep trong Student.
- Can kiem tra tinh nhat quan giua Enrollment va ScoreRecord khi hoc sinh chuyen lop.
- Khong di chuyen diem lich su sang Enrollment moi neu chua co quy tac nghiep vu duoc phe duyet.
- Data Dictionary nay la tai lieu thiet ke, chua phai migration SQL.

### 3.8. Subject

**Muc dich:** Luu danh muc cac mon hoc trong truong THPT, phuc vu quan ly va nhap ket qua hoc tap.

| Thuoc tinh | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| subject_id | BIGSERIAL | PRIMARY KEY | Ma dinh danh mon hoc |
| code | VARCHAR(20) | NOT NULL, UNIQUE | Ma mon hoc, VD: TOAN |
| name | VARCHAR(100) | NOT NULL | Ten mon hoc |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Trang thai mon hoc |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thoi diem tao mon hoc |

**Quy tac du lieu:**

- Moi Subject co mot subject_id duy nhat.
- code phai duy nhat trong toan he thong.
- code khong duoc NULL, rong hoac chi chua khoang trang.
- name khong duoc NULL, rong hoac chi chua khoang trang.
- Khong cho phep tao hai mon hoc co cung code.
- De xuat chuan hoa code thanh chu in hoa truoc khi luu.
- Can ngan ma mon hoc trung nhau khi chi khac chu hoa va chu thuong.
- status chi nhan ACTIVE hoac INACTIVE.
- Moi mon hoc co the duoc su dung trong nhieu nien khoa.
- Moi mon hoc co the duoc giang day o nhieu khoi lop.
- Khong luu academic_year_id hoac grade_id truc tiep trong Subject.
- Khong xoa cung mon hoc da co ket qua hoc tap.
- Khi ngung su dung mon hoc, cap nhat status thanh INACTIVE.
- Mon hoc INACTIVE khong duoc su dung de tao du lieu diem moi.
- Mon hoc INACTIVE van phai duoc hien thi khi tra cuu lich su.

**Quy tac nghiep vu:**

- Phong Khao thi co quyen them, sua va tra cuu mon hoc.
- Khi them mon hoc, he thong kiem tra trung ma.
- Khi sua mon hoc, khong duoc lam sai lech diem da luu.
- Khi mon hoc da co ket qua hoc tap, khong duoc xoa cung.
- Hoc sinh chi duoc xem ket qua cac mon hoc cua chinh minh.
- Pham vi demo cua he thong co it nhat 3 mon hoc.

**Quan he:**

- Subject (1) - (N) ScoreRecord.
- Subject (1) - (N) LockStatus.
- Subject co the duoc AuditLog tham chieu.

**Du lieu minh hoa:**

| code | name | status |
|---|---|---|
| TOAN | Toan | ACTIVE |
| NGUVAN | Ngu van | ACTIVE |
| TIENGANH | Tieng Anh | ACTIVE |

**Luu y tich hop:**

- Subject la danh muc mon hoc dung chung.
- ScoreRecord.subject_id tham chieu Subject.subject_id.
- LockStatus.subject_id tham chieu Subject.subject_id.
- Can thong nhat quy tac ma mon hoc va pham vi mon hoc theo khoi.
- Neu can quan ly mon hoc theo nien khoa hoac khoi, phai thong nhat thiet ke truoc khi bo sung bang lien ket.
- Khong tu y thay doi quan he Subject voi ScoreRecord khi chua thong nhat schema.
- Data Dictionary la tai lieu thiet ke, chua phai migration SQL.

### 3.9. ScoreRecord

**Muc dich:** Luu ban ghi ket qua hoc tap cua hoc sinh theo tung lan phan lop va mon hoc.

| Thuoc tinh | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| score_record_id | BIGSERIAL | PRIMARY KEY | Ma ban ghi diem |
| enrollment_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu Enrollment |
| subject_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu Subject |
| version | INTEGER | NOT NULL, DEFAULT 1, CHECK | Phien ban ban ghi de phat hien xung dot |

**Quy tac du lieu:**

- Moi ScoreRecord co mot score_record_id duy nhat.
- enrollment_id phai tham chieu Enrollment hop le.
- subject_id phai tham chieu Subject hop le.
- UNIQUE (enrollment_id, subject_id).
- CHECK (version >= 1).
- Khong cho phep hai ScoreRecord trung Enrollment va Subject.
- Moi ScoreRecord thuoc mot lan phan lop va mot mon hoc.
- Mot Enrollment co the co nhieu ScoreRecord theo cac mon hoc.
- Mot Subject co the duoc su dung trong nhieu ScoreRecord.
- Phai kiem tra Enrollment va Subject truoc khi tao ban ghi diem.
- version duoc su dung de ho tro phat hien xung dot khi nhieu nguoi cung cap nhat.
- Khong xoa ScoreRecord neu viec xoa lam mat du lieu diem lich su.
- Khi hoc sinh chuyen lop, ScoreRecord cu van lien ket voi Enrollment cu.
- Khong tu dong chuyen ScoreRecord cua lop cu sang Enrollment moi.
- Quy tac su dung diem lop cu khi chuyen lop trong cung nien khoa can duoc nhom xac nhan.

**Quan he:**

- Enrollment (1) - (N) ScoreRecord.
- Subject (1) - (N) ScoreRecord.
- ScoreRecord (1) - (N) ScoreComponent.
- ScoreRecord co the duoc AuditLog tham chieu.

**Quy tac tich hop:**

- ScoreComponent luu gia tri tung thanh phan QT1, QT2, QT3, GK, CK.
- Khong luu truc tiep 5 gia tri diem thanh phan trong ScoreRecord.
- Truoc khi cap nhat diem, backend phai kiem tra quyen va trang thai khoa diem.
- Khong cho phep chinh sua diem thuoc cot dang LOCKED.
- Cap nhat diem va ghi AuditLog phai bao dam tinh nhat quan trong cung transaction.
- Khong tu dong xoa hoac ghi de lich su diem khi chuyen lop.


**Luu y thiet ke:**

- Trong pham vi de tai, ScoreRecord duoc xac dinh theo Enrollment va Subject.
- Moi ScoreRecord luu ket qua cua mot hoc sinh theo lan phan lop va mon hoc.
- Khong bo sung semester vi de tai khong bat buoc quan ly diem rieng theo HK1 va HK2.
- UNIQUE (enrollment_id, subject_id).
- Nien khoa duoc xac dinh thong qua Enrollment.
- Khong bo sung formula_policy_id vao ScoreRecord trong pham vi demo hien tai.
- He thong su dung cau hinh cong thuc tinh diem thong nhat duoc mo ta trong ScoreFormulaPolicy.
- Khong tu dong thay doi hoac xoa diem lich su khi hoc sinh chuyen lop.
- Cau truc nay dap ung pham vi quan ly diem theo nien khoa va mon hoc cua de tai.


### 3.10. ScoreComponent

**Muc dich:** Luu gia tri va trang thai cua tung thanh phan diem thuoc mot ScoreRecord.

| Thuoc tinh | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| score_component_id | BIGSERIAL | PRIMARY KEY | Ma thanh phan diem |
| score_record_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu ScoreRecord |
| component_type | VARCHAR(10) | NOT NULL, CHECK | Loai thanh phan diem |
| score_value | NUMERIC | NULL, CHECK | Gia tri diem tu 0 den 10 |
| score_status | VARCHAR(15) | NOT NULL, DEFAULT 'NOT_ENTERED', CHECK | Trang thai diem |

**Quy tac du lieu:**

- Moi ScoreComponent co mot score_component_id duy nhat.
- score_record_id tham chieu ScoreRecord(score_record_id).
- UNIQUE (score_record_id, component_type).
- Moi ScoreRecord co toi da 5 ScoreComponent.
- component_type chi nhan QT1, QT2, QT3, GK, CK.
- score_value chi nhan gia tri tu 0 den 10 hoac NULL.
- QT1, QT2, QT3 chi nhan diem nguyen tu 0 den 10.
- GK va CK nhan diem tu 0 den 10 theo buoc 0.25.
- Khong tu dong lam tron diem nhap khong hop le.
- Diem 0 la gia tri hop le va khac NULL.
- Khong tu dong chuyen NULL thanh diem 0.

**Quy tac trang thai diem:**

| score_status | score_value | Y nghia |
|---|---|---|
| NOT_ENTERED | NULL | Chua nhap diem |
| SCORED | 0.00 den 10.00 | Da co diem hop le |
| ABSENT | NULL | Vang kiem tra |
| EXEMPT | NULL | Mien kiem tra |

- score_status chi nhan NOT_ENTERED, SCORED, ABSENT, EXEMPT.
- Neu score_status = SCORED thi score_value phai khac NULL.
- Neu score_status = NOT_ENTERED, ABSENT hoac EXEMPT thi score_value phai la NULL.
- ABSENT va EXEMPT khong duoc tu dong quy doi thanh diem 0.

**Rang buoc PostgreSQL de xuat:**

- UNIQUE (score_record_id, component_type).
- CHECK (component_type IN ('QT1', 'QT2', 'QT3', 'GK', 'CK')).
- CHECK (score_status IN ('NOT_ENTERED', 'SCORED', 'ABSENT', 'EXEMPT')).
- CHECK (score_value IS NULL OR score_value BETWEEN 0 AND 10).
- CHECK (component_type NOT IN ('QT1', 'QT2', 'QT3') OR score_value IS NULL OR score_value = TRUNC(score_value)).
- CHECK (component_type NOT IN ('GK', 'CK') OR score_value IS NULL OR MOD(score_value * 4, 1) = 0).
- CHECK ((score_status = 'SCORED' AND score_value IS NOT NULL) OR (score_status IN ('NOT_ENTERED', 'ABSENT', 'EXEMPT') AND score_value IS NULL)).

**Quy tac tinh diem tong ket:**

- QT1, QT2, QT3 co he so 1.
- GK co he so 2.
- CK co he so 3.
- Tong he so la 8.
- DTK = (QT1 + QT2 + QT3 + 2 * GK + 3 * CK) / 8.
- DTK duoc lam tron 2 chu so thap phan.
- Chi tinh DTK khi ca 5 thanh phan co trang thai SCORED.
- Neu mot thanh phan chua du diem hoac co trang thai ABSENT, EXEMPT thi khong tinh DTK theo quy tac hien tai.
- Khong luu lap lai cong thuc va thong tin phe duyet trong ScoreComponent.

**Quy tac khoa diem va AuditLog:**

- Truoc khi cap nhat ScoreComponent, phai kiem tra trang thai khoa diem tu LockStatus.
- Khong cho phep sua diem khi thanh phan dang LOCKED.
- Khi sua diem hop le, phai ghi nhan thay doi trong AuditLog.
- Cap nhat diem va ghi AuditLog phai thuc hien trong cung transaction.
- Luu gia tri cu, gia tri moi va nguoi thuc hien de phuc vu truy vet.
- Khong xoa du lieu diem lich su khi hoc sinh chuyen lop.

**Quan he:**

- ScoreRecord (1) - (N) ScoreComponent.
- ScoreComponent co the duoc AuditLog tham chieu.

**Luu y tich hop:**

- ScoreComponent khong luu truc tiep enrollment_id, subject_id hoac student_id.
- Cac thong tin nay duoc truy xuat qua ScoreRecord va Enrollment.
- Trang thai khoa diem va trang thai cong bo diem la hai nghiep vu doc lap.
- Data Dictionary nay la tai lieu thiet ke, chua phai database migration chinh thuc.

### 3.11. LockStatus

**Muc dich:** Quan ly trang thai khoa cua tung thanh phan diem theo nien khoa, lop hoc va mon hoc.

| Thuoc tinh | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| lock_status_id | BIGSERIAL | PRIMARY KEY | Ma trang thai khoa |
| academic_year_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu AcademicYear |
| class_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu Class |
| subject_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu Subject |
| component | VARCHAR(10) | NOT NULL, CHECK | Thanh phan diem |
| status | VARCHAR(20) | NOT NULL, DEFAULT 'UNLOCKED', CHECK | Trang thai khoa |
| locked_by | BIGINT | NULL, FOREIGN KEY | Tai khoan thuc hien khoa |
| locked_at | TIMESTAMPTZ | NULL | Thoi diem khoa |
| unlocked_by | BIGINT | NULL, FOREIGN KEY | Tai khoan thuc hien mo khoa |
| unlocked_at | TIMESTAMPTZ | NULL | Thoi diem mo khoa |
| requested_by | BIGINT | NULL, FOREIGN KEY | Tai khoan nguoi yeu cau |
| requested_by_name | VARCHAR(150) | NULL | Ten nguoi yeu cau de giai trinh |
| unlock_reason | TEXT | NULL | Ly do mo khoa |
| version | INTEGER | NOT NULL, DEFAULT 1, CHECK | Phien ban kiem tra xung dot |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thoi diem tao |
| updated_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thoi diem cap nhat |

**Quy tac du lieu:**

- Moi LockStatus co mot lock_status_id duy nhat.
- Moi LockStatus xac dinh trang thai khoa cua mot thanh phan diem theo nien khoa, lop va mon hoc.
- UNIQUE (academic_year_id, class_id, subject_id, component).
- academic_year_id tham chieu AcademicYear.
- class_id tham chieu Class.
- subject_id tham chieu Subject.
- academic_year_id phai khop voi nien khoa cua Class.
- component chi nhan QT1, QT2, QT3, GK, CK.
- status chi nhan UNLOCKED hoac LOCKED.
- Trang thai mac dinh la UNLOCKED.
- CHECK (version >= 1).
- version duoc tang khi cap nhat trang thai khoa de phat hien xung dot.
- Khong cho phep hai LockStatus trung nien khoa, lop, mon va thanh phan diem.

**Quy tac khoa diem:**

- Chi tai khoan KHAO_THI co quyen thuc hien khoa diem.
- QT1, QT2, QT3, GK, CK duoc khoa doc lap.
- Khi status = LOCKED, khong cho phep nhap, sua hoac xoa diem thuoc thanh phan dang khoa.
- Cho phep khoa cot diem khi van con hoc sinh chua du diem.
- Truoc khi khoa cot diem con thieu, he thong phai hien thi canh bao so luong diem thieu va yeu cau xac nhan.
- Khong tu dong khoa diem khi het han neu chua co quy tac duoc phe duyet.
- Khoa diem khong dong nghia voi cong bo diem cho hoc sinh.

**Quy tac mo khoa va khoa lai:**

- Chi tai khoan KHAO_THI duoc mo khoa va khoa lai.
- Khi mo khoa, phai ghi nhan nguoi yeu cau va ly do.
- requested_by tham chieu User(user_id) neu nguoi yeu cau co tai khoan.
- Neu nguoi yeu cau khong co tai khoan, requested_by co the NULL nhung requested_by_name phai duoc nhap de ghi nhan danh tinh.
- unlock_reason bat buoc co noi dung khi thuc hien mo khoa.
- unlocked_by va unlocked_at ghi nhan nguoi va thoi diem mo khoa.
- Sau khi chinh sua diem, can bo Khao thi thuc hien khoa lai cot diem.
- Khi khoa lai, cap nhat locked_by, locked_at va version.
- Moi lan LOCK, UNLOCK hoac RELOCK phai duoc ghi vao AuditLog.

**Rang buoc PostgreSQL de xuat:**

- UNIQUE (academic_year_id, class_id, subject_id, component).
- CHECK (component IN ('QT1', 'QT2', 'QT3', 'GK', 'CK')).
- CHECK (status IN ('UNLOCKED', 'LOCKED')).
- CHECK (version >= 1).
- FOREIGN KEY (academic_year_id) tham chieu AcademicYear.
- FOREIGN KEY (class_id) tham chieu Class.
- FOREIGN KEY (subject_id) tham chieu Subject.
- FOREIGN KEY (locked_by) tham chieu User.
- FOREIGN KEY (unlocked_by) tham chieu User.
- FOREIGN KEY (requested_by) tham chieu User.
- Can kiem tra rang buoc nien khoa cua Class khi tao LockStatus.
- De xuat FOREIGN KEY (class_id, academic_year_id) tham chieu Class (class_id, academic_year_id), su dung UNIQUE (class_id, academic_year_id) cua Class de bao dam nien khoa khop nhau.

**Quy tac transaction:**

- Thay doi trang thai LockStatus va ghi AuditLog phai duoc thuc hien nhat quan trong cung transaction.
- Neu ghi AuditLog that bai thi phai rollback thay doi LockStatus.
- Su dung version de phat hien thao tac dong thoi.
- Khong cho phep hai thao tac khoa va mo khoa ghi de trang thai cua nhau ma khong kiem tra xung dot.

**Quan he:**

- AcademicYear (1) - (N) LockStatus.
- Class (1) - (N) LockStatus.
- Subject (1) - (N) LockStatus.
- User (1) - (N) LockStatus qua cac truong nguoi thuc hien va nguoi yeu cau.
- LockStatus (1) - (N) AuditLog.

**Luu y tich hop:**

- Thiet ke duoc tong hop tu tai lieu LockStatus va AuditLog.
- Ten bang PostgreSQL cua thuc the User la app_user.
- Cac khoa ngoai locked_by, unlocked_by va requested_by tham chieu app_user(user_id).
- Khong luu trang thai khoa truc tiep trong ScoreComponent.
- Trang thai khoa diem va trang thai cong bo diem la hai nghiep vu doc lap.
- Neu he thong duoc mo rong quan ly diem theo HK1 va HK2, LockStatus cung can duoc dieu chinh de khoa rieng theo hoc ky.
- Cac quy tac can duoc doi chieu voi ban thiet ke da duoc review truoc khi tao migrations.
- Data Dictionary nay chua phai migration SQL chinh thuc.

### 3.12. AuditLog

**Muc dich:** Luu nhat ky bat bien (append-only) cho cac thao tac khoa, mo khoa, khoa lai, sua diem va import diem; phuc vu truy vet va giai trinh.

| Thuoc tinh | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| audit_log_id | BIGSERIAL | PRIMARY KEY | Ma nhat ky |
| action_type | VARCHAR(50) | NOT NULL, CHECK | Loai thao tac |
| performed_by | BIGINT | NOT NULL, FOREIGN KEY | Tai khoan thuc hien thao tac |
| requested_by | BIGINT | NULL, FOREIGN KEY | Tai khoan nguoi yeu cau neu co |
| requested_by_name | VARCHAR(150) | NULL | Ten nguoi yeu cau neu khong co tai khoan |
| lock_status_id | BIGINT | NULL, FOREIGN KEY | Tham chieu LockStatus |
| academic_year_id | BIGINT | NOT NULL, FOREIGN KEY | Nien khoa lien quan |
| class_id | BIGINT | NOT NULL, FOREIGN KEY | Lop hoc lien quan |
| subject_id | BIGINT | NOT NULL, FOREIGN KEY | Mon hoc lien quan |
| component | VARCHAR(10) | NULL, CHECK | QT1, QT2, QT3, GK hoac CK |
| student_id | BIGINT | NULL, FOREIGN KEY | Hoc sinh lien quan |
| score_record_id | BIGINT | NULL, FOREIGN KEY | Ban ghi diem lien quan |
| score_component_id | BIGINT | NULL, FOREIGN KEY | Thanh phan diem lien quan |
| old_value | NUMERIC | NULL | Gia tri diem truoc khi sua |
| new_value | NUMERIC | NULL | Gia tri diem sau khi sua |
| reason | TEXT | NULL | Ly do mo khoa hoac sua diem |
| related_log_id | BIGINT | NULL, FOREIGN KEY | Tham chieu AuditLog cua lan UNLOCK lien quan |
| result | VARCHAR(20) | NOT NULL, DEFAULT 'SUCCESS', CHECK | Ket qua thao tac |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thoi diem ghi nhat ky |

**Quy tac du lieu:**

- Moi AuditLog co mot audit_log_id duy nhat.
- action_type chi nhan LOCK, UNLOCK, RELOCK, SCORE_EDIT hoac SCORE_IMPORT.
- result chi nhan SUCCESS, REJECTED hoac FAILED.
- performed_by bat buoc tham chieu den User(user_id) da duoc xac thuc.
- Backend lay performed_by tu phien dang nhap/JWT hop le.
- Khong tin ID nguoi thuc hien do client tu khai bao.
- requested_by tham chieu User(user_id) neu nguoi yeu cau co tai khoan.
- Neu nguoi yeu cau khong co tai khoan thi requested_by co the NULL, nhung requested_by_name phai duoc ghi nhan theo quy tac mo khoa.
- academic_year_id, class_id va subject_id la thong tin bat buoc theo pham vi thao tac trong thiet ke hien tai.
- component chi nhan QT1, QT2, QT3, GK, CK hoac NULL khi thao tac khong gan rieng mot thanh phan diem.
- old_value va new_value co the NULL.
- Diem 0 la gia tri hop le, khong duoc thay the bang NULL.
- related_log_id tham chieu AuditLog(audit_log_id) de lien ket thao tac sua diem voi lan mo khoa tuong ung.
- Khi thao tac khong lien quan den hoc sinh hoac diem cu the, student_id, score_record_id va score_component_id co the NULL.

**Quy tac nhat ky bat bien:**

- AuditLog duoc thiet ke theo nguyen tac append-only: chi ghi them ban ghi moi.
- Khong cho phep sua hoac xoa nhat ky da ghi trong cac luong nghiep vu thong thuong.
- Moi thao tac LOCK, UNLOCK, RELOCK, SCORE_EDIT va SCORE_IMPORT can co nhat ky phu hop.
- Khi sua diem, ghi nhan gia tri cu, gia tri moi, nguoi thuc hien va thoi diem thao tac.
- Khi mo khoa, ghi nhan nguoi yeu cau, ly do va nguoi thuc hien.
- Moi ban ghi phai duoc bao toan de phuc vu truy vet va giai trinh.
- Thong tin phe duyet cong thuc thuoc ScoreFormulaPolicy, khong luu lap lai trong AuditLog.

**Rang buoc PostgreSQL de xuat:**

- CHECK (action_type IN ('LOCK', 'UNLOCK', 'RELOCK', 'SCORE_EDIT', 'SCORE_IMPORT')).
- CHECK (result IN ('SUCCESS', 'REJECTED', 'FAILED')).
- CHECK (component IS NULL OR component IN ('QT1', 'QT2', 'QT3', 'GK', 'CK')).
- FOREIGN KEY (performed_by) tham chieu User(user_id).
- FOREIGN KEY (requested_by) tham chieu User(user_id).
- FOREIGN KEY (lock_status_id) tham chieu LockStatus(lock_status_id).
- FOREIGN KEY (academic_year_id) tham chieu AcademicYear(academic_year_id).
- FOREIGN KEY (class_id) tham chieu Class(class_id).
- FOREIGN KEY (subject_id) tham chieu Subject(subject_id).
- FOREIGN KEY (student_id) tham chieu Student(student_id).
- FOREIGN KEY (score_record_id) tham chieu ScoreRecord(score_record_id).
- FOREIGN KEY (score_component_id) tham chieu ScoreComponent(score_component_id).
- FOREIGN KEY (related_log_id) tham chieu AuditLog(audit_log_id).
- Bang tai khoan trong PostgreSQL la app_user; performed_by va requested_by tham chieu app_user(user_id).
- Can bao dam tinh nhat quan giua class_id va academic_year_id cua ban ghi AuditLog.

**Quy tac transaction:**

- Cap nhat ScoreComponent va ghi AuditLog thanh cong phai nam trong cung mot database transaction.
- Thay doi LockStatus va ghi AuditLog thanh cong phai nam trong cung mot database transaction.
- Neu ghi nhat ky that bai thi phai rollback thay doi diem hoac trang thai khoa tuong ung.
- Cach luu nhat ky cua thao tac bi tu choi hoac that bai (result = REJECTED hoac FAILED) can duoc thiet ke rieng de khong bi mat khi transaction nghiep vu rollback.
- Ghi log khong thay the kiem tra quyen va kiem tra trang thai khoa diem.

**Quan he:**

- User (1) - (N) AuditLog qua performed_by.
- requested_by la quan he tuy chon voi User.
- AcademicYear (1) - (N) AuditLog.
- Class (1) - (N) AuditLog.
- Subject (1) - (N) AuditLog.
- LockStatus, Student, ScoreRecord va ScoreComponent co the duoc nhieu AuditLog tham chieu.
- AuditLog co the tu tham chieu qua related_log_id.

**Luu y tich hop:**

- Noi dung duoc tong hop tu thiet ke khoa diem va nhat ky thao tac.
- Doi chieu schema LockStatus va tai khoan User voi cac tai lieu da duoc phe duyet truoc khi tao migrations.
- Yeu cau cong bo diem doc lap voi khoa diem.
- AuditLog khong tu dong dong vai tro bang cong bo diem.
- Data Dictionary nay la tai lieu thiet ke, chua phai migration SQL chinh thuc.

### 3.13. ScoreFormulaPolicy

**Muc dich:** Luu cau hinh cong thuc tinh diem tong ket, he so tung thanh phan diem, quy tac lam tron, phien ban cong thuc va thong tin phe duyet.

| Thuoc tinh | Kieu du lieu | Rang buoc | Mo ta |
|---|---|---|---|
| formula_policy_id | BIGSERIAL | PRIMARY KEY | Ma chinh sach cong thuc |
| formula_expression | TEXT | NOT NULL | Bieu thuc tinh diem tong ket |
| weight_qt1 | SMALLINT | NOT NULL, CHECK = 1 | He so QT1 |
| weight_qt2 | SMALLINT | NOT NULL, CHECK = 1 | He so QT2 |
| weight_qt3 | SMALLINT | NOT NULL, CHECK = 1 | He so QT3 |
| weight_gk | SMALLINT | NOT NULL, CHECK = 2 | He so giua ky |
| weight_ck | SMALLINT | NOT NULL, CHECK = 3 | He so cuoi ky |
| rounding_digits | SMALLINT | NOT NULL, CHECK = 2 | So chu so thap phan khi lam tron |
| version | INTEGER | NOT NULL, UNIQUE, CHECK | Phien ban cong thuc |
| approval_status | VARCHAR(10) | NOT NULL, DEFAULT 'PENDING', CHECK | Trang thai phe duyet |
| approved_by | VARCHAR(150) | NULL | Thong tin nguoi phe duyet |
| approved_at | TIMESTAMPTZ | NULL | Thoi diem phe duyet |

**Quy tac du lieu:**

- Moi ScoreFormulaPolicy co mot formula_policy_id duy nhat.
- formula_expression khong duoc NULL, rong hoac chi chua khoang trang.
- Moi phien ban cong thuc co version duy nhat.
- CHECK (version >= 1).
- weight_qt1 = 1.
- weight_qt2 = 1.
- weight_qt3 = 1.
- weight_gk = 2.
- weight_ck = 3.
- rounding_digits = 2.
- Tong he so cua 5 thanh phan diem la 8.
- Khong luu lap lai cong thuc tinh diem trong ScoreComponent.
- Khong ghi de phien ban cong thuc cu neu viec thay doi anh huong den lich su diem.

**Cong thuc tinh diem tong ket:**

DTK = (QT1 + QT2 + QT3 + 2 * GK + 3 * CK) / 8

**Quy tac tinh DTK:**

- QT1, QT2, QT3 co he so 1.
- GK co he so 2.
- CK co he so 3.
- Tong he so la 8.
- Diem tong ket duoc lam tron den 2 chu so thap phan.
- Chi tinh DTK khi ca 5 thanh phan diem co trang thai SCORED.
- Neu thieu bat ky diem bat buoc nao thi khong tinh DTK.
- Diem 0 la gia tri hop le va khac NULL.
- Khong tu dong thay the NULL bang 0.
- ABSENT va EXEMPT khong duoc tu dong quy doi thanh diem 0.
- Cac quy tac nhap diem QT, GK va CK tuan theo ScoreComponent.

**Quy tac trang thai phe duyet:**

| approval_status | Y nghia |
|---|---|
| PENDING | Chua ghi nhan phe duyet |
| APPROVED | Da co thong tin phe duyet hop le |
| REJECTED | Khong duoc phe duyet |

- approval_status chi nhan PENDING, APPROVED hoac REJECTED.
- Gia tri mac dinh cua approval_status la PENDING.
- Khi approval_status = APPROVED, approved_by va approved_at bat buoc co gia tri.
- approved_by khong duoc rong hoac chi chua khoang trang khi APPROVED.
- Khi approval_status = PENDING hoac REJECTED, approved_by va approved_at phai la NULL theo thiet ke hien tai.
- Khong tu dong gan APPROVED khi chua co thong tin phe duyet thuc te.
- Viec nhom thong nhat cong thuc khong dong nghia voi viec giang vien da phe duyet.
- approved_by la thong tin nguoi phe duyet trong ho so.
- approved_by khong phai khoa ngoai den User.
- Khong bo sung vai tro dang nhap GIANG_VIEN hay API phe duyet rieng trong pham vi hien tai.

**Rang buoc PostgreSQL de xuat:**

- CHECK (weight_qt1 = 1).
- CHECK (weight_qt2 = 1).
- CHECK (weight_qt3 = 1).
- CHECK (weight_gk = 2).
- CHECK (weight_ck = 3).
- CHECK (rounding_digits = 2).
- CHECK (version >= 1).
- UNIQUE (version).
- CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')).
- CHECK ((approval_status = 'APPROVED' AND approved_by IS NOT NULL AND BTRIM(approved_by) <> '' AND approved_at IS NOT NULL) OR (approval_status IN ('PENDING', 'REJECTED') AND approved_by IS NULL AND approved_at IS NULL)).

**Quy tac quan ly phien ban:**

- Moi phien ban cong thuc duoc luu rieng.
- Khi thay doi cong thuc, he so hoac quy tac lam tron, phai tao phien ban moi.
- Khong ghi de cong thuc cu neu da duoc su dung de tinh diem.
- Phien ban moi phai co version khac phien ban truoc.
- Phai bao toan kha nang truy vet quy tac da duoc su dung de tinh diem lich su.
- Khong tu dong ap dung phien ban moi cho diem lich su khi chua co quy tac nghiep vu duoc phe duyet.


**Quan he va tich hop:**

- ScoreFormulaPolicy la thuc the cau hinh bo sung cho quy tac tinh diem tong ket.
- He thong su dung mot cong thuc thong nhat trong pham vi demo.
- ScoreRecord khong bat buoc luu formula_policy_id.
- ScoreComponent khong luu formula_policy_id.
- Backend su dung cau hinh cong thuc duoc ap dung cho he thong de tinh DTK.
- Giao dien phai hien thi ro cong thuc tinh diem theo G5-FR09.
- Cong thuc duoc nhom xay dung dua tren ket qua khao sat.
- Thong tin phe duyet cua giang vien phai duoc ghi nhan trung thuc.
- Khong tu dong gan APPROVED neu chua co bang chung phe duyet.
- Trong pham vi demo, khong thay doi cong thuc khi da phat sinh du lieu diem.
- Neu sau nay can ap dung nhieu phien ban cong thuc cho cac ban ghi diem khac nhau, phai mo rong thiet ke va bao toan lich su.


**Luu y thiet ke:**

- ScoreFormulaPolicy la thuc the bo sung, khong nam trong danh sach 12 thuc the chinh ban dau.
- Cong thuc va he so hien tai da duoc nhom thong nhat.
- Trang thai phe duyet cua giang vien phai dua tren thong tin xac nhan thuc te.
- Khong tu y bo sung quy trinh phe duyet hoac chuc nang ngoai pham vi da thong nhat.
- Data Dictionary nay la tai lieu thiet ke, chua phai migration SQL chinh thuc.


## 4. Cac quyet dinh thiet ke theo yeu cau de tai

### 4.1. Quy uoc ten bang PostgreSQL

- Su dung quy uoc snake_case cho ten bang va cot.
- Thuc the User duoc trien khai bang bang app_user.
- Khoa chinh cua app_user la user_id.
- LockStatus.locked_by tham chieu app_user(user_id).
- LockStatus.unlocked_by tham chieu app_user(user_id).
- LockStatus.requested_by tham chieu app_user(user_id).
- AuditLog.performed_by tham chieu app_user(user_id).
- AuditLog.requested_by tham chieu app_user(user_id).
- Cac khoa ngoai phai su dung ten bang da quy dinh thong nhat.

### 4.2. Pham vi quan ly diem

- He thong quan ly ket qua hoc tap trong 2 nien khoa.
- Moi nien khoa co 3 khoi: 10, 11 va 12.
- Moi khoi co 1 lop trong pham vi demo.
- Moi hoc sinh co ket qua hoc tap theo mon hoc va nien khoa.
- Moi mon hoc co 5 thanh phan diem: QT1, QT2, QT3, GK va CK.
- Khong bat buoc tach diem theo HK1 va HK2.
- ScoreRecord lien ket voi Enrollment va Subject.
- Nien khoa duoc xac dinh thong qua Enrollment.
- Moi thanh phan diem duoc luu trong ScoreComponent.

### 4.3. Cong thuc tinh diem tong ket

- He thong phai tinh DTK theo G5-FR09.
- Cong thuc phai duoc xay dung tu ket qua khao sat nghiep vu.
- Cong thuc duoc su dung phai co thong tin phe duyet thuc te cua giang vien theo yeu cau de tai.
- Cong thuc duoc hien thi ro rang tren giao dien.
- ScoreFormulaPolicy luu thong tin cau hinh cong thuc va phe duyet.
- Trong pham vi demo, he thong su dung mot cau hinh cong thuc thong nhat.
- Khong bat buoc tao quan he khoa ngoai truc tiep tu ScoreRecord den ScoreFormulaPolicy.
- Khong tu dong thay doi cong thuc khi da co diem.
- Khong tinh DTK neu thieu diem bat buoc.
- Diem 0 la gia tri hop le va khac NULL.

### 4.4. Quyen xem ket qua cua hoc sinh

- He thong co 2 vai tro: KHAO_THI va HOC_SINH.
- Hoc sinh phai dang nhap de xem ket qua hoc tap.
- Hoc sinh chi duoc xem ket qua cua chinh minh.
- Hoc sinh co the tra cuu ket qua theo nien khoa va mon hoc.
- Backend xac dinh student_id tu tai khoan da xac thuc.
- Khong cho phep hoc sinh truy cap du lieu hoc sinh khac.
- Hoc sinh khong co quyen nhap, sua, khoa hoac mo khoa diem.
- De tai khong bat buoc xay dung trang thai PUBLISHED rieng.
- Trang thai LOCKED chi kiem soat quyen chinh sua diem, khong duoc su dung thay cho kiem tra quyen xem.

### 4.5. Khoa diem va nhat ky thao tac

- Moi thanh phan diem QT1, QT2, QT3, GK va CK co trang thai khoa doc lap.
- LockStatus quan ly trang thai khoa theo nien khoa, lop, mon hoc va thanh phan diem.
- Chi vai tro KHAO_THI duoc phep khoa va mo khoa diem.
- Diem dang LOCKED khong duoc chinh sua bang thao tac thong thuong.
- Khi mo khoa phai ghi nhan nguoi thuc hien va thoi diem.
- Khi sua diem sau mo khoa phai ghi nhan nguoi thuc hien va thoi diem.
- AuditLog luu lich su thao tac phuc vu truy vet.
- Cap nhat diem va ghi log thanh cong phai bao dam tinh toan ven transaction.
- Khong xoa nhat ky thao tac da duoc ghi nhan.
- Co che khoa va mo khoa phai duoc kiem thu doc lap theo tung cot diem.

### 4.6. Bao toan du lieu hoc sinh

- Khong xoa cung hoc sinh neu viec xoa lam mat lich su diem.
- Co the chuyen trang thai hoc sinh sang INACTIVE.
- Enrollment luu quan he hoc sinh va lop hoc theo nien khoa.
- Khi hoc sinh chuyen lop, khong ghi de lich su Enrollment cu.
- ScoreRecord cu phai duoc bao toan.
- Khong tu dong chuyen diem cua lop cu sang lop moi.
- Viec tra cuu diem phai lien ket dung hoc sinh, nien khoa, lop va mon hoc.

### 4.7. Du lieu va luong demo bat buoc

- Co du lieu demo cho 2 nien khoa.
- Moi nien khoa co khoi 10, 11 va 12.
- Moi khoi co it nhat 1 lop demo.
- Co it nhat 3 mon hoc.
- Co tai khoan demo cho KHAO_THI va HOC_SINH.
- Demo tao nien khoa, lop va hoc sinh.
- Demo nhap diem, khoa cot, thu sua khi dang khoa.
- Demo mo khoa, sua diem va xem AuditLog.
- Demo hoc sinh dang nhap va xem diem cua chinh minh.
- Demo import CSV voi dong hop le va dong loi.
- Co du lieu seed va kich ban demo de chay lai.
- Cac yeu cau MUST phai duoc kiem thu va lien ket trong RTM.
- Tong so test case toan du an toi thieu 20.

### 4.8. Gioi han pham vi

- Khong bat buoc quan ly diem rieng theo hoc ky.
- Khong bat buoc tao tinh nang cong bo diem.
- Khong bat buoc tao vai tro dang nhap GIANG_VIEN.
- Khong bat buoc xay dung quy trinh phe duyet cong thuc bang API rieng.
- Khong tich hop so lien lac dien tu hoac he thong Bo/So.
- Khong mo rong thanh he thong quan ly toan bo truong khi chua can thiet.
- Uu tien hoan thanh va kiem thu tat ca yeu cau MUST.
- Cac chuc nang SHOULD va COULD duoc trien khai theo pham vi va luong demo cua de tai.


## 5. Ket luan

Tai lieu Data Dictionary da mo ta 12 thuc the chinh va 1 thuc the cau hinh bo sung cua he thong quan ly ket qua hoc tap THPT.

Tai lieu la co so de tong hop ERD, xay dung database schema, trien khai PostgreSQL migrations va kiem tra rang buoc toan ven du lieu.

Cac quyet dinh thiet ke tai Muc 4 duoc su dung lam co so khi xay dung ERD, SRS, API Contract va PostgreSQL migrations. Viec trien khai phai bao dam day du cac yeu cau MUST va tieu chi nghiem thu cua de tai.

Moi thay doi sau khi thong nhat phai duoc cap nhat dong bo trong Data Dictionary, ERD, SRS va cac API Contract lien quan.
