
# QUY TRINH GITHUB - NHOM 5

## 1. Nguyen tac chung

- Su dung chung mot GitHub repository.
- Nhanh main chua phien ban da tich hop.
- Moi thanh vien lam viec tren nhanh rieng.
- Khong tu y push code truc tiep len main.
- Moi thay doi can duoc kiem tra truoc khi merge.
- Giang phu trach review va tich hop code.

## 2. Phan cong thanh vien

- Giang: Kien truc, database, auth, tich hop.
- Yen: Figma va frontend.
- Ngoc: Quan ly nien khoa, lop, hoc sinh, mon.
- Chau: Quan ly diem va tinh tong ket.
- Uyen: Khoa diem, mo khoa va Audit Log.

## 3. Quy tac dat ten nhanh

Cau truc:

feature/tentv-YY-ten-cong-viec

Vi du:
- feature/Giang-01-setup
- feature/Yen-01-figma
- feature/Ngoc-02-academic-api
- feature/Chau-02-score-api
- feature/Uyen-02-lock-api

Moi cong viec nen co nhanh rieng.

## 4. Quy trinh lam viec

Buoc 1: Cap nhat nhanh main.

git switch main
git pull origin main

Buoc 2: Tao nhanh moi.

git switch -c feature/tentv-YY-ten-cong-viec

Buoc 3: Lap trinh va kiem tra.

- Viet code theo cau truc chung.
- Kiem tra chuc nang.
- Khong commit mat khau hoac file .env.

Buoc 4: Commit.

git add .
git commit -m "feat: mo ta cong viec"

Buoc 5: Push.

git push -u origin ten-nhanh

Buoc 6: Tao Pull Request tren GitHub.

- Base: main
- Compare: nhanh cong viec
- Dien Title va Description.
- Ghi ro chuc nang, cach test va bang chung.

Buoc 7: Review.

- Giang kiem tra code, API va cau truc.
- Neu PR do Giang tao, can thanh vien khac review.
- Neu co loi, yeu cau sua truoc khi merge.

Buoc 8: Merge.

- Chi merge PR da duoc review va kiem tra.
- Giang chiu trach nhiem tich hop main.
- Neu co conflict, xu ly va test lai.

## 5. Quy tac commit

- feat: them chuc nang moi
- fix: sua loi
- docs: cap nhat tai lieu
- test: them hoac sua kiem thu
- chore: cau hinh va bao tri

Vi du:

feat: add login API
fix: prevent editing locked scores
docs: update API conventions
test: add authorization tests

## 6. Quy tac bao mat

Khong commit:
- File .env that.
- Mat khau va secret key.
- Thu muc node_modules.
- Thu muc .vs.
- Du lieu ca nhan that cua hoc sinh.

## 7. Kiem tra truoc khi merge

- Code chay duoc.
- Khong co thong tin bi mat.
- Dung API conventions.
- Khong pha chuc nang hien co.
- Co bang chung kiem thu.
- Khong co conflict chua xu ly.

## 8. Quy trinh ban giao

Moi thanh vien gui cho Giang:
- Ma cong viec.
- Ten branch.
- Link Pull Request.
- Danh sach file thay doi.
- Huong dan kiem tra.
- Ket qua test.
- Anh minh chung neu co.

Giang kiem tra va tich hop vao main.
