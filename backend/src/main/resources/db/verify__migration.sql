-- =====================================
-- Flyway Migration Verification Script
-- Description: Verify successful migration execution
-- Author: EMS Backend Team
-- Date: 2026-02-03
-- =====================================

-- Step 1: Check Flyway Schema History
SELECT 
    installed_rank,
    version,
    description,
    type,
    script,
    installed_on,
    execution_time,
    success
FROM flyway_schema_history
ORDER BY installed_rank;

-- Expected Result:
-- 2 rows with versions 1 and 2, both with success = 1

-- Step 2: Verify All Tables Exist
SELECT TABLE_NAME, TABLE_ROWS, AUTO_INCREMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'ems_db'
AND TABLE_NAME IN ('users', 'roles', 'permissions', 'user_roles', 'role_permissions', 'flyway_schema_history')
ORDER BY TABLE_NAME;

-- Expected: 6 tables

-- Step 3: Check Permissions Seeded
SELECT 
    category,
    COUNT(*) as permission_count,
    GROUP_CONCAT(name ORDER BY name SEPARATOR ', ') as permissions
FROM permissions
WHERE is_deleted = FALSE
GROUP BY category
ORDER BY category;

-- Expected: 6 categories with 20 total permissions

-- Step 4: Check Roles Seeded
SELECT 
    r.name as role_name,
    r.description,
    COUNT(rp.permission_id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.is_deleted = FALSE
GROUP BY r.id, r.name, r.description
ORDER BY r.name;

-- Expected: 4 roles (ROLE_ADMIN, ROLE_HR, ROLE_MANAGER, ROLE_EMPLOYEE)

-- Step 5: Verify Admin User Created
SELECT 
    u.username,
    u.email,
    u.enabled,
    u.account_non_locked,
    GROUP_CONCAT(r.name SEPARATOR ', ') as roles
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.username = 'admin'
GROUP BY u.id, u.username, u.email, u.enabled, u.account_non_locked;

-- Expected: 1 row with username='admin', role='ROLE_ADMIN'

-- Step 6: Detailed Role-Permission Mapping
SELECT 
    r.name as role_name,
    p.category,
    GROUP_CONCAT(p.name ORDER BY p.name SEPARATOR ', ') as permissions
FROM roles r
INNER JOIN role_permissions rp ON r.id = rp.role_id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE r.is_deleted = FALSE AND p.is_deleted = FALSE
GROUP BY r.name, p.category
ORDER BY r.name, p.category;

-- Step 7: Check Indexes
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ', ') as columns,
    NON_UNIQUE,
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'ems_db'
AND TABLE_NAME IN ('users', 'roles', 'permissions')
GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE, INDEX_TYPE
ORDER BY TABLE_NAME, INDEX_NAME;

-- Expected: Indexes on username, email, role_name, permission_name

-- Step 8: Check Foreign Key Constraints
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    DELETE_RULE,
    UPDATE_RULE
FROM information_schema.REFERENTIAL_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = 'ems_db'
AND TABLE_NAME IN ('user_roles', 'role_permissions')
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- Expected: 4 foreign keys with DELETE_RULE = CASCADE

-- Step 9: Validate Column Types Match JPA Entities
SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    CHARACTER_MAXIMUM_LENGTH,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_TYPE
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'ems_db'
AND TABLE_NAME = 'users'
ORDER BY ORDINAL_POSITION;

-- Verify:
-- - username VARCHAR(50) NOT NULL
-- - email VARCHAR(100) NOT NULL
-- - password VARCHAR(255) NOT NULL
-- - enabled TINYINT(1) NOT NULL DEFAULT 1
-- - created_at, updated_at DATETIME(6) NOT NULL

-- Step 10: Test Data Integrity
-- Check that all role-permission mappings are valid (no orphans)
SELECT 
    'Orphaned role_permissions' as issue,
    COUNT(*) as count
FROM role_permissions rp
LEFT JOIN roles r ON rp.role_id = r.id
LEFT JOIN permissions p ON rp.permission_id = p.id
WHERE r.id IS NULL OR p.id IS NULL

UNION ALL

SELECT 
    'Orphaned user_roles' as issue,
    COUNT(*) as count
FROM user_roles ur
LEFT JOIN users u ON ur.user_id = u.id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.id IS NULL OR r.id IS NULL;

-- Expected: Both counts should be 0

-- =====================================
-- SUMMARY QUERY
-- =====================================
SELECT 
    'Migration Status' as metric,
    CASE 
        WHEN (SELECT COUNT(*) FROM flyway_schema_history WHERE success = 1) = 2 
        THEN '✅ SUCCESS' 
        ELSE '❌ FAILED' 
    END as value

UNION ALL

SELECT 
    'Tables Created',
    CONCAT((SELECT COUNT(*) FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'ems_db' 
            AND TABLE_NAME IN ('users', 'roles', 'permissions', 'user_roles', 'role_permissions')), '/5')

UNION ALL

SELECT 
    'Permissions Seeded',
    CONCAT((SELECT COUNT(*) FROM permissions WHERE is_deleted = FALSE), '/20')

UNION ALL

SELECT 
    'Roles Seeded',
    CONCAT((SELECT COUNT(*) FROM roles WHERE is_deleted = FALSE), '/4')

UNION ALL

SELECT 
    'Admin User Created',
    CASE 
        WHEN (SELECT COUNT(*) FROM users WHERE username = 'admin') = 1 
        THEN '✅ YES' 
        ELSE '❌ NO' 
    END

UNION ALL

SELECT 
    'ROLE_ADMIN Permissions',
    CONCAT((SELECT COUNT(*) FROM role_permissions rp 
            INNER JOIN roles r ON rp.role_id = r.id 
            WHERE r.name = 'ROLE_ADMIN'), '/20');
