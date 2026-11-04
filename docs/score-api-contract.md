# HOP DONG API QUAN LY DIEM HOC SINH THPT

## 1. Muc dich va pham vi

Tai lieu mo ta cac API phuc vu viec lay danh sach diem, xem chi tiet ban ghi diem, nhap va cap nhat 5 thanh phan diem cua hoc sinh.

Tai lieu duoc su dung de ban giao va tich hop giua backend voi giao dien quan ly diem, chuc nang khoa diem va nhat ky thao tac.

- Cong nghe backend: Node.js, Express.
- Co so du lieu: Microsoft SQL Server.
- Dinh dang du lieu: JSON.
- Duong dan goc: `/api/v1`.
- Quyen truy cap: Tai khoan da dang nhap, co vai tro `KHAO_THI`.
- Xac thuc: Su dung cookie phien dang nhap.

## 2. Danh sach API

| Phuong thuc | Duong dan | Chuc nang |
|---|---|---|
| GET | `/api/v1/scores` | Lay danh sach diem theo nien khoa, lop va mon hoc |
| GET | `/api/v1/score-records/:id` | Lay chi tiet mot ban ghi diem |
| PATCH | `/api/v1/score-records/:id/components/:type` | Nhap hoac cap nhat mot thanh phan diem |
| GET | `/api/v1/score-records/:id/summary` | Tinh va tra ket qua diem tong ket |

Tat ca API tren chi cho phep tai khoan co vai tro `KHAO_THI` truy cap.

## 3. API lay danh sach diem

### 3.1. Thong tin yeu cau

- Phuong thuc: `GET`
- Duong dan: `/api/v1/scores`

Tham so bat buoc:

| Tham so | Kieu du lieu | Mo ta |
|---|---|---|
| `academicYearId` | So nguyen duong | Ma nien khoa |
| `classId` | So nguyen duong | Ma lop |
| `subjectId` | So nguyen duong | Ma mon hoc |

Vi du:

`GET /api/v1/scores?academicYearId=1&classId=1&subjectId=1`

### 3.2. Du lieu tra ve

Khi thanh cong, API tra ve HTTP `200`, `success: true` va `data` la mang danh sach hoc sinh.

Moi hoc sinh gom cac truong:

| Truong | Mo ta |
|---|---|
| `enrollmentId` | Ma ban ghi phan lop |
| `studentId` | Ma hoc sinh |
| `studentCode` | Ma dinh danh hoc sinh |
| `fullName` | Ho va ten hoc sinh |
| `scoreRecordId` | Ma ban ghi diem, co the bang `null` |
| `version` | Phien ban ban ghi diem, co the bang `null` |
| `components` | Mang gom 5 thanh phan diem |

Moi thanh phan diem gom:

| Truong | Mo ta |
|---|---|
| `componentType` | Loai diem: QT1, QT2, QT3, GK, CK |
| `scoreComponentId` | Ma thanh phan diem, co the bang `null` |
| `scoreValue` | Gia tri diem, co the bang `null` |
| `scoreStatus` | Trang thai diem |
| `lockStatus` | Trang thai khoa diem |

API tra ve du 5 thanh phan diem theo thu tu QT1, QT2, QT3, GK, CK.

Neu khong co hoc sinh phu hop voi dieu kien loc, API tra ve mang rong va HTTP `200`.

### 3.3. Xu ly loi

- HTTP `400` - `VALIDATION_ERROR`: Thieu hoac sai ma nien khoa, lop, mon hoc.
- HTTP `401`: Chua dang nhap hop le.
- HTTP `403`: Khong co quyen truy cap.

## 4. API lay chi tiet ban ghi diem

### 4.1. Thong tin yeu cau

- Phuong thuc: `GET`
- Duong dan: `/api/v1/score-records/:id`

Trong do `id` la ma ban ghi diem, phai la so nguyen duong hop le.

Vi du:

`GET /api/v1/score-records/1`

### 4.2. Du lieu tra ve

Khi thanh cong, API tra ve HTTP `200` voi cau truc:

`{"success":true,"data":{...}}`

Du lieu `data` do ham `getScoreRecordById()` cung cap, phuc vu viec hien thi chi tiet ban ghi va cac thanh phan diem.

### 4.3. Xu ly loi

- HTTP `400` - `VALIDATION_ERROR`: Ma ban ghi diem khong hop le.
- HTTP `404` - `NOT_FOUND`: Khong tim thay ban ghi diem.
- HTTP `401`: Chua dang nhap hop le.
- HTTP `403`: Khong co quyen truy cap.

## 5. API nhap va cap nhat diem

### 5.1. Thong tin yeu cau

