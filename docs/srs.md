
# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)
# HE THONG QUAN LY KET QUA HOC TAP HOC SINH THPT

**Nhom thuc hien:** Nhom 5

**Ma tai lieu:** G5-SRS

**Phien ban tai lieu:** 1.0 - Draft

**Trang thai:** Du thao dac ta yeu cau, chua phai bien ban nghiem thu

**Cong nghe dang ky:** HTML, CSS, JavaScript

**Cong nghe trien khai du kien:** HTML, CSS, JavaScript, Node.js, Express, PostgreSQL

**Pham vi:** Do an mon Cong nghe phan mem

---

## 1. Gioi thieu

### 1.1. Muc dich tai lieu

Tai lieu Software Requirements Specification (SRS) dac ta cac yeu cau chuc nang, yeu cau phi chuc nang, quy tac nghiep vu, pham vi he thong, luong nghiep vu va dieu kien nghiem thu cua He thong quan ly ket qua hoc tap hoc sinh THPT.

SRS la co so de:

- Thiet ke Use Case Diagram va dac ta Use Case.
- Thiet ke ERD va Data Dictionary.
- Thiet ke prototype giao dien tren Figma.
- Xay dung frontend va backend.
- Thong nhat API Contract va rang buoc du lieu.
- Xay dung test case va Requirements Traceability Matrix (RTM).
- Kiem tra viec dap ung yeu cau khi nghiem thu cuoi ky.

### 1.2. Nguon yeu cau

Tai lieu duoc xay dung dua tren:

1. De tai Nhom 5 - He thong quan ly ket qua hoc tap hoc sinh THPT.
2. Danh sach yeu cau G5-FR01 den G5-FR12.
3. Cac Business Rules va luong demo trong de tai.
4. Cac tieu chi nghiem thu cuoi ky.
5. Tai lieu ERD va Data Dictionary cua nhom.
6. Thiet ke nghiep vu diem, khoa diem va AuditLog.
7. Ket qua khao sat nghiep vu va cac quyet dinh duoc ghi nhan trong ho so nhom.

Thong tin ve khao sat va phe duyet chi duoc coi la da xac nhan khi co bang chung thuc te.

### 1.3. Quy uoc muc do uu tien

| Muc do | Y nghia |
|---|---|
| MUST | Bat buoc dap ung va kiem thu |
| SHOULD | Nen trien khai theo pham vi va ke hoach du an |
| COULD | Tinh nang bo sung neu cac MUST da hoat dong on dinh |

Khong duoc tu y bo yeu cau MUST vi kho trien khai khi chua co Change Request duoc duyet.

Mot yeu cau SHOULD van can duoc trien khai neu no thuoc luong demo bat buoc cua de tai.

### 1.4. Thuat ngu va tu viet tat

| Thuat ngu | Y nghia |
|---|---|
| SRS | Software Requirements Specification |
| FR | Functional Requirement |
| NFR | Non-Functional Requirement |
| UC | Use Case |
| ERD | Entity Relationship Diagram |
| RTM | Requirements Traceability Matrix |
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete |
| CSV | Comma-Separated Values |
| PK | Primary Key |
| FK | Foreign Key |
| DTK | Diem tong ket |
| QT1 | Diem qua trinh 1 |
| QT2 | Diem qua trinh 2 |
| QT3 | Diem qua trinh 3 |
| GK | Diem giua ky |
| CK | Diem cuoi ky |
| Enrollment | Lich su phan lop cua hoc sinh |
| ScoreRecord | Ban ghi diem theo lan phan lop va mon hoc |
| ScoreComponent | Thanh phan diem cua ScoreRecord |
| LockStatus | Trang thai khoa cua tung thanh phan diem |
| AuditLog | Nhat ky thao tac |
| Change Request | Yeu cau thay doi pham vi hoac yeu cau da duoc xac lap |

### 1.5. Tai lieu lien quan

| Tai lieu | Muc dich |
|---|---|
| docs/erd.md | Mo hinh thuc the va quan he |
| docs/data-dictionary.md | Thuc the, thuoc tinh va rang buoc du lieu |
| docs/api-conventions.md | Quy uoc API va xu ly loi |
| docs/user-role-design.md | Thiet ke tai khoan va phan quyen |
| docs/vt3-data-model.md | Thiet ke du lieu hoc sinh, lop va nien khoa |
| docs/vt4-score-design.md | Thiet ke du lieu diem va quy tac tinh diem |
| docs/figma-handoff.md | Quy chuan thiet ke va ban giao Figma |
| docs/git-workflow.md | Quy trinh branch, commit va Pull Request |

---

## 2. Tong quan va pham vi he thong

### 2.1. Mo ta tong quan

He thong phuc vu Phong Khao thi trong viec quan ly hoc sinh va ket qua hoc tap tai truong THPT.

Phong Khao thi co the quan ly nien khoa, khoi, lop, hoc sinh, mon hoc, nhap diem, sua diem, khoa diem, mo khoa va theo doi nhat ky thao tac.

Hoc sinh co tai khoan rieng de dang nhap va xem ket qua hoc tap cua chinh minh.

He thong phai bao dam tinh toan ven du lieu, phan quyen va bao toan lich su diem.

### 2.2. Pham vi du lieu

- Quan ly 2 nien khoa.
- Moi nien khoa co cac khoi 10, 11 va 12.
- Pham vi demo moi khoi co 1 lop.
- Co it nhat 3 mon hoc trong du lieu demo.
- Moi hoc sinh co ma dinh danh duy nhat.
- Hoc sinh duoc phan lop thong qua Enrollment.
- Moi hoc sinh co ket qua hoc tap theo nien khoa va mon hoc.
- Moi mon hoc gom 3 diem qua trinh, 1 diem giua ky va 1 diem cuoi ky.
- Moi thanh phan diem duoc khoa rieng.
- Du lieu lich su phai duoc bao toan khi hoc sinh chuyen lop hoac ngung hoat dong.

### 2.3. In-scope

Cac chuc nang bat buoc trong pham vi:

- Dang nhap va phan quyen.
- Quan ly 2 nien khoa, khoi va lop.
- Quan ly ho so hoc sinh.
- Quan ly mon hoc va danh sach hoc sinh theo lop.
- Nhap va sua diem.
- Khoa diem theo tung thanh phan.
- Mo khoa diem theo quyen va ghi nhat ky.
- Hoc sinh xem ket qua cua chinh minh.
- Tinh DTK va hien thi cong thuc.
- Bao toan lich su diem va rang buoc du lieu.
- Chuan bi du lieu seed, tai khoan demo va kich ban demo.

Cac chuc nang SHOULD duoc dua vao ke hoach:

- Import hoc sinh hoac diem tu CSV.
- Xuat bang diem hoac thong ke theo lop, mon.

Trong do, import CSV co dong hop le va dong loi la luong demo bat buoc.

Chuc nang COULD:

- Xem lich su thay doi diem chi tiet voi gia tri truoc va sau.

### 2.4. Out-of-scope

Cac noi dung khong bat buoc trong pham vi hien tai:

- Quan ly toan bo truong voi so luong lon lop va hoc sinh.
- Tich hop so lien lac dien tu.
- Tich hop he thong quan ly cua Bo hoac So.
- Tao vai tro dang nhap GIANG_VIEN rieng.
- Quan ly diem tach rieng HK1 va HK2.
- Xay dung quy trinh cong bo diem theo lich rieng.
- Xay dung API phe duyet cong thuc danh cho giang vien.
- Tu dong khoa diem theo thoi han khi chua co quy tac nghiep vu.
- Cac tinh nang COULD chua duoc dua vao ke hoach thuc hien.

Cac gioi han tren la phuong an pham vi thiet ke. Neu phat sinh thay doi doi voi yeu cau MUST thi phai tuan theo quy trinh Change Request.

### 2.5. Moi truong trien khai

- Frontend: HTML, CSS, JavaScript.
- Backend: Node.js va Express.
- Database: PostgreSQL.
- Giao tiep frontend-backend: REST API, JSON.
- Giao dien demo: desktop, theo quy chuan trong docs/figma-handoff.md.
- He thong duoc demo trong moi truong phat trien cua nhom.
- Cau hinh can thiet duoc cung cap qua .env.example.
- Du lieu demo duoc khoi tao bang seed.

### 2.6. Nguyen tac thiet ke

