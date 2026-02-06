-- ============================================================
-- Attendance Service - Initial Schema Migration
-- Schema: hr_attendance (created by init.sql)
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

-- ============================================================
-- Table 2: leave_request
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

-- ============================================================
-- Table 3: leave_balance
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
-- Row Level Security (RLS)
-- Enable and force on ALL 5 tables
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
