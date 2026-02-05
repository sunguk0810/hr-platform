-- Condolence policy table
CREATE TABLE IF NOT EXISTS hr_core.condolence_policy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    leave_days INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uk_condolence_policy_tenant_event UNIQUE (tenant_id, event_type)
);

-- Condolence request table
CREATE TABLE IF NOT EXISTS hr_core.condolence_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(100),
    department_name VARCHAR(200),
    policy_id UUID REFERENCES hr_core.condolence_policy(id),
    event_type VARCHAR(30) NOT NULL,
    event_date DATE NOT NULL,
    description TEXT,
    relation VARCHAR(50),
    related_person_name VARCHAR(100),
    amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
    leave_days INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approval_id UUID,
    paid_date DATE,
    reject_reason VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_condolence_policy_tenant_id ON hr_core.condolence_policy(tenant_id);
CREATE INDEX IF NOT EXISTS idx_condolence_policy_event_type ON hr_core.condolence_policy(event_type);
CREATE INDEX IF NOT EXISTS idx_condolence_policy_is_active ON hr_core.condolence_policy(is_active);
CREATE INDEX IF NOT EXISTS idx_condolence_request_tenant_id ON hr_core.condolence_request(tenant_id);
CREATE INDEX IF NOT EXISTS idx_condolence_request_employee_id ON hr_core.condolence_request(employee_id);
CREATE INDEX IF NOT EXISTS idx_condolence_request_status ON hr_core.condolence_request(status);
CREATE INDEX IF NOT EXISTS idx_condolence_request_event_type ON hr_core.condolence_request(event_type);
CREATE INDEX IF NOT EXISTS idx_condolence_request_event_date ON hr_core.condolence_request(event_date);

-- Enable RLS
ALTER TABLE hr_core.condolence_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.condolence_request ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY condolence_policy_tenant_isolation ON hr_core.condolence_policy
    USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY condolence_request_tenant_isolation ON hr_core.condolence_request
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Comments
COMMENT ON TABLE hr_core.condolence_policy IS '경조비 정책';
COMMENT ON COLUMN hr_core.condolence_policy.event_type IS '경조사 유형';
COMMENT ON COLUMN hr_core.condolence_policy.name IS '정책명';
COMMENT ON COLUMN hr_core.condolence_policy.description IS '설명';
COMMENT ON COLUMN hr_core.condolence_policy.amount IS '지급 금액';
COMMENT ON COLUMN hr_core.condolence_policy.leave_days IS '휴가 일수';
COMMENT ON COLUMN hr_core.condolence_policy.is_active IS '활성 여부';
COMMENT ON COLUMN hr_core.condolence_policy.sort_order IS '정렬 순서';

COMMENT ON TABLE hr_core.condolence_request IS '경조비 신청';
COMMENT ON COLUMN hr_core.condolence_request.employee_id IS '신청자 직원 ID';
COMMENT ON COLUMN hr_core.condolence_request.employee_name IS '신청자 이름';
COMMENT ON COLUMN hr_core.condolence_request.department_name IS '신청자 부서명';
COMMENT ON COLUMN hr_core.condolence_request.policy_id IS '적용 정책 ID';
COMMENT ON COLUMN hr_core.condolence_request.event_type IS '경조사 유형';
COMMENT ON COLUMN hr_core.condolence_request.event_date IS '경조사 일자';
COMMENT ON COLUMN hr_core.condolence_request.description IS '상세 설명';
COMMENT ON COLUMN hr_core.condolence_request.relation IS '관계';
COMMENT ON COLUMN hr_core.condolence_request.related_person_name IS '관계인 이름';
COMMENT ON COLUMN hr_core.condolence_request.amount IS '지급 금액';
COMMENT ON COLUMN hr_core.condolence_request.leave_days IS '휴가 일수';
COMMENT ON COLUMN hr_core.condolence_request.status IS '상태 (PENDING, APPROVED, REJECTED, PAID, CANCELLED)';
COMMENT ON COLUMN hr_core.condolence_request.approval_id IS '결재 문서 ID';
COMMENT ON COLUMN hr_core.condolence_request.paid_date IS '지급일';
COMMENT ON COLUMN hr_core.condolence_request.reject_reason IS '반려 사유';
