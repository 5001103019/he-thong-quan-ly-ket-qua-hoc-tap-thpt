# VT1-06 - BAO CAO KIEM THU XAC THUC VA PHAN QUYEN



## 1. Thong tin chung



- Du an: He thong quan ly ket qua hoc tap hoc sinh THPT

- Nhom: 5

- Nguoi thuc hien: Giang

- Cong viec: VT1-06

- Pham vi: Kiem thu backend API xac thuc va phan quyen

- Moi truong: Windows, Node.js, SQL Server, CMD

- Ngay kiem thu: 02/11/2026



## 2. Ket qua kiem thu



| Ma TC | Noi dung kiem thu | Ket qua | Trang thai |

|---|---|---|---|

| TC01 | Dang nhap dung tai khoan va mat khau | HTTP 200, success=true, co cookie phien | PASS |

| TC02 | Dang nhap sai mat khau | HTTP 401, success=false, khong co cookie dang nhap | PASS |

| TC03 | Hoc sinh A khong xem duoc du lieu hoc sinh B qua API | PASS_PROFILE_ISOLATION: API ho so chi tra du lieu A (ID 22) du co truyen ID B (23). API diem quan tri tra HTTP 403. | PASS |

| TC04 | Hoc sinh khong duoc goi API quan tri | Hai API quan tri tra HTTP 403 | PASS |

| TC05 | Phien dang nhap khong con hop le | Thu hoi phien va het han phien deu bi tu choi HTTP 401 | PASS |



## 3. Minh chung kiem thu

Ket qua ghi nhan tu cac lan chay CMD ngay 02/11/2026:

- TC01: HTTP 200, success=true, co cookie phien.
- TC02: HTTP 401, success=false, khong co cookie dang nhap.
- TC03: Hoc sinh A co ID 22, hoc sinh B co ID 23. API ho so van tra ID 22 (PASS_PROFILE). API diem quan tri tra HTTP 403 (PASS_SCORE_ENDPOINTS). Chua kiem tra API xem diem ca nhan.
- TC04: Hai API quan tri deu tra HTTP 403 (PASS_TC04).
- TC05: Sau khi phien het han, API tra HTTP 401, success=false (PASS_SESSION_EXPIRED).

Minh chung kiem thu duoc luu tai:

- docs/vt1-06-evidence.txt: Log kiem thu TC01, TC02, TC04 va TC05 (thu hoi phien).
- docs/tc03-evidence.txt: Log kiem thu TC03 tren API ho so hoc sinh.

TC05 da co log thu hoi phien sau dang xuat. Ket qua kiem thu phien het han da duoc ghi nhan truoc do, nhung chua co log goc rieng.

## 4. Gioi han kiem thu

TC03 da PASS tren API ho so hoc sinh hien co. Ket qua cho thay hoc sinh A (ID 22) khong nhan duoc du lieu ho so cua hoc sinh B (ID 23) khi truyen tham so studentId cua B.

API diem danh cho vai tro KHAO_THI cung da tu choi tai khoan HOC_SINH voi HTTP 403.

Tuy nhien, API hoc sinh xem bang diem ca nhan chua san sang nen chua the kiem thu phan quyen tren endpoint nay. Noi dung nay can duoc kiem thu bo sung khi module duoc tich hop.

Cac ket qua kiem thu hien tai chi ap dung cho nhung API da duoc kiem tra.

## 5. Tong ket

- So test case: 5
- PASS: 5 (theo pham vi API hien co da kiem thu)
- FAIL: 0
- CHUA HOAN TAT: 0 trong pham vi API da kiem thu
- Trang thai bao cao: Da ghi nhan ket qua TC01-TC05.
- Trang thai evidence: Da luu log TC01, TC02, TC03, TC04 va TC05 (thu hoi phien). Chua co log goc rieng cho phien het han.
- Trang thai ban giao: Chua hoan tat xac nhan evidence.
- Gioi han: Chua kiem thu phan quyen tren API hoc sinh xem diem ca nhan do endpoint chua san sang.

Ket luan: Da kiem thu xac thuc va phan quyen tren cac API hien co. Cac test case trong pham vi da kiem tra deu dat ket qua PASS. Can hoan thien evidence va kiem thu bo sung API xem diem ca nhan khi duoc tich hop.