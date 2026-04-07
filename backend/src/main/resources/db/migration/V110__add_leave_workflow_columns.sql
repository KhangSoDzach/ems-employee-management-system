-- Add multi-level approval workflow columns to leaves table
ALTER TABLE leaves ADD COLUMN current_approval_level INT NOT NULL DEFAULT 1;
ALTER TABLE leaves ADD COLUMN max_approval_level INT NOT NULL DEFAULT 1;
ALTER TABLE leaves ADD COLUMN workflow_template_id BIGINT NULL;
ALTER TABLE leaves ADD COLUMN long_leave_hr_required BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index and foreign key if possible
-- We don't strictly need the FK for it to work, but it's good practice
ALTER TABLE leaves ADD CONSTRAINT fk_leaves_on_workflow_template FOREIGN KEY (workflow_template_id) REFERENCES workflow_templates (id);

CREATE INDEX idx_leave_current_level ON leaves (current_approval_level, status);
