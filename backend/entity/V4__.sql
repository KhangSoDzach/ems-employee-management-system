CREATE TABLE employees
(
    id                         BIGINT AUTO_INCREMENT NOT NULL,
    created_at                 datetime     NOT NULL,
    updated_at                 datetime     NOT NULL,
    created_by                 VARCHAR(255) NULL,
    updated_by                 VARCHAR(255) NULL,
    version                    BIGINT NULL,
    deleted_at                 datetime NULL,
    is_deleted                 BIT(1)       NOT NULL,
    deleted_by                 VARCHAR(255) NULL,
    first_name                 VARCHAR(100) NOT NULL,
    last_name                  VARCHAR(100) NOT NULL,
    email                      VARCHAR(255) NOT NULL,
    phone                      VARCHAR(20) NULL,
    date_of_birth              date         NOT NULL,
    hire_date                  date         NOT NULL,
    department_id              BIGINT NULL,
    position_id                BIGINT NULL,
    address                    VARCHAR(255) NULL,
    city                       VARCHAR(100) NULL,
    state                      VARCHAR(100) NULL,
    zip_code                   VARCHAR(20) NULL,
    country                    VARCHAR(100) NULL,
    status                     VARCHAR(20)  NOT NULL,
    emergency_contact_name     VARCHAR(100) NULL,
    emergency_contact_phone    VARCHAR(20) NULL,
    emergency_contact_relation VARCHAR(50) NULL,
    tax_id                     VARCHAR(50) NULL,
    social_security_number     VARCHAR(50) NULL,
    national_id                VARCHAR(50) NULL,
    bank_account_number        VARCHAR(50) NULL,
    bank_name                  VARCHAR(100) NULL,
    bank_branch                VARCHAR(100) NULL,
    reporting_manager_id       BIGINT NULL,
    contract_type              VARCHAR(20) NULL,
    probation_end_date         date NULL,
    contract_end_date          date NULL,
    work_location              VARCHAR(100) NULL,
    nationality                VARCHAR(50) NULL,
    blood_group                VARCHAR(10) NULL,
    gender                     VARCHAR(20) NULL,
    annual_leave_balance       INT NULL,
    sick_leave_balance         INT NULL,
    avatar_url                 VARCHAR(500) NULL,
    employee_code              VARCHAR(50) NULL,
    termination_date           date NULL,
    notes                      VARCHAR(1000) NULL,
    user_id                    BIGINT NULL,
    CONSTRAINT pk_employees PRIMARY KEY (id)
);

ALTER TABLE employees
    ADD CONSTRAINT uc_employees_email UNIQUE (email);

ALTER TABLE employees
    ADD CONSTRAINT uc_employees_employeecode UNIQUE (employee_code);

ALTER TABLE employees
    ADD CONSTRAINT uc_employees_user UNIQUE (user_id);

CREATE UNIQUE INDEX idx_employee_email ON employees (email);

CREATE INDEX idx_employee_hire_date ON employees (hire_date);

CREATE INDEX idx_employee_status ON employees (status);

ALTER TABLE employees
    ADD CONSTRAINT FK_EMPLOYEES_ON_DEPARTMENT FOREIGN KEY (department_id) REFERENCES departments (id);

CREATE INDEX idx_employee_department ON employees (department_id);

ALTER TABLE employees
    ADD CONSTRAINT FK_EMPLOYEES_ON_POSITION FOREIGN KEY (position_id) REFERENCES positions (id);

CREATE INDEX idx_employee_position ON employees (position_id);

ALTER TABLE employees
    ADD CONSTRAINT FK_EMPLOYEES_ON_REPORTING_MANAGER FOREIGN KEY (reporting_manager_id) REFERENCES employees (id);

CREATE INDEX idx_employee_manager ON employees (reporting_manager_id);

ALTER TABLE employees
    ADD CONSTRAINT FK_EMPLOYEES_ON_USER FOREIGN KEY (user_id) REFERENCES users (id);
