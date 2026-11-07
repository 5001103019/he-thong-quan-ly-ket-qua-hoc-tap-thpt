# API xuất CSV bảng điểm và thống kê kết quả học tập

**Phạm vi:** Backend – Phòng Khảo thí. Tài liệu này mô tả hợp đồng API của nhánh `feature/Ngoc-06-score-export-integration` (gồm phần xử lý lỗi HTTP 500 đang hoàn thiện trên máy cục bộ).

## 1. Endpoint và phân quyền

`GET /api/v1/score-export`

- Cần phiên đăng nhập hợp lệ; chỉ vai trò `KHAO_THI` được xuất dữ liệu toàn lớp.
- Chức năng chỉ đọc, **không** sửa điểm, khóa điểm hoặc lịch sử phân lớp.
- Giao diện xuất CSV được thực hiện trong phần việc UI riêng của nhóm.

## 2. Tham số truy vấn

| Tham số | Bắt buộc | Giá trị |
|---|---|---|
| `type` | Có | `details` (bảng điểm) hoặc `statistics` (thống kê) |
| `academicYearId` | Có | ID niên khóa dạng số nguyên dương |
| `classId` | Có | ID lớp dạng số nguyên dương, phải thuộc niên khóa đã chọn |
| `subjectId` | Không | ID môn dạng số nguyên dương; **`all` hoặc không truyền** để xuất tất cả môn |

Ví dụ:

```http
GET /api/v1/score-export?type=details&academicYearId=2&classId=7&subjectId=1
GET /api/v1/score-export?type=details&academicYearId=2&classId=7&subjectId=all
GET /api/v1/score-export?type=statistics&academicYearId=2&classId=7&subjectId=all
```

## 3. Xuất thành công – HTTP 200

Phản hồi trả về **file CSV**, không phải JSON:

- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="score-...csv"`
- `Cache-Control: no-store`
- Có **UTF-8 BOM**, xuống dòng **CRLF**, các giá trị CSV được đặt trong dấu nháy kép và escape đúng quy tắc.

**Bảng điểm (`details`), 18 cột:** Niên khóa, Lớp, Mã học sinh, Họ và tên, Mã môn, Môn học, QT1, QT2, QT3, GK, CK, Trạng thái QT1, Trạng thái QT2, Trạng thái QT3, Trạng thái GK, Trạng thái CK, Điểm tổng kết, Trạng thái tổng kết.

**Thống kê (`statistics`), 8 cột:** Niên khóa, Lớp, Mã môn, Môn học, Số học sinh, Số học sinh đủ điểm tổng kết, Số học sinh chưa có điểm tổng kết, Điểm trung bình tổng kết.

## 4. Quy tắc nghiệp vụ đã thống nhất

- **Học sinh chuyển lớp:** chỉ đưa vào bảng điểm và thống kê học sinh **hiện thuộc lớp** (`enrollment.end_date IS NULL`); dữ liệu lịch sử cũ vẫn được bảo toàn trong hệ thống.
- **Không áp dụng công bố điểm:** không có bộ lọc "Đã công bố" và không bổ sung quy trình công bố.
- Xuất theo niên khóa, lớp, một môn hoặc tất cả môn. Khi xuất tất cả môn, repository hiện bao gồm cả môn `INACTIVE` để không loại bỏ khả năng có dữ liệu lịch sử theo môn.
- Điểm `0` hợp lệ khác với điểm chưa nhập (`""` trong CSV). Xuất trạng thái để phân biệt `SCORED`, `NOT_ENTERED` và trạng thái khác từ dữ liệu nguồn.
- Điểm tổng kết chỉ có khi **đủ năm thành phần điểm hợp lệ và công thức được phê duyệt**; nếu chưa đủ điều kiện thì để trống.
- Thống kê tính theo từng môn, không cộng các môn thành một điểm trung bình chung.

## 5. Phản hồi lỗi

Với lỗi, API trả **JSON** (không trả file CSV):

| HTTP | Mã lỗi | Trường hợp |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Loại xuất hoặc bộ lọc không hợp lệ |
| 400 | `SCOPE_MISMATCH` | Lớp không thuộc niên khóa đã chọn |
| 401 | Theo middleware xác thực | Chưa đăng nhập |
| 403 | Theo middleware phân quyền | Không phải Phòng Khảo thí |
| 404 | `CLASS_NOT_FOUND` | Không tìm thấy lớp |
| 404 | `SUBJECT_NOT_FOUND` | Không tìm thấy môn |
| 404 | `NO_EXPORT_DATA` | Không có dữ liệu phù hợp; **không tạo CSV rỗng** |
| 500 | `INTERNAL_ERROR` | Lỗi bất ngờ lúc xuất CSV; không để lộ nội dung lỗi SQL Server cho người dùng |

Ví dụ HTTP 404 khi dữ liệu trống:

```json
{
  "success": false,
  "error": {
    "code": "NO_EXPORT_DATA",
    "message": "Không có dữ liệu phù hợp với điều kiện xuất đã chọn."
  }
}
```

Ví dụ HTTP 500 (sau khi cập nhật phần xử lý lỗi trên nhánh):

```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Không thể xuất CSV lúc này. Vui lòng thử lại sau."
  }
}
```

**Lưu ý:** Nội dung HTTP 401/403 do middleware xác thực/phân quyền chung định nghĩa, không nhất thiết cùng cấu trúc `error` như các lỗi riêng của API xuất CSV.

## 6. Hướng dẫn nối giao diện

- Gọi API bằng phiên đăng nhập hiện hành (gửi kèm cookie khi cần).
- HTTP 200: xử lý response dưới dạng `Blob` và kích hoạt tải file.
- HTTP lỗi: đọc JSON hiển thị thông báo, **không tải file**.
- Cho phép chọn niên khóa → lớp → môn; `subjectId=all` tương ứng "Tất cả môn".
- Không hiển thị lựa chọn "Đã công bố" vì nhóm đã quyết định không triển khai tính năng này.

## 7. CSV mẫu và minh chứng

Hai file trong `docs/samples/` dùng **dữ liệu giả lập 100%**, chỉ minh họa định dạng đầu ra và có thể được đưa vào GitHub. Chúng **không phải** file được tải từ SQL Server thật và **không thay thế** minh chứng kiểm thử API thực tế.

Đã có các minh chứng kiểm thử riêng cho HTTP 200, 401, 403, CSV một/tất cả môn, Enrollment chuyển lớp và ngoại lệ `NO_EXPORT_DATA`.

**Giới hạn:** Chưa kiểm thử đầu-cuối tính tổng kết với `score_formula_policy` ở trạng thái `APPROVED` trên SQL Server thật vì môi trường kiểm thử chưa có bản ghi công thức được phê duyệt.
