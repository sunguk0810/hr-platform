package com.hrsaas.common.security.client;

import com.hrsaas.common.security.dto.EmployeeAffiliationDto;

import java.util.UUID;

/**
 * Interface for looking up employee affiliation (department/team).
 * Services should provide an implementation (e.g., via Feign client).
 */
public interface EmployeeServiceClient {

    EmployeeAffiliationDto getAffiliation(UUID employeeId);
}
