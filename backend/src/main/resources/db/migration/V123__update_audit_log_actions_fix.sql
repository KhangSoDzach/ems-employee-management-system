-- Cập nhật lại với đúng tên bảng là audit_log, thay vì audit_logs

UPDATE audit_log SET action_type = 'AUTH_LOGIN_SUCCESS' WHERE action_type = 'LOGIN_SUCCESS';
UPDATE audit_log SET action_type = 'AUTH_LOGIN_FAILED' WHERE action_type = 'LOGIN_FAILED';
UPDATE audit_log SET action_type = 'AUTH_LOGOUT' WHERE action_type = 'LOGOUT';
UPDATE audit_log SET action_type = 'AUTH_TOKEN_EXPIRED' WHERE action_type = 'TOKEN_EXPIRED';
UPDATE audit_log SET action_type = 'AUTH_TOKEN_INVALID' WHERE action_type = 'TOKEN_INVALID';
UPDATE audit_log SET action_type = 'SECURITY_ACCESS_DENIED' WHERE action_type = 'ACCESS_DENIED';
UPDATE audit_log SET action_type = 'SYSTEM_PASSWORD_CHANGED' WHERE action_type = 'PASSWORD_CHANGED';
