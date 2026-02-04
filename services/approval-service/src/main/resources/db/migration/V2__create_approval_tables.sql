-- Approval Document table
CREATE TABLE IF NOT EXISTS hr_approval.approval_document (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    document_number VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    document_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    drafter_id UUID NOT NULL,
    drafter_name VARCHAR(100) NOT NULL,
    drafter_department_id UUID,
    drafter_department_name VARCHAR(200),
    submitted_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    reference_type VARCHAR(50),
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Indexes for approval_document
CREATE INDEX IF NOT EXISTS idx_approval_document_tenant_id ON hr_approval.approval_document(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_document_drafter_id ON hr_approval.approval_document(drafter_id);
CREATE INDEX IF NOT EXISTS idx_approval_document_status ON hr_approval.approval_document(status);
CREATE INDEX IF NOT EXISTS idx_approval_document_document_type ON hr_approval.approval_document(document_type);
CREATE INDEX IF NOT EXISTS idx_approval_document_submitted_at ON hr_approval.approval_document(submitted_at);

-- Approval Line table (child of document)
CREATE TABLE IF NOT EXISTS hr_approval.approval_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES hr_approval.approval_document(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    line_type VARCHAR(20) NOT NULL DEFAULT 'SEQUENTIAL',
    approver_id UUID NOT NULL,
    approver_name VARCHAR(100) NOT NULL,
    approver_position VARCHAR(100),
    approver_department_name VARCHAR(200),
    delegate_id UUID,
    delegate_name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING',
    action_type VARCHAR(20),
    comment TEXT,
    activated_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Indexes for approval_line
CREATE INDEX IF NOT EXISTS idx_approval_line_document_id ON hr_approval.approval_line(document_id);
CREATE INDEX IF NOT EXISTS idx_approval_line_approver_id ON hr_approval.approval_line(approver_id);
CREATE INDEX IF NOT EXISTS idx_approval_line_status ON hr_approval.approval_line(status);

-- Approval History table (child of document)
CREATE TABLE IF NOT EXISTS hr_approval.approval_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES hr_approval.approval_document(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL,
    actor_name VARCHAR(100) NOT NULL,
    action_type VARCHAR(20) NOT NULL,
    from_status VARCHAR(20),
    to_status VARCHAR(20),
    comment TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Indexes for approval_history
CREATE INDEX IF NOT EXISTS idx_approval_history_document_id ON hr_approval.approval_history(document_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_actor_id ON hr_approval.approval_history(actor_id);

-- Approval Template table
CREATE TABLE IF NOT EXISTS hr_approval.approval_template (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE(tenant_id, code)
);

-- Indexes for approval_template
CREATE INDEX IF NOT EXISTS idx_approval_template_tenant_id ON hr_approval.approval_template(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_template_document_type ON hr_approval.approval_template(document_type);

-- Approval Template Line table (child of template)
CREATE TABLE IF NOT EXISTS hr_approval.approval_template_line (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES hr_approval.approval_template(id) ON DELETE CASCADE,
    sequence INTEGER NOT NULL,
    line_type VARCHAR(20) NOT NULL DEFAULT 'SEQUENTIAL',
    approver_type VARCHAR(30) NOT NULL,
    approver_id UUID,
    approver_name VARCHAR(100),
    position_code VARCHAR(50),
    department_id UUID,
    description VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Indexes for approval_template_line
CREATE INDEX IF NOT EXISTS idx_approval_template_line_template_id ON hr_approval.approval_template_line(template_id);

-- Delegation Rule table
CREATE TABLE IF NOT EXISTS hr_approval.delegation_rule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    delegator_id UUID NOT NULL,
    delegator_name VARCHAR(100) NOT NULL,
    delegate_id UUID NOT NULL,
    delegate_name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    document_types VARCHAR(500),
    reason VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Indexes for delegation_rule
CREATE INDEX IF NOT EXISTS idx_delegation_rule_tenant_id ON hr_approval.delegation_rule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_delegation_rule_delegator_id ON hr_approval.delegation_rule(delegator_id);
CREATE INDEX IF NOT EXISTS idx_delegation_rule_delegate_id ON hr_approval.delegation_rule(delegate_id);
CREATE INDEX IF NOT EXISTS idx_delegation_rule_dates ON hr_approval.delegation_rule(start_date, end_date);
