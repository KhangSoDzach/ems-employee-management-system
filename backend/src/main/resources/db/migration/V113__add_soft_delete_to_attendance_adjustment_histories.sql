-- =====================================
-- V113: Add Soft Delete Columns to Attendance Adjustment Histories
-- Description: Add deleted_at, is_deleted, and deleted_by to match BaseEntity
-- Author: Antigravity
-- Date: 2026-03-17
-- =====================================

ALTER TABLE attendance_adjustment_histories
    ADD COLUMN deleted_at DATETIME(6) NULL AFTER version,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER deleted_at,
    ADD COLUMN deleted_by VARCHAR(255) NULL AFTER is_deleted;

CREATE INDEX idx_adj_histories_is_deleted ON attendance_adjustment_histories (is_deleted);
