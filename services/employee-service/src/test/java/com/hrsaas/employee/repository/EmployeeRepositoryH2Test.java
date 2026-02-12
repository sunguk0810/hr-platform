package com.hrsaas.employee.repository;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.jdbc.Sql;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.sql.init.mode=always",
    "spring.sql.init.platform=h2",
    "spring.sql.init.schema-locations=classpath:h2-schema.sql",
    "spring.flyway.enabled=false"
})
class EmployeeRepositoryH2Test {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TestEntityManager entityManager;

    private static final UUID TENANT_A = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID TENANT_B = UUID.fromString("00000000-0000-0000-0000-000000000002");

    @BeforeEach
    void setUp() {
        TenantContext.setCurrentTenant(TENANT_A);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("재입사 직원 조회 - 퇴사일 기준 최신 직원 반환 (H2)")
    void findTopResignedEmployee_returnsMostRecentByResignDate() {
        // given
        LocalDate birthDate = LocalDate.of(1990, 1, 1);
        String name = "RehireTarget";

        // 1. Old resigned employee
        Employee oldResigned = createEmployee(TENANT_A, name, "OLD-001");
        oldResigned.setBirthDate(birthDate);
        oldResigned.setStatus(EmployeeStatus.RESIGNED);
        oldResigned.setResignDate(LocalDate.of(2023, 1, 1));
        entityManager.persist(oldResigned);

        // 2. Recent resigned employee (should be returned)
        Employee recentResigned = createEmployee(TENANT_A, name, "RECENT-001");
        recentResigned.setBirthDate(birthDate);
        recentResigned.setStatus(EmployeeStatus.RESIGNED);
        recentResigned.setResignDate(LocalDate.of(2024, 1, 1));
        entityManager.persist(recentResigned);

        // 3. Active employee with same details (should be ignored)
        Employee active = createEmployee(TENANT_A, name, "ACTIVE-001");
        active.setBirthDate(birthDate);
        active.setStatus(EmployeeStatus.ACTIVE);
        entityManager.persist(active);

        // 4. Different employee (should be ignored)
        Employee other = createEmployee(TENANT_A, "Other", "OTHER-001");
        other.setBirthDate(birthDate);
        other.setStatus(EmployeeStatus.RESIGNED);
        other.setResignDate(LocalDate.of(2025, 1, 1));
        entityManager.persist(other);

        // 5. Employee from another tenant (should be ignored)
        TenantContext.setCurrentTenant(TENANT_B);
        Employee tenantBEmployee = createEmployee(TENANT_B, name, "TENANT-B-001");
        tenantBEmployee.setBirthDate(birthDate);
        tenantBEmployee.setStatus(EmployeeStatus.RESIGNED);
        tenantBEmployee.setResignDate(LocalDate.of(2026, 1, 1));
        entityManager.persist(tenantBEmployee);

        TenantContext.setCurrentTenant(TENANT_A); // Reset to Tenant A

        entityManager.flush();

        // when
        Optional<Employee> result = employeeRepository.findTopByTenantIdAndNameAndBirthDateAndStatusOrderByResignDateDesc(
            TENANT_A, name, birthDate, EmployeeStatus.RESIGNED
        );

        // then
        assertThat(result).isPresent();
        assertThat(result.get().getEmployeeNumber()).isEqualTo("RECENT-001");
    }

    private Employee createEmployee(UUID tenantId, String name, String empNumber) {
        Employee emp = Employee.builder()
                .employeeNumber(empNumber)
                .name(name)
                .email(empNumber.toLowerCase() + "@test.com")
                .hireDate(LocalDate.now())
                .build();
        emp.setCreatedAt(Instant.now());
        emp.setUpdatedAt(Instant.now());
        // Since we manually persist with entityManager, the TenantAwareEntity listener might fail if not configured.
        // But we set TenantContext globally.
        // We also manually set tenantId if setter is available (TenantAwareEntity usually has setter via lombok or protected).
        emp.setTenantId(tenantId);
        emp.setStatus(EmployeeStatus.ACTIVE);
        return emp;
    }
}
