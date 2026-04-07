-- V134__add_reserved_days_to_leave_balances.sql
ALTER TABLE leave_balances ADD COLUMN reserved_days INT NOT NULL DEFAULT 0;
