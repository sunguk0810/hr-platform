package com.hrsaas.employee.service;

import java.util.UUID;

/**
 * Service for validating organization references (department, position, grade)
 * against the organization-service. Best-effort validation.
 */
public interface OrganizationValidationService {

    void validateDepartment(UUID departmentId);

    void validatePosition(String positionCode);

    void validateGrade(String jobTitleCode);
}
