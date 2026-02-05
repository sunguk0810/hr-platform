package com.hrsaas.employee.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * DTO for tenant information received from Tenant Service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TenantClientResponse {
    private UUID id;
    private String code;
    private String name;
    private String status;
}
