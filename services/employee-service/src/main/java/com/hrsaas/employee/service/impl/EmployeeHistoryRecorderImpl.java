package com.hrsaas.employee.service.impl;

import com.hrsaas.employee.domain.entity.Employee;
import com.hrsaas.employee.domain.entity.EmployeeHistory;
import com.hrsaas.employee.domain.entity.HistoryChangeType;
import com.hrsaas.employee.repository.EmployeeHistoryRepository;
import com.hrsaas.employee.service.EmployeeHistoryRecorder;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmployeeHistoryRecorderImpl implements EmployeeHistoryRecorder {

    private final EmployeeHistoryRepository employeeHistoryRepository;

    @Override
    @Transactional
    public void recordDepartmentChange(Employee employee, UUID oldDeptId, UUID newDeptId, String reason) {
        EmployeeHistory history = EmployeeHistory.builder()
            .employeeId(employee.getId())
            .changeType(HistoryChangeType.TRANSFER)
            .fromDepartmentId(oldDeptId)
            .toDepartmentId(newDeptId)
            .effectiveDate(LocalDate.now())
            .reason(reason)
            .build();
        employeeHistoryRepository.save(history);
        log.info("Department change history recorded: employeeId={}", employee.getId());
    }

    @Override
    @Transactional
    public void recordPositionChange(Employee employee, String oldCode, String newCode, String reason) {
        EmployeeHistory history = EmployeeHistory.builder()
            .employeeId(employee.getId())
            .changeType(HistoryChangeType.POSITION_CHANGE)
            .fromPositionCode(oldCode)
            .toPositionCode(newCode)
            .effectiveDate(LocalDate.now())
            .reason(reason)
            .build();
        employeeHistoryRepository.save(history);
        log.info("Position change history recorded: employeeId={}", employee.getId());
    }

    @Override
    @Transactional
    public void recordGradeChange(Employee employee, String oldCode, String newCode, String reason) {
        EmployeeHistory history = EmployeeHistory.builder()
            .employeeId(employee.getId())
            .changeType(HistoryChangeType.GRADE_CHANGE)
            .fromGradeCode(oldCode)
            .toGradeCode(newCode)
            .effectiveDate(LocalDate.now())
            .reason(reason)
            .build();
        employeeHistoryRepository.save(history);
        log.info("Grade change history recorded: employeeId={}", employee.getId());
    }

    @Override
    @Transactional
    public void recordHire(Employee employee, String reason) {
        EmployeeHistory history = EmployeeHistory.builder()
            .employeeId(employee.getId())
            .changeType(HistoryChangeType.HIRE)
            .toDepartmentId(employee.getDepartmentId())
            .toPositionCode(employee.getPositionCode())
            .toGradeCode(employee.getJobTitleCode())
            .effectiveDate(employee.getHireDate() != null ? employee.getHireDate() : LocalDate.now())
            .reason(reason)
            .build();
        employeeHistoryRepository.save(history);
        log.info("Hire history recorded: employeeId={}", employee.getId());
    }

    @Override
    @Transactional
    public void recordResign(Employee employee, String reason) {
        EmployeeHistory history = EmployeeHistory.builder()
            .employeeId(employee.getId())
            .changeType(HistoryChangeType.RESIGN)
            .fromDepartmentId(employee.getDepartmentId())
            .fromPositionCode(employee.getPositionCode())
            .fromGradeCode(employee.getJobTitleCode())
            .effectiveDate(employee.getResignDate() != null ? employee.getResignDate() : LocalDate.now())
            .reason(reason)
            .build();
        employeeHistoryRepository.save(history);
        log.info("Resign history recorded: employeeId={}", employee.getId());
    }
}
