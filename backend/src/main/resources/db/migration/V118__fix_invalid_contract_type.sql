-- ============================================================
-- Migration V118: Fix invalid contract_type value 'PROBATION'
-- The ContractType enum does not have PROBATION.
-- Valid values: FULL_TIME, PART_TIME, CONTRACT, INTERN, CONSULTANT, TEMPORARY
-- ============================================================
UPDATE employees
SET contract_type = 'CONTRACT'
WHERE contract_type = 'PROBATION';
