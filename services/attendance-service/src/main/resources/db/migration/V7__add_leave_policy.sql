-- Leave Type Configuration
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

-- Leave Accrual Rule
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

-- Add hourly leave support to leave_request
ALTER TABLE hr_attendance.leave_request
    ADD COLUMN IF NOT EXISTS leave_unit VARCHAR(10) DEFAULT 'DAY',
    ADD COLUMN IF NOT EXISTS hours_count DECIMAL(5,1);

-- Add hourly leave support to leave_balance
ALTER TABLE hr_attendance.leave_balance
    ADD COLUMN IF NOT EXISTS used_hours DECIMAL(7,1) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS pending_hours DECIMAL(7,1) DEFAULT 0;

-- RLS policies
ALTER TABLE hr_attendance.leave_type_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_leave_type_config ON hr_attendance.leave_type_config
    USING (tenant_id = get_current_tenant_safe());

ALTER TABLE hr_attendance.leave_accrual_rule ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_leave_accrual_rule ON hr_attendance.leave_accrual_rule
    USING (tenant_id = get_current_tenant_safe());

-- Triggers for updated_at
CREATE TRIGGER update_leave_type_config_updated_at BEFORE UPDATE ON hr_attendance.leave_type_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_accrual_rule_updated_at BEFORE UPDATE ON hr_attendance.leave_accrual_rule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
