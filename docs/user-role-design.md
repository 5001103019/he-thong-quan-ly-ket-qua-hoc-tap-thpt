# THIET KE USER VA ROLE

## 1. Muc tieu

Thiet ke du lieu quan ly tai khoan dang nhap va
phan quyen cho He thong quan ly ket qua hoc tap
hoc sinh THPT.

He thong gom hai vai tro:
- KHAO_THI: Phong Khao thi.
- HOC_SINH: Hoc sinh.

## 2. Cac thuc the

1. Role - Vai tro nguoi dung.
2. User - Tai khoan dang nhap.


## 3. Thiet ke thuoc tinh va rang buoc

### 3.1. Role - Vai tro nguoi dung

Muc dich: Luu danh sach vai tro va phuc vu phan quyen truy cap he thong.

| Thuoc tinh | Kieu du lieu PostgreSQL | Rang buoc | Mo ta |
|---|---|---|---|
| role_id | BIGSERIAL | PRIMARY KEY | Ma dinh danh vai tro |
| code | VARCHAR(30) | NOT NULL, UNIQUE | Ma vai tro |
| name | VARCHAR(100) | NOT NULL | Ten vai tro |

Rang buoc du lieu:
- role_id la khoa chinh.
- code khong duoc NULL va khong duoc trung.
- name khong duoc NULL hoac chi chua khoang trang.
- Trong pham vi do an, code chi nhan KHAO_THI hoac HOC_SINH.
- Khong xoa Role neu dang co User tham chieu.

Du lieu minh hoa:

| role_id | code | name |
|---|---|---|
| 1 | KHAO_THI | Phong Khao thi |
| 2 | HOC_SINH | Hoc sinh |

Quan he:
- Mot Role co the duoc nhieu User su dung.
- Moi User phai thuoc mot Role hop le.
- Quan he Role - User la 1 - N.
- User.role_id tham chieu Role.role_id.

### 3.2. User - Tai khoan dang nhap

Muc dich: Luu thong tin tai khoan dang nhap va lien ket vai tro nguoi dung trong he thong.

| Thuoc tinh | Kieu du lieu PostgreSQL | Rang buoc | Mo ta |
|---|---|---|---|
| user_id | BIGSERIAL | PRIMARY KEY | Ma dinh danh tai khoan |
| username | VARCHAR(50) | NOT NULL, UNIQUE | Ten dang nhap |
| password_hash | TEXT | NOT NULL | Mat khau da bam |
| role_id | BIGINT | NOT NULL, FOREIGN KEY | Tham chieu Role |
| student_id | BIGINT | NULL, FOREIGN KEY, UNIQUE | Tham chieu Student |
| is_active | BOOLEAN | NOT NULL, DEFAULT TRUE | Trang thai tai khoan |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Thoi diem tao tai khoan |

Rang buoc du lieu:
- user_id la khoa chinh.
- username khong duoc NULL, rong hoac chi chua khoang trang.
- username phai duy nhat, khong phan biet chu hoa va chu thuong.
- password_hash khong duoc NULL.
- Khong luu mat khau dang van ban thuan.
- role_id tham chieu Role(role_id).
- student_id tham chieu Student(student_id) cua VT3.
- student_id co the NULL doi voi tai khoan KHAO_THI.
- Tai khoan HOC_SINH bat buoc lien ket voi mot Student.
- Tai khoan KHAO_THI khong lien ket voi Student.
- Moi Student co toi da mot tai khoan User.
- is_active = TRUE: Tai khoan dang hoat dong.
- is_active = FALSE: Tai khoan bi vo hieu hoa.
- Khong xoa lich su hoc tap khi vo hieu hoa tai khoan.

Quy tac bao mat:
- Mat khau phai duoc bam an toan truoc khi luu.
- Khong tra ve password_hash trong API.
- Backend kiem tra vai tro truoc khi cho phep truy cap.
- HOC_SINH chi duoc xem ket qua hoc tap cua chinh minh.
- Backend xac dinh student_id tu phien dang nhap.
- Khong cho phep frontend tu y thay doi role_id.
- Tai khoan bi vo hieu hoa khong duoc tiep tuc truy cap API duoc bao ve.

