-- Organization Service: Consolidated Migration (V1)
-- Merged from: V20__init_organization.sql, V27__organization_history_and_targets.sql, V28__add_performance_indexes.sql

SET search_path TO hr_core, public;

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 department
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.department (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    code        VARCHAR(50) NOT NULL,
    name        VARCHAR(200) NOT NULL,
    name_en     VARCHAR(200),
    parent_id   UUID,
    level       INTEGER,
    path        VARCHAR(500),
    manager_id  UUID,
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    sort_order  INTEGER,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100),

    CONSTRAINT uq_department_tenant_code UNIQUE (tenant_id, code),
    CONSTRAINT fk_department_parent
        FOREIGN KEY (parent_id) REFERENCES hr_core.department (id)
);

-- -----------------------------------------------------------------------------
-- 1.2 grade
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.grade (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    code        VARCHAR(50) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    name_en     VARCHAR(100),
    level       INTEGER,
    sort_order  INTEGER,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100),

    CONSTRAINT uq_grade_tenant_code UNIQUE (tenant_id, code)
);

-- -----------------------------------------------------------------------------
-- 1.3 position
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.position (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    code        VARCHAR(50) NOT NULL,
    name        VARCHAR(100) NOT NULL,
    name_en     VARCHAR(100),
    level       INTEGER,
    sort_order  INTEGER,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by  VARCHAR(100),
    updated_by  VARCHAR(100),

    CONSTRAINT uq_position_tenant_code UNIQUE (tenant_id, code)
);

-- -----------------------------------------------------------------------------
-- 1.4 announcement (includes target_scope from V27, search_vector from V28)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.announcement (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID NOT NULL,
    title             VARCHAR(500) NOT NULL,
    content           TEXT,
    category          VARCHAR(20) NOT NULL DEFAULT 'NOTICE',
    author_id         UUID,
    author_name       VARCHAR(100),
    author_department VARCHAR(200),
    is_pinned         BOOLEAN NOT NULL DEFAULT false,
    view_count        BIGINT NOT NULL DEFAULT 0,
    is_published      BOOLEAN NOT NULL DEFAULT false,
    published_at      TIMESTAMPTZ,
    target_scope      VARCHAR(20) DEFAULT 'ALL',
    search_vector     tsvector,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100)
);

