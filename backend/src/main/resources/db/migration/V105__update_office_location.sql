-- Update office coordinates to the correct location.
-- V99 seeded these with INSERT IGNORE so this migration is required
-- to fix any database that was already initialised with the old values.
UPDATE system_configs
SET config_value = '10.80374375',
    updated_at   = NOW()
WHERE config_key = 'OFFICE_LATITUDE';

UPDATE system_configs
SET config_value = '106.6896745',
    updated_at   = NOW()
WHERE config_key = 'OFFICE_LONGITUDE';