- Backend chiu trach nhiem kiem tra quyen truy cap.
- Database phai duy tri quan he PK/FK va rang buoc toan ven.
- Khong luu mat khau dang van ban thuan.
- Khong coi diem 0 la diem chua nhap.
- Diem da khoa khong duoc sua qua thao tac thong thuong.
- Mo khoa va sua diem sau mo khoa phai co nhat ky phu hop.
- Khong xoa du lieu lam mat lich su hoc tap.
- Cac tai lieu ERD, Data Dictionary, SRS va API Contract phai nhat quan.

---

## 3. Stakeholder, Actor va phan quyen

### 3.1. Stakeholder

| Stakeholder | Vai tro |
|---|---|
| Phong Khao thi | Quan ly hoc sinh, tai khoan, mon hoc va diem |
| Hoc sinh | Xem ket qua hoc tap ca nhan |
| Giang vien danh gia de tai | Danh gia yeu cau, cong thuc va san pham cuoi ky |
| Nhom phat trien | Phan tich, thiet ke, trien khai va kiem thu |

### 3.2. Actor chinh

He thong co dung 2 actor chinh:

1. PHONG KHAO THI.
2. HOC SINH.

Giang vien danh gia de tai la stakeholder, khong phai actor dang nhap cua he thong.

### 3.3. Quyen cua Phong Khao thi

- Dang nhap.
- Quan ly tai khoan theo pham vi phan quyen.
- Quan ly nien khoa, khoi va lop.
- Quan ly ho so hoc sinh.
- Quan ly mon hoc.
- Xem danh sach hoc sinh theo lop.
- Nhap va sua diem.
- Khoa tung thanh phan diem.
- Mo khoa va khoa lai diem.
- Xem AuditLog.
- Import CSV.
- Xuat bang diem hoac xem thong ke neu tinh nang duoc trien khai.

### 3.4. Quyen cua Hoc sinh

- Dang nhap bang tai khoan duoc cap.
- Xem ket qua hoc tap cua chinh minh.
- Loc ket qua theo nien khoa va mon hoc.
- Xem diem thanh phan va DTK neu du dieu kien tinh.
- Khong duoc nhap, sua, khoa hoac mo khoa diem.
- Khong duoc truy cap du lieu hoc sinh khac.

### 3.5. Ma vai tro

| Role.code | Ten vai tro |
|---|---|
| KHAO_THI | Phong Khao thi |
| HOC_SINH | Hoc sinh |

### 3.6. Quy tac phan quyen

- Moi User duoc gan Role hop le.
- USER la ten thuc the trong ERD.
- Bang PostgreSQL tuong ung la app_user.
- Tai khoan HOC_SINH phai lien ket voi Student.
- Tai khoan KHAO_THI khong gan voi Student.

- Backend lay danh tinh nguoi dung tu phien dang nhap hop le.
- Khong tin student_id hoac performed_by do client tu khai bao.
- Tai khoan INACTIVE khong duoc dang nhap.
- Khong tra ve password_hash trong API.
- Khong duoc phan quyen chi bang viec an nut tren giao dien.

---

## 4. Yeu cau chuc nang

### 4.1. G5-FR01 - Dang nhap va phan quyen

**Muc do:** MUST

**Actor:** Phong Khao thi, Hoc sinh

**Use Case lien quan:** UC01

**Mo ta:**

He thong cho phep nguoi dung dang nhap va truy cap chuc nang theo vai tro.

**Dau vao:**

- Username.
- Password.

**Dieu kien tien quyet:**

- Tai khoan ton tai.
- Tai khoan dang hoat dong.

**Luong chinh:**

1. Nguoi dung mo trang dang nhap.
2. Nhap username va password.
3. He thong kiem tra thong tin dang nhap.
4. He thong kiem tra trang thai tai khoan.
5. He thong xac dinh vai tro.
6. Tao phien dang nhap hop le.
7. Chuyen den giao dien phu hop.

**Ngoai le:**

- Sai username hoac password: tu choi dang nhap.
- Tai khoan INACTIVE: tu choi dang nhap.
- Thieu truong bat buoc: thong bao loi.
- Khong co quyen truy cap: backend tu choi.

**Tieu chi chap nhan:**

- Dang nhap thanh cong voi tai khoan hop le.
- Dang nhap that bai voi thong tin sai.
- Hoc sinh khong truy cap duoc API quan ly diem.
- Quyen truy cap duoc kiem tra tai backend.

### 4.2. G5-FR02 - Quan ly nien khoa, khoi va lop

**Muc do:** MUST

**Actor:** Phong Khao thi

**Use Case lien quan:** UC02

**Mo ta:**

He thong quan ly 2 nien khoa, cac khoi 10, 11, 12 va lop hoc.

**Dau vao:**

- Ma nien khoa.
- Nam bat dau va ket thuc.
- Khoi lop.
- Ma lop.
- Ten lop.
- Trang thai.

**Dieu kien tien quyet:**

- Dang nhap vai tro KHAO_THI.

**Luong chinh:**

1. Mo trang quan ly nien khoa.
2. Tao hoac chinh sua nien khoa.
3. Chon khoi.
4. Tao hoac chinh sua lop.
5. He thong kiem tra trung lap va tinh hop le.
6. Luu du lieu.

**Ngoai le:**

- Trung ma nien khoa.
- Trung ma lop trong cung nien khoa.
- Khoi khong hop le.
- Nam ket thuc khong bang nam bat dau cong 1.
- Co gang xoa du lieu da co lich su lien quan.

**Tieu chi chap nhan:**

- Co 2 nien khoa demo.
- Moi nien khoa co 3 khoi 10, 11, 12.
- Moi khoi co 1 lop demo.
- Lop thuoc dung nien khoa va khoi.

### 4.3. G5-FR03 - Quan ly ho so hoc sinh

**Muc do:** MUST

**Actor:** Phong Khao thi

**Use Case lien quan:** UC03, UC04

**Mo ta:**

He thong cho phep them, xem, sua, xoa hoac chuyen trang thai ho so hoc sinh theo quy tac nghiep vu.

**Dau vao:**

- Ma hoc sinh.
- Ho va ten.
- Ngay sinh.
- Trang thai ho so.

**Dieu kien tien quyet:**

- Dang nhap voi vai tro KHAO_THI.

**Luong chinh:**

1. Mo danh sach hoc sinh.
2. Chon them moi hoac sua.
3. Nhap thong tin ho so.
4. Kiem tra ma hoc sinh va du lieu bat buoc.
5. Luu thay doi.
6. Cap nhat danh sach.

**Ngoai le:**

- Trung ma hoc sinh.
- Ngay sinh khong hop le.
- Thieu truong bat buoc.
- Xoa hoc sinh da co lich su hoc tap.

**Tieu chi chap nhan:**

- Them va sua duoc ho so hop le.
- Khong chap nhan ma hoc sinh trung.
- Khong xoa cung hoc sinh da co diem.
- Chuyen INACTIVE khong lam mat lich su.

### 4.4. G5-FR04 - Quan ly mon hoc va danh sach theo lop

**Muc do:** MUST

**Actor:** Phong Khao thi

**Use Case lien quan:** UC05, UC14

**Mo ta:**

He thong quan ly mon hoc va danh sach hoc sinh theo lop, nien khoa.

**Dau vao:**

- Ma mon hoc.
- Ten mon hoc.
- Trang thai mon hoc.
- Nien khoa.
- Khoi va lop.

**Dieu kien tien quyet:**

- Dang nhap KHAO_THI.
- Nien khoa va lop ton tai.

**Luong chinh:**

1. Mo trang quan ly mon hoc.
2. Them hoac cap nhat mon hoc.
3. Kiem tra ma mon hoc.
4. Luu du lieu.
5. Chon nien khoa va lop.
6. Truy xuat danh sach hoc sinh tu Enrollment.
7. Hien thi danh sach hoc sinh.

**Ngoai le:**

- Trung ma mon hoc.
- Mon hoc hoac lop khong ton tai.
- Quan he phan lop khong hop le.

**Tieu chi chap nhan:**

- Quan ly duoc it nhat 3 mon hoc.
- Hien thi dung danh sach hoc sinh theo lop.
- Bao toan lich su hoc sinh chuyen lop.

### 4.5. G5-FR05 - Nhap va sua diem

**Muc do:** MUST

**Actor:** Phong Khao thi

**Use Case lien quan:** UC06, UC07

**Mo ta:**

He thong cho phep nhap va sua 5 thanh phan diem QT1, QT2, QT3, GK, CK theo hoc sinh va mon hoc.

