-- Add password_change related fields
ALTER TABLE users ADD COLUMN last_password_change DATETIME(6) NULL;
ALTER TABLE users ADD COLUMN force_password_change BOOLEAN NOT NULL DEFAULT FALSE;
