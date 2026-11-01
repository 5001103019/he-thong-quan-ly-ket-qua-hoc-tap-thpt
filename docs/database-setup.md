
# HƯỚNG DẪN KHỞI TẠO DATABASE VÀ KẾT NỐI BACKEND

## 1. Mục đích

Tài liệu hướng dẫn thiết lập cơ sở dữ liệu và kết nối
backend cho Hệ thống quản lý kết quả học tập học sinh
THPT.

Database sử dụng Microsoft SQL Server. Backend sử dụng
Node.js và Express.

Hướng dẫn áp dụng cho môi trường phát triển và kiểm thử
cục bộ của nhóm.

## 2. Công cụ cần chuẩn bị

- Microsoft SQL Server 2022 Express.
- SQL Server Management Studio (SSMS).
- Microsoft ODBC Driver 18 for SQL Server.
- Node.js và npm.
- Git.
- Visual Studio 2022 hoặc trình soạn thảo phù hợp.

Cấu hình đã kiểm thử:

- SQL Server instance: SQLEXPRESS.
- Authentication: Windows Authentication.
- Database: thpt_grade_management.
- Backend: Node.js.
- Kết nối SQL Server: mssql kết hợp msnodesqlv8.

Máy của thành viên khác có thể sử dụng cấu hình
SQL Server khác. Cần điều chỉnh file .env tương ứng.

## 3. Cấu trúc thư mục liên quan

```text
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   └── services/
│       ├── score-transaction.js
│       └── enrollment-transaction.js
├── tests/
├── .env.example
├── package.json
└── package-lock.json

database/
└── migrations/
    ├── 001_create_tables.sql
    └── 002_prevent_enrollment_overlap.sql

docs/
└── database-setup.md
```

## 4. Khởi tạo cơ sở dữ liệu

### 4.1. Kết nối SQL Server

Mở SQL Server Management Studio.

Tại cửa sổ kết nối:

- Server type: Database Engine.
- Server name: .\SQLEXPRESS
- Authentication: Windows Authentication.

Nhấn Connect.

### 4.2. Tạo database

Trong SSMS, chọn New Query và chạy:

```sql
IF DB_ID(N'thpt_grade_management') IS NULL
BEGIN
    EXEC(N'CREATE DATABASE [thpt_grade_management]');
END;
```

Nếu database đã tồn tại, không cần tạo lại.

### 4.3. Chạy migration tạo bảng

Mở file:

database/migrations/001_create_tables.sql

Chọn đúng database thpt_grade_management trong SSMS
và thực hiện Execute.

Migration này khởi tạo 13 bảng:

1. role
2. app_user
3. academic_year
4. grade
5. class
6. student
7. enrollment
8. subject
9. score_record
10. score_component
11. lock_status
12. audit_log
13. score_formula_policy

Schema bao gồm các ràng buộc:

- PRIMARY KEY
- FOREIGN KEY
- UNIQUE
- CHECK
- DEFAULT
- Các chỉ mục hỗ trợ toàn vẹn dữ liệu

Lưu ý: Không chạy lại migration trên database đã
khởi tạo nếu chưa xác định script hỗ trợ chạy lặp.

### 4.4. Chạy migration chống chồng lấn

Sau khi migration 001 thành công, mở file:

database/migrations/002_prevent_enrollment_overlap.sql

Thực hiện Execute.

Migration này tạo trigger kiểm tra các khoảng thời
gian phân lớp trong bảng enrollment.

Hệ thống sử dụng khoảng thời gian:

[start_date, end_date)

Ngày bắt đầu được tính vào khoảng thời gian.
Ngày kết thúc không được tính vào khoảng thời gian.

Không cho phép một học sinh có hai khoảng thời gian
phân lớp chồng lấn trong cùng niên khóa.

## 5. Kiểm tra database

Trong SSMS, chạy:

```sql
USE [thpt_grade_management];

SELECT name
FROM sys.tables
WHERE is_ms_shipped = 0
ORDER BY name;
```

Kết quả của schema hiện tại phải có đủ 13 bảng.

Kiểm tra trigger:

```sql
USE [thpt_grade_management];

SELECT
    name,
    is_disabled
FROM sys.triggers
WHERE name = 'trg_enrollment_no_overlap';
```

Kết quả mong đợi:

- Trigger tồn tại.
- is_disabled = 0.

Nếu thiếu bảng hoặc trigger, kiểm tra lại migration
và thông báo lỗi trước khi tiếp tục.

## 6. Cài đặt thư viện backend

Mở Command Prompt tại thư mục backend.

Chạy:

```bat
npm ci
```

Lệnh sử dụng package-lock.json để cài đặt các gói
phụ thuộc đã được chốt trong dự án.

Các thư viện liên quan đến kết nối database gồm:

- mssql
- msnodesqlv8
- dotenv

Không cần cài đặt thủ công từng gói nếu npm ci
đã thực hiện thành công.

## 7. Cấu hình biến môi trường

Trong thư mục backend có file:

.env.example

Tạo một bản sao và đặt tên:

.env

Có thể chạy trong CMD tại thư mục backend:

```bat
copy .env.example .env
```

Cấu hình SQL Server Express tham khảo:

