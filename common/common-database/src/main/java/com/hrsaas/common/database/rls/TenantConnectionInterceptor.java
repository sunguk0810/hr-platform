package com.hrsaas.common.database.rls;

import com.hrsaas.common.entity.TenantContextHolder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.datasource.ConnectionProxy;
import org.springframework.lang.NonNull;

import java.lang.reflect.InvocationHandler;
import java.lang.reflect.Method;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

/**
 * Connection proxy handler that sets PostgreSQL RLS context.
 */
@Slf4j
public class TenantConnectionInterceptor implements InvocationHandler {

    private static final String SET_TENANT_SQL = "SET app.current_tenant = '%s'";
    private static final String CLEAR_TENANT_SQL = "RESET app.current_tenant";

    private final Connection target;
    private boolean tenantSet = false;

    public TenantConnectionInterceptor(Connection target) {
        this.target = target;
    }

    public static Connection createProxy(Connection connection) {
        return (Connection) Proxy.newProxyInstance(
            ConnectionProxy.class.getClassLoader(),
            new Class<?>[]{ConnectionProxy.class},
            new TenantConnectionInterceptor(connection)
        );
    }

    @Override
    public Object invoke(Object proxy, @NonNull Method method, Object[] args) throws Throwable {
        if ("prepareStatement".equals(method.getName()) ||
            "createStatement".equals(method.getName())) {
            setTenantContext();
        }

        if ("close".equals(method.getName())) {
            clearTenantContext();
        }

        return method.invoke(target, args);
    }

    private void setTenantContext() {
        if (tenantSet) {
            return;
        }

        UUID tenantId = TenantContextHolder.getCurrentTenant();
        if (tenantId != null) {
            try (Statement stmt = target.createStatement()) {
                String sql = String.format(SET_TENANT_SQL, tenantId);
                stmt.execute(sql);
                tenantSet = true;
                log.trace("RLS tenant context set: {}", tenantId);
            } catch (SQLException e) {
                log.error("Failed to set RLS tenant context", e);
            }
        }
    }

    private void clearTenantContext() {
        if (!tenantSet) {
            return;
        }

        try (Statement stmt = target.createStatement()) {
            stmt.execute(CLEAR_TENANT_SQL);
            tenantSet = false;
            log.trace("RLS tenant context cleared");
        } catch (SQLException e) {
            log.error("Failed to clear RLS tenant context", e);
        }
    }
}
