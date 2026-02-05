-- Transfer Request Table
CREATE TABLE IF NOT EXISTS hr_core.transfer_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(100),
    employee_number VARCHAR(50),

    -- Source (전출)
    source_tenant_id UUID NOT NULL,
    source_tenant_name VARCHAR(200),
    source_department_id UUID,
    source_department_name VARCHAR(200),
    source_position_id UUID,
    source_position_name VARCHAR(100),
    source_grade_id UUID,
    source_grade_name VARCHAR(100),

    -- Target (전입)
    target_tenant_id UUID NOT NULL,
    target_tenant_name VARCHAR(200),
    target_department_id UUID,
    target_department_name VARCHAR(200),
    target_position_id UUID,
    target_position_name VARCHAR(100),
    target_grade_id UUID,
    target_grade_name VARCHAR(100),

    -- Transfer Info
    transfer_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',

    -- Approval Info
    source_approver_id UUID,
    source_approver_name VARCHAR(100),
    source_approved_at TIMESTAMP,
    target_approver_id UUID,
    target_approver_name VARCHAR(100),
    target_approved_at TIMESTAMP,
    reject_reason VARCHAR(500),
    completed_at TIMESTAMP,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,

    CONSTRAINT fk_transfer_request_tenant FOREIGN KEY (tenant_id)
        REFERENCES tenant_common.tenant(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transfer_request_tenant_id ON hr_core.transfer_request(tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfer_request_employee_id ON hr_core.transfer_request(employee_id);
CREATE INDEX IF NOT EXISTS idx_transfer_request_source_tenant_id ON hr_core.transfer_request(source_tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfer_request_target_tenant_id ON hr_core.transfer_request(target_tenant_id);
CREATE INDEX IF NOT EXISTS idx_transfer_request_status ON hr_core.transfer_request(status);
CREATE INDEX IF NOT EXISTS idx_transfer_request_transfer_date ON hr_core.transfer_request(transfer_date);

-- Enable RLS
ALTER TABLE hr_core.transfer_request ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow access if user's tenant is source, target, or owner tenant
CREATE POLICY transfer_request_tenant_isolation ON hr_core.transfer_request
    FOR ALL
    USING (
        tenant_id::text = current_setting('app.current_tenant', true) OR
        source_tenant_id::text = current_setting('app.current_tenant', true) OR
        target_tenant_id::text = current_setting('app.current_tenant', true)
    );

-- Comments
COMMENT ON TABLE hr_core.transfer_request IS '계열사 전출/전입 요청';
COMMENT ON COLUMN hr_core.transfer_request.status IS 'DRAFT, PENDING, SOURCE_APPROVED, TARGET_APPROVED, APPROVED, COMPLETED, REJECTED, CANCELLED';
