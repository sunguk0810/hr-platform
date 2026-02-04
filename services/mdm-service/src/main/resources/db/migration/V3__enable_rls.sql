-- Enable Row Level Security on MDM tables
-- Note: MDM has special behavior where tenant_id=NULL means system codes visible to all tenants

-- code_group (tenant_id can be NULL for system codes)
ALTER TABLE tenant_common.code_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.code_group FORCE ROW LEVEL SECURITY;

-- common_code (tenant_id can be NULL for system codes)
ALTER TABLE tenant_common.common_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.common_code FORCE ROW LEVEL SECURITY;

-- code_tenant_mapping (tenant_id is always required)
ALTER TABLE tenant_common.code_tenant_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.code_tenant_mapping FORCE ROW LEVEL SECURITY;

-- code_history (tenant_id can be NULL for system code changes)
ALTER TABLE tenant_common.code_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_common.code_history FORCE ROW LEVEL SECURITY;
