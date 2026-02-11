-- V2: Add audit and attachment fields to employee_change_request table
-- Adds approval tracking and file attachment support

ALTER TABLE hr_core.employee_change_request
    ADD COLUMN approved_by UUID,
    ADD COLUMN approved_at TIMESTAMP,
    ADD COLUMN rejection_reason VARCHAR(500),
    ADD COLUMN attachment_file_ids TEXT;

-- Add index for querying by approval status and date
CREATE INDEX idx_employee_change_request_approved_at
    ON hr_core.employee_change_request(approved_at);

-- Add comments
COMMENT ON COLUMN hr_core.employee_change_request.approved_by IS 'User ID who approved or rejected the request';
COMMENT ON COLUMN hr_core.employee_change_request.approved_at IS 'Timestamp when the request was approved or rejected';
COMMENT ON COLUMN hr_core.employee_change_request.rejection_reason IS 'Reason for rejection if status is REJECTED';
COMMENT ON COLUMN hr_core.employee_change_request.attachment_file_ids IS 'JSON array of file IDs from file-service';
