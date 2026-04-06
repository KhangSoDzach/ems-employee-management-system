

DELIMITER $$

DROP PROCEDURE IF EXISTS add_salary_column$$
CREATE PROCEDURE add_salary_column()
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'employees' AND column_name = 'salary') THEN
        ALTER TABLE employees ADD COLUMN salary DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Gross salary in VND';
    END IF;
END$$

DELIMITER ;
CALL add_salary_column();
DROP PROCEDURE IF EXISTS add_salary_column;
