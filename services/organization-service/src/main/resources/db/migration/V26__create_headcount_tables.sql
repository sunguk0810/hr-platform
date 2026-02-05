-- Headcount plan table
CREATE TABLE IF NOT EXISTS hr_core.headcount_plan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    year INTEGER NOT NULL,
    department_id UUID NOT NULL,
    department_name VARCHAR(200),
    planned_count INTEGER NOT NULL DEFAULT 0,
    current_count INTEGER NOT NULL DEFAULT 0,
    approved_count INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uk_headcount_plan_tenant_year_dept UNIQUE (tenant_id, year, department_id)
);

-- Headcount request table
CREATE TABLE IF NOT EXISTS hr_core.headcount_request (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    department_id UUID NOT NULL,
    department_name VARCHAR(200),
    type VARCHAR(20) NOT NULL,
    request_count INTEGER NOT NULL,
    grade_id UUID,
    grade_name VARCHAR(100),
    position_id UUID,
    position_name VARCHAR(100),
    reason TEXT,
    effective_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approval_id UUID,
    requester_id UUID,
    requester_name VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_headcount_plan_tenant_id ON hr_core.headcount_plan(tenant_id);
CREATE INDEX IF NOT EXISTS idx_headcount_plan_year ON hr_core.headcount_plan(year);
CREATE INDEX IF NOT EXISTS idx_headcount_plan_department_id ON hr_core.headcount_plan(department_id);
CREATE INDEX IF NOT EXISTS idx_headcount_request_tenant_id ON hr_core.headcount_request(tenant_id);
CREATE INDEX IF NOT EXISTS idx_headcount_request_department_id ON hr_core.headcount_request(department_id);
CREATE INDEX IF NOT EXISTS idx_headcount_request_status ON hr_core.headcount_request(status);
CREATE INDEX IF NOT EXISTS idx_headcount_request_type ON hr_core.headcount_request(type);
CREATE INDEX IF NOT EXISTS idx_headcount_request_requester_id ON hr_core.headcount_request(requester_id);

-- Enable RLS
ALTER TABLE hr_core.headcount_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.headcount_request ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY headcount_plan_tenant_isolation ON hr_core.headcount_plan
    USING (tenant_id::text = current_setting('app.current_tenant', true));

CREATE POLICY headcount_request_tenant_isolation ON hr_core.headcount_request
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Comments
COMMENT ON TABLE hr_core.headcount_plan IS '정현원 계획';
COMMENT ON COLUMN hr_core.headcount_plan.year IS '연도';
COMMENT ON COLUMN hr_core.headcount_plan.department_id IS '부서 ID';
COMMENT ON COLUMN hr_core.headcount_plan.department_name IS '부서명';
COMMENT ON COLUMN hr_core.headcount_plan.planned_count IS '계획 인원';
COMMENT ON COLUMN hr_core.headcount_plan.current_count IS '현재 인원';
COMMENT ON COLUMN hr_core.headcount_plan.approved_count IS '승인된 변경 인원';
COMMENT ON COLUMN hr_core.headcount_plan.notes IS '비고';

COMMENT ON TABLE hr_core.headcount_request IS '정현원 변경 요청';
COMMENT ON COLUMN hr_core.headcount_request.department_id IS '대상 부서 ID';
COMMENT ON COLUMN hr_core.headcount_request.department_name IS '대상 부서명';
COMMENT ON COLUMN hr_core.headcount_request.type IS '요청 유형 (INCREASE, DECREASE, TRANSFER)';
COMMENT ON COLUMN hr_core.headcount_request.request_count IS '요청 인원 수';
COMMENT ON COLUMN hr_core.headcount_request.grade_id IS '직급 ID';
COMMENT ON COLUMN hr_core.headcount_request.grade_name IS '직급명';
COMMENT ON COLUMN hr_core.headcount_request.position_id IS '직위 ID';
COMMENT ON COLUMN hr_core.headcount_request.position_name IS '직위명';
COMMENT ON COLUMN hr_core.headcount_request.reason IS '요청 사유';
COMMENT ON COLUMN hr_core.headcount_request.effective_date IS '적용 예정일';
COMMENT ON COLUMN hr_core.headcount_request.status IS '상태 (DRAFT, PENDING, APPROVED, REJECTED)';
COMMENT ON COLUMN hr_core.headcount_request.approval_id IS '결재 문서 ID';
COMMENT ON COLUMN hr_core.headcount_request.requester_id IS '요청자 ID';
COMMENT ON COLUMN hr_core.headcount_request.requester_name IS '요청자 이름';