CREATE TABLE departments
(
    id                    BIGINT AUTO_INCREMENT NOT NULL,
    created_at            datetime              NOT NULL,
    updated_at            datetime              NOT NULL,
    created_by            VARCHAR(255)          NULL,
    updated_by            VARCHAR(255)          NULL,
    version               BIGINT                NULL,
    deleted_at            datetime              NULL,
    is_deleted            BIT(1)                NOT NULL,
    deleted_by            VARCHAR(255)          NULL,
    code                  VARCHAR(50)           NOT NULL,
    name                  VARCHAR(100)          NOT NULL,
    `description`         VARCHAR(500)          NULL,
    parent_department_id  BIGINT                NULL,
    head_of_department_id BIGINT                NULL,
    budget_allocation     DECIMAL(15, 2)        NULL,
    location              VARCHAR(100)          NULL,
    cost_center           VARCHAR(50)           NULL,
    is_active             BIT(1)                NOT NULL,
    notes                 VARCHAR(1000)         NULL,
    CONSTRAINT pk_departments PRIMARY KEY (id)
);

ALTER TABLE departments
    ADD CONSTRAINT uc_departments_code UNIQUE (code);

ALTER TABLE departments
    ADD CONSTRAINT uc_departments_head_of_department UNIQUE (head_of_department_id);

CREATE UNIQUE INDEX idx_department_code ON departments (code);

CREATE INDEX idx_department_status ON departments (is_active);

ALTER TABLE departments
    ADD CONSTRAINT FK_DEPARTMENTS_ON_HEAD_OF_DEPARTMENT FOREIGN KEY (head_of_department_id) REFERENCES employees (id);

ALTER TABLE departments
    ADD CONSTRAINT FK_DEPARTMENTS_ON_PARENT_DEPARTMENT FOREIGN KEY (parent_department_id) REFERENCES departments (id);

CREATE INDEX idx_department_parent ON departments (parent_department_id);
CREATE TABLE positions
(
    id                     BIGINT AUTO_INCREMENT NOT NULL,
    created_at             datetime              NOT NULL,
    updated_at             datetime              NOT NULL,
    created_by             VARCHAR(255)          NULL,
    updated_by             VARCHAR(255)          NULL,
    version                BIGINT                NULL,
    deleted_at             datetime              NULL,
    is_deleted             BIT(1)                NOT NULL,
    deleted_by             VARCHAR(255)          NULL,
    code                   VARCHAR(50)           NOT NULL,
    title                  VARCHAR(100)          NOT NULL,
    `description`          VARCHAR(2000)         NULL,
    requirements           VARCHAR(2000)         NULL,
    department_id          BIGINT                NOT NULL,
    level                  INT                   NOT NULL,
    min_salary             DECIMAL(15, 2)        NULL,
    max_salary             DECIMAL(15, 2)        NULL,
    reports_to_position_id BIGINT                NULL,
    is_active              BIT(1)                NOT NULL,
    notes                  VARCHAR(1000)         NULL,
    CONSTRAINT pk_positions PRIMARY KEY (id)
);

ALTER TABLE positions
    ADD CONSTRAINT uc_positions_code UNIQUE (code);

CREATE UNIQUE INDEX idx_position_code ON positions (code);

CREATE INDEX idx_position_level ON positions (level);

CREATE INDEX idx_position_status ON positions (is_active);

ALTER TABLE positions
    ADD CONSTRAINT FK_POSITIONS_ON_DEPARTMENT FOREIGN KEY (department_id) REFERENCES departments (id);

CREATE INDEX idx_position_department ON positions (department_id);

ALTER TABLE positions
    ADD CONSTRAINT FK_POSITIONS_ON_REPORTS_TO_POSITION FOREIGN KEY (reports_to_position_id) REFERENCES positions (id);
