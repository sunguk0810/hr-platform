-- =============================================================================
-- Notification Service - V1 Initial Migration
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

-- notifications
CREATE TABLE hr_notification.notifications (
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

-- notification_templates
CREATE TABLE hr_notification.notification_templates (
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
    CONSTRAINT uq_notification_templates_tenant_code UNIQUE (tenant_id, code)
);

-- notification_preferences
CREATE TABLE hr_notification.notification_preferences (
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
    CONSTRAINT uq_notification_preferences_user_type_channel
        UNIQUE (tenant_id, user_id, notification_type, channel)
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------

-- notifications
CREATE INDEX idx_notifications_tenant_id       ON hr_notification.notifications (tenant_id);
CREATE INDEX idx_notifications_recipient_id    ON hr_notification.notifications (tenant_id, recipient_id);
CREATE INDEX idx_notifications_type            ON hr_notification.notifications (tenant_id, notification_type);
CREATE INDEX idx_notifications_channel         ON hr_notification.notifications (tenant_id, channel);
CREATE INDEX idx_notifications_is_read         ON hr_notification.notifications (tenant_id, recipient_id, is_read);
CREATE INDEX idx_notifications_is_sent         ON hr_notification.notifications (is_sent) WHERE is_sent = FALSE;
CREATE INDEX idx_notifications_reference       ON hr_notification.notifications (tenant_id, reference_type, reference_id);
CREATE INDEX idx_notifications_created_at      ON hr_notification.notifications (tenant_id, created_at DESC);

-- notification_templates
CREATE INDEX idx_notification_templates_tenant_id ON hr_notification.notification_templates (tenant_id);
CREATE INDEX idx_notification_templates_type      ON hr_notification.notification_templates (tenant_id, notification_type);
CREATE INDEX idx_notification_templates_channel   ON hr_notification.notification_templates (tenant_id, channel);

-- notification_preferences
CREATE INDEX idx_notification_preferences_tenant_id ON hr_notification.notification_preferences (tenant_id);
CREATE INDEX idx_notification_preferences_user_id   ON hr_notification.notification_preferences (tenant_id, user_id);

-- ---------------------------------------------------------------------------
-- 4. Enable RLS
-- ---------------------------------------------------------------------------

ALTER TABLE hr_notification.notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_notification.notifications           FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_notification.notification_templates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_notification.notification_templates   FORCE ROW LEVEL SECURITY;

ALTER TABLE hr_notification.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_notification.notification_preferences FORCE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 5. RLS Policies
-- ---------------------------------------------------------------------------

CREATE POLICY tenant_isolation_notifications ON hr_notification.notifications
    FOR ALL
    USING (
        hr_notification.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_notification.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_notification.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_notification.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_notification_templates ON hr_notification.notification_templates
    FOR ALL
    USING (
        hr_notification.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_notification.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_notification.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_notification.get_current_tenant_safe()
    );

CREATE POLICY tenant_isolation_notification_preferences ON hr_notification.notification_preferences
    FOR ALL
    USING (
        hr_notification.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_notification.get_current_tenant_safe()
    )
    WITH CHECK (
        hr_notification.get_current_tenant_safe() IS NULL
        OR tenant_id = hr_notification.get_current_tenant_safe()
    );
