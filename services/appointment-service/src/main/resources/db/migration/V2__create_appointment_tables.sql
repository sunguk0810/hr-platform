-- ============================================================================
-- V2__create_appointment_tables.sql
-- 발령 서비스 테이블 생성
-- ============================================================================

-- 발령안 테이블
CREATE TABLE IF NOT EXISTS hr_appointment.appointment_draft (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    draft_number VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    effective_date DATE NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approval_id UUID,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    executed_by UUID,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancelled_by UUID,
    cancel_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE(tenant_id, draft_number)
);

CREATE INDEX IF NOT EXISTS idx_appointment_draft_tenant_id ON hr_appointment.appointment_draft(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_draft_status ON hr_appointment.appointment_draft(status);
CREATE INDEX IF NOT EXISTS idx_appointment_draft_effective_date ON hr_appointment.appointment_draft(effective_date);

-- 발령 상세 테이블
CREATE TABLE IF NOT EXISTS hr_appointment.appointment_detail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    draft_id UUID NOT NULL REFERENCES hr_appointment.appointment_draft(id),
    employee_id UUID NOT NULL,
    employee_name VARCHAR(100),
    employee_number VARCHAR(50),
    appointment_type VARCHAR(30) NOT NULL,
    from_department_id UUID,
    from_department_name VARCHAR(100),
    to_department_id UUID,
    to_department_name VARCHAR(100),
    from_position_code VARCHAR(50),
    from_position_name VARCHAR(100),
    to_position_code VARCHAR(50),
    to_position_name VARCHAR(100),
    from_grade_code VARCHAR(50),
    from_grade_name VARCHAR(100),
    to_grade_code VARCHAR(50),
    to_grade_name VARCHAR(100),
    from_job_code VARCHAR(50),
    from_job_name VARCHAR(100),
    to_job_code VARCHAR(50),
    to_job_name VARCHAR(100),
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    executed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_appointment_detail_tenant_id ON hr_appointment.appointment_detail(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_detail_draft_id ON hr_appointment.appointment_detail(draft_id);
CREATE INDEX IF NOT EXISTS idx_appointment_detail_employee_id ON hr_appointment.appointment_detail(employee_id);

-- 예약 발령 테이블
CREATE TABLE IF NOT EXISTS hr_appointment.appointment_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    draft_id UUID NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME DEFAULT '00:00:00',
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    executed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_appointment_schedule_tenant_id ON hr_appointment.appointment_schedule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_schedule_draft_id ON hr_appointment.appointment_schedule(draft_id);
CREATE INDEX IF NOT EXISTS idx_appointment_schedule_scheduled_date ON hr_appointment.appointment_schedule(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_appointment_schedule_status ON hr_appointment.appointment_schedule(status);

-- 발령 이력 테이블
CREATE TABLE IF NOT EXISTS hr_appointment.appointment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    detail_id UUID,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(100),
    employee_number VARCHAR(50),
    appointment_type VARCHAR(30) NOT NULL,
    effective_date DATE NOT NULL,
    from_values JSONB,
    to_values JSONB,
    reason TEXT,
    draft_number VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_appointment_history_tenant_id ON hr_appointment.appointment_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_employee_id ON hr_appointment.appointment_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_appointment_history_effective_date ON hr_appointment.appointment_history(effective_date);
CREATE INDEX IF NOT EXISTS idx_appointment_history_appointment_type ON hr_appointment.appointment_history(appointment_type);
