
CREATE TABLE assets (
                        id              BIGINT          NOT NULL AUTO_INCREMENT,
                        asset_code      VARCHAR(50)     NOT NULL,
                        asset_name      VARCHAR(255)    NOT NULL,
                        asset_type      VARCHAR(50)     NOT NULL,
                        description     TEXT,
                        purchase_date   DATE,
                        asset_value     DECIMAL(15, 2),
                        warranty_until  DATE,
                        supplier_name   VARCHAR(255),
                        contract_until  DATE,
                        condition       VARCHAR(20)     NOT NULL DEFAULT 'NEW',
                        status          VARCHAR(20)     NOT NULL DEFAULT 'AVAILABLE',
                        assigned_to_id  BIGINT,
                        assigned_by_id  BIGINT,
                        assigned_date   DATETIME,
                        return_date     DATETIME,
                        image_url       VARCHAR(500),
                        notes           TEXT,
                        is_deleted      TINYINT(1)      NOT NULL DEFAULT 0,
                        created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                        created_by      BIGINT,

                        PRIMARY KEY (id),
                        UNIQUE KEY uk_asset_code (asset_code),

                        CONSTRAINT fk_asset_assigned_to
                            FOREIGN KEY (assigned_to_id) REFERENCES employees(id) ON DELETE SET NULL,
                        CONSTRAINT fk_asset_assigned_by
                            FOREIGN KEY (assigned_by_id) REFERENCES users(id)     ON DELETE SET NULL,
                        CONSTRAINT fk_asset_created_by
                            FOREIGN KEY (created_by)     REFERENCES users(id)     ON DELETE SET NULL,

                        CONSTRAINT chk_asset_condition CHECK (
                            condition IN ('NEW','GOOD','DAMAGED','LOST','DISPOSED')
                            ),
                        CONSTRAINT chk_asset_status CHECK (
                            status IN ('AVAILABLE','ASSIGNED','RETIRED')
                            )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE asset_code_sequence (
                                     year_part   SMALLINT    NOT NULL,
                                     next_seq    INT         NOT NULL DEFAULT 1,
                                     PRIMARY KEY (year_part)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE asset_history (
                               id              BIGINT          NOT NULL AUTO_INCREMENT,
                               asset_id        BIGINT          NOT NULL,
                               action_type     VARCHAR(50)     NOT NULL,
                               actor_id        BIGINT,
                               actor_username  VARCHAR(100),
                               old_value       JSON,
                               new_value       JSON,
                               notes           TEXT,
                               created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

                               PRIMARY KEY (id),

                               CONSTRAINT fk_asset_history_asset
                                   FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,

                               CONSTRAINT chk_history_action CHECK (
                                   action_type IN (
                                                   'CREATE_ASSET','UPDATE_ASSET',
                                                   'ASSIGN_ASSET','RETURN_ASSET',
                                                   'CHANGE_CONDITION','RETIRE_ASSET','SOFT_DELETE'
                                       )
                                   )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_asset_status        ON assets        (status,   is_deleted);
CREATE INDEX idx_asset_assigned_to   ON assets        (assigned_to_id);
CREATE INDEX idx_asset_type          ON assets        (asset_type);
CREATE INDEX idx_asset_history_asset ON asset_history (asset_id, created_at DESC);