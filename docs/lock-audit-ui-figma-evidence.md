# TÀI LIỆU MINH CHỨNG GIAO DIỆN KHÓA ĐIỂM VÀ AUDIT LOG

## 1. Danh sách màn hình đã hoàn thiện

### 1.1. Màn hình Khóa & Mở khóa điểm (`09_KT_LockUnlock`)
* **Đường dẫn tệp:**
  * HTML: [`frontend/pages/lock-unlock.html`](file:///d:/Code/abc/he-thong-quan-ly-ket-qua-hoc-tap-thpt/frontend/pages/lock-unlock.html)
  * CSS: [`frontend/css/lock-unlock.css`](file:///d:/Code/abc/he-thong-quan-ly-ket-qua-hoc-tap-thpt/frontend/css/lock-unlock.css)
  * JS: [`frontend/js/lock-unlock.js`](file:///d:/Code/abc/he-thong-quan-ly-ket-qua-hoc-tap-thpt/frontend/js/lock-unlock.js)
* **Các thành phần giao diện đạt chuẩn Figma:**
  1. **Bộ lọc phạm vi:** Dropdown liên hoàn chọn Niên khóa, Khối, Lớp, Môn học.
  2. **Bảng trạng thái 5 cột điểm độc lập:**
     * `QT1` (Điểm quá trình 1)
     * `QT2` (Điểm quá trình 2)
     * `QT3` (Điểm quá trình 3)
     * `GK` (Điểm giữa kỳ)
     * `CK` (Điểm cuối kỳ)
  3. **Huy hiệu trạng thái (Status Badge):**
     * Đang mở: Badge nền xanh lá (`status-unlocked`, chữ "ĐANG MỞ").
     * Đã khóa: Badge nền đỏ nhạt (`status-locked`, chữ "ĐÃ KHÓA").
  4. **Chỉ báo số điểm còn thiếu:**
     * Cột còn thiếu điểm: Dòng cảnh báo màu đỏ kèm biểu tượng `⚠️ Còn [X] học sinh`.
     * Cột đủ điểm: Dòng màu xanh `✓ Đầy đủ (0 thiếu)`.
  5. **Các nút thao tác theo trạng thái:**
     * Cột `UNLOCKED` phiên bản ban đầu: Nút xanh `Khóa điểm` (`POST /locks/lock`).
     * Cột `LOCKED`: Nút cam `Mở khóa` (`POST /locks/unlock`).
     * Cột `UNLOCKED` đã từng sửa: Nút xanh lá đậm `Khóa lại` (`POST /locks/relock`).
  6. **Modal popup Mở khóa điểm (`#unlockModal`):**
     * Ô nhập thông tin Người yêu cầu mở khóa (`unlockRequestedByNameInput`).
     * Ô nhập Lý do mở khóa giải trình bắt buộc (`unlockReasonInput`).
     * Nút [Hủy bỏ] và [Xác nhận mở khóa].
  7. **Hộp thoại Từ chối khi khóa do thiếu điểm (`#missingScoreModal`):**
     * Bật lên khi cán bộ bấm Khóa mà cột còn `missingCount > 0`.
     * Hiển thị rõ số học sinh còn thiếu và lý do từ chối (chặn tuyệt đối, không có ngoại lệ bypass).

---

### 1.2. Màn hình Nhật ký kiểm toán (`10_KT_AuditLog`)
* **Đường dẫn tệp:**
  * HTML: [`frontend/pages/audit-log.html`](file:///d:/Code/abc/he-thong-quan-ly-ket-qua-hoc-tap-thpt/frontend/pages/audit-log.html)
  * CSS: [`frontend/css/audit-log.css`](file:///d:/Code/abc/he-thong-quan-ly-ket-qua-hoc-tap-thpt/frontend/css/audit-log.css)
  * JS: [`frontend/js/audit-log.js`](file:///d:/Code/abc/he-thong-quan-ly-ket-qua-hoc-tap-thpt/frontend/js/audit-log.js)
* **Các thành phần giao diện đạt chuẩn Figma:**
  1. **Bộ lọc đa tiêu chí:**
     * Lọc theo khoảng thời gian: `Từ ngày` - `Đến ngày`.
     * Lọc theo loại thao tác: Tất cả, `LOCK`, `UNLOCK`, `RELOCK`, `SCORE_EDIT`, `SCORE_IMPORT`.
     * Lọc theo cột điểm: Tất cả, `QT1`, `QT2`, `QT3`, `GK`, `CK`.
     * Lọc theo Niên khóa, Lớp, Môn học.
     * Nút [Tìm kiếm] và [Đặt lại].
  2. **Bảng dữ liệu Audit Log:**
     * Cột Thời gian: Hiển thị định dạng ngày giờ chuẩn Việt Nam từ `DATETIMEOFFSET(7)`.
     * Cột Loại thao tác: Tag màu riêng biệt cho từng hành động.
     * Cột Người thực hiện: Tên tài khoản và User ID từ bảng `dbo.app_user`.
     * Cột Phạm vi: Hiển thị Lớp - Môn - Cột điểm.
     * Cột Học sinh liên quan: Mã học sinh và Họ tên (khi sửa điểm hoặc import).
     * Cột Thay đổi điểm: Hiển thị giá trị điểm cũ `→` điểm mới.
     * Cột Lý do giải trình: Lưu trữ minh bạch lý do mở khóa và người yêu cầu.
     * Cột Kết quả: Badge `SUCCESS`.
  3. **Điều hướng phân trang (Pagination):**
     * Nút [Trang trước], [Trang sau], chỉ báo số trang hiện tại.

---

## 2. API Backend bổ trợ
* Đã hoàn thiện và tích hợp endpoint đọc Audit Log:
  * `GET /api/v1/locks/audit-logs` (đồng thời ánh xạ tại `/api/v1/audit-logs`).
  * Tham số lọc: `academicYearId`, `classId`, `subjectId`, `component`, `actionType`, `performedBy`, `from`, `to`, `page`, `limit`.
  * Trả về kết quả phân trang kèm thông tin tên người thực hiện, tên lớp, tên môn và tên học sinh.

---

## 3. Tích hợp thanh điều hướng Navigation (Dùng chung)
* Cập nhật file [`frontend/js/navigation.js`](file:///d:/Code/abc/he-thong-quan-ly-ket-qua-hoc-tap-thpt/frontend/js/navigation.js):
  * `{ label: "Khóa / Mở khóa", url: "lock-unlock.html" }`
  * `{ label: "Audit Log", url: "audit-log.html" }`

