-- Chuẩn hoá các bản ghi cũ: actor đang lưu ID (1, 3,...) chuyển về username (admin, employee1,...)
UPDATE audit_log a
JOIN users u ON a.actor = CAST(u.id AS CHAR) COLLATE utf8mb4_unicode_ci
SET a.actor = u.username
WHERE a.entity_type = 'AUTHENTICATION' AND u.id IS NOT NULL;
