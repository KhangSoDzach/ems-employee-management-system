-- ============================================================
-- V5__asset_related_tables.sql
-- Mục tiêu: Tạo toàn bộ bảng liên quan module Asset cho EMS
-- Tương thích với entity hiện tại trong backend (Asset, AssetHistory,
-- AssetCodeSequence, AssetIncidentReport)
-- ============================================================

-- 1) ASSETS
CREATE TABLE IF NOT EXISTS assets (
    id               BIGINT          NOT NULL AUTO_INCREMENT,
    asset_code       VARCHAR(20)     NOT NULL,
    asset_name       VARCHAR(255)    NOT NULL,
    asset_type       VARCHAR(50)     NULL,
    description      TEXT            NULL,
    image_url        VARCHAR(500)    NULL,
    purchase_date    DATE            NULL,
    asset_value      DECIMAL(18,2)   NULL,
    notes            TEXT            NULL,

    status           VARCHAR(20)     NOT NULL DEFAULT 'AVAILABLE',
    asset_condition  VARCHAR(20)     NOT NULL DEFAULT 'NEW',

    location         VARCHAR(255)    NULL,
    assigned_to_id   BIGINT          NULL,
    assigned_by_id   BIGINT          NULL,
    assigned_date    DATETIME        NULL,
    return_date      DATETIME        NULL,

    warranty_until   DATE            NULL,
    supplier_name    VARCHAR(255)    NULL,
    contract_until   DATE            NULL,
    contract_number  VARCHAR(100)    NULL,

    created_by_id    BIGINT          NULL,
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted          TINYINT(1)      NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    UNIQUE KEY uk_assets_asset_code (asset_code),

    CONSTRAINT fk_assets_assigned_to
        FOREIGN KEY (assigned_to_id) REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT fk_assets_assigned_by
        FOREIGN KEY (assigned_by_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_assets_created_by
        FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_assets_status (status),
    INDEX idx_assets_type (asset_type),
    INDEX idx_assets_deleted (deleted),
    INDEX idx_assets_assigned_to (assigned_to_id),
    INDEX idx_assets_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2) ASSET CODE SEQUENCE
CREATE TABLE IF NOT EXISTS asset_code_sequence (
    year_part SMALLINT NOT NULL,
    next_seq  INT      NOT NULL DEFAULT 1,
    PRIMARY KEY (year_part)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) ASSET HISTORY
CREATE TABLE IF NOT EXISTS asset_history (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    asset_id        BIGINT       NOT NULL,
    action_type     VARCHAR(50)  NOT NULL,
    actor_id        BIGINT       NULL,
    actor_username  VARCHAR(100) NULL,
    detail          VARCHAR(500) NULL,
    old_value       TEXT         NULL,
    new_value       TEXT         NULL,
    notes           TEXT         NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_asset_history_asset
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,

    INDEX idx_asset_history_asset_id (asset_id),
    INDEX idx_asset_history_action_type (action_type),
    INDEX idx_asset_history_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4) ASSET INCIDENT REPORTS
CREATE TABLE IF NOT EXISTS asset_incident_reports (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    report_code     VARCHAR(30)  NOT NULL,
    asset_id        BIGINT       NOT NULL,
    incident_type   VARCHAR(40)  NOT NULL,
    description     TEXT         NOT NULL,
    attachment_url  VARCHAR(500) NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    reported_by     BIGINT       NOT NULL,
    reported_at     DATETIME     NOT NULL,
    processed_by    BIGINT       NULL,
    processed_at    DATETIME     NULL,
    process_note    VARCHAR(500) NULL,
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_air_report_code (report_code),

    CONSTRAINT fk_air_asset
        FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT,
    CONSTRAINT fk_air_reported_by
        FOREIGN KEY (reported_by) REFERENCES employees(id) ON DELETE RESTRICT,
    CONSTRAINT fk_air_processed_by
        FOREIGN KEY (processed_by) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_air_asset_id (asset_id),
    INDEX idx_air_reported_by (reported_by),
    INDEX idx_air_status (status),
    INDEX idx_air_reported_at (reported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Optional seed dữ liệu mẫu (an toàn vì dùng INSERT IGNORE)
-- ============================================================
INSERT IGNORE INTO assets (
    asset_code, asset_name, asset_type, description, status, asset_condition,
    location, purchase_date, asset_value, created_at, updated_at, deleted
) VALUES
    ('ASSET-2026-0001', 'Laptop Dell Latitude 5440', 'LAPTOP', 'Thiết bị cho nhân sự mới', 'AVAILABLE', 'NEW', 'Kho IT - Tầng 3', '2026-01-10', 22500000.00, NOW(), NOW(), 0),
    ('ASSET-2026-0002', 'Màn hình Dell P2422H', 'MONITOR', 'Màn hình 24 inch', 'AVAILABLE', 'GOOD', 'Kho IT - Tầng 3', '2026-01-12', 4100000.00, NOW(), NOW(), 0),
    ('ASSET-2026-0003', 'iPhone 14', 'PHONE', 'Điện thoại test app', 'RETIRED', 'DAMAGED', 'Phòng QA', '2025-08-01', 18990000.00, NOW(), NOW(), 0);

INSERT IGNORE INTO asset_code_sequence (year_part, next_seq)
VALUES (2026, 4);

-- ============================================================
-- Giá trị enum tham khảo từ code backend:
-- assets.status           : AVAILABLE | ASSIGNED | RETIRED
-- assets.asset_condition  : NEW | GOOD | DAMAGED | LOST | DISPOSED
-- asset_history.action_type:
--   CREATE_ASSET | UPDATE_ASSET | ASSIGN_ASSET | RETURN_ASSET |
--   CHANGE_CONDITION | CHANGE_STATUS | RETIRE_ASSET | SOFT_DELETE
-- asset_incident_reports.incident_type: DAMAGED | LOST
-- asset_incident_reports.status       : PENDING | APPROVED | REJECTED | RESOLVED
-- ============================================================
