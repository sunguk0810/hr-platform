-- Fix created_by/updated_by column types to match AuditableEntity (String, length=100)
ALTER TABLE hr_attendance.attendance_config
    ALTER COLUMN created_by TYPE VARCHAR(100) USING created_by::VARCHAR(100),
    ALTER COLUMN updated_by TYPE VARCHAR(100) USING updated_by::VARCHAR(100);