**Dau vao:**

- Nien khoa.
- Lop.
- Mon hoc.
- Hoc sinh.
- Thanh phan diem.
- Gia tri diem hoac trang thai diem.

**Dieu kien tien quyet:**

- Dang nhap KHAO_THI.
- Enrollment hop le.
- Mon hoc ton tai.
- Cot diem can sua dang UNLOCKED.

**Luong chinh:**

1. Chon nien khoa, lop va mon hoc.
2. Hien thi bang nhap diem dang luoi.
3. Chon hoc sinh va cot diem.
4. Nhap gia tri hoac trang thai diem.
5. He thong kiem tra mien gia tri.
6. Kiem tra trang thai khoa.
7. Luu ScoreComponent hop le.
8. Ghi AuditLog phu hop.
9. Cap nhat giao dien.

**Ngoai le:**

- Diem ngoai mien.
- Diem sai do chinh xac theo quy tac thiet ke.
- Hoc sinh khong thuoc lop hoac nien khoa.
- Cot diem dang LOCKED.
- Loi khi ghi du lieu hoac AuditLog.

**Tieu chi chap nhan:**

- Chap nhan diem 0 va 10.
- Phan biet 0 va NULL.
- Tu choi diem ngoai mien.
- Tu choi sua diem da khoa.
- Khong ghi diem cho sai hoc sinh.
- Luu vet cac thay doi theo quy tac AuditLog.

### 4.6. G5-FR06 - Khoa diem doc lap

**Muc do:** MUST

**Actor:** Phong Khao thi

**Use Case lien quan:** UC08

**Mo ta:**

He thong cho phep khoa rieng tung thanh phan diem theo nien khoa, lop va mon hoc.

**Dau vao:**

- Nien khoa.
- Lop.
- Mon hoc.
- QT1, QT2, QT3, GK hoac CK.

**Dieu kien tien quyet:**

- Dang nhap KHAO_THI.
- Lop va mon hoc hop le.

**Luong chinh:**

1. Mo bang diem.
2. Chon cot can khoa.
3. He thong kiem tra trang thai hien tai.
4. Neu cot con thieu diem, hien thi canh bao theo quy tac thiet ke.
5. Nguoi dung xac nhan.
6. Cap nhat LockStatus thanh LOCKED.
7. Ghi AuditLog.
8. Hien thi cot da khoa.

**Ngoai le:**

- Khong du quyen.
- Cot da LOCKED.
- Xung dot cap nhat dong thoi.
- Ghi AuditLog that bai.

**Tieu chi chap nhan:**

- Khoa QT1 khong khoa QT2, QT3, GK, CK.
- Khong sua duoc cot dang LOCKED.
- Backend tu choi thao tac sua diem da khoa.
- AuditLog ghi nhan thao tac khoa.

### 4.7. G5-FR07 - Mo khoa diem va ghi log

**Muc do:** MUST

**Actor:** Phong Khao thi

**Use Case lien quan:** UC09

**Mo ta:**

He thong cho phep mo khoa diem theo quyen duoc dinh nghia va ghi nhat ky thao tac.

**Dau vao:**

- Nien khoa, lop, mon.
- Thanh phan diem.
- Nguoi yeu cau.
- Ly do mo khoa.

**Dieu kien tien quyet:**

- Dang nhap KHAO_THI.
- Thanh phan diem dang LOCKED.

**Luong chinh:**

1. Nguoi dung chon mo khoa.
2. Nhap nguoi yeu cau va ly do.
3. He thong kiem tra quyen.
4. Kiem tra thong tin bat buoc.
5. Cap nhat LockStatus thanh UNLOCKED.
6. Ghi AuditLog voi nguoi thuc hien va thoi diem.
7. Cho phep sua diem theo quyen.
8. Ghi nhat ky sua diem.
9. Cho phep khoa lai cot diem.

**Ngoai le:**

- Khong du quyen.
- Thieu ly do mo khoa.
- Cot khong dang LOCKED.
- Xung dot cap nhat.
- Ghi nhat ky that bai.

**Tieu chi chap nhan:**

- Mo khoa hop le khi co quyen va ly do.
- Tu choi mo khoa neu thieu ly do.
- Co log nguoi thuc hien va thoi diem.
- Sua diem duoc sau khi mo khoa.
- Co the khoa lai cot diem.

### 4.8. G5-FR08 - Hoc sinh xem ket qua cua chinh minh

**Muc do:** MUST

**Actor:** Hoc sinh

**Use Case lien quan:** UC13

**Mo ta:**

Hoc sinh dang nhap va xem ket qua hoc tap cua chinh minh theo nien khoa va mon hoc.

**Dau vao:**

- Phien dang nhap hop le.
- Nien khoa.
- Mon hoc neu co.

**Dieu kien tien quyet:**

- Hoc sinh da dang nhap.
- Tai khoan lien ket Student hop le.

**Luong chinh:**

1. Hoc sinh dang nhap.
2. Mo trang ket qua hoc tap.
3. Backend xac dinh student_id tu tai khoan.
4. Truy xuat Enrollment va ScoreRecord.
5. Hoc sinh chon nien khoa.
6. Hien thi ket qua theo mon hoc.
7. Hien thi DTK neu du dieu kien.

**Ngoai le:**

- Chua dang nhap.
- Tai khoan khong lien ket Student.
- Khong co du lieu diem.
- Nien khoa khong hop le.
- Yeu cau truy cap du lieu cua hoc sinh khac.

**Tieu chi chap nhan:**

- Hoc sinh A xem duoc ket qua cua A.
- Hoc sinh A khong xem duoc ket qua cua B.
- Hoc sinh khong co quyen sua diem.
- Du lieu duoc hien thi dung nien khoa.

### 4.9. G5-FR09 - Tinh diem tong ket

**Muc do:** MUST

**Actor:** Phong Khao thi, Hoc sinh xem ket qua

**Use Case lien quan:** UC06, UC13

**Mo ta:**

He thong tinh diem tong ket theo cong thuc duoc xay dung tu ket qua khao sat va duoc giang vien phe duyet theo yeu cau de tai.

**Cong thuc thiet ke hien tai:**

DTK = (QT1 + QT2 + QT3 + 2 * GK + 3 * CK) / 8

**He so:**

| Thanh phan | He so |
|---|---|
| QT1 | 1 |
| QT2 | 1 |
| QT3 | 1 |
| GK | 2 |
| CK | 3 |
| Tong | 8 |

**Quy tac:**

- Lam tron DTK den 2 chu so thap phan.
- Chi tinh khi ca 5 thanh phan co trang thai SCORED.
- Khong tinh DTK khi thieu diem bat buoc.
- Diem 0 la hop le.
- Khong tu dong chuyen NULL thanh 0.
- Khong tu dong quy doi ABSENT hoac EXEMPT thanh 0.
- Giao dien phai hien thi ro cong thuc.

**Luong chinh:**

1. Truy xuat 5 thanh phan diem.
2. Kiem tra tinh hop le va day du.
3. Lay cau hinh cong thuc ap dung.
4. Tinh DTK.
5. Lam tron 2 chu so.
6. Hien thi ket qua va cong thuc.

**Ngoai le:**

- Thieu diem bat buoc.
- Thanh phan diem khong hop le.
- Chua co cau hinh cong thuc du dieu kien ap dung.

**Tieu chi chap nhan:**

- Ket qua khop voi phep tinh tay.
- Lam tron dung.
- Khong tinh khi thieu diem.
- Hien thi ro cong thuc.
- Ho so nghiem thu co bang chung phe duyet cong thuc thuc te.

**Luu y:**

Cong thuc hien tai la phuong an thiet ke cua nhom. Khong duoc tu dong ghi nhan la giang vien da phe duyet khi chua co bang chung.

### 4.10. G5-FR10 - Import CSV

**Muc do:** SHOULD

**Actor:** Phong Khao thi

**Use Case lien quan:** UC11

**Mo ta:**

He thong cho phep import hoc sinh hoac diem tu CSV va bao loi theo tung dong.

Tinh nang nay thuoc luong demo bat buoc cua de tai.

**Dau vao:**

- Tep CSV.
- Loai du lieu import.
- Nien khoa, lop va mon hoc neu can.

**Luong chinh:**

1. Chon Import CSV.
2. Chon tep.
3. He thong doc du lieu.
4. Kiem tra cau truc cot.
5. Kiem tra tung dong.
6. Hien thi preview.
7. Bao danh sach dong hop le va dong loi.
8. Nguoi dung xac nhan import.
9. Ghi du lieu hop le.
10. Hien thi ket qua import.

