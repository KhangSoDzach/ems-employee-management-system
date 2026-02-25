-- =====================================
-- V6: Core Domain Tables
-- Description: Create departments, positions, employees, salaries,
--              leaves, leave_balances, payrolls, attendances tables
-- Author: EMS Backend Team
-- Date: 2026-02-24
-- =====================================

-- ─────────────────────────────────────────────────────────────
-- 1. DEPARTMENTS (no FK to employees yet — circular dep)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments
(
    id                    BIGINT AUTO_INCREMENT NOT NULL,
    created_at            DATETIME(6)           NOT NULL,
    updated_at            DATETIME(6)           NOT NULL,
    created_by            VARCHAR(255)          NULL,
    updated_by            VARCHAR(255)          NULL,
    version               BIGINT                NULL,
    deleted_at            DATETIME(6)           NULL,
    is_deleted            BOOLEAN               NOT NULL DEFAULT FALSE,
    deleted_by            VARCHAR(255)          NULL,
    code                  VARCHAR(50)           NOT NULL,
    name                  VARCHAR(100)          NOT NULL,
    description           VARCHAR(500)          NULL,
    parent_department_id  BIGINT                NULL,
    head_of_department_id BIGINT                NULL,
    budget_allocation     DECIMAL(15, 2)        NULL,
    location              VARCHAR(100)          NULL,
    cost_center           VARCHAR(50)           NULL,
    is_active             BOOLEAN               NOT NULL DEFAULT TRUE,
    notes                 VARCHAR(1000)         NULL,
    CONSTRAINT pk_departments PRIMARY KEY (id),
    CONSTRAINT uc_departments_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Removed CREATE UNIQUE INDEX idx_department_code ON departments (code);
CREATE INDEX        idx_department_status ON departments (is_active);
CREATE INDEX        idx_department_parent ON departments (parent_department_id);

ALTER TABLE departments
    ADD CONSTRAINT FK_DEPARTMENTS_ON_PARENT_DEPARTMENT
    FOREIGN KEY (parent_department_id) REFERENCES departments (id);

-- ─────────────────────────────────────────────────────────────
-- 2. POSITIONS (department_id nullable — seed data omits it)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS positions
(
    id                     BIGINT AUTO_INCREMENT NOT NULL,
    created_at             DATETIME(6)           NOT NULL,
    updated_at             DATETIME(6)           NOT NULL,
    created_by             VARCHAR(255)          NULL,
    updated_by             VARCHAR(255)          NULL,
    version                BIGINT                NULL,
    deleted_at             DATETIME(6)           NULL,
    is_deleted             BOOLEAN               NOT NULL DEFAULT FALSE,
    deleted_by             VARCHAR(255)          NULL,
    code                   VARCHAR(50)           NOT NULL,
    title                  VARCHAR(100)          NOT NULL,
    description            VARCHAR(2000)         NULL,
    requirements           VARCHAR(2000)         NULL,
    department_id          BIGINT                NULL,
    level                  INT                   NOT NULL,
    min_salary             DECIMAL(15, 2)        NULL,
    max_salary             DECIMAL(15, 2)        NULL,
    reports_to_position_id BIGINT                NULL,
    is_active              BOOLEAN               NOT NULL DEFAULT TRUE,
    notes                  VARCHAR(1000)         NULL,
    CONSTRAINT pk_positions PRIMARY KEY (id),
    CONSTRAINT uc_positions_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Removed CREATE UNIQUE INDEX idx_position_code ON positions (code);
CREATE INDEX        idx_position_level      ON positions (level);
CREATE INDEX        idx_position_status     ON positions (is_active);
CREATE INDEX        idx_position_department ON positions (department_id);

ALTER TABLE positions
    ADD CONSTRAINT FK_POSITIONS_ON_DEPARTMENT
    FOREIGN KEY (department_id) REFERENCES departments (id);

ALTER TABLE positions
    ADD CONSTRAINT FK_POSITIONS_ON_REPORTS_TO_POSITION
    FOREIGN KEY (reports_to_position_id) REFERENCES positions (id);

-- ─────────────────────────────────────────────────────────────
-- 3. EMPLOYEES (FK to departments, positions, users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees
(
    id                         BIGINT AUTO_INCREMENT NOT NULL,
    created_at                 DATETIME(6)           NOT NULL,
    updated_at                 DATETIME(6)           NOT NULL,
    created_by                 VARCHAR(255)          NULL,
    updated_by                 VARCHAR(255)          NULL,
    version                    BIGINT                NULL,
    deleted_at                 DATETIME(6)           NULL,
    is_deleted                 BOOLEAN               NOT NULL DEFAULT FALSE,
    deleted_by                 VARCHAR(255)          NULL,
    first_name                 VARCHAR(100)          NOT NULL,
    last_name                  VARCHAR(100)          NOT NULL,
    email                      VARCHAR(255)          NOT NULL,
    phone                      VARCHAR(20)           NULL,
    date_of_birth              DATE                  NULL,
    hire_date                  DATE                  NOT NULL,
    department_id              BIGINT                NULL,
    position_id                BIGINT                NULL,
    address                    VARCHAR(255)          NULL,
    city                       VARCHAR(100)          NULL,
    state                      VARCHAR(100)          NULL,
    zip_code                   VARCHAR(20)           NULL,
    country                    VARCHAR(100)          NULL,
    status                     VARCHAR(20)           NOT NULL,
    emergency_contact_name     VARCHAR(100)          NULL,
    emergency_contact_phone    VARCHAR(20)           NULL,
    emergency_contact_relation VARCHAR(50)           NULL,
    tax_id                     VARCHAR(50)           NULL,
    social_security_number     VARCHAR(50)           NULL,
    national_id                VARCHAR(50)           NULL,
    bank_account_number        VARCHAR(50)           NULL,
    bank_name                  VARCHAR(100)          NULL,
    bank_branch                VARCHAR(100)          NULL,
    reporting_manager_id       BIGINT                NULL,
    contract_type              VARCHAR(20)           NULL,
    probation_end_date         DATE                  NULL,
    contract_end_date          DATE                  NULL,
    work_location              VARCHAR(100)          NULL,
    nationality                VARCHAR(50)           NULL,
    blood_group                VARCHAR(10)           NULL,
    gender                     VARCHAR(20)           NULL,
    annual_leave_balance       INT                   NULL,
    sick_leave_balance         INT                   NULL,
    avatar_url                 VARCHAR(500)          NULL,
    employee_code              VARCHAR(50)           NULL,
    termination_date           DATE                  NULL,
    notes                      VARCHAR(1000)         NULL,
    user_id                    BIGINT                NULL,
    CONSTRAINT pk_employees PRIMARY KEY (id),
    CONSTRAINT uc_employees_email        UNIQUE (email),
    CONSTRAINT uc_employees_employeecode UNIQUE (employee_code),
    CONSTRAINT uc_employees_user         UNIQUE (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX idx_employee_email       ON employees (email);
CREATE INDEX        idx_employee_hire_date   ON employees (hire_date);
CREATE INDEX        idx_employee_status      ON employees (status);
CREATE INDEX        idx_employee_department  ON employees (department_id);
CREATE INDEX        idx_employee_position    ON employees (position_id);
CREATE INDEX        idx_employee_manager     ON employees (reporting_manager_id);

ALTER TABLE employees
    ADD CONSTRAINT FK_EMPLOYEES_ON_DEPARTMENT
    FOREIGN KEY (department_id) REFERENCES departments (id);

ALTER TABLE employees
    ADD CONSTRAINT FK_EMPLOYEES_ON_POSITION
    FOREIGN KEY (position_id) REFERENCES positions (id);

ALTER TABLE employees
    ADD CONSTRAINT FK_EMPLOYEES_ON_REPORTING_MANAGER
    FOREIGN KEY (reporting_manager_id) REFERENCES employees (id);

ALTER TABLE employees
    ADD CONSTRAINT FK_EMPLOYEES_ON_USER
    FOREIGN KEY (user_id) REFERENCES users (id);

-- ─────────────────────────────────────────────────────────────
-- 4. Resolve departments ↔ employees circular FK
-- ─────────────────────────────────────────────────────────────
ALTER TABLE departments
    ADD CONSTRAINT FK_DEPARTMENTS_ON_HEAD_OF_DEPARTMENT
    FOREIGN KEY (head_of_department_id) REFERENCES employees (id);

ALTER TABLE departments
    ADD CONSTRAINT uc_departments_head_of_department UNIQUE (head_of_department_id);

-- ─────────────────────────────────────────────────────────────
-- 5. SALARIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salaries
(
    id                  BIGINT AUTO_INCREMENT NOT NULL,
    created_at          DATETIME(6)           NOT NULL,
    updated_at          DATETIME(6)           NOT NULL,
    created_by          VARCHAR(255)          NULL,
    updated_by          VARCHAR(255)          NULL,
    version             BIGINT                NULL,
    deleted_at          DATETIME(6)           NULL,
    is_deleted          BOOLEAN               NOT NULL DEFAULT FALSE,
    deleted_by          VARCHAR(255)          NULL,
    employee_id         BIGINT                NOT NULL,
    basic_salary        DECIMAL(15, 2)        NOT NULL,
    allowances          DECIMAL(15, 2)        NULL,
    deductions          DECIMAL(15, 2)        NULL,
    net_salary          DECIMAL(15, 2)        NULL,
    effective_from      DATE                  NOT NULL,
    effective_to        DATE                  NULL,
    change_reason       VARCHAR(500)          NULL,
    approved_by_user_id BIGINT                NULL,
    approved_at         DATE                  NULL,
    currency            VARCHAR(3)            NOT NULL,
    notes               VARCHAR(1000)         NULL,
    CONSTRAINT pk_salaries PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_salary_effective_dates         ON salaries (effective_from, effective_to);
CREATE INDEX idx_salary_employee_effective      ON salaries (employee_id, effective_from, effective_to);
CREATE INDEX idx_salary_employee                ON salaries (employee_id);

ALTER TABLE salaries
    ADD CONSTRAINT FK_SALARIES_ON_EMPLOYEE
    FOREIGN KEY (employee_id) REFERENCES employees (id);

ALTER TABLE salaries
    ADD CONSTRAINT FK_SALARIES_ON_APPROVED_BY_USER
    FOREIGN KEY (approved_by_user_id) REFERENCES users (id);

-- ─────────────────────────────────────────────────────────────
-- 6. LEAVES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaves
(
    id                             BIGINT AUTO_INCREMENT NOT NULL,
    created_at                     DATETIME(6)           NOT NULL,
    updated_at                     DATETIME(6)           NOT NULL,
    created_by                     VARCHAR(255)          NULL,
    updated_by                     VARCHAR(255)          NULL,
    version                        BIGINT                NULL,
    deleted_at                     DATETIME(6)           NULL,
    is_deleted                     BOOLEAN               NOT NULL DEFAULT FALSE,
    deleted_by                     VARCHAR(255)          NULL,
    employee_id                    BIGINT                NOT NULL,
    leave_type                     VARCHAR(50)           NOT NULL,
    start_date                     DATE                  NOT NULL,
    end_date                       DATE                  NOT NULL,
    total_days                     INT                   NOT NULL,
    reason                         VARCHAR(1000)         NOT NULL,
    status                         VARCHAR(20)           NOT NULL,
    approved_by_user_id            BIGINT                NULL,
    approved_at                    DATETIME(6)           NULL,
    approval_notes                 VARCHAR(500)          NULL,
    rejection_reason               VARCHAR(500)          NULL,
    is_half_day                    BOOLEAN               NULL,
    attachment_url                 VARCHAR(500)          NULL,
    is_emergency                   BOOLEAN               NULL,
    delegated_to_employee_id       BIGINT                NULL,
    leave_balance_before           INT                   NULL,
    leave_balance_after            INT                   NULL,
    is_paid                        BOOLEAN               NOT NULL DEFAULT TRUE,
    emergency_contact_during_leave VARCHAR(100)          NULL,
    emergency_phone_during_leave   VARCHAR(20)           NULL,
    CONSTRAINT pk_leaves PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_leave_dates    ON leaves (start_date, end_date);
CREATE INDEX idx_leave_status   ON leaves (status);
CREATE INDEX idx_leave_type     ON leaves (leave_type);
CREATE INDEX idx_leave_employee ON leaves (employee_id);

ALTER TABLE leaves
    ADD CONSTRAINT FK_LEAVES_ON_EMPLOYEE
    FOREIGN KEY (employee_id) REFERENCES employees (id);

ALTER TABLE leaves
    ADD CONSTRAINT FK_LEAVES_ON_APPROVED_BY_USER
    FOREIGN KEY (approved_by_user_id) REFERENCES users (id);

ALTER TABLE leaves
    ADD CONSTRAINT FK_LEAVES_ON_DELEGATED_TO_EMPLOYEE
    FOREIGN KEY (delegated_to_employee_id) REFERENCES employees (id);

-- ─────────────────────────────────────────────────────────────
-- 7. LEAVE BALANCES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leave_balances
(
    id                   BIGINT AUTO_INCREMENT NOT NULL,
    created_at           DATETIME(6)           NOT NULL,
    updated_at           DATETIME(6)           NOT NULL,
    created_by           VARCHAR(255)          NULL,
    updated_by           VARCHAR(255)          NULL,
    version              BIGINT                NULL,
    deleted_at           DATETIME(6)           NULL,
    is_deleted           BOOLEAN               NOT NULL DEFAULT FALSE,
    deleted_by           VARCHAR(255)          NULL,
    employee_id          BIGINT                NOT NULL,
    year                 INT                   NOT NULL,
    leave_type           VARCHAR(50)           NOT NULL,
    total_days           INT                   NOT NULL,
    used_days            INT                   NOT NULL,
    remaining_days       INT                   NOT NULL,
    carried_forward_days INT                   NOT NULL,
    expiry_date          DATE                  NULL,
    allow_carry_forward  BOOLEAN               NOT NULL DEFAULT FALSE,
    max_carry_forward    INT                   NULL,
    notes                VARCHAR(500)          NULL,
    CONSTRAINT pk_leave_balances PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX idx_leave_balance_employee_year_type ON leave_balances (employee_id, year, leave_type);
CREATE INDEX        idx_leave_balance_year               ON leave_balances (year);
CREATE INDEX        idx_leave_balance_employee           ON leave_balances (employee_id);

ALTER TABLE leave_balances
    ADD CONSTRAINT FK_LEAVE_BALANCES_ON_EMPLOYEE
    FOREIGN KEY (employee_id) REFERENCES employees (id);

-- ─────────────────────────────────────────────────────────────
-- 8. PAYROLLS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payrolls
(
    id                   BIGINT AUTO_INCREMENT NOT NULL,
    created_at           DATETIME(6)           NOT NULL,
    updated_at           DATETIME(6)           NOT NULL,
    created_by           VARCHAR(255)          NULL,
    updated_by           VARCHAR(255)          NULL,
    version              BIGINT                NULL,
    deleted_at           DATETIME(6)           NULL,
    is_deleted           BOOLEAN               NOT NULL DEFAULT FALSE,
    deleted_by           VARCHAR(255)          NULL,
    employee_id          BIGINT                NOT NULL,
    payroll_month        INT                   NOT NULL,
    payroll_year         INT                   NOT NULL,
    basic_salary         DECIMAL(15, 2)        NOT NULL,
    overtime_pay         DECIMAL(15, 2)        NULL,
    bonus                DECIMAL(15, 2)        NULL,
    allowances           DECIMAL(15, 2)        NULL,
    tax_deduction        DECIMAL(15, 2)        NULL,
    insurance_deduction  DECIMAL(15, 2)        NULL,
    net_pay              DECIMAL(15, 2)        NULL,
    payment_date         DATE                  NULL,
    status               VARCHAR(20)           NOT NULL,
    payment_reference    VARCHAR(100)          NULL,
    processed_by_user_id BIGINT                NULL,
    notes                VARCHAR(1000)         NULL,
    CONSTRAINT pk_payrolls PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX idx_payroll_employee_period ON payrolls (employee_id, payroll_month, payroll_year);
CREATE INDEX        idx_payroll_period          ON payrolls (payroll_month, payroll_year);
CREATE INDEX        idx_payroll_status          ON payrolls (status);
CREATE INDEX        idx_payroll_employee        ON payrolls (employee_id);

ALTER TABLE payrolls
    ADD CONSTRAINT FK_PAYROLLS_ON_EMPLOYEE
    FOREIGN KEY (employee_id) REFERENCES employees (id);

ALTER TABLE payrolls
    ADD CONSTRAINT FK_PAYROLLS_ON_PROCESSED_BY_USER
    FOREIGN KEY (processed_by_user_id) REFERENCES users (id);

-- ─────────────────────────────────────────────────────────────
-- 9. ATTENDANCES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendances
(
    id                  BIGINT AUTO_INCREMENT NOT NULL,
    created_at          DATETIME(6)           NOT NULL,
    updated_at          DATETIME(6)           NOT NULL,
    created_by          VARCHAR(255)          NULL,
    updated_by          VARCHAR(255)          NULL,
    version             BIGINT                NULL,
    deleted_at          DATETIME(6)           NULL,
    is_deleted          BOOLEAN               NOT NULL DEFAULT FALSE,
    deleted_by          VARCHAR(255)          NULL,
    employee_id         BIGINT                NOT NULL,
    date                DATE                  NOT NULL,
    check_in_time       DATETIME(6)           NOT NULL,
    check_out_time      DATETIME(6)           NULL,
    check_in_location   VARCHAR(255)          NULL,
    check_out_location  VARCHAR(255)          NULL,
    check_in_latitude   DOUBLE                NULL,
    check_in_longitude  DOUBLE                NULL,
    check_out_latitude  DOUBLE                NULL,
    check_out_longitude DOUBLE                NULL,
    status              VARCHAR(20)           NOT NULL,
    notes               VARCHAR(1000)         NULL,
    work_hours          INT                   NULL,
    break_time          INT                   NULL,
    is_late             BOOLEAN               NULL,
    is_overtime         BOOLEAN               NULL,
    overtime_minutes    INT                   NULL,
    ip_address          VARCHAR(50)           NULL,
    device_info         VARCHAR(255)          NULL,
    user_agent          VARCHAR(500)          NULL,
    is_remote           BOOLEAN               NOT NULL DEFAULT FALSE,
    check_in_method     VARCHAR(20)           NULL,
    approved_by_user_id BIGINT                NULL,
    approved_at         DATETIME(6)           NULL,
    approval_notes      VARCHAR(500)          NULL,
    CONSTRAINT pk_attendances PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE UNIQUE INDEX idx_attendance_employee_date ON attendances (employee_id, date);
CREATE INDEX        idx_attendance_status        ON attendances (status);

ALTER TABLE attendances
    ADD CONSTRAINT FK_ATTENDANCES_ON_EMPLOYEE
    FOREIGN KEY (employee_id) REFERENCES employees (id);

ALTER TABLE attendances
    ADD CONSTRAINT FK_ATTENDANCES_ON_APPROVED_BY_USER
    FOREIGN KEY (approved_by_user_id) REFERENCES users (id);
