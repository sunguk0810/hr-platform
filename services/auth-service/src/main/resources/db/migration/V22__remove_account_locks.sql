-- Remove unused account_locks table (functionality replaced by UserEntity fields)
DROP TABLE IF EXISTS tenant_common.account_locks;
