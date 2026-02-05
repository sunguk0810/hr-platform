-- ============================================================================
-- V5__fix_overtime_request_columns.sql
-- overtime_request 테이블 컬럼 수정
-- ============================================================================

-- 컬럼 이름 변경
ALTER TABLE hr_attendance.overtime_request RENAME COLUMN planned_start_time TO start_time;
ALTER TABLE hr_attendance.overtime_request RENAME COLUMN planned_end_time TO end_time;

-- 누락된 컬럼 추가
ALTER TABLE hr_attendance.overtime_request ADD COLUMN IF NOT EXISTS planned_hours DECIMAL(4,2);
ALTER TABLE hr_attendance.overtime_request ADD COLUMN IF NOT EXISTS actual_hours DECIMAL(4,2);
ALTER TABLE hr_attendance.overtime_request ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
