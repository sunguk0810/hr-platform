-- Schema
CREATE SCHEMA IF NOT EXISTS tenant_common;
SET search_path TO tenant_common, public;

-- Users table
CREATE TABLE IF NOT EXISTS tenant_common.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    employee_id UUID,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    roles TEXT[] NOT NULL DEFAULT '{}',
    permissions TEXT[] DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ,
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- User sessions table
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
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS tenant_common.password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(500) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT FALSE
);

-- ============ SAMPLE DATA ============

-- 1. SUPER_ADMIN (password: admin123! -> BCrypt)
INSERT INTO tenant_common.users (id, tenant_id, employee_id, username, email, password_hash, roles, permissions, status)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'admin',
    'admin@hrsaas.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    ARRAY['SUPER_ADMIN'],
    ARRAY['*'],
    'ACTIVE'
);

-- 2. HR_ADMIN
INSERT INTO tenant_common.users (id, tenant_id, employee_id, username, email, password_hash, roles, permissions, status)
VALUES (
    '10000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000002',
    'hr_admin',
    'hradmin@hansung.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    ARRAY['HR_ADMIN'],
    ARRAY['employee:*', 'attendance:*', 'approval:*', 'organization:*'],
    'ACTIVE'
);

-- 3. EMPLOYEE
INSERT INTO tenant_common.users (id, tenant_id, employee_id, username, email, password_hash, roles, permissions, status)
VALUES (
    '10000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000003',
    'hong.gildong',
    'hong@hansung.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    ARRAY['EMPLOYEE'],
    ARRAY['employee:read:self', 'attendance:read:self'],
    'ACTIVE'
);

-- 4. TENANT_ADMIN (different tenant)
INSERT INTO tenant_common.users (id, tenant_id, employee_id, username, email, password_hash, roles, permissions, status)
VALUES (
    '10000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000004',
    'tenant_admin_mirae',
    'admin@mirae.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    ARRAY['TENANT_ADMIN'],
    ARRAY['*'],
    'ACTIVE'
);

-- 5. LOCKED user
INSERT INTO tenant_common.users (id, tenant_id, username, email, password_hash, roles, status, failed_login_attempts, locked_until)
VALUES (
    '10000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'locked_user',
    'locked@hansung.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    ARRAY['EMPLOYEE'],
    'LOCKED',
    5,
    CURRENT_TIMESTAMP + INTERVAL '1 hour'
);

-- 6. Sample sessions
INSERT INTO tenant_common.user_sessions (id, user_id, tenant_id, session_token, refresh_token, device_info, ip_address, location, last_accessed_at, expires_at, is_active)
VALUES
    ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'session-token-001', 'refresh-token-001', 'Chrome on Windows', '192.168.1.1', 'Seoul, South Korea',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '24 hours', true),
    ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001',
     'session-token-002', 'refresh-token-002', 'Safari on iPhone', '192.168.1.2', 'Seoul, South Korea',
     CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP + INTERVAL '23 hours', true);

-- 7. Sample password reset tokens
INSERT INTO tenant_common.password_reset_tokens (id, user_id, email, token, expires_at, is_used)
VALUES
    ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'hong@hansung.com',
     'valid-reset-token-001', CURRENT_TIMESTAMP + INTERVAL '1 hour', false),
    ('40000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'hong@hansung.com',
     'used-reset-token-001', CURRENT_TIMESTAMP - INTERVAL '1 hour', true);