**Ngoai le:**

- Dinh dang tep khong hop le.
- Thieu cot bat buoc.
- Trung ma du lieu.
- Hoc sinh khong ton tai.
- Diem ngoai mien.
- Cot diem dang khoa.

**Tieu chi chap nhan:**

- Import duoc du lieu hop le.
- Bao loi theo so dong.
- Khong ghi dong khong hop le.
- Khong ghi de diem da khoa.
- Demo co it nhat 1 dong hop le va 1 dong loi.

### 4.11. G5-FR11 - Xuat bang diem hoac thong ke

**Muc do:** SHOULD

**Actor:** Phong Khao thi

**Use Case lien quan:** UC12

**Mo ta:**

He thong ho tro xuat bang diem hoac thong ke ket qua hoc tap theo lop va mon hoc.

**Dau vao:**

- Nien khoa.
- Lop hoc.
- Mon hoc.
- Dieu kien loc.

**Luong chinh:**

1. Mo trang xuat hoac thong ke.
2. Chon nien khoa, lop va mon.
3. He thong truy xuat du lieu.
4. Hien thi ket qua.
5. Xuat bang diem hoac hien thi thong ke.

**Ngoai le:**

- Khong co du lieu.
- Lop hoac mon hoc khong hop le.
- Loi khi tao ket qua xuat.

**Tieu chi chap nhan neu trien khai:**

- Co the xuat bang diem hoac xem thong ke theo lop, mon.
- Ket qua phu hop voi diem da luu.
- Khong thay doi du lieu diem khi xuat.

### 4.12. G5-FR12 - Lich su thay doi diem chi tiet

**Muc do:** COULD

**Actor:** Phong Khao thi

**Mo ta:**

He thong co the cho phep xem chi tiet gia tri diem truoc va sau cac lan chinh sua.

**Dau vao:**

- Hoc sinh.
- Nien khoa.
- Mon hoc.
- Thanh phan diem.
- Dieu kien loc lich su.

**Luong chinh neu trien khai:**

1. Chon hoc sinh hoac ban ghi diem.
2. Mo lich su thay doi.
3. Truy xuat AuditLog.
4. Hien thi nguoi thuc hien va thoi diem.
5. Hien thi gia tri cu va moi neu co.

**Tieu chi chap nhan neu trien khai:**

- Xem duoc lich su thay doi chi tiet.
- Phan biet gia tri 0 va NULL.
- Khong cho phep sua hoac xoa AuditLog.

**Luu y:**

AuditLog cho thao tac mo khoa va sua diem sau mo khoa van la yeu cau bat buoc theo G5-FR07 va Business Rules, khong phu thuoc viec trien khai FR12.

---

## 5. Business Rules

### 5.1. Quy tac tai khoan va phan quyen

**SRS-BR01:** He thong co 2 vai tro dang nhap la KHAO_THI va HOC_SINH.

**SRS-BR02:** Tai khoan HOC_SINH phai lien ket voi Student hop le.

**SRS-BR03:** Hoc sinh chi duoc xem ket qua cua chinh minh.

**SRS-BR04:** Phan quyen phai duoc kiem tra tai backend.

**SRS-BR05:** Tai khoan bi vo hieu hoa khong duoc dang nhap.

### 5.2. Quy tac nien khoa, khoi va lop

**SRS-BR06:** Du lieu demo co 2 nien khoa.

**SRS-BR07:** Moi nien khoa co khoi 10, 11 va 12.

**SRS-BR08:** Moi khoi co it nhat 1 lop demo.

**SRS-BR09:** Ma lop khong duoc trung trong cung nien khoa.

**SRS-BR10:** Khong xoa du lieu lop hoac nien khoa neu lam mat lich su lien quan.

### 5.3. Quy tac hoc sinh

**SRS-BR11:** Ma hoc sinh phai duy nhat.

**SRS-BR12:** Khong xoa cung hoc sinh da co lich su hoc tap.

**SRS-BR13:** Khi ngung hoat dong, hoc sinh co the chuyen sang INACTIVE.

**SRS-BR14:** Enrollment luu lich su hoc sinh thuoc lop va nien khoa.

**SRS-BR15:** Khi chuyen lop, phai bao toan Enrollment va ScoreRecord cu.

**SRS-BR16:** Khong cho phep Enrollment cua cung mot hoc sinh trong cung nien khoa co khoang thoi gian hieu luc chong lan nhau.

### 5.4. Quy tac mon hoc va diem

**SRS-BR17:** Du lieu demo co it nhat 3 mon hoc.

**SRS-BR18:** Moi ScoreRecord thuoc mot Enrollment va mot Subject.

**SRS-BR19:** Moi ScoreRecord co toi da 5 ScoreComponent.

**SRS-BR20:** Nam loai thanh phan diem la QT1, QT2, QT3, GK va CK.

**SRS-BR21:** Mien diem tu 0 den 10.

**SRS-BR22:** Theo phuong an thiet ke hien tai, QT1, QT2 va QT3 chi nhan so nguyen.

**SRS-BR23:** Theo phuong an thiet ke hien tai, GK va CK nhan gia tri theo buoc 0.25.

**SRS-BR24:** Diem 0 la gia tri hop le va khac NULL.

**SRS-BR25:** Cac trang thai diem gom NOT_ENTERED, SCORED, ABSENT va EXEMPT.

**SRS-BR26:** ABSENT va EXEMPT khong duoc tu dong quy doi thanh diem 0.

**SRS-BR27:** Khong duoc nhap hoac sua diem thuoc cot dang LOCKED.

### 5.5. Quy tac khoa va mo khoa

**SRS-BR28:** Moi thanh phan diem co trang thai khoa rieng.

**SRS-BR29:** LockStatus duoc xac dinh theo nien khoa, lop, mon hoc va thanh phan diem.

**SRS-BR30:** Chi KHAO_THI duoc khoa va mo khoa diem theo phan quyen hien tai.

**SRS-BR31:** Mo khoa bat buoc co ly do.

**SRS-BR32:** Mo khoa phai ghi nhan nguoi thuc hien va thoi diem.

**SRS-BR33:** Sua diem sau mo khoa phai ghi nhan nguoi thuc hien va thoi diem.

**SRS-BR34:** Ghi diem va ghi nhat ky thanh cong phai bao dam tinh nhat quan transaction.

**SRS-BR35:** Khong cho phep xoa hoac sua AuditLog bang luong nghiep vu thong thuong.

### 5.6. Quy tac tinh diem

**SRS-BR36:** DTK phai duoc tinh theo cong thuc duoc ap dung hop le.

**SRS-BR37:** Cong thuc thiet ke hien tai la:

DTK = (QT1 + QT2 + QT3 + 2 * GK + 3 * CK) / 8

**SRS-BR38:** DTK duoc lam tron 2 chu so thap phan.

**SRS-BR39:** Chi tinh DTK khi 5 thanh phan diem da du dieu kien.

**SRS-BR40:** Cong thuc phai duoc hien thi ro cho nguoi dung.

**SRS-BR41:** Thong tin phe duyet cong thuc phai dua tren bang chung thuc te, khong duoc tu dong gan APPROVED.

### 5.7. Quy tac import va truy vet

**SRS-BR42:** Import CSV phai kiem tra loi theo tung dong.

**SRS-BR43:** Khong import ghi de diem da khoa.

**SRS-BR44:** Dong khong hop le khong duoc ghi vao database.

**SRS-BR45:** Nhat ky thao tac phai xac dinh nguoi thuc hien tu phien dang nhap hop le.

**SRS-BR46:** Khong xoa AuditLog khi hoc sinh chuyen lop hoac ngung hoat dong.

**Ghi chu nguon quy tac:**

- Cac quy tac ve vai tro, bao toan lich su, khoa diem, audit va pham vi demo bat nguon tu de tai.
- Cac chi tiet nhu buoc diem 0.25, he so cong thuc, trang thai diem va quy trinh khoa lai la phuong an thiet ke nghiep vu cua nhom.
- Cac quy tac duoc thiet ke chi tiet phai duoc doi chieu voi ho so khao sat va Data Dictionary.
- Khong duoc ghi nhan giang vien da phe duyet cong thuc neu khong co bang chung.

---

## 6. Yeu cau phi chuc nang (NFR)

