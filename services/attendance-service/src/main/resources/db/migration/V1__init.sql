-- Attendance Service: Consolidated Migration (V1)
-- Schema: hr_attendance (created by init.sql)
-- Consolidates: V1 (init), V6 (modification log), V7 (leave policy),
--               V8 (performance indexes), V9 (BRIN and composite indexes)
-- ============================================================

SET search_path TO hr_attendance, public;

-- ============================================================
-- Function: get_current_tenant_safe()
-- Returns the current tenant from session variable, or NULL
-- ============================================================
CREATE OR REPLACE FUNCTION hr_attendance.get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================
-- Table 1: attendance_record
-- ============================================================
CREATE TABLE hr_attendance.attendance_record (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID        NOT NULL,
    employee_id     UUID        NOT NULL,
    work_date       DATE        NOT NULL,
    check_in_time   TIME,
    check_out_time  TIME,
    status          VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    late_minutes    INTEGER     NOT NULL DEFAULT 0,
    early_leave_minutes INTEGER NOT NULL DEFAULT 0,
    overtime_minutes INTEGER    NOT NULL DEFAULT 0,
    work_hours      INTEGER     NOT NULL DEFAULT 0,
    check_in_location  VARCHAR(500),
    check_out_location VARCHAR(500),
    note            TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),

    CONSTRAINT uq_attendance_record_tenant_employee_date
        UNIQUE (tenant_id, employee_id, work_date)
);

-- Indexes for attendance_record
CREATE INDEX idx_attendance_record_tenant_id ON hr_attendance.attendance_record (tenant_id);
CREATE INDEX idx_attendance_record_employee_id ON hr_attendance.attendance_record (employee_id);
CREATE INDEX idx_attendance_record_work_date ON hr_attendance.attendance_record (work_date);
CREATE INDEX idx_attendance_record_status ON hr_attendance.attendance_record (status);
CREATE INDEX idx_attendance_record_tenant_work_date ON hr_attendance.attendance_record (tenant_id, work_date);
CREATE INDEX idx_attendance_record_tenant_employee ON hr_attendance.attendance_record (tenant_id, employee_id);

-- V8: 직원별 날짜 조회 최적화 (workHours 집계용)
CREATE INDEX idx_attendance_record_tenant_emp_date
    ON hr_attendance.attendance_record (tenant_id, employee_id, work_date);

-- V9: BRIN index for date range scans (monthly/weekly reports)
-- work_date is naturally ordered (append-only inserts by date)
CREATE INDEX idx_attendance_record_work_date_brin
    ON hr_attendance.attendance_record USING BRIN (work_date);

-- ============================================================
-- Table 2: leave_request
-- (V7 columns leave_unit, hours_count included directly)
-- ============================================================
CREATE TABLE hr_attendance.leave_request (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID        NOT NULL,
    employee_id             UUID        NOT NULL,
    employee_name           VARCHAR(100) NOT NULL,
    department_id           UUID,
    department_name         VARCHAR(200),
    leave_type              VARCHAR(30) NOT NULL,
    start_date              DATE        NOT NULL,
    end_date                DATE        NOT NULL,
    days_count              DECIMAL(3,1) NOT NULL,
    leave_unit              VARCHAR(10) DEFAULT 'DAY',
    hours_count             DECIMAL(5,1),
    reason                  TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approval_document_id    UUID,
    emergency_contact       VARCHAR(50),
    handover_to_id          UUID,
    handover_to_name        VARCHAR(100),
    handover_notes          TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              VARCHAR(100),
    updated_by              VARCHAR(100)
);

-- Indexes for leave_request
CREATE INDEX idx_leave_request_tenant_id ON hr_attendance.leave_request (tenant_id);
CREATE INDEX idx_leave_request_employee_id ON hr_attendance.leave_request (employee_id);
CREATE INDEX idx_leave_request_status ON hr_attendance.leave_request (status);
CREATE INDEX idx_leave_request_start_date ON hr_attendance.leave_request (start_date);
CREATE INDEX idx_leave_request_end_date ON hr_attendance.leave_request (end_date);
CREATE INDEX idx_leave_request_tenant_employee ON hr_attendance.leave_request (tenant_id, employee_id);
CREATE INDEX idx_leave_request_tenant_status ON hr_attendance.leave_request (tenant_id, status);

-- V8: 부서별 승인 대기 조회 최적화
CREATE INDEX idx_leave_request_tenant_status_dept
    ON hr_attendance.leave_request (tenant_id, status, department_id);

-- V8: 직원별 기간 조회 최적화 (중복/캘린더 조회)
CREATE INDEX idx_leave_request_tenant_emp_dates
    ON hr_attendance.leave_request (tenant_id, employee_id, start_date, end_date);

-- V8: 부서별 기간 + 상태 부분 인덱스 (PENDING/APPROVED만)
CREATE INDEX idx_leave_request_tenant_dept_dates_status
    ON hr_attendance.leave_request (tenant_id, department_id, start_date, end_date)
    WHERE status IN ('PENDING', 'APPROVED');

-- V9: BRIN index for date range scans
CREATE INDEX idx_leave_request_created_at_brin
    ON hr_attendance.leave_request USING BRIN (created_at);

