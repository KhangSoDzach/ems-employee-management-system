CREATE TABLE IF NOT EXISTS performance_review_cycles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    manager_id BIGINT NOT NULL,
    review_period VARCHAR(20) NOT NULL,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    created_by VARCHAR(100) NULL,
    updated_by VARCHAR(100) NULL,
    is_deleted BIT(1) NOT NULL DEFAULT b'0'
);

CREATE INDEX idx_prc_manager_period
    ON performance_review_cycles(manager_id, review_period, status, is_deleted);

CREATE INDEX idx_prc_window
    ON performance_review_cycles(manager_id, start_at, end_at, status, is_deleted);
