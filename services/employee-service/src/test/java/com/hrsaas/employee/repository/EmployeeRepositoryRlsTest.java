package com.hrsaas.employee.repository;

import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeStatus;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * RLS (Row Level Security) 통합 테스트.
 * PostgreSQL Testcontainer를 사용하여 실제 RLS 정책이 올바르게 동작하는지 검증합니다.
 */
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@EnabledIf(value = "isDockerAvailable", disabledReason = "Docker is not available")
@DisplayName("Employee Repository RLS Tests")
class EmployeeRepositoryRlsTest {

    static boolean isDockerAvailable() {
        try {
            return DockerClientFactory.instance().isDockerAvailable();
        } catch (Exception e) {
            return false;
        }
    }

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
        .withDatabaseName("testdb")
        .withUsername("test")
        .withPassword("test")
        .withInitScript("db/init-rls.sql");

    @DynamicPropertySource
    static void registerProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
    }

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final UUID TENANT_A = UUID.randomUUID();
    private static final UUID TENANT_B = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        // Clear any existing tenant context
        jdbcTemplate.execute("SELECT set_config('app.current_tenant', '', false)");
    }

    @AfterEach
    void tearDown() {
        // Clear tenant context
        jdbcTemplate.execute("SELECT set_config('app.current_tenant', '', false)");
    }

    @Nested
    @DisplayName("Tenant Isolation Tests")
    class TenantIsolation {

        @Test
        @DisplayName("테넌트 A 컨텍스트: 테넌트 A 데이터만 조회")
        void findAll_tenantAContext_returnOnlyTenantAData() {
            // Given: 테넌트 A, B에 각각 직원 생성
            Employee employeeA = createEmployee("EMP-A-001", "직원A", TENANT_A);
            Employee employeeB = createEmployee("EMP-B-001", "직원B", TENANT_B);

            // 컨텍스트 없이 저장 (직접 SQL 사용)
            saveEmployeeDirectly(employeeA);
            saveEmployeeDirectly(employeeB);

            // When: 테넌트 A 컨텍스트 설정 후 조회
            setTenantContext(TENANT_A);
            List<Employee> results = employeeRepository.findAll();

            // Then: 테넌트 A 데이터만 조회됨
            assertThat(results)
                .hasSize(1)
                .allMatch(e -> e.getTenantId().equals(TENANT_A));
        }

        @Test
        @DisplayName("테넌트 B 컨텍스트: 테넌트 B 데이터만 조회")
        void findAll_tenantBContext_returnOnlyTenantBData() {
            // Given: 테넌트 A, B에 각각 직원 생성
            Employee employeeA = createEmployee("EMP-A-002", "직원A", TENANT_A);
            Employee employeeB = createEmployee("EMP-B-002", "직원B", TENANT_B);

            saveEmployeeDirectly(employeeA);
            saveEmployeeDirectly(employeeB);

            // When: 테넌트 B 컨텍스트 설정 후 조회
            setTenantContext(TENANT_B);
            List<Employee> results = employeeRepository.findAll();

            // Then: 테넌트 B 데이터만 조회됨
            assertThat(results)
                .hasSize(1)
                .allMatch(e -> e.getTenantId().equals(TENANT_B));
        }

        @Test
        @DisplayName("컨텍스트 없음: 모든 데이터 조회 (슈퍼 관리자)")
        void findAll_noContext_returnAllData() {
            // Given: 테넌트 A, B에 각각 직원 생성
            Employee employeeA = createEmployee("EMP-A-003", "직원A", TENANT_A);
            Employee employeeB = createEmployee("EMP-B-003", "직원B", TENANT_B);

            saveEmployeeDirectly(employeeA);
            saveEmployeeDirectly(employeeB);

            // When: 컨텍스트 없이 조회 (슈퍼 관리자 시나리오)
            // Note: RLS 정책에서 get_current_tenant_safe() IS NULL인 경우 모든 데이터 허용
            List<Employee> results = employeeRepository.findAll();

            // Then: 모든 데이터 조회됨
            assertThat(results).hasSizeGreaterThanOrEqualTo(2);
        }
    }

    @Nested
    @DisplayName("Data Modification Tests")
    class DataModification {

        @Test
        @DisplayName("테넌트 A 컨텍스트: 테넌트 A 데이터만 수정 가능")
        void update_tenantAContext_canOnlyUpdateTenantAData() {
            // Given: 테넌트 A 직원
            Employee employeeA = createEmployee("EMP-A-004", "직원A", TENANT_A);
            saveEmployeeDirectly(employeeA);

            // When: 테넌트 A 컨텍스트에서 수정
            setTenantContext(TENANT_A);
            Employee found = employeeRepository.findByEmployeeNumberAndTenantId("EMP-A-004", TENANT_A).orElse(null);

            // Then
            assertThat(found).isNotNull();
            found.setName("수정된 직원A");
            Employee updated = employeeRepository.save(found);
            assertThat(updated.getName()).isEqualTo("수정된 직원A");
        }

        @Test
        @DisplayName("테넌트 B 컨텍스트: 테넌트 A 데이터 조회 불가")
        void find_tenantBContext_cannotAccessTenantAData() {
            // Given: 테넌트 A 직원
            Employee employeeA = createEmployee("EMP-A-005", "직원A", TENANT_A);
            saveEmployeeDirectly(employeeA);

            // When: 테넌트 B 컨텍스트에서 조회 (RLS가 tenant_id 필터링)
            setTenantContext(TENANT_B);
            var found = employeeRepository.findByEmployeeNumberAndTenantId("EMP-A-005", TENANT_A);

            // Then: RLS 정책에 의해 조회되지 않음 (테넌트 B 컨텍스트에서 테넌트 A 데이터 접근 불가)
            assertThat(found).isEmpty();
        }
    }

    private Employee createEmployee(String employeeNumber, String name, UUID tenantId) {
        Employee employee = Employee.builder()
            .employeeNumber(employeeNumber)
            .name(name)
            .email(employeeNumber.toLowerCase() + "@test.com")
            .hireDate(LocalDate.now())
            .build();
        employee.setTenantId(tenantId);
        employee.setStatus(EmployeeStatus.ACTIVE);
        return employee;
    }

    private void saveEmployeeDirectly(Employee employee) {
        // RLS를 우회하여 직접 저장 (테스트 데이터 설정용)
        jdbcTemplate.update("""
            INSERT INTO hr_core.employee
            (id, tenant_id, employee_number, name, email, hire_date, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            """,
            employee.getId() != null ? employee.getId() : UUID.randomUUID(),
            employee.getTenantId(),
            employee.getEmployeeNumber(),
            employee.getName(),
            employee.getEmail(),
            employee.getHireDate(),
            employee.getStatus().name()
        );
    }

    private void setTenantContext(UUID tenantId) {
        jdbcTemplate.execute("SELECT set_config('app.current_tenant', '" + tenantId + "', false)");
    }
}