### 6.1. NFR ve Usability

#### G5-NFR-US01 - De su dung

He thong phai cung cap giao dien ro rang cho hai vai tro KHAO_THI va HOC_SINH.

**Tieu chi kiem tra:**

- Menu phu hop voi vai tro.
- Ten truong du lieu de hieu.
- Co thong bao khi thao tac thanh cong hoac that bai.
- Nguoi dung co the nhan biet trang thai khoa diem.

#### G5-NFR-US02 - Bang nhap diem de quan sat

Bang diem phai hien thi ro hoc sinh, mon hoc va cac cot QT1, QT2, QT3, GK, CK.

**Tieu chi kiem tra:**

- Khong nham lan hoc sinh khi nhap diem.
- Cot diem dang khoa duoc phan biet ve mat giao dien.
- Diem 0 va o chua nhap co gia tri hien thi khac nhau.
- Thong bao loi xac dinh duoc o diem can sua.

#### G5-NFR-US03 - Thong bao va canh bao

He thong phai thong bao ro khi:

- Nhap diem ngoai mien.
- Thieu du lieu bat buoc.
- Khoa cot diem.
- Mo khoa cot diem.
- Sua diem bi tu choi vi dang khoa.
- Import CSV co dong loi.

Mau sac khong duoc la dau hieu duy nhat de phan biet trang thai; can co gia tri, chu hoac ky hieu phu hop.

#### G5-NFR-US04 - Prototype desktop

Giao dien duoc thiet ke va demo tren desktop, phu hop voi quy chuan Figma cua nhom.

Kich thuoc frame, mau sac, typography va components thuc hien theo docs/figma-handoff.md.

### 6.2. NFR ve Security va phan quyen

#### G5-NFR-SE01 - Xac thuc

Cac chuc nang can dang nhap phai kiem tra phien xac thuc hop le.

#### G5-NFR-SE02 - Bao ve mat khau

- Mat khau duoc luu duoi dang hash an toan.
- Khong luu mat khau dang van ban thuan.
- Khong tra password_hash trong API.
- Khong ghi mat khau vao AuditLog.

#### G5-NFR-SE03 - Kiem soat quyen tai backend

- Backend kiem tra vai tro truoc khi cho phep thao tac.
- Hoc sinh khong duoc goi thanh cong API nhap va sua diem.
- Hoc sinh khong duoc xem diem hoc sinh khac.
- Khong su dung student_id do client khai bao lam can cu duy nhat de cap quyen.

#### G5-NFR-SE04 - Bao ve du lieu dau vao

- Kiem tra kieu du lieu, gia tri va truong bat buoc.
- Su dung truy van tham so hoa hoac co che tuong duong.
- Khong tin du lieu tu frontend.
- Khong de lo thong tin noi bo nhay cam qua thong bao loi.

### 6.3. NFR ve Performance

#### G5-NFR-PE01 - Phan hoi trong pham vi demo

He thong phai hoat dong on dinh voi bo du lieu demo gom 2 nien khoa, 3 khoi moi nien khoa, 1 lop moi khoi va it nhat 3 mon hoc.

**Muc tieu noi bo de xuat:**

- Trang danh sach hoc sinh phan hoi trong khoang 3 giay.
- Bang diem phan hoi trong khoang 3 giay.
- Thao tac luu mot o diem hop le phan hoi trong khoang 3 giay, khong tinh truong hop moi truong bi gian doan.

Cac con so tren la muc tieu kiem thu de xuat cho moi truong demo, khong phai nguong hieu nang duoc cho san trong de bai.

#### G5-NFR-PE02 - Khong mat tinh nhat quan

Khong danh doi rang buoc khoa diem, phan quyen hoac tinh toan ven du lieu de tang toc do xu ly.

#### G5-NFR-PE03 - Tai du lieu demo

He thong phai khoi tao duoc du lieu seed va chay lai kich ban demo ma khong can nhap lai toan bo du lieu.

### 6.4. NFR ve Data Integrity

#### G5-NFR-DI01 - Toan ven khoa va quan he

- Cac bang co PK hop le.
- Cac quan he co FK phu hop.
- Khong cho phep diem tham chieu hoc sinh, lop hoac mon hoc khong hop le.
- Ma hoc sinh va ma mon hoc khong bi trung theo quy tac.

#### G5-NFR-DI02 - Toan ven gia tri diem

- Diem phai thuoc mien da quy dinh.
- Diem 0 khac NULL.
- Khong tu dong lam tron diem nhap khong hop le.
- Khong cho phep sua cot dang LOCKED.

#### G5-NFR-DI03 - Bao toan lich su

- Khong xoa cung hoc sinh da co lich su diem.
- Khong ghi de Enrollment cu khi chuyen lop.
- Khong di chuyen diem lich su sang Enrollment moi khi chua co quy tac.
- Khong mat lich su khi doi nien khoa.

#### G5-NFR-DI04 - Transaction

- Cap nhat diem va ghi AuditLog thanh cong trong cung transaction.
- Cap nhat LockStatus va ghi AuditLog thanh cong trong cung transaction.
- Neu thao tac ghi log thanh cong khong the hoan tat thi thay doi nghiep vu tuong ung phai rollback.

### 6.5. NFR ve Logging va Audit

#### G5-NFR-AU01 - Ghi nhan thao tac

He thong phai ghi nhan cac thao tac quan trong:

- LOCK.
- UNLOCK.
- RELOCK.
- SCORE_EDIT.
- SCORE_IMPORT khi import diem.

#### G5-NFR-AU02 - Thong tin nhat ky

AuditLog phai co thong tin phu hop voi thao tac, bao gom:

- Nguoi thuc hien.
- Thoi diem thuc hien.
- Loai thao tac.
- Nien khoa, lop, mon hoc lien quan.
- Thanh phan diem neu co.
- Ly do mo khoa khi bat buoc.
- Tham chieu ban ghi lien quan neu co.

#### G5-NFR-AU03 - Bao ve nhat ky

- Khong cho phep sua hoac xoa AuditLog qua chuc nang thong thuong.
- Nguoi thuc hien duoc xac dinh tu phien dang nhap da xac thuc.
- Khong chap nhan gia mao performed_by tu client.

#### G5-NFR-AU04 - Truy vet thao tac mo khoa

Khi mo khoa va sua diem sau mo khoa, he thong phai co du lieu de xac dinh nguoi thuc hien va thoi diem.

Chuc nang hien thi toan bo gia tri diem cu/moi chi tiet la G5-FR12 COULD, khong thay the nghia vu ghi log bat buoc.

---

## 7. Cac luong nghiep vu bat buoc demo

### 7.1. DEMO-01 - Nhap diem, khoa, mo khoa va xem log

**Actor:** Phong Khao thi

**FR lien quan:** G5-FR02, G5-FR03, G5-FR05, G5-FR06, G5-FR07

**Cac buoc:**

1. Dang nhap bang tai khoan KHAO_THI.
2. Chon hoac tao nien khoa.
3. Chon hoac tao lop.
4. Chon hoac tao hoc sinh.
5. Chon mon hoc.
6. Nhap diem QT1, QT2, QT3, GK, CK.
7. Khoa QT1.
8. Thu sua QT1.
9. He thong tu choi sua vi QT1 dang LOCKED.
10. Kiem tra cac cot khac khong bi khoa theo QT1.
11. Mo khoa QT1 va nhap ly do.
12. Sua QT1.
13. Khoa lai QT1.
14. Mo AuditLog.
15. Kiem tra nguoi thuc hien, thoi diem va thao tac lien quan.

**Ket qua can chung minh:**

- Khoa diem doc lap.
- Khong sua duoc khi da khoa.
- Mo khoa dung quyen.
- Ghi log dung thao tac.

### 7.2. DEMO-02 - Hoc sinh xem ket qua cua chinh minh

**Actor:** Hoc sinh

**FR lien quan:** G5-FR01, G5-FR08, G5-FR09

**Cac buoc:**

1. Dang xuat tai khoan KHAO_THI.
2. Dang nhap tai khoan HOC_SINH.
3. Mo trang ket qua hoc tap.
4. Chon nien khoa.
5. Xem diem theo mon hoc.
6. Xem DTK neu du du lieu.
7. Kiem tra khong co chuc nang nhap hoac sua diem.
8. Thu yeu cau truy cap du lieu cua hoc sinh khac.
9. Xac nhan backend tu choi yeu cau vuot quyen.

**Ket qua can chung minh:**

