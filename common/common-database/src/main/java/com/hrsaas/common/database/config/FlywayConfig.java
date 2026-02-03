package com.hrsaas.common.database.config;

import org.flywaydb.core.Flyway;
import org.springframework.boot.autoconfigure.flyway.FlywayProperties;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

/**
 * Flyway migration configuration.
 */
@Configuration
public class FlywayConfig {

    @Bean
    @ConfigurationProperties("spring.flyway")
    public FlywayProperties flywayProperties() {
        return new FlywayProperties();
    }

    @Bean
    public Flyway flyway(DataSource dataSource, FlywayProperties properties) {
        return Flyway.configure()
            .dataSource(dataSource)
            .locations(properties.getLocations().toArray(new String[0]))
            .baselineOnMigrate(properties.isBaselineOnMigrate())
            .validateOnMigrate(properties.isValidateOnMigrate())
            .outOfOrder(properties.isOutOfOrder())
            .load();
    }
}
