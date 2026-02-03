package com.hrsaas.common.database.rls;

import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.datasource.DelegatingDataSource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;

/**
 * DataSource wrapper that creates tenant-aware connections.
 */
@Slf4j
public class TenantAwareDataSource extends DelegatingDataSource {

    public TenantAwareDataSource(DataSource targetDataSource) {
        super(targetDataSource);
    }

    @Override
    public Connection getConnection() throws SQLException {
        Connection connection = super.getConnection();
        return TenantConnectionInterceptor.createProxy(connection);
    }

    @Override
    public Connection getConnection(String username, String password) throws SQLException {
        Connection connection = super.getConnection(username, password);
        return TenantConnectionInterceptor.createProxy(connection);
    }
}
