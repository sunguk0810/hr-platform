package com.hrsaas.employee.service;

import com.hrsaas.common.core.exception.NotFoundException;
import com.hrsaas.common.core.exception.ValidationException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeStatus;
import com.hrsaas.employee.repository.EmployeeRepository;
import com.hrsaas.employee.service.impl.EmployeeServiceImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceImplTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @Mock
    private EventPublisher eventPublisher;

    @InjectMocks
    private EmployeeServiceImpl employeeService;

    private UUID tenantId;
    private UUID employeeId;
    private Employee employee;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        employeeId = UUID.randomUUID();
        TenantContext.setCurrentTenant(tenantId);

        employee = Employee.builder()
            .employeeNumber("EMP-2026-0001")
            .name("홍길동")
            .nameEn("Hong Gildong")
            .email("hong@example.com")
            .phone("02-1234-5678")
            .mobile("010-1234-5678")
            .hireDate(LocalDate.of(2026, 1, 1))
            .build();
        setEntityId(employee, employeeId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    // --- Soft Delete Tests ---

    @Test
    void delete_softDeletes_setsStatusResigned() {
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(employeeRepository.save(any(Employee.class))).thenReturn(employee);

        employeeService.delete(employeeId);

        assertThat(employee.getStatus()).isEqualTo(EmployeeStatus.RESIGNED);
        verify(employeeRepository, never()).delete(any(Employee.class));
        verify(employeeRepository).save(employee);
    }

    @Test
    void delete_setsResignDateToToday() {
        when(employeeRepository.findById(employeeId)).thenReturn(Optional.of(employee));
        when(employeeRepository.save(any(Employee.class))).thenReturn(employee);

        employeeService.delete(employeeId);

        assertThat(employee.getResignDate()).isEqualTo(LocalDate.now());
    }

    @Test
    void bulkDelete_allSoftDeleted() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        Employee emp1 = createEmployee(id1, "EMP-001");
        Employee emp2 = createEmployee(id2, "EMP-002");

        when(employeeRepository.findById(id1)).thenReturn(Optional.of(emp1));
        when(employeeRepository.findById(id2)).thenReturn(Optional.of(emp2));
        when(employeeRepository.save(any(Employee.class))).thenAnswer(i -> i.getArgument(0));

        int result = employeeService.bulkDelete(List.of(id1, id2));

        assertThat(result).isEqualTo(2);
        assertThat(emp1.getStatus()).isEqualTo(EmployeeStatus.RESIGNED);
        assertThat(emp2.getStatus()).isEqualTo(EmployeeStatus.RESIGNED);
        verify(employeeRepository, never()).delete(any(Employee.class));
    }

    @Test
    void bulkDelete_someNotFound_partialSuccess() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        Employee emp1 = createEmployee(id1, "EMP-001");

        when(employeeRepository.findById(id1)).thenReturn(Optional.of(emp1));
        when(employeeRepository.findById(id2)).thenReturn(Optional.empty());
        when(employeeRepository.save(any(Employee.class))).thenAnswer(i -> i.getArgument(0));

        int result = employeeService.bulkDelete(List.of(id1, id2));

        assertThat(result).isEqualTo(1);
        assertThat(emp1.getStatus()).isEqualTo(EmployeeStatus.RESIGNED);
    }

    // --- Count Tests ---

    @Test
    void countByDepartment_returnsCount() {
        UUID departmentId = UUID.randomUUID();
        when(employeeRepository.countByDepartmentIdAndTenantId(departmentId, tenantId)).thenReturn(5L);

        long count = employeeService.countByDepartment(departmentId);

        assertThat(count).isEqualTo(5);
    }

    @Test
    void countByPosition_returnsCount() {
        when(employeeRepository.countByPositionCodeAndTenantId("TL", tenantId)).thenReturn(3L);

        long count = employeeService.countByPosition("TL");

        assertThat(count).isEqualTo(3);
    }

    @Test
    void countByGrade_returnsCount() {
        when(employeeRepository.countByJobTitleCodeAndTenantId("G3", tenantId)).thenReturn(10L);

        long count = employeeService.countByGrade("G3");

        assertThat(count).isEqualTo(10);
    }

    @Test
    void existsById_exists_returnsTrue() {
        when(employeeRepository.existsById(employeeId)).thenReturn(true);

        boolean result = employeeService.existsById(employeeId);

        assertThat(result).isTrue();
    }

    // --- Helper Methods ---

    private Employee createEmployee(UUID id, String empNo) {
        Employee emp = Employee.builder()
            .employeeNumber(empNo)
            .name("Test")
            .email(empNo + "@test.com")
            .hireDate(LocalDate.now())
            .build();
        setEntityId(emp, id);
        return emp;
    }

    private void setEntityId(Object entity, UUID id) {
        try {
            var field = findField(entity.getClass(), "id");
            field.setAccessible(true);
            field.set(entity, id);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set entity ID", e);
        }
    }

    private java.lang.reflect.Field findField(Class<?> clazz, String fieldName) {
        Class<?> current = clazz;
        while (current != null) {
            try {
                return current.getDeclaredField(fieldName);
            } catch (NoSuchFieldException e) {
                current = current.getSuperclass();
            }
        }
        throw new RuntimeException("Field not found: " + fieldName);
    }
}