-- -----------------------------------------------------------------------------
-- 1.5 announcement_attachment
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.announcement_attachment (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL,
    file_id         UUID,
    file_name       VARCHAR(500),
    file_url        VARCHAR(1000),
    file_size       BIGINT,
    content_type    VARCHAR(255),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),

    CONSTRAINT fk_announcement_attachment_announcement
        FOREIGN KEY (announcement_id) REFERENCES hr_core.announcement (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 1.6 announcement_target (from V27)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.announcement_target (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES hr_core.announcement(id) ON DELETE CASCADE,
    target_type     VARCHAR(20) NOT NULL,
    target_id       UUID NOT NULL,
    target_name     VARCHAR(200),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 1.7 announcement_read (from V27)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.announcement_read (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    announcement_id UUID NOT NULL REFERENCES hr_core.announcement(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL,
    read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(announcement_id, employee_id)
);

-- -----------------------------------------------------------------------------
-- 1.8 committee
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.committee (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID NOT NULL,
    code             VARCHAR(50) NOT NULL,
    name             VARCHAR(200) NOT NULL,
    name_en          VARCHAR(200),
    type             VARCHAR(20),
    purpose          TEXT,
    start_date       DATE,
    end_date         DATE,
    meeting_schedule VARCHAR(500),
    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by       VARCHAR(100),
    updated_by       VARCHAR(100),

    CONSTRAINT uq_committee_tenant_code UNIQUE (tenant_id, code)
);

-- -----------------------------------------------------------------------------
-- 1.9 committee_member
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.committee_member (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    committee_id    UUID NOT NULL,
    employee_id     UUID,
    employee_name   VARCHAR(100),
    department_name VARCHAR(200),
    position_name   VARCHAR(100),
    role            VARCHAR(20),
    join_date       DATE,
    leave_date      DATE,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),

    CONSTRAINT fk_committee_member_committee
        FOREIGN KEY (committee_id) REFERENCES hr_core.committee (id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 1.10 headcount_plan
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.headcount_plan (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    year            INTEGER NOT NULL,
    department_id   UUID,
    department_name VARCHAR(200),
    planned_count   INTEGER,
    current_count   INTEGER,
    approved_count  INTEGER,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),

    CONSTRAINT uq_headcount_plan_tenant_year_dept UNIQUE (tenant_id, year, department_id)
);

-- -----------------------------------------------------------------------------
-- 1.11 headcount_request
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.headcount_request (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    department_id   UUID,
    department_name VARCHAR(200),
    type            VARCHAR(20),
    request_count   INTEGER,
    grade_id        UUID,
    grade_name      VARCHAR(100),
    position_id     UUID,
    position_name   VARCHAR(100),
    reason          TEXT,
    effective_date  DATE,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    approval_id     UUID,
    requester_id    UUID,
    requester_name  VARCHAR(100),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

-- -----------------------------------------------------------------------------
-- 1.12 organization_history (from V27)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.organization_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    event_type      VARCHAR(50) NOT NULL,
    department_id   UUID,
    department_name VARCHAR(200),
    title           VARCHAR(500) NOT NULL,
    description     TEXT,
    previous_value  JSONB,
    new_value       JSONB,
    actor_id        UUID,
    actor_name      VARCHAR(100),
    event_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata        JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 1.13 headcount_history (from V27)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_core.headcount_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    plan_id         UUID NOT NULL REFERENCES hr_core.headcount_plan(id),
    event_type      VARCHAR(50) NOT NULL,
    previous_value  JSONB,
    new_value       JSONB,
    actor_id        UUID,
    actor_name      VARCHAR(100),
    event_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- =============================================================================
-- 2. INDEXES
-- =============================================================================

-- department
CREATE INDEX idx_department_tenant_id ON hr_core.department (tenant_id);
CREATE INDEX idx_department_parent_id ON hr_core.department (parent_id);
CREATE INDEX idx_department_status ON hr_core.department (status);
CREATE INDEX idx_department_manager_id ON hr_core.department (manager_id);
CREATE INDEX idx_department_path ON hr_core.department (path);
CREATE INDEX idx_department_level ON hr_core.department (level);

-- grade
CREATE INDEX idx_grade_tenant_id ON hr_core.grade (tenant_id);
CREATE INDEX idx_grade_is_active ON hr_core.grade (is_active);

-- position
CREATE INDEX idx_position_tenant_id ON hr_core.position (tenant_id);
CREATE INDEX idx_position_is_active ON hr_core.position (is_active);

-- announcement
CREATE INDEX idx_announcement_tenant_id ON hr_core.announcement (tenant_id);
CREATE INDEX idx_announcement_category ON hr_core.announcement (category);
CREATE INDEX idx_announcement_is_published ON hr_core.announcement (is_published);
CREATE INDEX idx_announcement_is_pinned ON hr_core.announcement (is_pinned);
CREATE INDEX idx_announcement_published_at ON hr_core.announcement (published_at);
CREATE INDEX idx_announcement_author_id ON hr_core.announcement (author_id);

-- announcement_attachment
CREATE INDEX idx_announcement_attachment_announcement_id ON hr_core.announcement_attachment (announcement_id);

-- announcement_target (from V27)
CREATE INDEX idx_announcement_target_announcement ON hr_core.announcement_target(announcement_id);
CREATE INDEX idx_announcement_target_type_id ON hr_core.announcement_target(target_type, target_id);

-- announcement_read (from V27)
CREATE INDEX idx_announcement_read_announcement ON hr_core.announcement_read(announcement_id);
CREATE INDEX idx_announcement_read_employee ON hr_core.announcement_read(employee_id);

-- committee
CREATE INDEX idx_committee_tenant_id ON hr_core.committee (tenant_id);
CREATE INDEX idx_committee_status ON hr_core.committee (status);
CREATE INDEX idx_committee_type ON hr_core.committee (type);

-- committee_member
CREATE INDEX idx_committee_member_committee_id ON hr_core.committee_member (committee_id);
CREATE INDEX idx_committee_member_employee_id ON hr_core.committee_member (employee_id);
CREATE INDEX idx_committee_member_is_active ON hr_core.committee_member (is_active);

-- headcount_plan
CREATE INDEX idx_headcount_plan_tenant_id ON hr_core.headcount_plan (tenant_id);
CREATE INDEX idx_headcount_plan_year ON hr_core.headcount_plan (year);
CREATE INDEX idx_headcount_plan_department_id ON hr_core.headcount_plan (department_id);

-- headcount_request
CREATE INDEX idx_headcount_request_tenant_id ON hr_core.headcount_request (tenant_id);
CREATE INDEX idx_headcount_request_department_id ON hr_core.headcount_request (department_id);
CREATE INDEX idx_headcount_request_status ON hr_core.headcount_request (status);
CREATE INDEX idx_headcount_request_effective_date ON hr_core.headcount_request (effective_date);
CREATE INDEX idx_headcount_request_requester_id ON hr_core.headcount_request (requester_id);

-- organization_history (from V27)
CREATE INDEX idx_org_history_tenant ON hr_core.organization_history(tenant_id);
CREATE INDEX idx_org_history_department ON hr_core.organization_history(department_id);
CREATE INDEX idx_org_history_event_type ON hr_core.organization_history(event_type);
CREATE INDEX idx_org_history_event_date ON hr_core.organization_history(event_date DESC);

-- headcount_history (from V27)
CREATE INDEX idx_headcount_history_tenant ON hr_core.headcount_history(tenant_id);
CREATE INDEX idx_headcount_history_plan ON hr_core.headcount_history(plan_id);
CREATE INDEX idx_headcount_history_event_date ON hr_core.headcount_history(event_date DESC);

-- Performance indexes (from V28)
CREATE INDEX IF NOT EXISTS idx_announcement_tenant_pinned_published
    ON hr_core.announcement (tenant_id, is_pinned DESC, published_at DESC NULLS LAST)
    WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_department_tenant_status_parent_sort
    ON hr_core.department (tenant_id, status, parent_id, sort_order);

-- Announcement full-text search GIN index (from V28)
CREATE INDEX IF NOT EXISTS idx_announcement_search_vector
    ON hr_core.announcement USING GIN (search_vector);


-- =============================================================================
-- 3. ROW LEVEL SECURITY
-- =============================================================================

-- Enable and force RLS on all tables with tenant_id
ALTER TABLE hr_core.department ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.department FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.grade ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.grade FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.position ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.position FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.announcement ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.announcement FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.announcement_attachment ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.announcement_attachment FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.committee ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.committee FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.committee_member ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.committee_member FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.headcount_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.headcount_plan FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.headcount_request ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_core.headcount_request FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_core.organization_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE hr_core.headcount_history ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 4. TENANT-SAFE FUNCTION
-- =============================================================================

-- Race-safe: hr_core schema is shared with employee-service
DO $$
BEGIN
    CREATE OR REPLACE FUNCTION hr_core.get_current_tenant_safe()
    RETURNS UUID AS $func$
    BEGIN
        RETURN NULLIF(current_setting('app.current_tenant', true), '')::UUID;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN NULL;
    END;
    $func$ LANGUAGE plpgsql STABLE;
EXCEPTION
    WHEN unique_violation THEN NULL;
END;
$$;


-- =============================================================================
-- 5. RLS POLICIES
-- =============================================================================

-- department
CREATE POLICY department_tenant_isolation ON hr_core.department
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- grade
CREATE POLICY grade_tenant_isolation ON hr_core.grade
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- position
CREATE POLICY position_tenant_isolation ON hr_core.position
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- announcement
CREATE POLICY announcement_tenant_isolation ON hr_core.announcement
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- announcement_attachment (no tenant_id column; access controlled via FK to announcement)
CREATE POLICY announcement_attachment_access ON hr_core.announcement_attachment
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM hr_core.announcement a
            WHERE a.id = announcement_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM hr_core.announcement a
            WHERE a.id = announcement_id
        )
    );

-- committee
CREATE POLICY committee_tenant_isolation ON hr_core.committee
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- committee_member (no tenant_id column; access controlled via FK to committee)
CREATE POLICY committee_member_access ON hr_core.committee_member
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM hr_core.committee c
            WHERE c.id = committee_id
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM hr_core.committee c
            WHERE c.id = committee_id
        )
    );

