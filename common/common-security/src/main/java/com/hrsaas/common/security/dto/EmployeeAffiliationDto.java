package com.hrsaas.common.security.dto;

import java.util.UUID;

public record EmployeeAffiliationDto(
    UUID departmentId,
    UUID teamId
) {}
