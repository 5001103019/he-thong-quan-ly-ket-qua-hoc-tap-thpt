
# BAO CAO KIEM THU API KHOI TAO SCORE RECORD

## 1. Muc dich

Kiem thu API POST /api/v1/score-records de ho tro giao dien nhap diem lan dau khi GET /api/v1/scores tra ve scoreRecordId = null.

## 2. Moi truong

- Backend: Node.js, Express.
- Database: Microsoft SQL Server.
- Database name: thpt_grade_management.
- Phan quyen: KHAO_THI.
- Endpoint: POST /api/v1/score-records.

## 3. Ket qua kiem thu

| STT | Truong hop | Ket qua thuc te | Trang thai |
|---|---|---|---|
| 1 | Chua dang nhap | HTTP 401 | PASS |
| 2 | Tao ScoreRecord lan dau | created = true, ID = 41, version = 1 | PASS |
| 3 | Goi lai cung Enrollment va Subject | created = false, ID = 41, version = 1 | PASS |
| 4 | Doi chieu SQL Server | Dung 1 ScoreRecord, chua co ScoreComponent | PASS |
| 5 | PATCH nhap diem QT1 = 8 | changed = true, version = 2, auditLogId = 40 | PASS |
| 6 | Doi chieu diem va AuditLog | ScoreComponent ID 198, QT1 = 8, SCORE_EDIT SUCCESS | PASS |
| 7 | enrollmentId = 0 | HTTP 400, VALIDATION_ERROR | PASS |
| 8 | Enrollment khong ton tai | HTTP 404, NOT_FOUND, tra JSON | PASS |
| 9 | Tai khoan HOC_SINH goi POST | HTTP 403 | PASS |
| 10 | Subject khong ton tai | HTTP 404, NOT_FOUND, tra JSON | PASS |

## 4. Du lieu kiem thu

- enrollmentId: 2.
- subjectId: 1.
- scoreRecordId duoc tao: 41.
- version ban dau: 1.
- Diem nhap qua PATCH: QT1 = 8.
- version sau PATCH: 2.
- scoreComponentId: 198.
- auditLogId: 40.

Cac ID tren la du lieu kiem thu, khong phai gia tri co dinh trong API.

## 5. Ket luan

API POST da ho tro tao ScoreRecord ban dau va tra ve ID, version cho frontend.

Khi ScoreRecord da ton tai, API tra ve ban ghi hien co, khong tao trung trong lan kiem thu.

Frontend co the su dung luong:

GET /api/v1/scores
-> POST /api/v1/score-records neu scoreRecordId = null
-> PATCH /api/v1/score-records/:id/components/:type

API POST khong tu nhap diem. Viec luu diem, tang version va ghi AuditLog duoc xu ly boi PATCH.

Chua kiem thu tinh huong nhieu yeu cau POST dong thoi. Ket qua tren chi xac nhan cac truong hop da thuc hien.
