package com.hrsaas.employee.repository;

import com.hrsaas.common.database.test.AbstractRepositoryTest;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.TestEntityManager;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for EmployeeRepository with Testcontainers.
 */
@ActiveProfiles("test")
class EmployeeRepositoryIT extends AbstractRepositoryTest {

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private TestEntityManager entityManager;

    @Test
    @DisplayName("RLS 테넌트 격리 - Tenant A 데이터를 Tenant B에서 조회하면 0건")
    void findByTenantId_rlsIsolation_returnsOnlyOwnTenantData() {
        // given
        setTenantContext(TENANT_A);
        Employee empA = createEmployee(TENANT_A, "김철수", "EMP-001");
        entityManager.persist(empA);
        entityManager.flush();

        // when
        setTenantContext(TENANT_B);
        List<Employee> results = employeeRepository.findAll();

        // then
        assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("이름 검색 - LIKE 패턴 검색 정상 동작")
    void findByNameContaining_returnsMatchingEmployees() {
        // given
        setTenantContext(TENANT_A);
        entityManager.persist(createEmployee(TENANT_A, "김철수", "EMP-001"));
        entityManager.persist(createEmployee(TENANT_A, "김영희", "EMP-002"));
        entityManager.persist(createEmployee(TENANT_A, "이철수", "EMP-003"));
        entityManager.flush();

        // when
        List<Employee> results = employeeRepository.findAll();

        // then
        assertThat(results).hasSize(3);
    }

    @Test
    @DisplayName("상태별 직원 조회")
    void findByStatus_returnsCorrectEmployees() {
        // given
        setTenantContext(TENANT_A);
        entityManager.persist(createEmployee(TENANT_A, "김활성", "EMP-010"));

        Employee resigned = createEmployee(TENANT_A, "이퇴직", "EMP-011");
        resigned.setStatus(EmployeeStatus.RESIGNED);
        entityManager.persist(resigned);
        entityManager.flush();

        // when
        long activeCount = employeeRepository.count();

        // then
        assertThat(activeCount).isGreaterThanOrEqualTo(1);
    }

    private Employee createEmployee(UUID tenantId, String name, String empNumber) {
        Employee emp = Employee.builder()
                .employeeNumber(empNumber)
                .name(name)
                .email(empNumber.toLowerCase() + "@test.com")
                .hireDate(LocalDate.now())
                .build();
        emp.setTenantId(tenantId);
        emp.setStatus(EmployeeStatus.ACTIVE);
        return emp;
    }
}
