ALTER TABLE positions
    ADD COLUMN office_location_id BIGINT NULL;

ALTER TABLE positions
    ADD CONSTRAINT fk_positions_office_location
    FOREIGN KEY (office_location_id) REFERENCES office_locations (id);

CREATE INDEX idx_positions_office_location ON positions (office_location_id);