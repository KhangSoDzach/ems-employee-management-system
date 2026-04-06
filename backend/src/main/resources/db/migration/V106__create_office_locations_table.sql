-- Create office_locations table
CREATE TABLE office_locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    radius_meters DOUBLE NOT NULL,
    address VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(255)
);

-- Migrate existing global office config to the new table as the default location
-- We take values from system_configs if they exist, otherwise use the defaults that were in the code/YAML
INSERT INTO office_locations (name, latitude, longitude, radius_meters, address, is_active, updated_by)
SELECT 
    'Văn phòng chính',
    COALESCE((SELECT CAST(config_value AS DOUBLE) FROM system_configs WHERE config_key = 'OFFICE_LATITUDE'), 10.80374375),
    COALESCE((SELECT CAST(config_value AS DOUBLE) FROM system_configs WHERE config_key = 'OFFICE_LONGITUDE'), 106.6896745),
    COALESCE((SELECT CAST(config_value AS DOUBLE) FROM system_configs WHERE config_key = 'OFFICE_RADIUS_METERS'), 200.0),
    'Hồ Chí Minh, Việt Nam',
    TRUE,
    'SYSTEM';