-- headcount_plan
CREATE POLICY headcount_plan_tenant_isolation ON hr_core.headcount_plan
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- headcount_request
CREATE POLICY headcount_request_tenant_isolation ON hr_core.headcount_request
    FOR ALL
    USING (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe())
    WITH CHECK (hr_core.get_current_tenant_safe() IS NULL OR tenant_id = hr_core.get_current_tenant_safe());

-- organization_history (from V27)
CREATE POLICY organization_history_tenant_isolation ON hr_core.organization_history
    USING (tenant_id::text = current_setting('app.current_tenant', true));

-- headcount_history (from V27)
CREATE POLICY headcount_history_tenant_isolation ON hr_core.headcount_history
    USING (tenant_id::text = current_setting('app.current_tenant', true));


-- =============================================================================
-- 6. TRIGGERS
-- =============================================================================

-- Race-safe: hr_core schema is shared with employee-service
DO $$
BEGIN
    CREATE OR REPLACE FUNCTION hr_core.set_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = now();
        RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
EXCEPTION
    WHEN unique_violation THEN NULL;
END;
$$;

-- department updated_at trigger
CREATE TRIGGER trg_department_updated_at
    BEFORE UPDATE ON hr_core.department
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.set_updated_at();

-- grade updated_at trigger
CREATE TRIGGER trg_grade_updated_at
    BEFORE UPDATE ON hr_core.grade
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.set_updated_at();

