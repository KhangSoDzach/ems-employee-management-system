# Payroll Configuration - Manual QA Checklist

## 1) Preconditions

- Đăng nhập bằng tài khoản có role `ROLE_ADMIN` hoặc `ROLE_HR`.
- Mở màn hình `Cấu hình chính sách lương` tại đường dẫn `/payroll`.
- Đảm bảo API backend đang chạy và truy cập được `GET/POST/PUT /api/payroll/components`.

## 2) RBAC & Navigation

- [ ] Với `ROLE_ADMIN`: thấy menu Payroll ở sidebar và vào được `/payroll`.
- [ ] Với `ROLE_HR`: vào được `/payroll`.
- [ ] Với role khác (`MANAGER/EMPLOYEE`): không vào được `/payroll` (bị chặn theo policy hệ thống).

## 3) Create - Type/Nature/Fields Rules

### 3.1 ALLOWANCE (Phụ cấp)

- [ ] Chọn `Loại = ALLOWANCE`.
- [ ] Trường `Tính chất` tự khóa và hiển thị `Thu nhập`.
- [ ] Chỉ thấy trường `Số tiền`, không thấy `Hệ số/Phần trăm`.
- [ ] Bấm lưu khi thiếu `Số tiền` => hiện lỗi `Vui lòng nhập Số tiền`.
- [ ] Nhập hợp lệ và lưu thành công.

### 3.2 COMMISSION (Hoa hồng)

- [ ] Chọn `Loại = COMMISSION`.
- [ ] `Tính chất` tự khóa = `Thu nhập`.
- [ ] Chỉ thấy `Hệ số/Phần trăm`, không thấy `Số tiền`.
- [ ] Thiếu `Hệ số/Phần trăm` => hiện lỗi `Vui lòng nhập Hệ số/Phần trăm`.
- [ ] Nhập hệ số hợp lệ (0-100) và lưu thành công.

### 3.3 INSURANCE (Bảo hiểm)

- [ ] Chọn `Loại = INSURANCE`.
- [ ] `Tính chất` tự khóa = `Khấu trừ`.
- [ ] Chỉ thấy `Hệ số/Phần trăm`, không thấy `Số tiền`.
- [ ] Lưu thành công với dữ liệu hợp lệ.
- [ ] Kiểm tra dữ liệu trả về/list: insurance luôn thuộc nhóm khấu trừ.

### 3.4 BONUS (Thưởng)

- [ ] Chọn `Loại = BONUS`.
- [ ] `Tính chất` tự khóa = `Thu nhập`.
- [ ] Thấy cả `Số tiền` và `Hệ số/Phần trăm`.
- [ ] Có thể lưu khi nhập cả hai hoặc một giá trị theo rule backend hiện hành.

## 4) Base Type Visibility

- [ ] Ở modal tạo mới: không thấy lựa chọn `BASE`.
- [ ] Nếu mở sửa bản ghi cũ loại `BASE` (nếu tồn tại): vẫn hiển thị để không làm hỏng dữ liệu legacy.

## 5) Validation & Duplicate (AC-02)

- [ ] Tạo mới với `code` trùng => backend trả lỗi 409, UI hiển thị lỗi server tương ứng.
- [ ] Tạo mới với `name` trùng => backend trả lỗi 409, UI hiển thị lỗi server tương ứng.
- [ ] Mã rỗng => lỗi `Mã thành phần là bắt buộc`.
- [ ] Tên rỗng => lỗi `Tên thành phần là bắt buộc`.

## 6) Edit Flow

- [ ] Mở edit từ bảng danh sách.
- [ ] Đổi loại giữa các nhóm (ALLOWANCE ↔ COMMISSION ↔ BONUS ↔ INSURANCE).
- [ ] Kiểm tra trường hiển thị đổi đúng theo loại ngay lập tức.
- [ ] Lưu thành công và list cập nhật đúng `Loại`, `Tính chất`, `Số tiền/Hệ số`.

## 7) List Rendering

- [ ] Cột hiển thị đúng: `Mã`, `Tên`, `Loại`, `Tính chất`, `Số tiền`, `Hệ số (%)`, `Trạng thái`.
- [ ] Giá trị không áp dụng hiển thị `-`.
- [ ] Nút `Sửa` hoạt động cho từng dòng.

## 8) Audit Log (Backend Verification)

- [ ] Tạo component mới => có bản ghi audit log (ai tạo, thời gian, thay đổi).
- [ ] Sửa component => có bản ghi audit log.
- [ ] (Nếu có xóa ở màn hình khác/API) xóa component => có bản ghi audit log.

## 9) Suggested Test Data

- ALLOWANCE: `code=ALLOWANCE_LUNCH`, `name=Phụ cấp ăn trưa`, `amount=500000`
- COMMISSION: `code=COMM_SALES`, `name=Hoa hồng bán hàng`, `ratePercent=5`
- INSURANCE: `code=INS_BHXH`, `name=Bảo hiểm xã hội`, `ratePercent=8`
- BONUS: `code=BONUS_KPI`, `name=Thưởng KPI`, `amount=1000000`, `ratePercent=10`

## 10) Expected Overall Result

- Rule hiển thị field theo loại hoạt động đúng.
- Rule khóa `Tính chất` hoạt động đúng.
- Không còn checkbox `Tính thuế` và `Tính bảo hiểm` trong form.
- `BASE` không xuất hiện trong tạo mới.
- Create/Edit chạy thông suốt với thông báo lỗi rõ ràng.
