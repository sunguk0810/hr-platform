-- =============================================================================
-- V8: Performance optimization indexes for attendance service
-- Addresses: leave_request composite index gaps, attendance_record optimization
-- =============================================================================

SET search_path TO hr_attendance, public;

-- leave_request: 부서별 승인 대기 조회 최적화
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_request_tenant_status_dept
    ON hr_attendance.leave_request (tenant_id, status, department_id);

-- leave_request: 직원별 기간 조회 최적화 (중복/캘린더 조회)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_request_tenant_emp_dates
    ON hr_attendance.leave_request (tenant_id, employee_id, start_date, end_date);

-- leave_request: 부서별 기간 + 상태 부분 인덱스 (PENDING/APPROVED만)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leave_request_tenant_dept_dates_status
    ON hr_attendance.leave_request (tenant_id, department_id, start_date, end_date)
    WHERE status IN ('PENDING', 'APPROVED');

-- attendance_record: 직원별 날짜 조회 최적화 (workHours 집계용)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_attendance_record_tenant_emp_date
    ON hr_attendance.attendance_record (tenant_id, employee_id, work_date);