```dotenv
DB_SERVER=localhost
DB_INSTANCE=SQLEXPRESS
DB_PORT=
DB_NAME=thpt_grade_management
DB_AUTH=windows
DB_USER=
DB_PASSWORD=
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

Lưu ý:

- Cấu hình trên dùng Windows Authentication.
- DB_PORT để trống khi sử dụng SQL Server instance
  theo cấu hình kết nối đã triển khai.
- DB_TRUST_SERVER_CERTIFICATE=true chỉ phù hợp
  cho môi trường phát triển cục bộ đã tin cậy.
- Không sử dụng mật khẩu thật trong .env.example.
- Không đưa file .env lên GitHub.
- Các biến môi trường khác giữ theo mẫu của dự án.

## 8. Kiểm tra kết nối backend

Tại thư mục backend, chạy:

```bat
node -e "const db=require('./src/config/database'); (async()=>{const p=await db.connectDatabase(); try{const r=await p.request().query('SELECT DB_NAME() AS database_name'); console.log(r.recordset);} finally{await p.close();}})().catch(e=>{console.error(e.message);process.exitCode=1})"
```

Kết quả mong đợi chứa:

database_name: thpt_grade_management

Nếu kết nối thất bại, kiểm tra:

- Dịch vụ SQL Server đang hoạt động.
- Instance SQLEXPRESS tồn tại.
- Windows Authentication hoạt động.
- Microsoft ODBC Driver 18 đã cài đặt.
- Nội dung cấu hình .env chính xác.
- Database đã được tạo thành công.

## 9. Quy tắc toàn vẹn dữ liệu

### 9.1. Lịch sử phân lớp

Học sinh được quản lý thông qua Student và Enrollment.

Khi chuyển lớp:

- Giữ nguyên thông tin Student.
- Kết thúc Enrollment của lớp cũ.
- Ghi lý do kết thúc là TRANSFER.
- Tạo Enrollment mới cho lớp chuyển đến.
- Bảo toàn ScoreRecord và ScoreComponent lịch sử.

Các thao tác chuyển lớp phải nằm trong một transaction.

### 9.2. Cập nhật điểm

Điểm được quản lý theo ScoreRecord và ScoreComponent.

Quy tắc chính:

- Điểm 0 là hợp lệ và khác NULL.
- QT1, QT2, QT3 nhận điểm nguyên.
- GK và CK nhận điểm theo bước 0.25.
- Không chỉnh sửa thành phần điểm đang LOCKED.

Cập nhật điểm và ghi AuditLog phải được thực hiện
trong cùng một transaction.

### 9.3. Khóa điểm và nhật ký

LockStatus lưu trạng thái khóa theo:

- Niên khóa
- Lớp
- Môn học
- Thành phần điểm

AuditLog ghi nhận các thao tác nghiệp vụ cần theo dõi.

Việc khóa điểm và công bố điểm là hai nghiệp vụ
khác nhau.

## 10. Kiểm thử

Các bài kiểm thử được tổ chức trong backend/tests.

Những nội dung đã được kiểm thử trong quá trình
phát triển bao gồm:

- Ràng buộc khóa chính, khóa ngoại, UNIQUE và CHECK.
- Giá trị điểm và trạng thái điểm.
- Lịch sử phân lớp không chồng lấn.
- COMMIT cập nhật điểm và AuditLog.
- ROLLBACK ở tầng SQL Server.
- Từ chối cập nhật điểm khi LOCKED.
- COMMIT chuyển lớp.
- ROLLBACK chuyển lớp.
- Hai thao tác chuyển lớp đồng thời.

Chỉ chạy các bài kiểm thử có ghi dữ liệu trên
database thử nghiệm.

Không chạy lại bài kiểm thử thay đổi dữ liệu trên
database đang sử dụng thực tế nếu chưa chuẩn bị
dữ liệu kiểm thử phù hợp.

## 11. Quy tắc bảo mật Git

File .env chứa cấu hình riêng của từng máy.

Yêu cầu:

- Không commit file .env.
- Không lưu mật khẩu thật trong mã nguồn.
- Không ghi token hoặc mật khẩu vào tài liệu.
- Không đưa thông tin nhạy cảm vào ảnh chụp lỗi.
- Chỉ chia sẻ .env.example với các giá trị mẫu.

Tại thư mục gốc repository, chạy:

```bat
git check-ignore -v backend/.env
```

Nếu file được Git bỏ qua, lệnh sẽ trả về quy tắc
trong .gitignore tương ứng.

Kiểm tra file có đang được Git theo dõi không:

```bat
git ls-files -- backend/.env
```

Kết quả mong đợi là không có dòng nào.

Việc kiểm tra .env không thay thế cho bước rà soát
toàn bộ repository trước khi đẩy lên GitHub.

## 12. Lưu ý bàn giao

- Sử dụng Microsoft SQL Server, không dùng PostgreSQL.
- Chạy migrations theo đúng thứ tự.
- Không tự ý thay đổi tên bảng hoặc quan hệ dữ liệu.
- Không xóa dữ liệu lịch sử khi học sinh chuyển lớp.
- Không ghi đè điểm đang khóa.
- Không đẩy dữ liệu thử nghiệm vào database thật.
- Không đưa mật khẩu thật lên GitHub.

Nếu thay đổi schema, phải cập nhật migration và
tài liệu liên quan để giữ tính thống nhất.
