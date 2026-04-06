CREATE TABLE performance_reviews (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,

    -- Actors
    reviewer_id         BIGINT          NOT NULL COMMENT 'Employee id của người đánh giá',
    reviewee_id         BIGINT          NOT NULL COMMENT 'Employee id của người được đánh giá',
    reviewer_username   VARCHAR(100)    NOT NULL,
    reviewee_username   VARCHAR(100)    NOT NULL,

    -- Review context
    review_type         VARCHAR(20)     NOT NULL COMMENT 'SELF | PEER | MANAGER',
    review_period       VARCHAR(20)     NOT NULL COMMENT 'e.g. 2026-Q1',
    status              VARCHAR(20)     NOT NULL DEFAULT 'SUBMITTED',

    -- Criterion scores (0–100)
    expertise_score     INT             NOT NULL DEFAULT 0,
    communication_score INT             NOT NULL DEFAULT 0,
    attitude_score      INT             NOT NULL DEFAULT 0,
    total_score         INT             NOT NULL DEFAULT 0 COMMENT 'AVG(expertise, communication, attitude)',

    -- Qualitative
    comment             TEXT,

    -- Soft-delete / audit (BaseEntity)
    is_deleted          TINYINT(1)      NOT NULL DEFAULT 0,
    deleted_at          DATETIME,
    deleted_by          VARCHAR(100),
    created_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),
    version             BIGINT          NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    INDEX idx_pr_reviewee   (reviewee_id, is_deleted),
    INDEX idx_pr_reviewer   (reviewer_id, is_deleted),
    INDEX idx_pr_period     (review_period, is_deleted),
    -- Prevent duplicate: same reviewer → same reviewee in same period
    UNIQUE KEY uq_review_period (reviewer_id, reviewee_id, review_period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='360° performance reviews';
