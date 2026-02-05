-- ============================================================================
-- V3__fix_audit_columns_type.sql
-- Fix created_by/updated_by columns from UUID to VARCHAR(100) for consistency
-- ============================================================================

-- job_posting table
ALTER TABLE hr_recruitment.job_posting
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- applicant table
ALTER TABLE hr_recruitment.applicant
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- application table
ALTER TABLE hr_recruitment.application
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- interview table
ALTER TABLE hr_recruitment.interview
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- interview_score table
ALTER TABLE hr_recruitment.interview_score
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);

-- offer table
ALTER TABLE hr_recruitment.offer
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);
