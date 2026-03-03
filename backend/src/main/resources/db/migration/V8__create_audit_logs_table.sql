
CREATE TABLE IF NOT EXISTS audit_logs (
    id                    BIGINT          NOT NULL AUTO_INCREMENT,
    user_id               BIGINT          NULL         COMMENT 'userId (NULL nếu anonymous)',
    identifier_attempted  VARCHAR(255)    NULL         COMMENT 'Username/email đã nhập — không lưu password',
    action_type           VARCHAR(50)     NOT NULL     COMMENT 'LOGIN_SUCCESS | LOGIN_FAILED | LOGOUT | ...',
    result                VARCHAR(20)     NOT NULL     COMMENT 'SUCCESS | FAILED | DENIED',
    login_method          VARCHAR(20)     NULL         COMMENT 'JWT | SSO | API_KEY',
    ip_address            VARCHAR(45)     NULL         COMMENT 'IPv4 hoặc IPv6',
    user_agent            VARCHAR(500)    NULL         COMMENT 'Browser/OS/device info',
    client_type           VARCHAR(50)     NULL         COMMENT 'WEB | MOBILE | API',
    correlation_id        VARCHAR(100)    NULL         COMMENT 'Request trace ID',
    message               VARCHAR(500)    NULL         COMMENT 'Reason for failure/action detail',
    created_at            DATETIME(3)     NOT NULL     COMMENT 'Timestamp (ms precision)',

    PRIMARY KEY (id),

    INDEX idx_audit_created_at    (created_at),
    INDEX idx_audit_user_id       (user_id),
    INDEX idx_audit_action_type   (action_type),
    INDEX idx_audit_result        (result),
    INDEX idx_audit_ip_address    (ip_address),
    INDEX idx_audit_user_created  (user_id, created_at),
    INDEX idx_audit_action_result (action_type, result, created_at)
)
ENGINE = InnoDB
DEFAULT CHARSET = utf8mb4
COLLATE = utf8mb4_unicode_ci
COMMENT = 'US-05: Append-only audit log — mọi hành vi authentication';

DROP TRIGGER IF EXISTS trg_audit_logs_no_update;
CREATE TRIGGER trg_audit_logs_no_update
    BEFORE UPDATE ON audit_logs
    FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'AUDIT LOG IS IMMUTABLE: UPDATE is not allowed on audit_logs';
END;


DROP TRIGGER IF EXISTS trg_audit_logs_no_delete;
CREATE TRIGGER trg_audit_logs_no_delete
    BEFORE DELETE ON audit_logs
    FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'AUDIT LOG IS IMMUTABLE: DELETE is not allowed on audit_logs';
END;
