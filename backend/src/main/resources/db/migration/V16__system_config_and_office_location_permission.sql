-- ============================================================
-- Migration V16: system_configs table + SYSTEM_CONFIG_MANAGE permission
-- ============================================================

-- 1. Generic key-value store for runtime system configuration
CREATE TABLE IF NOT EXISTS system_configs (
    id           BIGINT       NOT NULL AUTO_INCREMENT,
    config_key   VARCHAR(100) NOT NULL,
    config_value TEXT,
    description  VARCHAR(500),
    updated_by   VARCHAR(100),
    created_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at   DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uq_system_configs_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Seed permission for managing system configuration (Admin only)
INSERT IGNORE INTO permissions (name, description, category, created_at, updated_at, is_deleted, version)
VALUES ('SYSTEM_CONFIG_MANAGE', 'Quản lý cấu hình hệ thống (tọa độ văn phòng, bán kính checkin...)', 'SYSTEM', NOW(), NOW(), FALSE, 0);

-- 3. Assign SYSTEM_CONFIG_MANAGE to ROLE_ADMIN only
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'ROLE_ADMIN'
  AND p.name = 'SYSTEM_CONFIG_MANAGE';