CREATE TABLE salaries
(
    id                  BIGINT AUTO_INCREMENT NOT NULL,
    created_at          datetime              NOT NULL,
    updated_at          datetime              NOT NULL,
    created_by          VARCHAR(255)          NULL,
    updated_by          VARCHAR(255)          NULL,
    version             BIGINT                NULL,
    deleted_at          datetime              NULL,
    is_deleted          BIT(1)                NOT NULL,
    deleted_by          VARCHAR(255)          NULL,
    employee_id         BIGINT                NOT NULL,
    basic_salary        DECIMAL(15, 2)        NOT NULL,
    allowances          DECIMAL(15, 2)        NULL,
    deductions          DECIMAL(15, 2)        NULL,
    net_salary          DECIMAL(15, 2)        NULL,
    effective_from      date                  NOT NULL,
    effective_to        date                  NULL,
    change_reason       VARCHAR(500)          NULL,
    approved_by_user_id BIGINT                NULL,
    approved_at         date                  NULL,
    currency            VARCHAR(3)            NOT NULL,
    notes               VARCHAR(1000)         NULL,
    CONSTRAINT pk_salaries PRIMARY KEY (id)
);

CREATE INDEX idx_salary_effective_dates ON salaries (effective_from, effective_to);

CREATE INDEX idx_salary_employee_effective ON salaries (employee_id, effective_from, effective_to);

ALTER TABLE salaries
    ADD CONSTRAINT FK_SALARIES_ON_APPROVED_BY_USER FOREIGN KEY (approved_by_user_id) REFERENCES users (id);

ALTER TABLE salaries
    ADD CONSTRAINT FK_SALARIES_ON_EMPLOYEE FOREIGN KEY (employee_id) REFERENCES employees (id);

CREATE INDEX idx_salary_employee ON salaries (employee_id);
CREATE TABLE leaves
(
    id                             BIGINT AUTO_INCREMENT NOT NULL,
    created_at                     datetime              NOT NULL,
    updated_at                     datetime              NOT NULL,
    created_by                     VARCHAR(255)          NULL,
    updated_by                     VARCHAR(255)          NULL,
    version                        BIGINT                NULL,
    deleted_at                     datetime              NULL,
    is_deleted                     BIT(1)                NOT NULL,
    deleted_by                     VARCHAR(255)          NULL,
    employee_id                    BIGINT                NOT NULL,
    leave_type                     VARCHAR(50)           NOT NULL,
    start_date                     date                  NOT NULL,
    end_date                       date                  NOT NULL,
    total_days                     INT                   NOT NULL,
    reason                         VARCHAR(1000)         NOT NULL,
    status                         VARCHAR(20)           NOT NULL,
    approved_by_user_id            BIGINT                NULL,
    approved_at                    datetime              NULL,
    approval_notes                 VARCHAR(500)          NULL,
    rejection_reason               VARCHAR(500)          NULL,
    is_half_day                    BIT(1)                NULL,
    attachment_url                 VARCHAR(500)          NULL,
    is_emergency                   BIT(1)                NULL,
    delegated_to_employee_id       BIGINT                NULL,
    leave_balance_before           INT                   NULL,
    leave_balance_after            INT                   NULL,
    is_paid                        BIT(1)                NOT NULL,
    emergency_contact_during_leave VARCHAR(100)          NULL,
    emergency_phone_during_leave   VARCHAR(20)           NULL,
    CONSTRAINT pk_leaves PRIMARY KEY (id)
);

CREATE INDEX idx_leave_dates ON leaves (start_date, end_date);

CREATE INDEX idx_leave_status ON leaves (status);

CREATE INDEX idx_leave_type ON leaves (leave_type);

ALTER TABLE leaves
    ADD CONSTRAINT FK_LEAVES_ON_APPROVED_BY_USER FOREIGN KEY (approved_by_user_id) REFERENCES users (id);

ALTER TABLE leaves
    ADD CONSTRAINT FK_LEAVES_ON_DELEGATED_TO_EMPLOYEE FOREIGN KEY (delegated_to_employee_id) REFERENCES employees (id);

ALTER TABLE leaves
    ADD CONSTRAINT FK_LEAVES_ON_EMPLOYEE FOREIGN KEY (employee_id) REFERENCES employees (id);