- Phuong thuc: `PATCH`
- Duong dan: `/api/v1/score-records/:id/components/:type`

Trong do:

- `id`: Ma ban ghi diem da ton tai.
- `type`: Mot trong 5 gia tri `QT1`, `QT2`, `QT3`, `GK`, `CK`.

Vi du:

`PATCH /api/v1/score-records/1/components/QT1`

### 5.2. Du lieu gui len

| Truong | Bat buoc | Mo ta |
|---|---|---|
| `scoreValue` | Co | Gia tri diem hoac `null` |
| `scoreStatus` | Co | Trang thai diem |
| `expectedVersion` | Co | Phien ban ban ghi diem hien tai |
| `reason` | Co dieu kien | Bat buoc khi sua diem hoac trang thai da co (khac NOT_ENTERED) va du lieu thuc su thay doi; toi da 1000 ky tu |

Quy tac su dung `reason`:
- Nhap diem lan dau: Khong bat buoc ly do.
- Sua diem hoac trang thai da co: Bat buoc ly do.
- Du lieu khong thay doi: Khong bat buoc ly do, khong tang version va khong ghi AuditLog moi.
- Ly do chi chua khoang trang duoc xem la khong hop le khi bat buoc nhap.
- Thieu ly do khi bat buoc: HTTP 400 - REASON_REQUIRED.

Vi du sua diem CK co ly do:

`{"scoreValue":7.75,"scoreStatus":"SCORED","expectedVersion":7,"reason":"Dieu chinh diem sau khi doi chieu"}`

Luu y: `expectedVersion` trong vi du chi mang tinh minh hoa.
Vi du nhap diem QT1 bang 8:

`{"scoreValue":8,"scoreStatus":"SCORED","expectedVersion":1}`

Vi du nhap diem QT2 bang 0:

`{"scoreValue":0,"scoreStatus":"SCORED","expectedVersion":2}`

Vi du danh dau vang:

`{"scoreValue":null,"scoreStatus":"ABSENT","expectedVersion":3}`

Vi du danh dau mien:

`{"scoreValue":null,"scoreStatus":"EXEMPT","expectedVersion":4}`

Gia tri `expectedVersion` phai lay tu du lieu moi nhat, khong su dung co dinh cac phien ban trong vi du.

### 5.3. Du lieu tra ve

Khi cap nhat thanh cong, API tra ve HTTP `200` voi `success: true`.

Neu du lieu thay doi, `data` gom:

- `success`: Ket qua xu ly trong service.
- `changed`: `true`.
- `scoreRecordId`: Ma ban ghi diem.
- `scoreComponentId`: Ma thanh phan diem.
- `componentType`: Loai diem.
- `oldValue`: Gia tri diem truoc khi sua.
- `scoreValue`: Gia tri diem moi.
- `scoreStatus`: Trang thai diem moi.
- `version`: Phien ban moi.
- `auditLogId`: Ma nhat ky thao tac.

Neu du lieu khong thay doi:

- `changed` bang `false`.
- Khong tang phien ban.
- Khong tao AuditLog moi.

## 6. Quy tac nghiep vu

### 6.1. Gia tri diem

- QT1, QT2, QT3: So nguyen tu 0 den 10.
- GK, CK: Gia tri tu 0 den 10, theo buoc 0.25.
- Diem 0 la gia tri hop le.
- `NULL` bieu thi khong co gia tri diem, khac voi diem 0.

### 6.2. Trang thai diem

| Trang thai | Y nghia | Gia tri diem |
|---|---|---|
| `SCORED` | Da nhap diem | Phai co gia tri |
| `NOT_ENTERED` | Chua nhap diem | `null` |
| `ABSENT` | Vang | `null` |
| `EXEMPT` | Mien | `null` |

### 6.3. Kiem tra khoa diem

Truoc khi luu, he thong kiem tra trang thai khoa theo:

- Nien khoa.
- Lop hoc.
- Mon hoc.
- Thanh phan diem.

Neu thanh phan dang o trang thai `LOCKED`, API tu choi cap nhat.

### 6.4. Kiem tra phien ban

Moi ban ghi diem co truong `version`.

Khi gui yeu cau cap nhat, frontend phai cung cap `expectedVersion`.

Neu phien ban gui len khong trung voi phien ban hien tai, API tra ve loi `VERSION_CONFLICT`.

Frontend can tai lai du lieu truoc khi tiep tuc cap nhat.

### 6.5. Ghi nhat ky thao tac

Khi diem thay doi thanh cong:

- He thong them hoac cap nhat thanh phan diem.
- Tang phien ban ban ghi diem.
- Ghi AuditLog voi hanh dong `SCORE_EDIT`.
- Luu thong tin nguoi thuc hien, pham vi diem, gia tri cu, gia tri moi va ly do neu co.
- Toan bo thao tac duoc xu ly trong cung mot giao dich.

