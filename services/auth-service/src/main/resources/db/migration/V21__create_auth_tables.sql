-- ============================================================================
-- V2__create_auth_tables.sql
-- Auth 서비스 테이블 생성
-- ============================================================================

-- 사용자 세션 테이블 (동시 로그인 관리)
CREATE TABLE IF NOT EXISTS tenant_common.user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    tenant_id UUID NOT NULL,
    session_token VARCHAR(500) NOT NULL UNIQUE,
    refresh_token VARCHAR(500),
    device_info VARCHAR(500),
    ip_address VARCHAR(45),
    user_agent TEXT,
    location VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON tenant_common.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_tenant_id ON tenant_common.user_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON tenant_common.user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON tenant_common.user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON tenant_common.user_sessions(is_active);

-- 비밀번호 재설정 토큰 테이블
CREATE TABLE IF NOT EXISTS tenant_common.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    is_used BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON tenant_common.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON tenant_common.password_reset_tokens(email);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON tenant_common.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON tenant_common.password_reset_tokens(expires_at);

-- 로그인 이력 테이블 (감사용)
CREATE TABLE IF NOT EXISTS tenant_common.login_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    tenant_id UUID,
    login_type VARCHAR(20) NOT NULL DEFAULT 'PASSWORD', -- PASSWORD, SSO, MFA
    status VARCHAR(20) NOT NULL, -- SUCCESS, FAILED, LOCKED
    ip_address VARCHAR(45),
    user_agent TEXT,
    location VARCHAR(200),
    failure_reason VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON tenant_common.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_tenant_id ON tenant_common.login_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_login_history_status ON tenant_common.login_history(status);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON tenant_common.login_history(created_at);

-- 계정 잠금 테이블
CREATE TABLE IF NOT EXISTS tenant_common.account_locks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL UNIQUE,
    failed_attempts INT DEFAULT 0,
    last_failed_at TIMESTAMP WITH TIME ZONE,
    locked_at TIMESTAMP WITH TIME ZONE,
    lock_expires_at TIMESTAMP WITH TIME ZONE,
    is_locked BOOLEAN DEFAULT FALSE,
    lock_reason VARCHAR(200),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_account_locks_user_id ON tenant_common.account_locks(user_id);
CREATE INDEX IF NOT EXISTS idx_account_locks_is_locked ON tenant_common.account_locks(is_locked);
