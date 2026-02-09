package com.hrsaas.employee.service;

import com.hrsaas.employee.domain.entity.Employee;

import java.util.UUID;

/**
 * Service for automatically recording employee history changes.
 */
public interface EmployeeHistoryRecorder {

    void recordDepartmentChange(Employee employee, UUID oldDeptId, UUID newDeptId, String reason);

    void recordPositionChange(Employee employee, String oldCode, String newCode, String reason);

    void recordGradeChange(Employee employee, String oldCode, String newCode, String reason);

    void recordHire(Employee employee, String reason);

    void recordResign(Employee employee, String reason);
}