CREATE INDEX idx_leave_employee ON leaves (employee_id);
CREATE TABLE leave_balances
(
    id                   BIGINT AUTO_INCREMENT NOT NULL,
    created_at           datetime              NOT NULL,
    updated_at           datetime              NOT NULL,
    created_by           VARCHAR(255)          NULL,
    updated_by           VARCHAR(255)          NULL,
    version              BIGINT                NULL,
    deleted_at           datetime              NULL,
    is_deleted           BIT(1)                NOT NULL,
    deleted_by           VARCHAR(255)          NULL,
    employee_id          BIGINT                NOT NULL,
    year                 INT                   NOT NULL,
    leave_type           VARCHAR(50)           NOT NULL,
    total_days           INT                   NOT NULL,
    used_days            INT                   NOT NULL,
    remaining_days       INT                   NOT NULL,
    carried_forward_days INT                   NOT NULL,
    expiry_date          date                  NULL,
    allow_carry_forward  BIT(1)                NOT NULL,
    max_carry_forward    INT                   NULL,
    notes                VARCHAR(500)          NULL,
    CONSTRAINT pk_leave_balances PRIMARY KEY (id)
);

CREATE UNIQUE INDEX idx_leave_balance_employee_year_type ON leave_balances (employee_id, year, leave_type);

CREATE INDEX idx_leave_balance_year ON leave_balances (year);

ALTER TABLE leave_balances
    ADD CONSTRAINT FK_LEAVE_BALANCES_ON_EMPLOYEE FOREIGN KEY (employee_id) REFERENCES employees (id);

CREATE INDEX idx_leave_balance_employee ON leave_balances (employee_id);
CREATE TABLE payrolls
(
    id                   BIGINT AUTO_INCREMENT NOT NULL,
    created_at           datetime              NOT NULL,
    updated_at           datetime              NOT NULL,
    created_by           VARCHAR(255)          NULL,
    updated_by           VARCHAR(255)          NULL,
    version              BIGINT                NULL,
    deleted_at           datetime              NULL,
    is_deleted           BIT(1)                NOT NULL,
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
    payment_date         date                  NULL,
    status               VARCHAR(20)           NOT NULL,
    payment_reference    VARCHAR(100)          NULL,
    processed_by_user_id BIGINT                NULL,
    notes                VARCHAR(1000)         NULL,
    CONSTRAINT pk_payrolls PRIMARY KEY (id)
);

CREATE UNIQUE INDEX idx_payroll_employee_period ON payrolls (employee_id, payroll_month, payroll_year);

CREATE INDEX idx_payroll_period ON payrolls (payroll_month, payroll_year);

CREATE INDEX idx_payroll_status ON payrolls (status);

ALTER TABLE payrolls
    ADD CONSTRAINT FK_PAYROLLS_ON_EMPLOYEE FOREIGN KEY (employee_id) REFERENCES employees (id);

CREATE INDEX idx_payroll_employee ON payrolls (employee_id);

ALTER TABLE payrolls
    ADD CONSTRAINT FK_PAYROLLS_ON_PROCESSED_BY_USER FOREIGN KEY (processed_by_user_id) REFERENCES users (id);
CREATE TABLE attendances
(
    id                  BIGINT AUTO_INCREMENT NOT NULL,
    created_at          datetime              NOT NULL,
    updated_at          datetime              NOT NULL,
    created_by          VARCHAR(255)          NULL,
    updated_by          VARCHAR(255)          NULL,
    version             BIGINT                NULL,
    deleted_at          datetime              NULL,
    is_deleted          BIT(1)                NOT NULL,
    deleted_by          VARCHAR(255)          NULL,
    employee_id         BIGINT                NOT NULL,
    date                date                  NOT NULL,
    check_in_time       datetime              NOT NULL,
    check_out_time      datetime              NULL,
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
    is_late             BIT(1)                NULL,
    is_overtime         BIT(1)                NULL,
    overtime_minutes    INT                   NULL,
    ip_address          VARCHAR(50)           NULL,
    device_info         VARCHAR(255)          NULL,
    user_agent          VARCHAR(500)          NULL,
    is_remote           BIT(1)                NOT NULL,
    check_in_method     VARCHAR(20)           NULL,
    approved_by_user_id BIGINT                NULL,
    approved_at         datetime              NULL,
    approval_notes      VARCHAR(500)          NULL,
    CONSTRAINT pk_attendances PRIMARY KEY (id)
);

