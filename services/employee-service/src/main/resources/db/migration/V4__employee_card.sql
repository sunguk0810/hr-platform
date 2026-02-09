-- V4: Employee card management tables

CREATE TABLE IF NOT EXISTS hr_core.employee_card (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    card_number VARCHAR(50) NOT NULL,
    employee_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    issue_type VARCHAR(20) NOT NULL DEFAULT 'NEW',
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    access_level VARCHAR(20) DEFAULT 'LEVEL_1',
    rfid_enabled BOOLEAN DEFAULT false,
    rfid_tag VARCHAR(100),
    qr_code VARCHAR(100),
    photo_file_id UUID,
    remarks TEXT,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID,
    revoke_reason TEXT,
    lost_at TIMESTAMPTZ,
    lost_location VARCHAR(200),
    lost_description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE(tenant_id, card_number)
);

CREATE TABLE IF NOT EXISTS hr_core.card_issue_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    request_number VARCHAR(50) NOT NULL,
    employee_id UUID NOT NULL,
    issue_type VARCHAR(20) NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    rejection_reason TEXT,
    issued_card_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE(tenant_id, request_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_employee_card_employee ON hr_core.employee_card(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_card_tenant_status ON hr_core.employee_card(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_card_issue_request_tenant ON hr_core.card_issue_request(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_card_issue_request_employee ON hr_core.card_issue_request(employee_id);

-- RLS
ALTER TABLE hr_core.employee_card ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.card_issue_request ENABLE ROW LEVEL SECURITY;

CREATE POLICY employee_card_tenant_isolation ON hr_core.employee_card
    USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY card_issue_request_tenant_isolation ON hr_core.card_issue_request
    USING (tenant_id::text = current_setting('app.current_tenant', true));
