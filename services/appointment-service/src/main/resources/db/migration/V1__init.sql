-- Appointment Service: Consolidated Migration (V1)
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

-- appointment_draft
CREATE TABLE hr_appointment.appointment_draft (
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
    CONSTRAINT uq_appointment_draft_tenant_number UNIQUE (tenant_id, draft_number)
);

-- appointment_detail
CREATE TABLE hr_appointment.appointment_detail (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id            UUID            NOT NULL,
    draft_id             UUID            NOT NULL REFERENCES hr_appointment.appointment_draft (id),
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

-- appointment_schedule
CREATE TABLE hr_appointment.appointment_schedule (
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

-- appointment_history
CREATE TABLE hr_appointment.appointment_history (
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

-- appointment_draft
CREATE INDEX idx_appointment_draft_tenant_id       ON hr_appointment.appointment_draft (tenant_id);
CREATE INDEX idx_appointment_draft_status           ON hr_appointment.appointment_draft (tenant_id, status);
CREATE INDEX idx_appointment_draft_effective_date   ON hr_appointment.appointment_draft (tenant_id, effective_date);
CREATE INDEX idx_appointment_draft_approval_id      ON hr_appointment.appointment_draft (approval_id) WHERE approval_id IS NOT NULL;
CREATE INDEX idx_appointment_draft_created_at       ON hr_appointment.appointment_draft (tenant_id, created_at DESC);

-- appointment_detail
CREATE INDEX idx_appointment_detail_tenant_id       ON hr_appointment.appointment_detail (tenant_id);
CREATE INDEX idx_appointment_detail_draft_id        ON hr_appointment.appointment_detail (tenant_id, draft_id);
CREATE INDEX idx_appointment_detail_employee_id     ON hr_appointment.appointment_detail (tenant_id, employee_id);
CREATE INDEX idx_appointment_detail_type            ON hr_appointment.appointment_detail (tenant_id, appointment_type);
CREATE INDEX idx_appointment_detail_status          ON hr_appointment.appointment_detail (tenant_id, status);

-- appointment_schedule
CREATE INDEX idx_appointment_schedule_tenant_id     ON hr_appointment.appointment_schedule (tenant_id);
CREATE INDEX idx_appointment_schedule_draft_id      ON hr_appointment.appointment_schedule (tenant_id, draft_id);
CREATE INDEX idx_appointment_schedule_tenant_status_date ON hr_appointment.appointment_schedule (tenant_id, status, scheduled_date);
CREATE INDEX idx_appointment_schedule_date          ON hr_appointment.appointment_schedule (tenant_id, scheduled_date);

-- appointment_history
CREATE INDEX idx_appointment_history_tenant_id     ON hr_appointment.appointment_history (tenant_id);
CREATE INDEX idx_appointment_history_employee_id   ON hr_appointment.appointment_history (tenant_id, employee_id);
CREATE INDEX idx_appointment_history_type          ON hr_appointment.appointment_history (tenant_id, appointment_type);
CREATE INDEX idx_appointment_history_effective_date ON hr_appointment.appointment_history (tenant_id, effective_date);
CREATE INDEX idx_appointment_history_detail_id     ON hr_appointment.appointment_history (detail_id) WHERE detail_id IS NOT NULL;
CREATE INDEX idx_appointment_history_draft_number  ON hr_appointment.appointment_history (tenant_id, draft_number);

-- ---------------------------------------------------------------------------
-- 4. Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE hr_appointment.appointment_draft    ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_appointment.appointment_draft    FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_appointment.appointment_detail   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_appointment.appointment_detail   FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_appointment.appointment_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_appointment.appointment_schedule FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_appointment.appointment_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_appointment.appointment_history FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. RLS Policies
-- ---------------------------------------------------------------------------

CREATE POLICY tenant_isolation_appointment_draft ON hr_appointment.appointment_draft
    FOR ALL
    USING (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_appointment_detail ON hr_appointment.appointment_detail
    FOR ALL
    USING (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_appointment_schedule ON hr_appointment.appointment_schedule
    FOR ALL
    USING (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_appointment_history ON hr_appointment.appointment_history
    FOR ALL
    USING (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_appointment.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_appointment.get_current_tenant_safe()
    );
