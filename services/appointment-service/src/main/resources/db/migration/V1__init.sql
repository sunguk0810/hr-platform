-- =============================================================================
-- Appointment Service - V1 Initial Migration
-- Schema: hr_appointment
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper function for RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION hr_appointment.get_current_tenant_safe()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant', TRUE), '')::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

-- appointment_drafts
CREATE TABLE hr_appointment.appointment_drafts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL,
    draft_number    VARCHAR(50)     NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    effective_date  DATE            NOT NULL,
    description     TEXT,
    status          VARCHAR(20)     DEFAULT 'DRAFT',
    approval_id     UUID,
    approved_by     UUID,
    approved_at     TIMESTAMPTZ,
    executed_at     TIMESTAMPTZ,
    executed_by     UUID,
    cancelled_at    TIMESTAMPTZ,
    cancelled_by    UUID,
    cancel_reason   TEXT,
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100),
    CONSTRAINT uq_appointment_drafts_tenant_number UNIQUE (tenant_id, draft_number)
);

-- appointment_details
CREATE TABLE hr_appointment.appointment_details (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID            NOT NULL,
    draft_id             UUID            NOT NULL REFERENCES hr_appointment.appointment_drafts (id),
    employee_id          UUID            NOT NULL,
    employee_name        VARCHAR(100),
    employee_number      VARCHAR(50),
    appointment_type     VARCHAR(30)     NOT NULL,
    from_department_id   UUID,
    to_department_id     UUID,
    from_department_name VARCHAR(100),
    to_department_name   VARCHAR(100),
    from_position_code   VARCHAR(50),
    to_position_code     VARCHAR(50),
    from_position_name   VARCHAR(100),
    to_position_name     VARCHAR(100),
    from_grade_code      VARCHAR(50),
    to_grade_code        VARCHAR(50),
    from_grade_name      VARCHAR(100),
    to_grade_name        VARCHAR(100),
    from_job_code        VARCHAR(50),
    to_job_code          VARCHAR(50),
    from_job_name        VARCHAR(100),
    to_job_name          VARCHAR(100),
    reason               TEXT,
    status               VARCHAR(20)     DEFAULT 'PENDING',
    executed_at          TIMESTAMPTZ,
    error_message        TEXT,
    created_at           TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(100),
    updated_by           VARCHAR(100)
);

-- appointment_schedules
CREATE TABLE hr_appointment.appointment_schedules (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL,
    draft_id        UUID            NOT NULL,
    scheduled_date  DATE            NOT NULL,
    scheduled_time  TIME            DEFAULT '00:00:00',
    status          VARCHAR(20)     DEFAULT 'SCHEDULED',
    executed_at     TIMESTAMPTZ,
    error_message   TEXT,
    retry_count     INTEGER         DEFAULT 0,
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

-- appointment_histories
CREATE TABLE hr_appointment.appointment_histories (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID            NOT NULL,
    detail_id        UUID,
    employee_id      UUID            NOT NULL,
    employee_name    VARCHAR(100),
    employee_number  VARCHAR(50),
    appointment_type VARCHAR(30)     NOT NULL,
    effective_date   DATE            NOT NULL,
    from_values      JSONB,
    to_values        JSONB,
    reason           TEXT,
    draft_number     VARCHAR(50),
    created_at       TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(100),
    updated_by       VARCHAR(100)
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------

-- appointment_drafts
CREATE INDEX idx_appointment_drafts_tenant_id       ON hr_appointment.appointment_drafts (tenant_id);
CREATE INDEX idx_appointment_drafts_status           ON hr_appointment.appointment_drafts (tenant_id, status);
CREATE INDEX idx_appointment_drafts_effective_date   ON hr_appointment.appointment_drafts (tenant_id, effective_date);
CREATE INDEX idx_appointment_drafts_approval_id      ON hr_appointment.appointment_drafts (approval_id) WHERE approval_id IS NOT NULL;
CREATE INDEX idx_appointment_drafts_created_at       ON hr_appointment.appointment_drafts (tenant_id, created_at DESC);

-- appointment_details
CREATE INDEX idx_appointment_details_tenant_id       ON hr_appointment.appointment_details (tenant_id);
CREATE INDEX idx_appointment_details_draft_id        ON hr_appointment.appointment_details (tenant_id, draft_id);
CREATE INDEX idx_appointment_details_employee_id     ON hr_appointment.appointment_details (tenant_id, employee_id);
CREATE INDEX idx_appointment_details_type            ON hr_appointment.appointment_details (tenant_id, appointment_type);
CREATE INDEX idx_appointment_details_status          ON hr_appointment.appointment_details (tenant_id, status);

-- appointment_schedules
CREATE INDEX idx_appointment_schedules_tenant_id     ON hr_appointment.appointment_schedules (tenant_id);
CREATE INDEX idx_appointment_schedules_draft_id      ON hr_appointment.appointment_schedules (tenant_id, draft_id);
CREATE INDEX idx_appointment_schedules_status        ON hr_appointment.appointment_schedules (status, scheduled_date);
CREATE INDEX idx_appointment_schedules_date          ON hr_appointment.appointment_schedules (tenant_id, scheduled_date);

-- appointment_histories
CREATE INDEX idx_appointment_histories_tenant_id     ON hr_appointment.appointment_histories (tenant_id);
CREATE INDEX idx_appointment_histories_employee_id   ON hr_appointment.appointment_histories (tenant_id, employee_id);
CREATE INDEX idx_appointment_histories_type          ON hr_appointment.appointment_histories (tenant_id, appointment_type);
CREATE INDEX idx_appointment_histories_effective_date ON hr_appointment.appointment_histories (tenant_id, effective_date);
CREATE INDEX idx_appointment_histories_detail_id     ON hr_appointment.appointment_histories (detail_id) WHERE detail_id IS NOT NULL;
CREATE INDEX idx_appointment_histories_draft_number  ON hr_appointment.appointment_histories (tenant_id, draft_number);

-- ---------------------------------------------------------------------------
-- 4. Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE hr_appointment.appointment_drafts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_appointment.appointment_drafts    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_appointment.appointment_details   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_appointment.appointment_details   FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_appointment.appointment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_appointment.appointment_schedules FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_appointment.appointment_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_appointment.appointment_histories FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. RLS Policies
-- ---------------------------------------------------------------------------

CREATE POLICY tenant_isolation_appointment_drafts ON hr_appointment.appointment_drafts
    FOR ALL
    USING (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_appointment_details ON hr_appointment.appointment_details
    FOR ALL
    USING (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_appointment_schedules ON hr_appointment.appointment_schedules
    FOR ALL
    USING (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_appointment_histories ON hr_appointment.appointment_histories
    FOR ALL
    USING (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    );
