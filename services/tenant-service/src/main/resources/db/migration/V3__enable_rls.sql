-- V3: Enable Row Level Security on tenant-related tables
-- Note: tenant table does NOT have RLS (managed by SUPER_ADMIN only)
-- tenant_policy and tenant_feature have tenant_id and need RLS

-- Enable RLS on tenant_policy table
ALTER TABLE tenant_common.tenant_policy ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.tenant_policy FORCE ROW LEVEL SECURITY;

-- Enable RLS on tenant_feature table
ALTER TABLE tenant_common.tenant_feature ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.tenant_feature FORCE ROW LEVEL SECURITY;
