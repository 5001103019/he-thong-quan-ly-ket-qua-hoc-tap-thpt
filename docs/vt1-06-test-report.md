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

| TC03 | Hoc sinh A khong xem duoc du lieu hoc sinh B | API ho so chi tra du lieu A; API diem quan tri tra 403. Chua kiem tra API xem diem ca nhan | CHUA HOAN TAT |

| TC04 | Hoc sinh khong duoc goi API quan tri | Hai API quan tri tra HTTP 403 | PASS |

| TC05 | Phien dang nhap khong con hop le | Thu hoi phien va het han phien deu bi tu choi HTTP 401 | PASS |



## 3. Minh chung kiem thu

Ket qua ghi nhan tu cac lan chay CMD ngay 02/11/2026:

- TC01: HTTP 200, success=true, co cookie phien.
- TC02: HTTP 401, success=false, khong co cookie dang nhap.
- TC03: Hoc sinh A co ID 22, hoc sinh B co ID 23. API ho so van tra ID 22 (PASS_PROFILE). API diem quan tri tra HTTP 403 (PASS_SCORE_ENDPOINTS). Chua kiem tra API xem diem ca nhan.
- TC04: Hai API quan tri deu tra HTTP 403 (PASS_TC04).
- TC05: Sau khi phien het han, API tra HTTP 401, success=false (PASS_SESSION_EXPIRED).

Day la ban ghi tom tat ket qua CMD da kiem tra. Chua dinh kem log nguyen van hoac anh chup man hinh.


## 4. Van de can hoan thien



TC03 can kiem tra bo sung API hoc sinh xem bang diem ca nhan de chung minh hoc sinh A khong xem duoc bang diem cua hoc sinh B.



Sau khi module xem diem ca nhan duoc tich hop, can chay lai phan kiem thu con thieu, cap nhat ket qua va minh chung.



## 5. Tong ket



- So test case: 5

- PASS: 4

- FAIL: 0

- CHUA HOAN TAT: 1

- Trang thai cong viec: Dang hoan thien kiem thu va minh chung

- Ghi chu: Ket qua PASS duoc ghi nhan theo cac lan kiem thu da xac nhan; can luu anh hoac log thuc te de ban giao.