CREATE UNIQUE INDEX idx_attendance_employee_date ON attendances (employee_id, date);

CREATE INDEX idx_attendance_status ON attendances (status);

ALTER TABLE attendances
    ADD CONSTRAINT FK_ATTENDANCES_ON_APPROVED_BY_USER FOREIGN KEY (approved_by_user_id) REFERENCES users (id);

ALTER TABLE attendances
    ADD CONSTRAINT FK_ATTENDANCES_ON_EMPLOYEE FOREIGN KEY (employee_id) REFERENCES employees (id);
CREATE TABLE refresh_tokens
(
    id          BIGINT AUTO_INCREMENT NOT NULL,
    created_at  datetime              NOT NULL,
    updated_at  datetime              NOT NULL,
    created_by  VARCHAR(255)          NULL,
    updated_by  VARCHAR(255)          NULL,
    version     BIGINT                NULL,
    deleted_at  datetime              NULL,
    is_deleted  BIT(1)                NOT NULL,
    deleted_by  VARCHAR(255)          NULL,
    token_hash  VARCHAR(255)          NOT NULL,
    user_id     BIGINT                NOT NULL,
    expires_at  datetime              NOT NULL,
    revoked     BIT(1)                NOT NULL,
    device_info VARCHAR(500)          NULL,
    CONSTRAINT pk_refresh_tokens PRIMARY KEY (id)
);

ALTER TABLE refresh_tokens
    ADD CONSTRAINT uc_refresh_tokens_token_hash UNIQUE (token_hash);

CREATE INDEX idx_expires_at ON refresh_tokens (expires_at);

CREATE INDEX idx_revoked ON refresh_tokens (revoked);

CREATE UNIQUE INDEX uk_token_hash ON refresh_tokens (token_hash);

ALTER TABLE refresh_tokens
    ADD CONSTRAINT FK_REFRESH_TOKENS_ON_USER FOREIGN KEY (user_id) REFERENCES users (id);

CREATE INDEX idx_user_id ON refresh_tokens (user_id);
CREATE TABLE departments
(
    id                    BIGINT AUTO_INCREMENT NOT NULL,
    created_at            datetime              NOT NULL,
    updated_at            datetime              NOT NULL,
    created_by            VARCHAR(255)          NULL,
    updated_by            VARCHAR(255)          NULL,
    version               BIGINT                NULL,
    deleted_at            datetime              NULL,
    is_deleted            BIT(1)                NOT NULL,
    deleted_by            VARCHAR(255)          NULL,
    code                  VARCHAR(50)           NOT NULL,
    name                  VARCHAR(100)          NOT NULL,
    `description`         VARCHAR(500)          NULL,
    parent_department_id  BIGINT                NULL,
    head_of_department_id BIGINT                NULL,
    budget_allocation     DECIMAL(15, 2)        NULL,
    location              VARCHAR(100)          NULL,
    cost_center           VARCHAR(50)           NULL,
    is_active             BIT(1)                NOT NULL,
    notes                 VARCHAR(1000)         NULL,
    CONSTRAINT pk_departments PRIMARY KEY (id)
);

ALTER TABLE departments
    ADD CONSTRAINT uc_departments_code UNIQUE (code);

ALTER TABLE departments
    ADD CONSTRAINT uc_departments_head_of_department UNIQUE (head_of_department_id);

CREATE UNIQUE INDEX idx_department_code ON departments (code);

CREATE INDEX idx_department_status ON departments (is_active);

ALTER TABLE departments
    ADD CONSTRAINT FK_DEPARTMENTS_ON_HEAD_OF_DEPARTMENT FOREIGN KEY (head_of_department_id) REFERENCES employees (id);

ALTER TABLE departments
    ADD CONSTRAINT FK_DEPARTMENTS_ON_PARENT_DEPARTMENT FOREIGN KEY (parent_department_id) REFERENCES departments (id);