Neu giao dich that bai, he thong rollback de tranh luu du lieu khong dong bo.

## 7. Ma loi can xu ly

| HTTP | Ma loi | Y nghia |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Du lieu dau vao khong hop le |
| 400 | `INVALID_SCORE` | Gia tri diem khong hop le |
| 403 | `FORBIDDEN` | Khong co quyen sua diem |
| 404 | `NOT_FOUND` | Khong tim thay ban ghi diem |
| 409 | `VERSION_CONFLICT` | Du lieu da thay doi, can tai lai |
| 409 | `SCORE_LOCKED` | Thanh phan diem dang bi khoa |
| 409 | `LOCK_TIMEOUT` | Khong the lay khoa giao dich |
| 409 | `SCOPE_CHANGED` | Pham vi ban ghi diem da thay doi |

Loi xac thuc duoc xu ly boi middleware va co the co cau truc thong bao rieng.

## 8. Huong dan tich hop frontend

Frontend can:

1. Su dung API danh sach de lay hoc sinh va diem theo nien khoa, lop, mon hoc.
2. Hien thi day du 5 thanh phan QT1, QT2, QT3, GK, CK.
3. Phan biet diem 0 voi diem chua nhap.
4. Hien thi trang thai Vang, Mien va Chua nhap.
5. Kiem tra `lockStatus` truoc khi cho phep chinh sua tren giao dien.
6. Gui `expectedVersion` khi cap nhat.
7. Tai lai du lieu neu gap `VERSION_CONFLICT`.
8. Khong tu gui `userId` cua nguoi sua diem.
9. Khong goi API cap nhat neu `scoreRecordId` bang `null`.

Luu y: Kiem tra khoa tai giao dien chi phuc vu hien thi. Backend van phai tu kiem tra khoa truoc khi luu.

## 9. Noi dung can thong nhat voi cac module lien quan

### 9.1. Tao ban ghi diem ban dau

API danh sach co the tra ve `scoreRecordId = null` neu hoc sinh chua co ban ghi diem.

API PATCH hien tai chi cap nhat duoc khi ban ghi diem da ton tai.

Can thong nhat co che khoi tao ban ghi diem truoc khi nhap diem lan dau.

### 9.2. Lich su thay doi trang thai diem

AuditLog hien tai ghi gia tri diem cu va moi, nhung chua ghi truc tiep trang thai cu va moi.

Can thong nhat cach luu lich su thay doi giua `NOT_ENTERED`, `SCORED`, `ABSENT` va `EXEMPT` neu nghiep vu yeu cau truy vet chi tiet.

### 9.3. Hoc sinh chuyen lop

API danh sach hien truy van cac ban ghi phan lop thuoc nien khoa va lop duoc chon.

Can thong nhat cach hien thi hoc sinh da chuyen lop de dam bao lich su hoc tap khong bi sai lech.

## 10. Ket qua kiem thu

- 21/21 bai kiem thu Validation thanh cong.
- Nhap va cap nhat du 5 thanh phan diem thanh cong.
- Kiem thu diem 0 va gia tri NULL thanh cong.
- Kiem thu trang thai Vang va Mien thanh cong.
- Kiem thu tu choi cap nhat diem bi khoa thanh cong.
- Kiem thu xung dot phien ban thanh cong.
- Kiem thu du lieu khong hop le thanh cong.
- Kiem tra du lieu va AuditLog tren SQL Server thanh cong.
- API lay danh sach diem tra ve HTTP 200 va du lieu demo thanh cong.

## 11. Thong tin ban giao

**Cong viec:** Xay dung API lay va luu diem 5 thanh phan theo hoc sinh, nien khoa, lop va mon hoc.

**Pull Request:** #14.

**Nhanh thuc hien:** `feature/Chau-02-score-api`.

**Nhanh dich:** `main`.

**Tai lieu:** `docs/score-api-contract.md`.


**Trang thai:** Da hoan thanh lap trinh va kiem thu, PR #14 da duoc merge vao `main`. Cac noi dung tai Muc 9 van can duoc doi chieu voi cac module lien quan truoc khi xac nhan tich hop hoan chinh.

## 12. API tinh diem tong ket

### 12.1. Thong tin yeu cau

- Phuong thuc: `GET`
- Duong dan: `/api/v1/score-records/:id/summary`
- Quyen truy cap: `KHAO_THI`.
- `id`: Ma ban ghi diem, phai la so nguyen duong hop le.

Vi du:

`GET /api/v1/score-records/1/summary`

