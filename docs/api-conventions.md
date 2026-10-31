
# QUY CHUAN API - NHOM 5

## 1. Cong nghe
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: PostgreSQL
- Kieu API: REST
- Dinh dang du lieu: JSON

## 2. Duong dan chung

Base URL:
http://localhost:3000/api/v1

## 3. Quy tac dat ten
- API su dung chu thuong, kebab-case.
- Ten tai nguyen dung danh tu so nhieu.
- Bien JavaScript su dung camelCase.
- Ten bang va cot database su dung snake_case.
- JSON su dung camelCase.

## 4. Phuong thuc HTTP
- GET: Lay du lieu.
- POST: Tao du lieu hoac thuc hien thao tac.
- PATCH: Cap nhat mot phan du lieu.
- DELETE: Xoa du lieu neu duoc phep.

## 5. JSON thanh cong

{
  "success": true,
  "data": {
    "id": 1,
    "fullName": "Nguyen Van A"
  }
}

## 6. JSON bao loi

{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Ban khong co quyen truy cap"
  }
}

## 7. Ma loi thong nhat
- 400 VALIDATION_ERROR: Du lieu sai.
- 401 UNAUTHORIZED: Chua dang nhap.
- 403 FORBIDDEN: Khong co quyen.
- 404 NOT_FOUND: Khong tim thay.
- 409 CONFLICT: Du lieu xung dot.
- 409 SCORE_LOCKED: Cot diem da khoa.
- 409 VERSION_CONFLICT: Du lieu da thay doi.
- 422 INVALID_SCORE: Diem khong hop le.
- 500 INTERNAL_ERROR: Loi may chu.

## 8. Phan quyen
He thong co 2 vai tro:
- KHAO_THI: Quan ly du lieu va diem.
- HOC_SINH: Chi xem diem cua chinh minh.

Backend phai kiem tra quyen truy cap.

## 9. API xac thuc du kien
- POST /auth/login
- POST /auth/logout
- GET /auth/me
- GET /me/scores

## 10. Nguyen tac bao mat
- Khong luu mat khau dang van ban.
- Khong dua mat khau that len GitHub.
- Khong lay Student ID tuy y tu frontend
  khi hoc sinh xem diem ca nhan.
- Moi thao tac quan tri phai kiem tra role.
- Moi thao tac sua diem phai kiem tra khoa.
- Thay doi diem quan trong phai co Audit Log.

## 11. Nguyen tac lam viec nhom
- Moi thanh vien lam tren branch rieng.
- Khong commit truc tiep len main.
- Commit, Push va tao Pull Request.
- Giang review truoc khi merge.
- API thay doi phai cap nhat tai lieu.