CREATE INDEX idx_department_parent ON departments (parent_department_id);
CREATE TABLE employees
(
    id                         BIGINT AUTO_INCREMENT NOT NULL,
    created_at                 datetime              NOT NULL,
    updated_at                 datetime              NOT NULL,
    created_by                 VARCHAR(255)          NULL,
    updated_by                 VARCHAR(255)          NULL,
    version                    BIGINT                NULL,
    deleted_at                 datetime              NULL,
    is_deleted                 BIT(1)                NOT NULL,
    deleted_by                 VARCHAR(255)          NULL,
    first_name                 VARCHAR(100)          NOT NULL,
    last_name                  VARCHAR(100)          NOT NULL,
    email                      VARCHAR(255)          NOT NULL,
    phone                      VARCHAR(20)           NULL,
    date_of_birth              date                  NOT NULL,
    hire_date                  date                  NOT NULL,
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
    probation_end_date         date                  NULL,
    contract_end_date          date                  NULL,
    work_location              VARCHAR(100)          NULL,
    nationality                VARCHAR(50)           NULL,
    blood_group                VARCHAR(10)           NULL,
    gender                     VARCHAR(20)           NULL,
    annual_leave_balance       INT                   NULL,
    sick_leave_balance         INT                   NULL,
    avatar_url                 VARCHAR(500)          NULL,
    employee_code              VARCHAR(50)           NULL,
    termination_date           date                  NULL,
    notes                      VARCHAR(1000)         NULL,
    user_id                    BIGINT                NULL,
    CONSTRAINT pk_employees PRIMARY KEY (id)
);

ALTER TABLE employees
    ADD CONSTRAINT uc_employees_email UNIQUE (email);

ALTER TABLE employees
    ADD CONSTRAINT uc_employees_employeecode UNIQUE (employee_code);

ALTER TABLE employees
    ADD CONSTRAINT uc_employees_user UNIQUE (user_id);

CREATE UNIQUE INDEX idx_employee_email ON employees (email);

CREATE INDEX idx_employee_hire_date ON employees (hire_date);

CREATE INDEX idx_employee_status ON employees (status);

ALTER TABLE employees
    ADD CONSTRAINT FK_EMPLOYEES_ON_DEPARTMENT FOREIGN KEY (department_id) REFERENCES departments (id);

CREATE INDEX idx_employee_department ON employees (department_id);

ALTER TABLE employees
    ADD CONSTRAINT FK_EMPLOYEES_ON_POSITION FOREIGN KEY (position_id) REFERENCES positions (id);

CREATE INDEX idx_employee_position ON employees (position_id);

ALTER TABLE employees
    ADD CONSTRAINT FK_EMPLOYEES_ON_REPORTING_MANAGER FOREIGN KEY (reporting_manager_id) REFERENCES employees (id);

CREATE INDEX idx_employee_manager ON employees (reporting_manager_id);

ALTER TABLE employees
    ADD CONSTRAINT FK_EMPLOYEES_ON_USER FOREIGN KEY (user_id) REFERENCES users (id);
CREATE TABLE leaves
(
    id                             BIGINT AUTO_INCREMENT NOT NULL,
    created_at                     datetime              NOT NULL,
    updated_at                     datetime              NOT NULL,
    created_by                     VARCHAR(255)          NULL,
    updated_by                     VARCHAR(255)          NULL,
    version                        BIGINT                NULL,
    deleted_at                     datetime              NULL,
    is_deleted                     BIT(1)                NOT NULL,
    deleted_by                     VARCHAR(255)          NULL,
    employee_id                    BIGINT                NOT NULL,
    leave_type                     VARCHAR(50)           NOT NULL,
    start_date                     date                  NOT NULL,
    end_date                       date                  NOT NULL,
    total_days                     INT                   NOT NULL,
    reason                         VARCHAR(1000)         NOT NULL,
    status                         VARCHAR(20)           NOT NULL,
    approved_by_user_id            BIGINT                NULL,
    approved_at                    datetime              NULL,
    approval_notes                 VARCHAR(500)          NULL,
    rejection_reason               VARCHAR(500)          NULL,
    is_half_day                    BIT(1)                NULL,
    attachment_url                 VARCHAR(500)          NULL,
    is_emergency                   BIT(1)                NULL,
    delegated_to_employee_id       BIGINT                NULL,
    leave_balance_before           INT                   NULL,
    leave_balance_after            INT                   NULL,
    is_paid                        BIT(1)                NOT NULL,
    emergency_contact_during_leave VARCHAR(100)          NULL,
    emergency_phone_during_leave   VARCHAR(20)           NULL,
    CONSTRAINT pk_leaves PRIMARY KEY (id)
);

