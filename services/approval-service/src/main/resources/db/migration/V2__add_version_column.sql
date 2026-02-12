-- Add version column for optimistic locking (@Version in ApprovalDocument entity)
ALTER TABLE hr_approval.approval_document
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