-- ============================================================
-- Table 3: leave_balance
-- (V7 columns used_hours, pending_hours included directly)
-- ============================================================
CREATE TABLE hr_attendance.leave_balance (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID        NOT NULL,
    employee_id         UUID        NOT NULL,
    year                INTEGER     NOT NULL,
    leave_type          VARCHAR(30) NOT NULL,
    total_days          DECIMAL(5,1) NOT NULL DEFAULT 0,
    used_days           DECIMAL(5,1) NOT NULL DEFAULT 0,
    pending_days        DECIMAL(5,1) NOT NULL DEFAULT 0,
    carried_over_days   DECIMAL(5,1) NOT NULL DEFAULT 0,
    used_hours          DECIMAL(7,1) DEFAULT 0,
    pending_hours       DECIMAL(7,1) DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by          VARCHAR(100),
    updated_by          VARCHAR(100),

    CONSTRAINT uq_leave_balance_tenant_employee_year_type
        UNIQUE (tenant_id, employee_id, year, leave_type)
);

-- Indexes for leave_balance
CREATE INDEX idx_leave_balance_tenant_id ON hr_attendance.leave_balance (tenant_id);
CREATE INDEX idx_leave_balance_employee_id ON hr_attendance.leave_balance (employee_id);
CREATE INDEX idx_leave_balance_year ON hr_attendance.leave_balance (year);
CREATE INDEX idx_leave_balance_tenant_employee ON hr_attendance.leave_balance (tenant_id, employee_id);
CREATE INDEX idx_leave_balance_tenant_year ON hr_attendance.leave_balance (tenant_id, year);

-- ============================================================
-- Table 4: holiday
-- ============================================================
CREATE TABLE hr_attendance.holiday (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID        NOT NULL,
    holiday_date    DATE        NOT NULL,
    name            VARCHAR(100) NOT NULL,
    name_en         VARCHAR(100),
    holiday_type    VARCHAR(20) NOT NULL,
    is_paid         BOOLEAN     NOT NULL DEFAULT TRUE,
    description     VARCHAR(500),
    year            INTEGER     NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),

    CONSTRAINT uq_holiday_tenant_date
        UNIQUE (tenant_id, holiday_date)
);

-- Indexes for holiday
CREATE INDEX idx_holiday_tenant_id ON hr_attendance.holiday (tenant_id);
CREATE INDEX idx_holiday_holiday_date ON hr_attendance.holiday (holiday_date);
CREATE INDEX idx_holiday_year ON hr_attendance.holiday (year);
CREATE INDEX idx_holiday_tenant_year ON hr_attendance.holiday (tenant_id, year);

-- ============================================================
-- Table 5: overtime_request
-- ============================================================
CREATE TABLE hr_attendance.overtime_request (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID        NOT NULL,
    employee_id             UUID        NOT NULL,
    employee_name           VARCHAR(100) NOT NULL,
    department_id           UUID,
    department_name         VARCHAR(200),
    overtime_date           DATE        NOT NULL,
    start_time              TIME        NOT NULL,
    end_time                TIME        NOT NULL,
    actual_start_time       TIME,
    actual_end_time         TIME,
    planned_hours           DECIMAL(4,2),
    actual_hours            DECIMAL(4,2),
    reason                  TEXT,
    status                  VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approval_document_id    UUID,
    rejection_reason        VARCHAR(500),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by              VARCHAR(100),
    updated_by              VARCHAR(100)
);

-- Indexes for overtime_request
CREATE INDEX idx_overtime_request_tenant_id ON hr_attendance.overtime_request (tenant_id);
CREATE INDEX idx_overtime_request_employee_id ON hr_attendance.overtime_request (employee_id);
CREATE INDEX idx_overtime_request_overtime_date ON hr_attendance.overtime_request (overtime_date);
CREATE INDEX idx_overtime_request_status ON hr_attendance.overtime_request (status);
CREATE INDEX idx_overtime_request_tenant_employee ON hr_attendance.overtime_request (tenant_id, employee_id);
CREATE INDEX idx_overtime_request_tenant_status ON hr_attendance.overtime_request (tenant_id, status);

-- ============================================================
-- Table 6: attendance_modification_log (from V6)
-- 관리자 근태 수정 감사 로그 테이블
-- ============================================================
CREATE TABLE hr_attendance.attendance_modification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    attendance_record_id UUID NOT NULL REFERENCES hr_attendance.attendance_record(id),
    modified_by UUID NOT NULL,
    modified_by_name VARCHAR(100),
    field_name VARCHAR(50) NOT NULL,
    old_value VARCHAR(200),
    new_value VARCHAR(200),
    remarks VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for attendance_modification_log
CREATE INDEX idx_modification_log_tenant_id ON hr_attendance.attendance_modification_log(tenant_id);
CREATE INDEX idx_modification_log_record_id ON hr_attendance.attendance_modification_log(attendance_record_id);
CREATE INDEX idx_modification_log_modified_by ON hr_attendance.attendance_modification_log(modified_by);
CREATE INDEX idx_modification_log_created_at ON hr_attendance.attendance_modification_log(created_at);

