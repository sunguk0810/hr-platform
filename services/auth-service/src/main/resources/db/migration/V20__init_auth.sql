-- =============================================================================
-- V20__init_auth.sql
-- Consolidated migration for Auth Service (V20-V21)
-- Schema: tenant_common (created by init.sql)
-- =============================================================================

SET search_path TO tenant_common, public;

-- =============================================================================
-- 1. TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1.1 users
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.users (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id             UUID         NOT NULL,
    employee_id           UUID,
    username              VARCHAR(100) NOT NULL UNIQUE,
    email                 VARCHAR(255),
    password_hash         VARCHAR(255) NOT NULL,
    roles                 TEXT[]       NOT NULL DEFAULT '{}',
    permissions           TEXT[]       DEFAULT '{}',
    status                VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    failed_login_attempts INT          NOT NULL DEFAULT 0,
    locked_until          TIMESTAMPTZ,
    last_login_at         TIMESTAMPTZ,
    password_changed_at   TIMESTAMPTZ,
    created_at            TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by            VARCHAR(100),
    updated_by            VARCHAR(100),

    CONSTRAINT uq_users_tenant_email UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id   ON tenant_common.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_username     ON tenant_common.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email        ON tenant_common.users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id  ON tenant_common.users(employee_id);
CREATE INDEX IF NOT EXISTS idx_users_status       ON tenant_common.users(status);

-- -----------------------------------------------------------------------------
-- 1.2 user_sessions
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.user_sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          VARCHAR(100) NOT NULL,
    tenant_id        UUID         NOT NULL,
    session_token    VARCHAR(500) NOT NULL UNIQUE,
    refresh_token    VARCHAR(500),
    device_info      VARCHAR(500),
    ip_address       VARCHAR(45),
    user_agent       TEXT,
    location         VARCHAR(200),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMPTZ,
    expires_at       TIMESTAMPTZ  NOT NULL,
    is_active        BOOLEAN      DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id       ON tenant_common.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant_id     ON tenant_common.user_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON tenant_common.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at    ON tenant_common.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active     ON tenant_common.user_sessions(is_active);

-- -----------------------------------------------------------------------------
-- 1.3 password_reset_tokens
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.password_reset_tokens (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    VARCHAR(100) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    token      VARCHAR(500) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ  NOT NULL,
    used_at    TIMESTAMPTZ,
    is_used    BOOLEAN      DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id    ON tenant_common.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email      ON tenant_common.password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token      ON tenant_common.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON tenant_common.password_reset_tokens(expires_at);

-- -----------------------------------------------------------------------------
-- 1.4 login_history
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.login_history (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        VARCHAR(100) NOT NULL,
    tenant_id      UUID,
    login_type     VARCHAR(20)  NOT NULL DEFAULT 'PASSWORD',
    status         VARCHAR(20)  NOT NULL,
    ip_address     VARCHAR(45),
    user_agent     TEXT,
    location       VARCHAR(200),
    failure_reason VARCHAR(200),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id    ON tenant_common.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_tenant_id  ON tenant_common.login_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_login_history_status     ON tenant_common.login_history(status);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON tenant_common.login_history(created_at);

-- -----------------------------------------------------------------------------
-- 1.5 account_locks
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tenant_common.account_locks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         VARCHAR(100) NOT NULL UNIQUE,
    failed_attempts INT          DEFAULT 0,
    last_failed_at  TIMESTAMPTZ,
    locked_at       TIMESTAMPTZ,
    lock_expires_at TIMESTAMPTZ,
    is_locked       BOOLEAN      DEFAULT FALSE,
    lock_reason     VARCHAR(200),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_account_locks_user_id   ON tenant_common.account_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_account_locks_is_locked ON tenant_common.account_locks(is_locked);

-- =============================================================================
-- 2. NO RLS
-- Auth tables are managed by service-level logic, not tenant RLS.
-- =============================================================================

-- =============================================================================
-- 3. SEED DATA
-- =============================================================================

-- Seed default admin user (password: admin123!)
-- BCrypt hash of 'password!'
INSERT INTO tenant_common.users (id, tenant_id, username, email, password_hash, roles, permissions, status)
VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'admin@hrsaas.com',
    '$2a$12$loGZpPotBBOPqcvnxuUpCuvbPqmehTAH4XWDdqxy5vIPcL42ZYObW',
    ARRAY['SUPER_ADMIN', 'SYSTEM_ADMIN'],
    ARRAY['*'],
    'ACTIVE'
) ON CONFLICT (username) DO NOTHING;