- Hoc sinh chi xem diem cua chinh minh.
- Khong the truy cap diem cua hoc sinh khac.
- Khong the sua diem.

### 7.3. DEMO-03 - Import CSV co dong loi

**Actor:** Phong Khao thi

**FR lien quan:** G5-FR10

**Cac buoc:**

1. Dang nhap tai khoan KHAO_THI.
2. Mo chuc nang Import CSV.
3. Chon tep mau co dong hop le va dong loi.
4. He thong kiem tra tep.
5. Hien thi preview.
6. Bao ro dong hop le va dong loi.
7. Xac nhan import.
8. He thong ghi du lieu hop le theo quy tac.
9. Kiem tra dong loi khong duoc ghi.
10. Neu import diem, kiem tra khong ghi de cot dang khoa.

**Ket qua can chung minh:**

- Bao loi theo tung dong.
- Khong ghi du lieu sai.
- Import duoc du lieu hop le.

---

## 8. Gia dinh, gioi han va thay doi sau khao sat

### 8.1. Nguyen tac ghi nhan

De tai la dau vao ban dau. Ket qua khao sat co the bo sung hoac dieu chinh quy tac nghiep vu.

Moi thay doi can phan biet:

- Yeu cau goc cua de tai.
- Gia dinh thiet ke.
- Quy tac duoc nhom thong nhat.
- Ket qua khao sat co bang chung.
- Thay doi can Change Request.
- Thay doi da duoc duyet.

Khong tu dong coi mot gia dinh la ket qua khao sat da duoc xac nhan.

### 8.2. Cac gia dinh va quyet dinh thiet ke

| ID | Noi dung | Trang thai trong SRS |
|---|---|---|
| AS-01 | Quan ly diem theo nien khoa va mon hoc, khong tach HK1/HK2 | Lua chon pham vi thiet ke |
| AS-02 | Co 5 thanh phan diem QT1, QT2, QT3, GK, CK | Theo de tai va phuong an nhom |
| AS-03 | QT1, QT2, QT3 nhan diem nguyen | Quy tac thiet ke nghiep vu |
| AS-04 | GK va CK nhan diem theo buoc 0.25 | Quy tac thiet ke nghiep vu |
| AS-05 | Diem 0 hop le, khac NULL | Quy tac du lieu da thiet ke |
| AS-06 | Co trang thai NOT_ENTERED, SCORED, ABSENT, EXEMPT | Quy tac thiet ke nghiep vu |
| AS-07 | Khong tinh DTK khi thieu diem bat buoc | Quy tac thiet ke nghiep vu |
| AS-08 | Cong thuc DTK he so 1,1,1,2,3 va lam tron 2 chu so | Phuong an cua nhom; can bang chung phe duyet thuc te |
| AS-09 | Khong can trang thai PUBLISHED rieng | Lua chon pham vi thiet ke |
| AS-10 | Chi co 2 actor dang nhap | Theo de tai |
| AS-11 | Su dung app_user lam ten bang User trong PostgreSQL | Quy uoc ky thuat |
| AS-12 | Su dung mot cau hinh cong thuc thong nhat trong demo | Lua chon thiet ke |
| AS-13 | Khong tu dong khoa diem theo thoi han | Gioi han trien khai hien tai |
| AS-14 | Bao toan Enrollment va diem khi chuyen lop | Quy tac bao toan lich su |

### 8.3. Bang ghi nhan ket qua khao sat

Cac muc sau la nhung noi dung can co trong ho so khao sat cua nhom.

| ID | Van de can ghi nhan | Bang chung can doi chieu |
|---|---|---|
| KS-01 | Ai duoc nhap diem | Bien ban/phieu khao sat nghiep vu |
| KS-02 | Ai duoc sua diem sau khoa | Quy tac quyen va quy trinh |
| KS-03 | Ly do va nguoi thuc hien mo khoa | Ket qua khao sat |
| KS-04 | Mien diem va do chinh xac | Ket qua khao sat |
| KS-05 | Xu ly diem 0, chua nhap, vang, mien | Ket qua khao sat |
| KS-06 | Cong thuc tinh DTK | Ket qua khao sat va bang chung phe duyet |
| KS-07 | Quy tac bao toan diem khi chuyen lop | Ket qua khao sat |

Trang thai bang chung thuc te cua cac muc KS can duoc doi chieu voi tai lieu khao sat da co cua nhom.

Khong ghi "Da duoc giang vien phe duyet" neu chua co bang chung.

### 8.4. Quan ly Change Request

Change Request duoc su dung khi de xuat thay doi pham vi hoac yeu cau da xac lap, dac biet la yeu cau MUST.

**Thong tin toi thieu cua mot Change Request:**

- Ma CR.
- Ngay de xuat.
- Nguoi de xuat.
- Yeu cau FR/BR/NFR bi anh huong.
- Noi dung cu.
- Noi dung de xuat.
- Ly do thay doi.
- Anh huong den ERD, Data Dictionary, API, Figma va test.
- Trang thai: PROPOSED, APPROVED hoac REJECTED.
- Nguoi phe duyet.
- Ngay phe duyet neu co.

### 8.5. Bang theo doi thay doi

| ID | Noi dung | Loai | Trang thai |
|---|---|---|---|
| DEC-01 | Khong tach diem theo HK1, HK2 | Quy uoc pham vi, de tai khong bat buoc | Ghi nhan trong thiet ke |
| DEC-02 | Khong tao actor dang nhap GIANG_VIEN | Theo 2 actor de tai | Ghi nhan trong thiet ke |
| DEC-03 | Khong tao trang thai PUBLISHED rieng | Lua chon thiet ke | Ghi nhan trong thiet ke |
| DEC-04 | Cong thuc DTK 1,1,1,2,3 | Phuong an nghiep vu | Can doi chieu bang chung phe duyet |
| DEC-05 | Import CSV co preview va bao loi tung dong | Chi tiet hoa FR10 | Ghi nhan trong thiet ke |

Bang tren khong phai danh sach Change Request da duoc phe duyet.

Neu ho so nhom co CR thuc te, can bo sung ma CR va bang chung tuong ung.

---

## 9. Doi chieu Use Case va prototype Figma

### 9.1. Nguyen tac

Truoc khi lap trinh UI, prototype Figma phai duoc doi chieu voi:

- Actor.
- Use Case.
- Functional Requirement.
- Business Rules.
- Quyen truy cap.
- Trang thai loi va thanh cong.
- Tieu chi nghiem thu giao dien.

Ten trang, frame, components, mau sac va kich thuoc thuc hien theo docs/figma-handoff.md.

### 9.2. Danh sach man hinh va lien ket yeu cau

| ID | Man hinh/prototype | UC lien quan | FR lien quan | Muc do |
|---|---|---|---|---|
| FG-01 | Dang nhap | UC01 | FR01 | MUST |
| FG-02 | Quan ly nien khoa, khoi, lop | UC02 | FR02 | MUST |
| FG-03 | Danh sach va ho so hoc sinh | UC03, UC04, UC14 | FR03, FR04 | MUST |
| FG-04 | Quan ly mon hoc | UC05 | FR04 | MUST |
| FG-05 | Bang diem dang luoi | UC06, UC07 | FR05, FR09 | MUST |
| FG-06 | Khoa, mo khoa cot diem | UC08, UC09 | FR06, FR07 | MUST |
| FG-07 | AuditLog | UC09 | FR07 | MUST cho luong demo |
| FG-08 | Hoc sinh xem ket qua | UC13 | FR08, FR09 | MUST |
| FG-09 | Import CSV va ket qua loi | UC11 | FR10 | Bat buoc cho luong demo |
| FG-10 | Xuat hoac thong ke | UC12 | FR11 | SHOULD |

Ma UC can duoc doi chieu voi danh sach Use Case chinh thuc cua nhom khi ban giao.

### 9.3. Tieu chi nghiem thu tung man hinh

#### FG-01 - Dang nhap

- Co truong username va password.
- Co nut dang nhap.
- Co trang thai loi khi nhap sai.
- Co luong dieu huong theo vai tro.
- Khong hien thi thong tin mat khau nhay cam.

#### FG-02 - Quan ly nien khoa, khoi, lop

- Hien thi nien khoa.
- Chon duoc khoi 10, 11, 12.
- Hien thi lop theo nien khoa.
- Co giao dien tao hoac chinh sua.
- Co thong bao khi trung ma hoac du lieu sai.

