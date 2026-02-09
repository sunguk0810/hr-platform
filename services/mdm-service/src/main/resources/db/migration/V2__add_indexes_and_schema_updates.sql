-- V2: Performance indexes, code_usage_mapping table, deprecation columns, menu tenant_id
-- Applied to schema: tenant_common

-- G10: code_history performance indexes
CREATE INDEX IF NOT EXISTS idx_code_history_code_created
    ON tenant_common.code_history(code_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_code_history_tenant_created
    ON tenant_common.code_history(tenant_id, created_at DESC);

-- G02: code_usage_mapping table for DB-based impact analysis
CREATE TABLE IF NOT EXISTS tenant_common.code_usage_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_code VARCHAR(50) NOT NULL,
    resource_type VARCHAR(20) NOT NULL,
    resource_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    estimated_impact VARCHAR(20) DEFAULT 'MEDIUM',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_code_usage_group_resource UNIQUE (group_code, resource_type, resource_name)
);

-- Seed data for code_usage_mapping (11 records matching existing static CODE_USAGE_MAP)
INSERT INTO tenant_common.code_usage_mapping (group_code, resource_type, resource_name, description, estimated_impact)
VALUES
    ('LEAVE_TYPE', 'TABLE', 'leave_request', '휴가 신청 테이블', 'HIGH'),
    ('LEAVE_TYPE', 'TABLE', 'leave_balance', '휴가 잔여 테이블', 'HIGH'),
    ('LEAVE_TYPE', 'SERVICE', 'attendance-service', '근태 관리 서비스', 'HIGH'),
    ('GRADE', 'TABLE', 'employee', '직원 테이블', 'HIGH'),
    ('GRADE', 'TABLE', 'employee_history', '인사이력 테이블', 'MEDIUM'),
    ('GRADE', 'SERVICE', 'employee-service', '직원 관리 서비스', 'HIGH'),
    ('POSITION', 'TABLE', 'employee', '직원 테이블', 'HIGH'),
    ('POSITION', 'TABLE', 'approval_line', '결재선 테이블', 'MEDIUM'),
    ('POSITION', 'SERVICE', 'approval-service', '결재 서비스', 'HIGH'),
    ('DEPT_TYPE', 'TABLE', 'department', '부서 테이블', 'HIGH'),
    ('DEPT_TYPE', 'SERVICE', 'organization-service', '조직 관리 서비스', 'HIGH')
ON CONFLICT DO NOTHING;

-- G04: Deprecation columns on common_code
ALTER TABLE tenant_common.common_code ADD COLUMN IF NOT EXISTS replacement_code_id UUID;
ALTER TABLE tenant_common.common_code ADD COLUMN IF NOT EXISTS deprecated_at TIMESTAMPTZ;
ALTER TABLE tenant_common.common_code ADD COLUMN IF NOT EXISTS deprecation_grace_period_days INTEGER DEFAULT 90;

-- G05: tenant_id column on menu_item for tenant custom menus
ALTER TABLE tenant_common.menu_item ADD COLUMN IF NOT EXISTS tenant_id UUID;
CREATE INDEX IF NOT EXISTS idx_menu_item_tenant ON tenant_common.menu_item(tenant_id);

-- Additional useful indexes
CREATE INDEX IF NOT EXISTS idx_common_code_status ON tenant_common.common_code(status);
CREATE INDEX IF NOT EXISTS idx_common_code_effective ON tenant_common.common_code(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_code_usage_mapping_group ON tenant_common.code_usage_mapping(group_code);