-- position updated_at trigger
CREATE TRIGGER trg_position_updated_at
    BEFORE UPDATE ON hr_core.position
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.set_updated_at();

-- announcement updated_at trigger
CREATE TRIGGER trg_announcement_updated_at
    BEFORE UPDATE ON hr_core.announcement
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.set_updated_at();

-- announcement_attachment updated_at trigger
CREATE TRIGGER trg_announcement_attachment_updated_at
    BEFORE UPDATE ON hr_core.announcement_attachment
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.set_updated_at();

-- committee updated_at trigger
CREATE TRIGGER trg_committee_updated_at
    BEFORE UPDATE ON hr_core.committee
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.set_updated_at();

-- committee_member updated_at trigger
CREATE TRIGGER trg_committee_member_updated_at
    BEFORE UPDATE ON hr_core.committee_member
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.set_updated_at();

-- headcount_plan updated_at trigger
CREATE TRIGGER trg_headcount_plan_updated_at
    BEFORE UPDATE ON hr_core.headcount_plan
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.set_updated_at();

-- headcount_request updated_at trigger
CREATE TRIGGER trg_headcount_request_updated_at
    BEFORE UPDATE ON hr_core.headcount_request
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.set_updated_at();


-- =============================================================================
-- 7. FULL-TEXT SEARCH (from V28)
-- =============================================================================

-- tsvector update function
CREATE OR REPLACE FUNCTION hr_core.announcement_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- tsvector trigger
DROP TRIGGER IF EXISTS trg_announcement_search_vector ON hr_core.announcement;
CREATE TRIGGER trg_announcement_search_vector
    BEFORE INSERT OR UPDATE OF title, content ON hr_core.announcement
    FOR EACH ROW
    EXECUTE FUNCTION hr_core.announcement_search_vector_update();

-- Update existing data (if any)
UPDATE hr_core.announcement SET search_vector =
    setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(content, '')), 'B')
WHERE search_vector IS NULL;
