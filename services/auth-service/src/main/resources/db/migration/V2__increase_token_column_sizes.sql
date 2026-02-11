-- V2: Increase token column sizes to accommodate longer JWT tokens
-- JWT tokens can exceed 500 characters when they include detailed claims like permissions arrays

ALTER TABLE tenant_common.user_sessions
    ALTER COLUMN session_token TYPE VARCHAR(2000),
    ALTER COLUMN refresh_token TYPE VARCHAR(2000);

-- Update comments
COMMENT ON COLUMN tenant_common.user_sessions.session_token IS 'JWT access token (increased to 2000 for detailed claims)';
COMMENT ON COLUMN tenant_common.user_sessions.refresh_token IS 'JWT refresh token (increased to 2000)';
