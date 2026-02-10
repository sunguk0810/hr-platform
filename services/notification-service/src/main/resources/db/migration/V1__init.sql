-- Notification Service: Consolidated Migration (V1)
-- Schema: hr_notification
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Helper function for RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION hr_notification.get_current_tenant_safe()
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

-- notification
CREATE TABLE hr_notification.notification (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID            NOT NULL,
    recipient_id    UUID            NOT NULL,
    recipient_email VARCHAR(255),
    notification_type VARCHAR(50)   NOT NULL,
    channel         VARCHAR(20)     NOT NULL,
    title           VARCHAR(500)    NOT NULL,
    content         TEXT            NOT NULL,
    link_url        VARCHAR(1000),
    reference_type  VARCHAR(50),
    reference_id    UUID,
    is_read         BOOLEAN         DEFAULT FALSE,
    read_at         TIMESTAMPTZ,
    is_sent         BOOLEAN         DEFAULT FALSE,
    sent_at         TIMESTAMPTZ,
    send_error      VARCHAR(500),
    created_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_by      VARCHAR(100)
);

-- notification_template
CREATE TABLE hr_notification.notification_template (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID            NOT NULL,
    code              VARCHAR(100)    NOT NULL,
    notification_type VARCHAR(50)     NOT NULL,
    channel           VARCHAR(20)     NOT NULL,
    name              VARCHAR(200)    NOT NULL,
    subject           VARCHAR(500),
    body_template     TEXT            NOT NULL,
    description       VARCHAR(500),
    is_active         BOOLEAN         DEFAULT TRUE,
    variables         TEXT,
    created_at        TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100),
    CONSTRAINT uq_notification_template_tenant_code UNIQUE (tenant_id, code)
);

-- notification_preference
CREATE TABLE hr_notification.notification_preference (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id         UUID            NOT NULL,
    user_id           UUID            NOT NULL,
    notification_type VARCHAR(50)     NOT NULL,
    channel           VARCHAR(20)     NOT NULL,
    enabled           BOOLEAN         DEFAULT TRUE,
    created_at        TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMPTZ     DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_by        VARCHAR(100),
    CONSTRAINT uq_notification_preference_user_type_channel
        UNIQUE (tenant_id, user_id, notification_type, channel)
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------

-- notification
CREATE INDEX idx_notification_tenant_id       ON hr_notification.notification (tenant_id);
CREATE INDEX idx_notification_recipient_id    ON hr_notification.notification (tenant_id, recipient_id);
CREATE INDEX idx_notification_type            ON hr_notification.notification (tenant_id, notification_type);
CREATE INDEX idx_notification_channel         ON hr_notification.notification (tenant_id, channel);
CREATE INDEX idx_notification_is_read         ON hr_notification.notification (tenant_id, recipient_id, is_read);
CREATE INDEX idx_notification_is_sent         ON hr_notification.notification (is_sent) WHERE is_sent = FALSE;
CREATE INDEX idx_notification_reference       ON hr_notification.notification (tenant_id, reference_type, reference_id);
CREATE INDEX idx_notification_created_at      ON hr_notification.notification (tenant_id, created_at DESC);

-- notification_template
CREATE INDEX idx_notification_template_tenant_id ON hr_notification.notification_template (tenant_id);
CREATE INDEX idx_notification_template_type      ON hr_notification.notification_template (tenant_id, notification_type);
CREATE INDEX idx_notification_template_channel   ON hr_notification.notification_template (tenant_id, channel);

-- notification_preference
CREATE INDEX idx_notification_preference_tenant_id ON hr_notification.notification_preference (tenant_id);
CREATE INDEX idx_notification_preference_user_id   ON hr_notification.notification_preference (tenant_id, user_id);

-- ---------------------------------------------------------------------------
-- 4. Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE hr_notification.notification           ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_notification.notification           FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_notification.notification_template   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_notification.notification_template   FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_notification.notification_preference ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_notification.notification_preference FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. RLS Policies
-- ---------------------------------------------------------------------------

CREATE POLICY tenant_isolation_notification ON hr_notification.notification
    FOR ALL
    USING (
        hr_notification.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_notification.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_notification.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_notification.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_notification_template ON hr_notification.notification_template
    FOR ALL
    USING (
        hr_notification.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_notification.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_notification.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_notification.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_notification_preference ON hr_notification.notification_preference
    FOR ALL
    USING (
        hr_notification.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_notification.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_notification.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_notification.get_current_tenant_safe()
    );

-- ---------------------------------------------------------------------------
-- 6. BRIN Index (time-series optimization)
-- ---------------------------------------------------------------------------

-- BRIN index: notification created_at for date range scans
-- (inbox pagination, unread count queries, retention policy cleanup)
CREATE INDEX idx_notification_created_at_brin
    ON hr_notification.notification USING BRIN (created_at);
