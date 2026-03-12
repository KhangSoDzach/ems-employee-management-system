-- ============================================================
-- Migration: Tạo bảng quản lý tài sản
-- File: V3__create_asset_tables.sql
-- ============================================================

-- ── Bảng assets ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assets (
                                      id               BIGINT          NOT NULL AUTO_INCREMENT,
                                      asset_code       VARCHAR(20)     NOT NULL UNIQUE COMMENT 'VD: ASSET-2026-0001',
    asset_name       VARCHAR(255)    NOT NULL,
    asset_type       VARCHAR(50)     NULL     COMMENT 'Loại tài sản: Thiết bị IT, Nội thất...',
    description      TEXT            NULL     COMMENT 'Subtitle bên dưới tên trong bảng list',
    image_url        VARCHAR(500)    NULL,

    -- Giá trị & ngày
    purchase_date    DATE            NULL     COMMENT 'Ngày mua',
    asset_value      DECIMAL(18, 2)  NULL     COMMENT 'Giá trị VNĐ',

    -- Trạng thái & Tình trạng
    -- status: AVAILABLE|ASSIGNED|RETIRED → badge màu trong bảng (Image 2)
    status           VARCHAR(20)     NOT NULL DEFAULT 'AVAILABLE',
    -- asset_condition: NEW|GOOD|DAMAGED|LOST|DISPOSED → radio buttons (Image 1)
    asset_condition  VARCHAR(20)     NOT NULL DEFAULT 'NEW',

    -- Vị trí / Người sử dụng (Image 2 cột "NGƯỜI SỬ DỤNG / VỊ TRÍ")
    location         VARCHAR(255)    NULL     COMMENT 'VD: Kho HN, Kho trung tâm (Khu A-12)',

    -- Thông tin cấp phát
    assigned_to_id   BIGINT          NULL,
    assigned_by_id   BIGINT          NULL,
    assigned_date    DATETIME        NULL,
    return_date      DATETIME        NULL,

    -- Thông tin bổ sung (Image 3 — panel Thông tin phụ trợ)
    warranty_until   DATE            NULL     COMMENT 'Bảo hành đến — VD: 15/06/2025',
    supplier_name    VARCHAR(255)    NULL     COMMENT 'Nhà cung cấp — VD: FPT Retail',
    contract_until   DATE            NULL     COMMENT 'Ngày hết hợp đồng (dùng trong form)',
    contract_number  VARCHAR(100)    NULL     COMMENT 'Mã hợp đồng hiển thị — VD: HD-2023-084',

    notes            TEXT            NULL,
    created_by_id    BIGINT          NULL,
    created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted          TINYINT(1)      NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    CONSTRAINT fk_asset_assigned_to  FOREIGN KEY (assigned_to_id) REFERENCES employees(id) ON DELETE SET NULL,
    CONSTRAINT fk_asset_assigned_by  FOREIGN KEY (assigned_by_id) REFERENCES users(id)     ON DELETE SET NULL,
    CONSTRAINT fk_asset_created_by   FOREIGN KEY (created_by_id)  REFERENCES users(id)     ON DELETE SET NULL,

    INDEX idx_assets_status      (status),
    INDEX idx_assets_asset_type  (asset_type),
    INDEX idx_assets_asset_code  (asset_code),
    INDEX idx_assets_deleted     (deleted)
    ) ENGINE = InnoDB
    DEFAULT CHARSET = utf8mb4
    COLLATE = utf8mb4_unicode_ci
    COMMENT = 'Bảng tài sản công ty';


CREATE TABLE IF NOT EXISTS asset_history (
                                             id BIGINT PRIMARY KEY AUTO_INCREMENT,
                                             asset_id BIGINT NOT NULL,
                                             action_type VARCHAR(50) NOT NULL,
    actor_user_id BIGINT,
    actor_username VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES users(id) ON DELETE SET NULL,

    INDEX idx_asset_id (asset_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;