#### FG-03 - Danh sach hoc sinh

- Hien thi danh sach hoc sinh theo lop.
- Co ma hoc sinh va ho ten.
- Co thao tac them hoac sua.
- Co trang thai ho so.
- Co canh bao khi thao tac xoa anh huong lich su.

#### FG-04 - Mon hoc

- Hien thi danh sach mon hoc.
- Co ma va ten mon hoc.
- Co thao tac quan ly phu hop.
- Co thong bao khi ma mon hoc trung.

#### FG-05 - Bang nhap diem

- Hien thi nien khoa, lop va mon hoc dang chon.
- Moi dong gan voi dung hoc sinh.
- Co cot QT1, QT2, QT3, GK, CK.
- Phan biet diem 0 va o chua nhap.
- Hien thi loi khi diem khong hop le.
- Hien thi DTK khi du dieu kien.
- Hien thi ro cong thuc tinh DTK.

#### FG-06 - Khoa va mo khoa

- Co dieu khien khoa cho tung cot diem.
- The hien ro LOCKED va UNLOCKED.
- Khi cot LOCKED, giao dien khong cho sua theo luong thong thuong.
- Co thong bao khi thu sua cot da khoa.
- Co giao dien mo khoa va nhap ly do.
- Co trang thai sau khi mo khoa.
- Co thao tac khoa lai.

#### FG-07 - AuditLog

- Hien thi loai thao tac.
- Hien thi nguoi thuc hien.
- Hien thi thoi diem.
- Hien thi nien khoa, lop, mon hoac cot diem lien quan.
- Hien thi ly do mo khoa khi co.
- Khong cung cap thao tac sua hoac xoa AuditLog cho nguoi dung thong thuong.

#### FG-08 - Hoc sinh xem ket qua

- Giao dien phu hop actor HOC_SINH.
- Co chon nien khoa.
- Hien thi mon hoc.
- Hien thi diem thanh phan.
- Hien thi DTK neu du dieu kien.
- Khong co chuc nang sua diem.
- Co trang thai khi chua co du lieu.

#### FG-09 - Import CSV

- Co thao tac chon tep.
- Co preview.
- Hien thi dong hop le.
- Hien thi dong loi va ly do.
- Co thao tac xac nhan import.
- Hien thi ket qua sau import.

#### FG-10 - Xuat hoac thong ke

- Co bo loc nien khoa, lop va mon hoc.
- Co ket qua theo bo loc.
- Co giao dien xuat hoac thong ke neu trien khai.

### 9.4. Tieu chi chung de chap nhan prototype

Prototype chi duoc coi la san sang ban giao de lap trinh UI khi:

1. Co day du cac man hinh bat buoc theo pham vi demo.
2. Cac man hinh co ten va frame nhat quan.
3. Co lien ket UC/FR ro rang.
4. Co luong dang nhap cua hai actor.
5. Co bang diem dang luoi.
6. Co khoa va mo khoa tung cot.
7. Co man hinh hoc sinh xem ket qua.
8. Co luong xem AuditLog.
9. Co giao dien import CSV cho demo.
10. Co mo ta trang thai thanh cong, loi va du lieu trong.
11. Khong them chuc nang ngoai pham vi ma khong ghi nhan.
12. Duoc doi chieu voi tai lieu figma-handoff.md.

### 9.5. Bang theo doi nghiem thu Figma

| ID | Man hinh | Trang thai doi chieu |
|---|---|---|
| FG-01 | Dang nhap | CHUA_XAC_NHAN |
| FG-02 | Nien khoa, khoi, lop | CHUA_XAC_NHAN |
| FG-03 | Hoc sinh | CHUA_XAC_NHAN |
| FG-04 | Mon hoc | CHUA_XAC_NHAN |
| FG-05 | Bang diem | CHUA_XAC_NHAN |
| FG-06 | Khoa va mo khoa | CHUA_XAC_NHAN |
| FG-07 | AuditLog | CHUA_XAC_NHAN |
| FG-08 | Hoc sinh xem diem | CHUA_XAC_NHAN |
| FG-09 | Import CSV | CHUA_XAC_NHAN |
| FG-10 | Xuat/thong ke | CHUA_XAC_NHAN |

Trang thai tren khong khang dinh prototype chua duoc ve. Day la trang thai chua co ket qua doi chieu nghiem thu duoc ghi trong SRS nay.

---

## 10. Ke hoach kiem thu va RTM

### 10.1. Nguyen tac kiem thu

- Moi FR MUST phai co it nhat mot test case lien ket.
- Tong so test case cua du an toi thieu 20.
- Phai kiem thu diem bien va diem ngoai mien.
- Phai kiem thu cot diem khoa doc lap.
- Phai kiem thu hoc sinh A khong xem/sua du lieu hoc sinh B.
- Phai kiem thu mo khoa va AuditLog.
- Phai kiem thu cong thuc DTK bang du lieu tinh tay.
- Test case phai co ket qua PASS hoac FAIL khi nghiem thu.
- Khong duoc ghi PASS truoc khi chay test thuc te.

### 10.2. Danh sach test case du kien

| Test ID | Mo ta | FR/NFR lien quan | Trang thai |
|---|---|---|---|
| TC-01 | Dang nhap tai khoan KHAO_THI hop le | FR01 | CHUA_CHAY |
| TC-02 | Dang nhap sai mat khau | FR01 | CHUA_CHAY |
| TC-03 | Tai khoan INACTIVE khong dang nhap duoc | FR01 | CHUA_CHAY |
| TC-04 | Hoc sinh khong truy cap duoc API quan ly diem | FR01, NFR-SE03 | CHUA_CHAY |
| TC-05 | Hien thi 2 nien khoa va du 3 khoi | FR02 | CHUA_CHAY |
| TC-06 | Tu choi ma lop trung trong cung nien khoa | FR02 | CHUA_CHAY |
| TC-07 | Them hoc sinh hop le | FR03 | CHUA_CHAY |
| TC-08 | Khong xoa mat lich su diem khi hoc sinh INACTIVE | FR03 | CHUA_CHAY |
| TC-09 | Quan ly va hien thi it nhat 3 mon hoc | FR04 | CHUA_CHAY |
| TC-10 | Danh sach hoc sinh dung lop va nien khoa | FR04 | CHUA_CHAY |
| TC-11 | Nhap diem 0 hop le | FR05 | CHUA_CHAY |
| TC-12 | Nhap diem 10 hop le | FR05 | CHUA_CHAY |
| TC-13 | Tu choi diem nho hon 0 hoac lon hon 10 | FR05 | CHUA_CHAY |
| TC-14 | Phan biet diem 0 va NULL | FR05, NFR-DI02 | CHUA_CHAY |
| TC-15 | Tu choi buoc diem khong hop le | FR05 | CHUA_CHAY |
| TC-16 | Khoa QT1 nhung QT2 van duoc sua neu chua khoa | FR06 | CHUA_CHAY |
| TC-17 | Tu choi sua diem QT1 da LOCKED | FR06 | CHUA_CHAY |
| TC-18 | Tu choi mo khoa khi thieu ly do | FR07 | CHUA_CHAY |
| TC-19 | Mo khoa hop le va ghi AuditLog | FR07, NFR-AU01 | CHUA_CHAY |
| TC-20 | Sua diem sau mo khoa va khoa lai | FR07 | CHUA_CHAY |
| TC-21 | Hoc sinh A xem duoc diem cua A | FR08 | CHUA_CHAY |
| TC-22 | Hoc sinh A khong xem duoc diem cua B | FR08, NFR-SE03 | CHUA_CHAY |
| TC-23 | DTK khop ket qua tinh tay | FR09 | CHUA_CHAY |
| TC-24 | Khong tinh DTK khi thieu diem | FR09 | CHUA_CHAY |
| TC-25 | Import CSV co dong dung va dong loi | FR10 | CHUA_CHAY |
| TC-26 | Import khong ghi de diem da khoa | FR10 | CHUA_CHAY |
| TC-27 | Xuat bang diem hoac thong ke dung lop, mon | FR11 | CHUA_CHAY |
| TC-28 | Xem chi tiet diem cu va diem moi neu trien khai | FR12 | CHUA_CHAY |
| TC-29 | Rollback khi ghi AuditLog that bai | FR07, NFR-DI04 | CHUA_CHAY |

Danh sach tren la de xuat test case cho du an, khong phai ket qua kiem thu da thuc hien.

TC-28 chi bat buoc neu nhom trien khai FR12.

