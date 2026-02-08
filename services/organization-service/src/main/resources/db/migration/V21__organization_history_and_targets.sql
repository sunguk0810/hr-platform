-- V21: Organization History, Announcement Targets, Announcement Reads, Headcount History

-- G02: organization_history table
CREATE TABLE hr_core.organization_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    department_id UUID,
    department_name VARCHAR(200),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    previous_value JSONB,
    new_value JSONB,
    actor_id UUID,
    actor_name VARCHAR(100),
    event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_org_history_tenant ON hr_core.organization_history(tenant_id);
CREATE INDEX idx_org_history_department ON hr_core.organization_history(department_id);
CREATE INDEX idx_org_history_event_type ON hr_core.organization_history(event_type);
CREATE INDEX idx_org_history_event_date ON hr_core.organization_history(event_date DESC);

ALTER TABLE hr_core.organization_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_history_tenant_isolation ON hr_core.organization_history
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- G05: announcement_target table
CREATE TABLE hr_core.announcement_target (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES hr_core.announcement(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL,
    target_id UUID NOT NULL,
    target_name VARCHAR(200),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_announcement_target_announcement ON hr_core.announcement_target(announcement_id);
CREATE INDEX idx_announcement_target_type_id ON hr_core.announcement_target(target_type, target_id);

-- G05: Add target_scope column to announcement
ALTER TABLE hr_core.announcement ADD COLUMN IF NOT EXISTS target_scope VARCHAR(20) DEFAULT 'ALL';

-- G12: announcement_read table
CREATE TABLE hr_core.announcement_read (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES hr_core.announcement(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL,
    read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(announcement_id, employee_id)
);

CREATE INDEX idx_announcement_read_announcement ON hr_core.announcement_read(announcement_id);
CREATE INDEX idx_announcement_read_employee ON hr_core.announcement_read(employee_id);

-- G13: headcount_history table
CREATE TABLE hr_core.headcount_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    plan_id UUID NOT NULL REFERENCES hr_core.headcount_plan(id),
    event_type VARCHAR(50) NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    actor_id UUID,
    actor_name VARCHAR(100),
    event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_headcount_history_tenant ON hr_core.headcount_history(tenant_id);
CREATE INDEX idx_headcount_history_plan ON hr_core.headcount_history(plan_id);
CREATE INDEX idx_headcount_history_event_date ON hr_core.headcount_history(event_date DESC);

ALTER TABLE hr_core.headcount_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY headcount_history_tenant_isolation ON hr_core.headcount_history
    USING (tenant_id::text = current_setting('app.current_tenant', true));
