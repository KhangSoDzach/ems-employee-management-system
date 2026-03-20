-- ============================================================
-- Migration V117: Seed Realistic Data for CRUD functionality
-- Description: Add a comprehensive set of seed data across all modules:
--   Users, Employees, KPI, Announcements, Assets, Attendances, Leaves
-- ============================================================

-- 1. USERS & EMPLOYEES (IDs 8-17)
-- Password is 'password' -> $2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum
INSERT IGNORE INTO users (id, username, email, password, enabled, account_non_expired, account_non_locked, credentials_non_expired, failed_login_attempts, created_at, updated_at, is_deleted, version)
VALUES
(8,  'tran.a',     'tran.a@ems.company.com',   '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(9,  'nguyen.b',   'nguyen.b@ems.company.com', '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(10, 'le.c',       'le.c@ems.company.com',     '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(11, 'pham.d',     'pham.d@ems.company.com',   '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(12, 'vu.e',       'vu.e@ems.company.com',     '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(13, 'dang.f',     'dang.f@ems.company.com',   '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(14, 'bui.g',      'bui.g@ems.company.com',    '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(15, 'ho.h',       'ho.h@ems.company.com',     '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(16, 'ngo.i',      'ngo.i@ems.company.com',    '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0),
(17, 'phan.j',     'phan.j@ems.company.com',   '$2a$10$CMma736Zxup0lwfPCPvsQOxzrZR6xqm30KDgn1fdMwIbBskcsjYum', TRUE, TRUE, TRUE, TRUE, 0, NOW(), NOW(), FALSE, 0);

-- Roles (Assume ROLE_EMPLOYEE = 3)
INSERT IGNORE INTO user_roles (user_id, role_id) SELECT id, 3 FROM users WHERE id BETWEEN 8 AND 17;

-- Employees
INSERT IGNORE INTO employees (id, employee_code, first_name, last_name, email, phone, gender, date_of_birth, nationality, national_id, tax_id, hire_date, status, contract_type, department_id, position_id, user_id, reporting_manager_id, annual_leave_balance, sick_leave_balance, created_at, updated_at, is_deleted, version)
VALUES
(8,  'EMS-2024-008', 'A', 'Trần Văn',  'tran.a@ems.company.com',   '0961111111', 'MALE',   '1995-01-01', 'Vietnam', '111222333444', 'T111222', '2024-01-01', 'ACTIVE', 'FULL_TIME', 2, 3, 8,  2, 12, 10, NOW(), NOW(), FALSE, 0),
(9,  'EMS-2024-009', 'B', 'Nguyễn Thị', 'nguyen.b@ems.company.com', '0962222222', 'FEMALE', '1996-02-02', 'Vietnam', '111222333555', 'T111223', '2024-02-01', 'ACTIVE', 'FULL_TIME', 2, 4, 9,  2, 12, 10, NOW(), NOW(), FALSE, 0),
(10, 'EMS-2024-010', 'C', 'Lê Văn',    'le.c@ems.company.com',     '0963333333', 'MALE',   '1997-03-03', 'Vietnam', '111222333666', 'T111224', '2024-03-01', 'ACTIVE', 'FULL_TIME', 2, 4, 10, 2, 12, 10, NOW(), NOW(), FALSE, 0),
(11, 'EMS-2024-011', 'D', 'Phạm Thị',  'pham.d@ems.company.com',   '0964444444', 'FEMALE', '1998-04-04', 'Vietnam', '111222333777', 'T111225', '2024-04-01', 'ACTIVE', 'CONTRACT', 2, 4, 11, 2, 12, 10, NOW(), NOW(), FALSE, 0),
(12, 'EMS-2024-012', 'E', 'Vũ Văn',    'vu.e@ems.company.com',     '0965555555', 'MALE',   '1999-05-05', 'Vietnam', '111222333888', 'T111226', '2024-05-01', 'ACTIVE', 'FULL_TIME', 3, 5, 12, 3, 12, 10, NOW(), NOW(), FALSE, 0),
(13, 'EMS-2024-013', 'F', 'Đặng Thị',  'dang.f@ems.company.com',   '0966666666', 'FEMALE', '2000-06-06', 'Vietnam', '111222333999', 'T111227', '2024-06-01', 'ACTIVE', 'FULL_TIME', 2, 4, 13, 2, 12, 10, NOW(), NOW(), FALSE, 0),
(14, 'EMS-2024-014', 'G', 'Bùi Văn',   'bui.g@ems.company.com',    '0967777777', 'MALE',   '1994-07-07', 'Vietnam', '111222333000', 'T111228', '2024-07-01', 'ACTIVE', 'FULL_TIME', 2, 3, 14, 2, 12, 10, NOW(), NOW(), FALSE, 0),
(15, 'EMS-2024-015', 'H', 'Hồ Thị',    'ho.h@ems.company.com',     '0968888888', 'FEMALE', '1993-08-08', 'Vietnam', '111222333111', 'T111229', '2024-08-01', 'ACTIVE', 'FULL_TIME', 3, 5, 15, 3, 12, 10, NOW(), NOW(), FALSE, 0),
(16, 'EMS-2024-016', 'I', 'Ngô Văn',    'ngo.i@ems.company.com',    '0969999999', 'MALE',   '1992-09-09', 'Vietnam', '111222333222', 'T111230', '2024-09-01', 'ACTIVE', 'FULL_TIME', 2, 4, 16, 2, 12, 10, NOW(), NOW(), FALSE, 0),
(17, 'EMS-2024-017', 'J', 'Phan Thị',   'phan.j@ems.company.com',   '0960000000', 'FEMALE', '1991-10-10', 'Vietnam', '111222333333', 'T111231', '2024-10-01', 'ACTIVE', 'FULL_TIME', 2, 4, 17, 2, 12, 10, NOW(), NOW(), FALSE, 0);

-- 2. KPI OBJECTIVES (Q1 2026)
INSERT IGNORE INTO kpi_objectives (name, type, metric_type, target_value, actual_value, weight, description, scope_type, scope_id, period_start, period_end, status, created_at, updated_at, created_by, updated_by, version, is_deleted)
VALUES
('Company Revenue Q1 2026', 'KPI', 'VND', 5000000000, 4200000000, 40, 'Mục tiêu doanh thu quý 1 2026 cho toàn công ty', 'COMPANY', NULL, '2026-01-01', '2026-03-31', 'ACTIVE', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 0, FALSE),
('Improve Code Coverage',   'OKR', 'PERCENT', 85, 78, 20, 'Nâng cao tỷ lệ test coverage cho dự án EMS', 'DEPARTMENT', 2, '2026-01-01', '2026-03-31', 'ACTIVE', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 0, FALSE),
('Hire 5 Engineers',        'KPI', 'NUMBER', 5, 3, 15, 'Tuyển dụng thêm 5 kỹ sư mới trong Q1', 'DEPARTMENT', 3, '2026-01-01', '2026-03-31', 'ACTIVE', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 0, FALSE),
('Personal Goal: Tran Van A', 'OKR', 'PERCENT', 100, 90, 25, 'Hoàn thành module quản lý tài sản', 'EMPLOYEE', 8, '2026-01-01', '2026-03-31', 'ACTIVE', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 0, FALSE);

-- 3. ANNOUNCEMENTS
INSERT IGNORE INTO announcements (title, content, announcement_type, target_audience, published_at, created_at, updated_at, created_by, updated_by, version, is_deleted)
VALUES
('Thông báo Nghỉ lễ Giỗ tổ Hùng Vương', 'Công ty thông báo nghỉ lễ Giỗ tổ Hùng Vương vào ngày 10/3 âm lịch. Các phòng ban chủ động sắp xếp công việc.', 'GENERAL', 'ALL', '2026-03-10 08:00:00', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 0, FALSE),
('Chính sách Remote Working mới', 'Từ tháng 4/2026, nhân viên có thể đăng ký remote tối đa 2 ngày/tuần với sự đồng ý của Manager.', 'POLICY', 'ALL', '2026-03-15 09:00:00', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 0, FALSE),
('Sự kiện Tech Talk tháng 3', 'Mời toàn thể anh em Engineering tham dự buổi Tech Talk về Microservices vào chiều thứ 6 tuần này.', 'EVENT', 'DEPARTMENT', '2026-03-18 10:00:00', NOW(), NOW(), 'SYSTEM', 'SYSTEM', 0, FALSE);

-- 4. ASSETS & HISTORY
INSERT IGNORE INTO assets (id, asset_code, asset_name, asset_type, description, status, asset_condition, assigned_to_id, assigned_date, warranty_until, location, supplier_name, created_at, updated_at)
VALUES
(5, 'AST-2026-0101', 'Monitor LG 27GL850', 'IT_EQUIPMENT', 'Màn hình chuyên đồ họa', 'ASSIGNED', 'NEW', 8, '2026-01-05', '2027-01-05', 'Floor 4 - Desk A1', 'LG Mall', NOW(), NOW()),
(6, 'AST-2026-0102', 'Keychron K2 V2',      'IT_EQUIPMENT', 'Bàn phím cơ không dây', 'ASSIGNED', 'GOOD', 9, '2026-01-10', '2027-01-10', 'Floor 4 - Desk A2', 'Phong Cach Xanh', NOW(), NOW()),
(7, 'AST-2026-0103', 'Logitech MX Master 3','IT_EQUIPMENT', 'Chuột làm việc cao cấp',  'AVAILABLE', 'NEW', NULL, NULL, '2027-01-15', 'Storage Room', 'Hoang Ham', NOW(), NOW()),
(8, 'AST-2026-0104', 'DrayTek Vigor2927',   'IT_EQUIPMENT', 'Router cân bằng tải', 'ASSIGNED', 'NEW', 1, '2026-01-01', '2028-01-01', 'Server Room', 'An Phat', NOW(), NOW());

INSERT IGNORE INTO asset_history (asset_id, action_type, actor_username, old_value, new_value, created_at)
VALUES
(1, 'ASSIGN', 'admin', 'AVAILABLE', 'ASSIGNED', '2026-01-05 10:00:00'),
(2, 'ASSIGN', 'admin', 'AVAILABLE', 'ASSIGNED', '2026-01-10 11:00:00');

-- 5. ATTENDANCES (Last 5 days for some employees)
-- Note: Simplified seeding for demonstration. A loop would be better in a script, but for SQL migration we do static lines.
INSERT IGNORE INTO attendances (employee_id, date, check_in_time, check_out_time, status, work_hours, is_late, is_remote, created_at, updated_at)
VALUES
(8,  DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 23 HOUR), 'PRESENT', 480, FALSE, FALSE, NOW(), NOW()),
(9,  DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 23 HOUR), 'PRESENT', 480, FALSE, FALSE, NOW(), NOW()),
(10, DATE_SUB(CURRENT_DATE, INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 23 HOUR), 'PRESENT', 480, FALSE, FALSE, NOW(), NOW()),
(8,  DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 47 HOUR), 'PRESENT', 480, FALSE, FALSE, NOW(), NOW()),
(9,  DATE_SUB(CURRENT_DATE, INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 47 HOUR), 'PRESENT', 480, FALSE, FALSE, NOW(), NOW());

-- 6. LEAVES
INSERT IGNORE INTO leaves (employee_id, leave_type, start_date, end_date, total_days, reason, status, is_half_day, is_paid, is_emergency, created_at, updated_at, version)
VALUES
(8, 'ANNUAL', '2026-04-10', '2026-04-12', 3, 'Đi du lịch gia đình', 'PENDING', FALSE, TRUE, FALSE, NOW(), NOW(), 0),
(12, 'SICK',   '2026-03-20', '2026-03-20', 1, 'Bị sốt xuất huyết', 'APPROVED', FALSE, TRUE, TRUE,  NOW(), NOW(), 0),
(15, 'CASUAL', '2026-03-25', '2026-03-25', 1, 'Giải quyết việc riêng', 'REJECTED', FALSE, TRUE, FALSE, NOW(), NOW(), 0);

-- 7. PERFORMANCE REVIEWS (2026-Q1)
INSERT IGNORE INTO performance_reviews (reviewer_id, reviewee_id, reviewer_username, reviewee_username, review_type, review_period, expertise_score, communication_score, attitude_score, total_score, status, created_at, updated_at, version)
VALUES
(2, 8,  'manager1', 'tran.a',   'MANAGER', '2026-Q1', 85, 80, 90, 85, 'SUBMITTED', NOW(), NOW(), 0),
(2, 9,  'manager1', 'nguyen.b', 'MANAGER', '2026-Q1', 90, 85, 85, 87, 'SUBMITTED', NOW(), NOW(), 0),
(8, 8,  'tran.a',   'tran.a',   'SELF',    '2026-Q1', 80, 80, 85, 82, 'SUBMITTED', NOW(), NOW(), 0),
(9, 8,  'nguyen.b', 'tran.a',   'PEER',    '2026-Q1', 88, 85, 92, 88, 'SUBMITTED', NOW(), NOW(), 0);

-- 8. ASSET INCIDENT REPORTS
INSERT IGNORE INTO asset_incident_reports (report_code, asset_id, incident_type, description, status, reported_by, reported_at, created_at, updated_at)
VALUES
('AIR-2026-0001', 5, 'HARDWARE_ISSUE', 'Màn hình bị loang mực nhẹ ở góc trái', 'PENDING', 8, '2026-03-15 14:00:00', NOW(), NOW()),
('AIR-2026-0002', 6, 'LOST_ASSET',     'Bàn phím bị hỏng do đổ cà phê vào', 'RESOLVED', 9, '2026-03-10 09:30:00', NOW(), NOW());
