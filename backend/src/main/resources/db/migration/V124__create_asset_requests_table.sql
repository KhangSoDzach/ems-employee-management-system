-- V124: Create asset_requests table
-- Employees can submit asset request tickets; HR reviews them

CREATE TABLE IF NOT EXISTS asset_requests (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    request_code    VARCHAR(30)     NOT NULL UNIQUE,
    requested_by    BIGINT          NOT NULL,
    asset_type      VARCHAR(100)    NOT NULL,
    reason          TEXT            NOT NULL,
    priority        VARCHAR(20)     NOT NULL DEFAULT 'NORMAL',
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    reviewed_by     BIGINT,
    reviewed_at     DATETIME,
    review_note     VARCHAR(500),
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_ar_requested_by
        FOREIGN KEY (requested_by) REFERENCES employees(id),
    CONSTRAINT fk_ar_reviewed_by
        FOREIGN KEY (reviewed_by)  REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_ar_requested_by ON asset_requests (requested_by);
CREATE INDEX IF NOT EXISTS idx_ar_status        ON asset_requests (status);
CREATE INDEX IF NOT EXISTS idx_ar_created_at    ON asset_requests (created_at);
