CREATE TABLE IF NOT EXISTS employee_attachments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    created_by VARCHAR(255) NULL,
    updated_by VARCHAR(255) NULL,
    version BIGINT NULL,
    deleted_at DATETIME(6) NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by VARCHAR(255) NULL,
    employee_id BIGINT NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_type VARCHAR(30) NOT NULL,
    file_size BIGINT NOT NULL,
    CONSTRAINT pk_employee_attachments PRIMARY KEY (id),
    CONSTRAINT fk_employee_attachments_employee FOREIGN KEY (employee_id) REFERENCES employees (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_employee_attachments_employee ON employee_attachments (employee_id);
CREATE INDEX idx_employee_attachments_deleted ON employee_attachments (is_deleted);
