-- Committee table
CREATE TABLE IF NOT EXISTS hr_core.committee (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    name_en VARCHAR(200),
    type VARCHAR(20) NOT NULL DEFAULT 'PERMANENT',
    purpose TEXT,
    start_date DATE,
    end_date DATE,
    meeting_schedule VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    CONSTRAINT uk_committee_tenant_code UNIQUE (tenant_id, code)
);

-- Committee member table
CREATE TABLE IF NOT EXISTS hr_core.committee_member (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id UUID NOT NULL REFERENCES hr_core.committee(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    employee_name VARCHAR(100),
    department_name VARCHAR(200),
    position_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER',
    join_date DATE,
    leave_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_committee_tenant_id ON hr_core.committee(tenant_id);
CREATE INDEX IF NOT EXISTS idx_committee_status ON hr_core.committee(status);
CREATE INDEX IF NOT EXISTS idx_committee_type ON hr_core.committee(type);
CREATE INDEX IF NOT EXISTS idx_committee_member_committee_id ON hr_core.committee_member(committee_id);
CREATE INDEX IF NOT EXISTS idx_committee_member_employee_id ON hr_core.committee_member(employee_id);
CREATE INDEX IF NOT EXISTS idx_committee_member_is_active ON hr_core.committee_member(is_active);

-- Enable RLS
ALTER TABLE hr_core.committee ENABLE ROW LEVEL SECURITY;

-- RLS Policy for committee
CREATE POLICY committee_tenant_isolation ON hr_core.committee
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- Comments
COMMENT ON TABLE hr_core.committee IS '위원회';
COMMENT ON COLUMN hr_core.committee.code IS '위원회 코드';
COMMENT ON COLUMN hr_core.committee.name IS '위원회 명칭';
COMMENT ON COLUMN hr_core.committee.name_en IS '영문 명칭';
COMMENT ON COLUMN hr_core.committee.type IS '유형 (PERMANENT, TEMPORARY, PROJECT)';
COMMENT ON COLUMN hr_core.committee.purpose IS '설립 목적';
COMMENT ON COLUMN hr_core.committee.start_date IS '시작일';
COMMENT ON COLUMN hr_core.committee.end_date IS '종료일';
COMMENT ON COLUMN hr_core.committee.meeting_schedule IS '회의 일정';
COMMENT ON COLUMN hr_core.committee.status IS '상태 (ACTIVE, INACTIVE, DISSOLVED)';

COMMENT ON TABLE hr_core.committee_member IS '위원회 멤버';
COMMENT ON COLUMN hr_core.committee_member.employee_id IS '직원 ID';
COMMENT ON COLUMN hr_core.committee_member.employee_name IS '직원 이름';
COMMENT ON COLUMN hr_core.committee_member.department_name IS '소속 부서';
COMMENT ON COLUMN hr_core.committee_member.position_name IS '직위';
COMMENT ON COLUMN hr_core.committee_member.role IS '역할 (CHAIR, VICE_CHAIR, SECRETARY, MEMBER)';
COMMENT ON COLUMN hr_core.committee_member.join_date IS '가입일';
COMMENT ON COLUMN hr_core.committee_member.leave_date IS '탈퇴일';
COMMENT ON COLUMN hr_core.committee_member.is_active IS '활성 여부';
