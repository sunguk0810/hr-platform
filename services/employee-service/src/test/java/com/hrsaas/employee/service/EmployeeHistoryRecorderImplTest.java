package com.hrsaas.employee.service;

import com.hrsaas.common.tenant.TenantContext;
import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeHistory;
import com.hrsaas.employee.domain.entity.HistoryChangeType;
import com.hrsaas.employee.repository.EmployeeHistoryRepository;
import com.hrsaas.employee.service.impl.EmployeeHistoryRecorderImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeHistoryRecorderImplTest {

    @Mock
    private EmployeeHistoryRepository employeeHistoryRepository;

    @InjectMocks
    private EmployeeHistoryRecorderImpl historyRecorder;

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
            .email("hong@example.com")
            .departmentId(UUID.randomUUID())
            .positionCode("TL")
            .jobTitleCode("G03")
            .hireDate(LocalDate.of(2026, 1, 15))
            .build();
        setEntityId(employee, employeeId);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void recordDepartmentChange_createsHistory() {
        UUID oldDeptId = UUID.randomUUID();
        UUID newDeptId = UUID.randomUUID();
        String reason = "조직 개편";

        when(employeeHistoryRepository.save(any(EmployeeHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        historyRecorder.recordDepartmentChange(employee, oldDeptId, newDeptId, reason);

        ArgumentCaptor<EmployeeHistory> captor = ArgumentCaptor.forClass(EmployeeHistory.class);
        verify(employeeHistoryRepository).save(captor.capture());

        EmployeeHistory history = captor.getValue();
        assertThat(history.getEmployeeId()).isEqualTo(employeeId);
        assertThat(history.getChangeType()).isEqualTo(HistoryChangeType.TRANSFER);
        assertThat(history.getFromDepartmentId()).isEqualTo(oldDeptId);
        assertThat(history.getToDepartmentId()).isEqualTo(newDeptId);
        assertThat(history.getEffectiveDate()).isEqualTo(LocalDate.now());
        assertThat(history.getReason()).isEqualTo(reason);
    }

    @Test
    void recordPositionChange_createsHistory() {
        String oldCode = "TL";
        String newCode = "MGR";
        String reason = "승진";

        when(employeeHistoryRepository.save(any(EmployeeHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        historyRecorder.recordPositionChange(employee, oldCode, newCode, reason);

        ArgumentCaptor<EmployeeHistory> captor = ArgumentCaptor.forClass(EmployeeHistory.class);
        verify(employeeHistoryRepository).save(captor.capture());

        EmployeeHistory history = captor.getValue();
        assertThat(history.getEmployeeId()).isEqualTo(employeeId);
        assertThat(history.getChangeType()).isEqualTo(HistoryChangeType.POSITION_CHANGE);
        assertThat(history.getFromPositionCode()).isEqualTo(oldCode);
        assertThat(history.getToPositionCode()).isEqualTo(newCode);
        assertThat(history.getEffectiveDate()).isEqualTo(LocalDate.now());
        assertThat(history.getReason()).isEqualTo(reason);
    }

    @Test
    void recordGradeChange_createsHistory() {
        String oldCode = "G03";
        String newCode = "G04";
        String reason = "직급 조정";

        when(employeeHistoryRepository.save(any(EmployeeHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        historyRecorder.recordGradeChange(employee, oldCode, newCode, reason);

        ArgumentCaptor<EmployeeHistory> captor = ArgumentCaptor.forClass(EmployeeHistory.class);
        verify(employeeHistoryRepository).save(captor.capture());

        EmployeeHistory history = captor.getValue();
        assertThat(history.getEmployeeId()).isEqualTo(employeeId);
        assertThat(history.getChangeType()).isEqualTo(HistoryChangeType.GRADE_CHANGE);
        assertThat(history.getFromGradeCode()).isEqualTo(oldCode);
        assertThat(history.getToGradeCode()).isEqualTo(newCode);
        assertThat(history.getEffectiveDate()).isEqualTo(LocalDate.now());
        assertThat(history.getReason()).isEqualTo(reason);
    }

    @Test
    void recordHire_createsHistory() {
        String reason = "신입 사원 입사";

        when(employeeHistoryRepository.save(any(EmployeeHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        historyRecorder.recordHire(employee, reason);

        ArgumentCaptor<EmployeeHistory> captor = ArgumentCaptor.forClass(EmployeeHistory.class);
        verify(employeeHistoryRepository).save(captor.capture());

        EmployeeHistory history = captor.getValue();
        assertThat(history.getEmployeeId()).isEqualTo(employeeId);
        assertThat(history.getChangeType()).isEqualTo(HistoryChangeType.HIRE);
        assertThat(history.getToDepartmentId()).isEqualTo(employee.getDepartmentId());
        assertThat(history.getToPositionCode()).isEqualTo(employee.getPositionCode());
        assertThat(history.getToGradeCode()).isEqualTo(employee.getJobTitleCode());
        assertThat(history.getEffectiveDate()).isEqualTo(employee.getHireDate());
        assertThat(history.getReason()).isEqualTo(reason);
    }

    @Test
    void recordResign_createsHistory() {
        String reason = "개인 사유";
        LocalDate resignDate = LocalDate.of(2026, 12, 31);
        employee.resign(resignDate);

        when(employeeHistoryRepository.save(any(EmployeeHistory.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        historyRecorder.recordResign(employee, reason);

        ArgumentCaptor<EmployeeHistory> captor = ArgumentCaptor.forClass(EmployeeHistory.class);
        verify(employeeHistoryRepository).save(captor.capture());

        EmployeeHistory history = captor.getValue();
        assertThat(history.getEmployeeId()).isEqualTo(employeeId);
        assertThat(history.getChangeType()).isEqualTo(HistoryChangeType.RESIGN);
        assertThat(history.getFromDepartmentId()).isEqualTo(employee.getDepartmentId());
        assertThat(history.getFromPositionCode()).isEqualTo(employee.getPositionCode());
        assertThat(history.getFromGradeCode()).isEqualTo(employee.getJobTitleCode());
        assertThat(history.getEffectiveDate()).isEqualTo(resignDate);
        assertThat(history.getReason()).isEqualTo(reason);
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
