-- MFA (Multi-Factor Authentication) tables
CREATE TABLE IF NOT EXISTS tenant_common.user_mfa (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES tenant_common.users(id),
    mfa_type    VARCHAR(20) NOT NULL DEFAULT 'TOTP',
    secret_key  VARCHAR(255) NOT NULL,
    is_enabled  BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, mfa_type)
);

CREATE TABLE IF NOT EXISTS tenant_common.mfa_recovery_codes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES tenant_common.users(id),
    code       VARCHAR(20) NOT NULL,
    used_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_mfa_user_id ON tenant_common.user_mfa(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_recovery_codes_user_id ON tenant_common.mfa_recovery_codes(user_id);
