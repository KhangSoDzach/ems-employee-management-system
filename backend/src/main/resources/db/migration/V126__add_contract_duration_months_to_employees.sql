DELIMITER $$

DROP PROCEDURE IF EXISTS add_contract_duration$$
CREATE PROCEDURE add_contract_duration()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'employees' AND column_name = 'contract_duration_months') THEN
        ALTER TABLE employees ADD COLUMN contract_duration_months INT NULL;
    END IF;
END$$

DELIMITER ;
CALL add_contract_duration();
DROP PROCEDURE IF EXISTS add_contract_duration;

UPDATE employees
SET contract_duration_months = CASE
    WHEN contract_start_date IS NOT NULL AND contract_end_date IS NOT NULL
    THEN TIMESTAMPDIFF(MONTH, contract_start_date, DATE_ADD(contract_end_date, INTERVAL 1 DAY))
    ELSE NULL
END
WHERE contract_duration_months IS NULL;