Luu y:
- UNIQUE tren username can thuc thi ca quy tac khong phan biet chu hoa, chu thuong.
- Quy tac role HOC_SINH phai co student_id can duoc kiem tra tai backend hoac bang rang buoc lien bang phu hop.
- Schema User se duoc doi chieu voi AuditLog cua VT5 truoc khi tao migration chinh thuc.


## 4. Quan he giua cac thuc the

### 4.1. Quan he Role - User

Loai quan he: Mot - Nhieu (1 - N).

- Mot Role co the duoc nhieu User su dung.
- Moi User phai thuoc dung mot Role.
- User.role_id la khoa ngoai tham chieu Role.role_id.
- Khong cho phep User tham chieu Role khong ton tai.

### 4.2. Quan he Student - User

Loai quan he: Mot - Mot tuy chon (0..1 - 0..1).

- Mot Student co the chua co tai khoan dang nhap.
- Mot Student co toi da mot tai khoan User.
- Tai khoan HOC_SINH phai lien ket voi Student.
- Tai khoan KHAO_THI khong lien ket voi Student.
- User.student_id la khoa ngoai tham chieu Student.student_id.
- UNIQUE(User.student_id) ngan nhieu tai khoan lien ket cung mot Student.
- Khong xoa Student hoac lich su hoc tap khi vo hieu hoa User.

### 4.3. Bang tong hop quan he

| Thuc the cha | Thuc the con | Quan he | Khoa ngoai |
|---|---|---|---|
| Role | User | 1 - N | User.role_id |
| Student | User | 0..1 - 0..1 | User.student_id |

### 4.4. Quy tac toan ven

- Khoa ngoai User.role_id phai tham chieu Role hop le.
- Khoa ngoai User.student_id phai tham chieu Student hop le neu khac NULL.
- Phai kiem tra su phu hop giua Role va student_id.
- Khong cho phep tai khoan HOC_SINH khong co student_id.
- Khong cho phep tai khoan KHAO_THI lien ket Student.
- Cac quy tac phu thuoc Role can duoc kiem tra tai backend hoac bang rang buoc lien bang phu hop.
- Khong cho phep hoc sinh truy cap du lieu cua hoc sinh khac.
- Backend su dung danh tinh da xac thuc de xac dinh Student.


## 5. Quy tac nghiep vu (Business Rules)

### 5.1. Quan ly tai khoan

BR-U01: Moi User phai co username duy nhat.

BR-U02: Mat khau phai duoc bam an toan truoc khi luu vao database.

BR-U03: Chi tai khoan co is_active = TRUE moi duoc dang nhap thanh cong.

BR-U04: Moi User phai thuoc mot Role hop le.

BR-U05: Tai khoan HOC_SINH phai lien ket voi mot Student hop le.

BR-U06: Tai khoan KHAO_THI khong lien ket voi Student.

BR-U07: Moi Student co toi da mot tai khoan User.

### 5.2. Phan quyen truy cap

BR-U08: Chi KHAO_THI duoc truy cap cac API quan tri.

BR-U09: HOC_SINH chi duoc xem ket qua hoc tap cua chinh minh.

BR-U10: Backend phai lay student_id tu tai khoan da xac thuc, khong tin student_id do frontend tu cung cap.

BR-U11: Khong cho phep frontend tu thay doi Role hoac nang quyen tai khoan.

### 5.3. Bao mat va lich su

BR-U12: Khong luu mat khau dang van ban thuan.

BR-U13: Khong tra ve password_hash trong bat ky API nao.

BR-U14: Khi vo hieu hoa tai khoan, he thong phai ngan truy cap cac API duoc bao ve, bao gom ca phien dang nhap con hieu luc.

BR-U15: Khong xoa du lieu Student, Enrollment hoac diem khi vo hieu hoa User.

BR-U16: Cac thao tac quan trong ve tai khoan can duoc ghi nhat ky theo pham vi AuditLog duoc nhom thong nhat.