### 10.3. Requirements Traceability Matrix

| Requirement ID | UC lien quan | Figma | Test case |
|---|---|---|---|
| G5-FR01 | UC01 | FG-01 | TC-01, TC-02, TC-03, TC-04 |
| G5-FR02 | UC02 | FG-02 | TC-05, TC-06 |
| G5-FR03 | UC03, UC04 | FG-03 | TC-07, TC-08 |
| G5-FR04 | UC05, UC14 | FG-03, FG-04 | TC-09, TC-10 |
| G5-FR05 | UC06, UC07 | FG-05 | TC-11 den TC-15 |
| G5-FR06 | UC08 | FG-06 | TC-16, TC-17 |
| G5-FR07 | UC09 | FG-06, FG-07 | TC-18, TC-19, TC-20, TC-29 |
| G5-FR08 | UC13 | FG-08 | TC-21, TC-22 |
| G5-FR09 | UC06, UC13 | FG-05, FG-08 | TC-23, TC-24 |
| G5-FR10 | UC11 | FG-09 | TC-25, TC-26 |
| G5-FR11 | UC12 | FG-10 | TC-27 |
| G5-FR12 | Bo sung neu trien khai | FG-07 | TC-28 |

### 10.4. Dieu kien kiem thu duoc coi la hoan thanh

- Cac test case MUST da duoc thuc thi.
- Moi test co ket qua PASS hoac FAIL ro rang.
- Co bang chung kiem thu phu hop.
- Cac loi FAIL duoc ghi nhan.
- Cac test case duoc lien ket voi FR qua RTM.
- Kich ban demo bat buoc co the thuc hien lai.

---

## 11. Tieu chi nghiem thu cuoi ky

### 11.1. Du lieu demo

He thong phai co:

- 2 nien khoa.
- Moi nien khoa co khoi 10, 11 va 12.
- Moi khoi co it nhat 1 lop.
- It nhat 3 mon hoc.
- Du lieu hoc sinh.
- Du lieu diem.
- Tai khoan KHAO_THI.
- Tai khoan HOC_SINH.
- Du lieu seed.

### 11.2. Chuc nang bat buoc

He thong phai chung minh:

- Dang nhap va phan quyen dung.
- Quan ly nien khoa, lop va hoc sinh.
- Nhap va sua diem hop le.
- Khoa doc lap tung cot diem.
- Khong sua duoc diem dang khoa.
- Mo khoa theo quyen.
- Ghi nhat ky mo khoa va sua diem.
- Hoc sinh chi xem duoc diem cua chinh minh.
- Tinh DTK dung cong thuc duoc ap dung.
- Import CSV co dong hop le va dong loi theo luong demo.

### 11.3. Tai lieu ban giao

Can co:

- README huong dan cai dat va chay.
- Tai khoan demo theo vai tro.
- Cau hinh .env.example.
- Du lieu seed.
- Kich ban demo.
- SRS.
- ERD.
- Data Dictionary.
- Use Case Diagram 2 actor.
- State hoac Activity Diagram cho luong khoa, mo khoa va sua diem.
- Prototype Figma.
- Test case va RTM.
- Ket qua PASS/FAIL tai thoi diem nghiem thu.

### 11.4. Nguyen tac chap nhan

- Moi yeu cau MUST can co test case tuong ung.
- Khong tu y loai bo MUST khi chua co CR duoc duyet.
- Tong so test case toan du an it nhat 20.
- Tinh nang COULD khong thay the cac yeu cau MUST.
- Cac tinh nang SHOULD duoc danh gia theo pham vi va yeu cau demo.
- Khong phu thuoc vao viec nhap du lieu thu cong tai thoi diem cham.

---

## 12. Thong nhat du lieu giua cac tai lieu

### 12.1. Danh sach thuc the

Mo hinh du lieu gom 12 thuc the chinh:

1. Role.
2. User.
3. AcademicYear.
4. Grade.
5. Class.
6. Student.
7. Enrollment.
8. Subject.
9. ScoreRecord.
10. ScoreComponent.
11. LockStatus.
12. AuditLog.

Thuc the cau hinh bo sung:

13. ScoreFormulaPolicy.

### 12.2. Nguyen tac dong bo

- USER trong ERD duoc anh xa thanh app_user trong PostgreSQL.
- Student lien ket Class qua Enrollment.
- ScoreRecord lien ket Enrollment va Subject.
- ScoreComponent luu diem thanh phan.
- LockStatus quan ly khoa diem theo nien khoa, lop, mon va thanh phan.
- AuditLog luu nhat ky thao tac.
- ScoreFormulaPolicy luu cau hinh cong thuc va thong tin phe duyet.
- Trong pham vi demo hien tai, khong bat buoc khoa ngoai tu ScoreRecord den ScoreFormulaPolicy.
- He thong khong bat buoc tach diem theo HK1 va HK2.
- He thong khong bat buoc co trang thai PUBLISHED rieng.

### 12.3. Quy tac cap nhat tai lieu

Khi thay doi quy tac nghiep vu hoac mo hinh du lieu:

1. Xac dinh FR/BR/NFR bi anh huong.
2. Doi chieu Change Request neu can.
3. Cap nhat SRS.
4. Cap nhat ERD.
5. Cap nhat Data Dictionary.
6. Cap nhat API Contract.
7. Cap nhat prototype Figma neu anh huong giao dien.
8. Cap nhat test case va RTM.

Khong duoc tu y thay doi mot tai lieu lam mau thuan voi cac tai lieu con lai.

---

## 13. Danh sach kiem tra hoan thanh SRS

| ID | Hang muc | Trang thai tai thoi diem soan |
|---|---|---|
| SRS-01 | Gioi thieu va muc dich | DA_SOAN |
| SRS-02 | Pham vi In-scope, Out-of-scope | DA_SOAN |
| SRS-03 | Stakeholder va 2 actor | DA_SOAN |
| SRS-04 | G5-FR01 den G5-FR12 | DA_SOAN |
| SRS-05 | Business Rules | DA_SOAN |
| SRS-06 | NFR Usability | DA_SOAN |
| SRS-07 | NFR Security | DA_SOAN |
| SRS-08 | NFR Performance | DA_SOAN |
| SRS-09 | NFR Data Integrity | DA_SOAN |
| SRS-10 | NFR Audit/Logging | DA_SOAN |
| SRS-11 | Cac luong demo | DA_SOAN |
| SRS-12 | Gia dinh va quyet dinh thiet ke | DA_SOAN |
| SRS-13 | Bang theo doi thay doi/CR | DA_SOAN |
| SRS-14 | Doi chieu UC/FR voi Figma | DA_SOAN |
| SRS-15 | Tieu chi nghiem thu Figma | DA_SOAN |
| SRS-16 | Ke hoach test case va RTM | DA_SOAN |
| SRS-17 | Tieu chi nghiem thu cuoi ky | DA_SOAN |
| SRS-18 | Doi chieu bang chung khao sat | CAN_KIEM_TRA |
| SRS-19 | Bang chung GV phe duyet cong thuc | CAN_KIEM_TRA |
| SRS-20 | Ket qua nghiem thu Figma | CHUA_XAC_NHAN |
| SRS-21 | Ket qua chay test PASS/FAIL | CHUA_CHAY |
| SRS-22 | Review va ban giao GitHub | CHUA_XAC_NHAN |

---

## 14. Ket luan

Tai lieu SRS da dac ta cac yeu cau chuc nang G5-FR01 den G5-FR12, Business Rules, cac nhom NFR, pham vi, gia dinh, luong demo, tieu chi nghiem thu prototype Figma va ke hoach lien ket kiem thu RTM.

Tai lieu duoc xay dung dua tren yeu cau de tai Nhom 5 va cac quyet dinh thiet ke da duoc ghi nhan trong ERD, Data Dictionary va tai lieu nghiep vu cua nhom.

Cac noi dung can bang chung khao sat, phe duyet giang vien, nghiem thu prototype va ket qua kiem thu thuc te khong duoc tu dong coi la da hoan thanh.

Truoc khi trien khai UI, can doi chieu prototype Figma voi UC/FR va cac tieu chi chap nhan trong Muc 9.

Truoc khi nghiem thu cuoi ky, can cap nhat ket qua kiem thu va minh chung hoan thanh yeu cau MUST trong RTM.

**Trang thai tai lieu:** Draft - San sang cho buoc review va dong bo voi cac tai lieu thiet ke lien quan.
