-- Add termination tracking columns to tenant table
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ;
ALTER TABLE tenant_common.tenant ADD COLUMN IF NOT EXISTS data_retention_until TIMESTAMPTZ;

-- Add index for contract end date (used by scheduler queries)
CREATE INDEX IF NOT EXISTS idx_tenant_contract_end_date ON tenant_common.tenant(contract_end_date);

-- Add index for terminated_at (used by cleanup scheduler)
CREATE INDEX IF NOT EXISTS idx_tenant_terminated_at ON tenant_common.tenant(terminated_at);
