package com.hrsaas.common.database.config;

import com.hrsaas.common.database.rls.TenantAwareDataSource;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;

/**
 * Database configuration with tenant-aware connection handling.
 */
@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    @ConfigurationProperties("spring.datasource")
    public DataSourceProperties dataSourceProperties() {
        return new DataSourceProperties();
    }

    @Bean
    @ConfigurationProperties("spring.datasource.hikari")
    public HikariDataSource hikariDataSource(DataSourceProperties properties) {
        return properties.initializeDataSourceBuilder()
            .type(HikariDataSource.class)
            .build();
    }

    @Bean
    @Primary
    public DataSource dataSource(HikariDataSource hikariDataSource) {
        return new TenantAwareDataSource(hikariDataSource);
    }
}