API doc du lieu diem moi nhat tu SQL Server va tinh diem tong ket. Khong ghi ket qua tong ket vao database.

### 12.2. Cong thuc tinh

Cong thuc da thong nhat:

`DTK = (QT1 + QT2 + QT3 + 2 * GK + 3 * CK) / 8`

He so:
- QT1, QT2, QT3: He so 1.
- GK: He so 2.
- CK: He so 3.
- Tong he so: 8.

Ket qua duoc lam tron den 2 chu so thap phan.

Diem 0 la gia tri hop le, khac voi `null`.

Chi tinh DTK khi ca 5 thanh phan co trang thai `SCORED` va gia tri diem hop le.

Neu co thanh phan `NOT_ENTERED`, `ABSENT`, `EXEMPT` hoac thieu gia tri diem hop le, API khong tinh DTK.

### 12.3. Du lieu tra ve

Khi thanh cong, API tra ve HTTP `200` va `success: true`.

Du lieu `data` gom:

| Truong | Mo ta |
|---|---|
| `scoreRecordId` | Ma ban ghi diem |
| `version` | Phien ban ban ghi diem |
| `calculationStatus` | `CALCULATED` hoac `INCOMPLETE` |
| `finalScore` | Diem tong ket hoac `null` |
| `formula` | Cong thuc tinh diem tong ket |
| `totalWeight` | Tong he so, bang 8 |
| `weightedSum` | Tong diem da nhan he so, hoac `null` neu chua du diem |
| `components` | Mang chi tiet 5 thanh phan diem |
| `missingComponents` | Danh sach thanh phan chua du dieu kien tinh |

Moi phan tu trong `components` gom:
- `componentType`: Loai diem.
- `scoreValue`: Gia tri diem hoac `null`.
- `scoreStatus`: Trang thai diem.
- `weight`: He so.
- `weightedValue`: Gia tri sau khi nhan he so, hoac `null`.

### 12.4. Truong hop du 5 diem

API tra ve:
- `calculationStatus`: `CALCULATED`.
- `finalScore`: Ket qua da lam tron 2 chu so.
- `weightedSum`: Tong diem co he so.
- `missingComponents`: Mang rong.

Vi du tinh tay:

- QT1 = 8, QT2 = 7, QT3 = 9.
- GK = 8, CK = 9.

`DTK = (8 + 7 + 9 + 2 * 8 + 3 * 9) / 8`

`DTK = 67 / 8 = 8.375`

Ket qua: `8.38`.

### 12.5. Truong hop chua du diem

API tra ve:
- `calculationStatus`: `INCOMPLETE`.
- `finalScore`: `null`.
- `weightedSum`: `null`.
- `missingComponents`: Danh sach thanh phan chua du dieu kien tinh.

Khong tu dong thay diem thieu bang 0.

### 12.6. Tinh lai sau khi sua diem

API khong luu gia tri DTK co dinh.

Moi lan frontend goi API, he thong doc du lieu diem hien tai va tinh lai ket qua.

Khi diem duoc sua hop le, lan goi API tiep theo se phan anh diem moi va version moi nhat.

### 12.7. Xu ly loi

- HTTP `400` - `VALIDATION_ERROR`: Ma ban ghi diem khong hop le.
- HTTP `401`: Chua dang nhap hop le.
- HTTP `403`: Khong co quyen truy cap.
- HTTP `404` - `NOT_FOUND`: Khong tim thay ban ghi diem.


### 12.8. Ket qua kiem thu

- PASS: 5/5 bai kiem thu tu dong ve cong thuc va quy tac tinh.
- PASS: API khong tinh DTK khi thieu diem.
- PASS: API tra HTTP 404 khi ban ghi khong ton tai.
- PASS: API tra HTTP 400 khi ma ban ghi khong hop le.
- PASS: API tra CALCULATED voi du 5 diem tren SQL Server.
- PASS: Ket qua tinh tay va API deu bang 7.69.
- PASS: Sua QT1 tu 7 thanh 8, API tinh lai DTK tu 7.69 thanh 7.81.
- PASS: Khoi phuc QT1 ve 7, API tinh lai DTK ve 7.69.

Ban ghi kiem thu: score_record_id = 3.

Gia tri diem QT1 da duoc khoi phuc ve ban dau.
Version tang tu 1 len 3 va AuditLog van luu lich su thay doi.

### 12.9. Ban giao tich hop

API duoc phat trien tren nhanh:

`feature/Chau-04-score-summary`

Frontend su dung truong `calculationStatus` de phan biet ket qua da tinh va chua du dieu kien tinh.

Khi `finalScore` bang `null`, frontend khong duoc hien thi thanh diem 0.
