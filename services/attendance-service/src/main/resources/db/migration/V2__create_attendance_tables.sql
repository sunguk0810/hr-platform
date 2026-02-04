-- Attendance Record table
CREATE TABLE IF NOT EXISTS hr_attendance.attendance_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    work_date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    status VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    late_minutes INTEGER DEFAULT 0,
    early_leave_minutes INTEGER DEFAULT 0,
    overtime_minutes INTEGER DEFAULT 0,
    work_hours INTEGER DEFAULT 0,
    check_in_location VARCHAR(500),
    check_out_location VARCHAR(500),
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uk_attendance_record UNIQUE (tenant_id, employee_id, work_date)
);

-- Leave Request table
CREATE TABLE IF NOT EXISTS hr_attendance.leave_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    department_id UUID,
    department_name VARCHAR(200),
    leave_type VARCHAR(30) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_count DECIMAL(3,1) NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approval_document_id UUID,
    emergency_contact VARCHAR(50),
    handover_to_id UUID,
    handover_to_name VARCHAR(100),
    handover_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Leave Balance table
CREATE TABLE IF NOT EXISTS hr_attendance.leave_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    year INTEGER NOT NULL,
    leave_type VARCHAR(30) NOT NULL,
    total_days DECIMAL(5,1) NOT NULL DEFAULT 0,
    used_days DECIMAL(5,1) NOT NULL DEFAULT 0,
    pending_days DECIMAL(5,1) NOT NULL DEFAULT 0,
    carried_over_days DECIMAL(5,1) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uk_leave_balance UNIQUE (tenant_id, employee_id, year, leave_type)
);

-- Holiday table
CREATE TABLE IF NOT EXISTS hr_attendance.holiday (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    holiday_date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    name_en VARCHAR(100),
    holiday_type VARCHAR(20) NOT NULL,
    is_paid BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(500),
    year INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uk_holiday UNIQUE (tenant_id, holiday_date)
);

-- Overtime Request table
CREATE TABLE IF NOT EXISTS hr_attendance.overtime_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    department_id UUID,
    department_name VARCHAR(200),
    overtime_date DATE NOT NULL,
    planned_start_time TIME NOT NULL,
    planned_end_time TIME NOT NULL,
    actual_start_time TIME,
    actual_end_time TIME,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approval_document_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_record_tenant ON hr_attendance.attendance_record(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_record_employee ON hr_attendance.attendance_record(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_record_date ON hr_attendance.attendance_record(work_date);
CREATE INDEX IF NOT EXISTS idx_leave_request_tenant ON hr_attendance.leave_request(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_request_employee ON hr_attendance.leave_request(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_request_status ON hr_attendance.leave_request(status);
CREATE INDEX IF NOT EXISTS idx_leave_balance_tenant ON hr_attendance.leave_balance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_holiday_tenant ON hr_attendance.holiday(tenant_id);
CREATE INDEX IF NOT EXISTS idx_holiday_year ON hr_attendance.holiday(year);
CREATE INDEX IF NOT EXISTS idx_overtime_request_tenant ON hr_attendance.overtime_request(tenant_id);
