-- Add version column for optimistic locking (@Version in ApprovalLine entity)
ALTER TABLE hr_approval.approval_line
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
