ALTER TABLE salary_components
    ADD COLUMN rate_percent DECIMAL(7, 4) NULL AFTER amount,
    ADD COLUMN nature VARCHAR(20) NOT NULL DEFAULT 'INCOME' AFTER rate_percent;

UPDATE salary_components
SET nature = 'INCOME'
WHERE nature IS NULL;

CREATE INDEX idx_salary_components_nature ON salary_components (nature);