-- ============================================================
-- Table 7: leave_type_config (from V7)
-- Leave Type Configuration
-- ============================================================
CREATE TABLE hr_attendance.leave_type_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    is_paid BOOLEAN DEFAULT true,
    max_days_per_year DECIMAL(5,1),
    requires_approval BOOLEAN DEFAULT true,
    min_notice_days INTEGER DEFAULT 0,
    allow_half_day BOOLEAN DEFAULT true,
    allow_hourly BOOLEAN DEFAULT false,
    deduct_from_annual BOOLEAN DEFAULT false,
    min_service_months INTEGER,
    gender_restriction VARCHAR(10),
    max_consecutive_days INTEGER,
    blackout_periods JSONB,
    approval_template_code VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uq_leave_type_config UNIQUE (tenant_id, code)
);

CREATE INDEX idx_leave_type_config_tenant ON hr_attendance.leave_type_config (tenant_id);

-- ============================================================
-- Table 8: leave_accrual_rule (from V7)
-- Leave Accrual Rule
-- ============================================================
CREATE TABLE hr_attendance.leave_accrual_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    leave_type_code VARCHAR(30) NOT NULL,
    accrual_type VARCHAR(20) NOT NULL,
    base_entitlement DECIMAL(5,1) NOT NULL DEFAULT 15,
    service_year_bonuses JSONB,
    max_carry_over_days DECIMAL(5,1) DEFAULT 0,
    carry_over_expiry_months INTEGER DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uq_leave_accrual_rule UNIQUE (tenant_id, leave_type_code)
);

CREATE INDEX idx_leave_accrual_rule_tenant ON hr_attendance.leave_accrual_rule (tenant_id);

-- ============================================================
-- Row Level Security (RLS)
-- Enable and force on ALL tables
-- ============================================================

-- attendance_record
ALTER TABLE hr_attendance.attendance_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.attendance_record FORCE ROW LEVEL SECURITY;

CREATE POLICY attendance_record_tenant_isolation ON hr_attendance.attendance_record
    FOR ALL
    USING (tenant_id IS NULL OR tenant_id = hr_attendance.get_current_tenant_safe())
    WITH CHECK (tenant_id IS NULL OR tenant_id = hr_attendance.get_current_tenant_safe());

-- leave_request
ALTER TABLE hr_attendance.leave_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.leave_request FORCE ROW LEVEL SECURITY;

CREATE POLICY leave_request_tenant_isolation ON hr_attendance.leave_request
    FOR ALL
    USING (tenant_id IS NULL OR tenant_id = hr_attendance.get_current_tenant_safe())
    WITH CHECK (tenant_id IS NULL OR tenant_id = hr_attendance.get_current_tenant_safe());

-- leave_balance
ALTER TABLE hr_attendance.leave_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.leave_balance FORCE ROW LEVEL SECURITY;

CREATE POLICY leave_balance_tenant_isolation ON hr_attendance.leave_balance
    FOR ALL
    USING (tenant_id IS NULL OR tenant_id = hr_attendance.get_current_tenant_safe())
    WITH CHECK (tenant_id IS NULL OR tenant_id = hr_attendance.get_current_tenant_safe());

-- holiday
ALTER TABLE hr_attendance.holiday ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.holiday FORCE ROW LEVEL SECURITY;

CREATE POLICY holiday_tenant_isolation ON hr_attendance.holiday
    FOR ALL
    USING (tenant_id IS NULL OR tenant_id = hr_attendance.get_current_tenant_safe())
    WITH CHECK (tenant_id IS NULL OR tenant_id = hr_attendance.get_current_tenant_safe());

-- overtime_request
ALTER TABLE hr_attendance.overtime_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_attendance.overtime_request FORCE ROW LEVEL SECURITY;

CREATE POLICY overtime_request_tenant_isolation ON hr_attendance.overtime_request
    FOR ALL
    USING (tenant_id IS NULL OR tenant_id = hr_attendance.get_current_tenant_safe())
    WITH CHECK (tenant_id IS NULL OR tenant_id = hr_attendance.get_current_tenant_safe());

-- attendance_modification_log (from V6)
ALTER TABLE hr_attendance.attendance_modification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY attendance_modification_log_tenant_isolation
    ON hr_attendance.attendance_modification_log
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- leave_type_config (from V7)
ALTER TABLE hr_attendance.leave_type_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_leave_type_config ON hr_attendance.leave_type_config
    USING (tenant_id = get_current_tenant_safe());

-- leave_accrual_rule (from V7)
ALTER TABLE hr_attendance.leave_accrual_rule ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_leave_accrual_rule ON hr_attendance.leave_accrual_rule
    USING (tenant_id = get_current_tenant_safe());

-- ============================================================
-- Triggers (from V7)
-- ============================================================

-- Triggers for updated_at on leave_type_config
CREATE TRIGGER update_leave_type_config_updated_at BEFORE UPDATE ON hr_attendance.leave_type_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for updated_at on leave_accrual_rule
CREATE TRIGGER update_leave_accrual_rule_updated_at BEFORE UPDATE ON hr_attendance.leave_accrual_rule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
