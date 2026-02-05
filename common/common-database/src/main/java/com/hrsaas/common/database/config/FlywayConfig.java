package com.hrsaas.common.database.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.flyway.FlywayProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Flyway migration configuration.
 */
@Configuration
@ConditionalOnProperty(name = "spring.flyway.enabled", havingValue = "true", matchIfMissing = false)
public class FlywayConfig {

    @Bean
    @ConfigurationProperties("spring.flyway")
    public FlywayProperties flywayProperties() {
        return new FlywayProperties();
    }

    @Bean
    public Flyway flyway(DataSource dataSource, FlywayProperties properties) {
        Flyway flyway = Flyway.configure()
            .dataSource(dataSource)
            .locations(properties.getLocations().toArray(new String[0]))
            .schemas(properties.getSchemas().toArray(new String[0]))
            .baselineOnMigrate(true)
            .validateOnMigrate(false)  // Disable validation for multi-service schema
            .outOfOrder(true)
            .ignoreMigrationPatterns("*:missing", "*:ignored")
            .load();

        // Run migrations
        flyway.migrate();

        return flyway;
    }
}
