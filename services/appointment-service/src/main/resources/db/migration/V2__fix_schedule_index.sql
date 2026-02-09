-- =============================================================================
-- V2: Fix appointment_schedules index to include tenant_id
-- Problem: idx_appointment_schedules_status has (status, scheduled_date) without tenant_id
-- Solution: Replace with (tenant_id, status, scheduled_date) composite index
-- =============================================================================

-- 기존 인덱스 삭제 후 tenant_id 포함 복합 인덱스로 재생성
DROP INDEX IF EXISTS hr_appointment.idx_appointment_schedules_status;

CREATE INDEX idx_appointment_schedules_tenant_status_date
    ON hr_appointment.appointment_schedules (tenant_id, status, scheduled_date);
