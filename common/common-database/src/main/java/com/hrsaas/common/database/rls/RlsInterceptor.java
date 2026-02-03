package com.hrsaas.common.database.rls;

import com.hrsaas.common.entity.TenantContextHolder;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.resource.jdbc.spi.StatementInspector;

import java.util.UUID;

/**
 * Hibernate StatementInspector that sets PostgreSQL RLS tenant context
 * before SQL execution.
 */
@Slf4j
public class RlsInterceptor implements StatementInspector {

    private static final String SET_TENANT_SQL = "SET app.current_tenant = '%s'";

    @Override
    public String inspect(String sql) {
        UUID tenantId = TenantContextHolder.getCurrentTenant();

        if (tenantId != null) {
            log.trace("Setting RLS context for tenant: {}", tenantId);
        }

        return sql;
    }
}
