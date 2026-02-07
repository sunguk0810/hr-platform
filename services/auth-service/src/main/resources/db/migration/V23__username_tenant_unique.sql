-- Change username uniqueness from global to per-tenant
ALTER TABLE tenant_common.users DROP CONSTRAINT IF EXISTS users_username_key;
ALTER TABLE tenant_common.users ADD CONSTRAINT uq_users_tenant_username UNIQUE(tenant_id, username);
