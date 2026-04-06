CREATE TABLE IF NOT EXISTS asset_incident_reports (
                                                      id              BIGINT          NOT NULL AUTO_INCREMENT,
                                                      report_code     VARCHAR(30)     NOT NULL UNIQUE,
    asset_id        BIGINT          NOT NULL,
    incident_type   VARCHAR(40)     NOT NULL,
    description     TEXT            NOT NULL,
    attachment_url  VARCHAR(500),
    status          VARCHAR(20)     NOT NULL DEFAULT 'PENDING',
    reported_by     BIGINT          NOT NULL,
    reported_at     DATETIME        NOT NULL,
    processed_by    BIGINT,
    processed_at    DATETIME,
    process_note    VARCHAR(500),
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    CONSTRAINT fk_air_asset
    FOREIGN KEY (asset_id)    REFERENCES assets(id),
    CONSTRAINT fk_air_reported_by
    FOREIGN KEY (reported_by) REFERENCES employees(id),
    CONSTRAINT fk_air_processed_by
    FOREIGN KEY (processed_by) REFERENCES users(id)
    );

DELIMITER $$

DROP PROCEDURE IF EXISTS add_asset_incident_indexes$$
CREATE PROCEDURE add_asset_incident_indexes()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'asset_incident_reports' AND index_name = 'idx_air_asset_id') THEN
        CREATE INDEX idx_air_asset_id ON asset_incident_reports (asset_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'asset_incident_reports' AND index_name = 'idx_air_reported_by') THEN
        CREATE INDEX idx_air_reported_by ON asset_incident_reports (reported_by);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'asset_incident_reports' AND index_name = 'idx_air_status') THEN
        CREATE INDEX idx_air_status ON asset_incident_reports (status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = 'asset_incident_reports' AND index_name = 'idx_air_reported_at') THEN
        CREATE INDEX idx_air_reported_at ON asset_incident_reports (reported_at);
    END IF;
END$$

DELIMITER ;
CALL add_asset_incident_indexes();
DROP PROCEDURE IF EXISTS add_asset_incident_indexes;