package com.hrsaas.common.database.test;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

/**
 * Base class for repository integration tests using Testcontainers.
 * Provides PostgreSQL container, tenant context management, and common utilities.
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@EnabledIf("isDockerAvailable")
public abstract class AbstractRepositoryTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("hr_saas_test")
            .withUsername("test")
            .withPassword("test")
            .withInitScript("test-init.sql");

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    protected static final UUID TENANT_A = UUID.fromString("00000000-0000-0000-0000-000000000001");
    protected static final UUID TENANT_B = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @BeforeEach
    void setUpTenantContext() {
        setTenantContext(TENANT_A);
    }

    @AfterEach
    void clearTenantContext() {
        jdbcTemplate.execute("SET app.current_tenant = '00000000-0000-0000-0000-000000000000'");
    }

    protected void setTenantContext(UUID tenantId) {
        jdbcTemplate.execute("SET app.current_tenant = '" + tenantId + "'");
    }

    static boolean isDockerAvailable() {
        try {
            ProcessBuilder pb = new ProcessBuilder("docker", "info");
            pb.redirectErrorStream(true);
            Process process = pb.start();
            return process.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }
}
