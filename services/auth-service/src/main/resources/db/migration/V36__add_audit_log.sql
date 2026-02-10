-- =============================================================================
-- V36: Add audit_log table for security audit trail
-- Addresses: AUTH-G01 (Audit Log module)
-- =============================================================================

SET search_path TO tenant_common, public;

CREATE TABLE IF NOT EXISTS tenant_common.audit_log (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id      UUID,
    actor_id       VARCHAR(100),
    actor_name     VARCHAR(200),
    action         VARCHAR(100) NOT NULL,
    resource_type  VARCHAR(100) NOT NULL,
    resource_id    VARCHAR(255),
    description    TEXT,
    ip_address     VARCHAR(45),
    user_agent     TEXT,
    status         VARCHAR(20) DEFAULT 'SUCCESS',
    error_message  TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index: tenant + time range for admin queries
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_created
    ON tenant_common.audit_log (tenant_id, created_at DESC);

-- Index: actor lookup
CREATE INDEX IF NOT EXISTS idx_audit_log_actor
    ON tenant_common.audit_log (tenant_id, actor_id, created_at DESC);

-- Index: action type filter
CREATE INDEX IF NOT EXISTS idx_audit_log_action
    ON tenant_common.audit_log (tenant_id, action, created_at DESC);
