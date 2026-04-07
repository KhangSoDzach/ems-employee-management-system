-- Add reserved_days column to leave_balances table
-- This supports the "tạm giữ" (reservation) mechanism for pending leave requests.

ALTER TABLE `leave_balances`
ADD COLUMN `reserved_days` INT NOT NULL DEFAULT 0 AFTER `used_days`;

-- Initializing reserved_days is implicitly 0 via DEFAULT 0, which is correct for existing records.