CREATE INDEX idx_leave_dates ON leaves (start_date, end_date);

CREATE INDEX idx_leave_status ON leaves (status);

CREATE INDEX idx_leave_type ON leaves (leave_type);

ALTER TABLE leaves
    ADD CONSTRAINT FK_LEAVES_ON_APPROVED_BY_USER FOREIGN KEY (approved_by_user_id) REFERENCES users (id);

ALTER TABLE leaves
    ADD CONSTRAINT FK_LEAVES_ON_DELEGATED_TO_EMPLOYEE FOREIGN KEY (delegated_to_employee_id) REFERENCES employees (id);

ALTER TABLE leaves
    ADD CONSTRAINT FK_LEAVES_ON_EMPLOYEE FOREIGN KEY (employee_id) REFERENCES employees (id);

CREATE INDEX idx_leave_employee ON leaves (employee_id);
CREATE TABLE leaves
(
    id                             BIGINT AUTO_INCREMENT NOT NULL,
    created_at                     datetime              NOT NULL,
    updated_at                     datetime              NOT NULL,
    created_by                     VARCHAR(255)          NULL,
    updated_by                     VARCHAR(255)          NULL,
    version                        BIGINT                NULL,
    deleted_at                     datetime              NULL,
    is_deleted                     BIT(1)                NOT NULL,
    deleted_by                     VARCHAR(255)          NULL,
    employee_id                    BIGINT                NOT NULL,
    leave_type                     VARCHAR(50)           NOT NULL,
    start_date                     date                  NOT NULL,
    end_date                       date                  NOT NULL,
    total_days                     INT                   NOT NULL,
    reason                         VARCHAR(1000)         NOT NULL,
    status                         VARCHAR(20)           NOT NULL,
    approved_by_user_id            BIGINT                NULL,
    approved_at                    datetime              NULL,
    approval_notes                 VARCHAR(500)          NULL,
    rejection_reason               VARCHAR(500)          NULL,
    is_half_day                    BIT(1)                NULL,
    attachment_url                 VARCHAR(500)          NULL,
    is_emergency                   BIT(1)                NULL,
    delegated_to_employee_id       BIGINT                NULL,
    leave_balance_before           INT                   NULL,
    leave_balance_after            INT                   NULL,
    is_paid                        BIT(1)                NOT NULL,
    emergency_contact_during_leave VARCHAR(100)          NULL,
    emergency_phone_during_leave   VARCHAR(20)           NULL,
    CONSTRAINT pk_leaves PRIMARY KEY (id)
);

CREATE INDEX idx_leave_dates ON leaves (start_date, end_date);

CREATE INDEX idx_leave_status ON leaves (status);

CREATE INDEX idx_leave_type ON leaves (leave_type);

ALTER TABLE leaves
    ADD CONSTRAINT FK_LEAVES_ON_APPROVED_BY_USER FOREIGN KEY (approved_by_user_id) REFERENCES users (id);

ALTER TABLE leaves
    ADD CONSTRAINT FK_LEAVES_ON_DELEGATED_TO_EMPLOYEE FOREIGN KEY (delegated_to_employee_id) REFERENCES employees (id);

ALTER TABLE leaves
    ADD CONSTRAINT FK_LEAVES_ON_EMPLOYEE FOREIGN KEY (employee_id) REFERENCES employees (id);

CREATE INDEX idx_leave_employee ON leaves (employee_id);