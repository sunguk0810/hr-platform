package com.hrsaas.auth.client;

import com.hrsaas.common.security.client.EmployeeServiceClient;
import com.hrsaas.common.security.dto.EmployeeAffiliationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Adapter that bridges common-security EmployeeServiceClient to auth-service Feign client.
 */
@Component
@RequiredArgsConstructor
public class SecurityEmployeeServiceClientAdapter implements EmployeeServiceClient {

    private final com.hrsaas.auth.client.EmployeeServiceClient employeeServiceClient;

    @Override
    public EmployeeAffiliationDto getAffiliation(UUID employeeId) {
        var response = employeeServiceClient.getEmployee(employeeId);
        var employee = response != null ? response.getData() : null;

        if (employee == null) {
            return null;
        }

        return new EmployeeAffiliationDto(employee.departmentId(), employee.teamId());
    }
}
