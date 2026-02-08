package com.hrsaas.tenant.client.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateAdminRequest {

    private UUID tenantId;
    private String tenantCode;
    private String username;
    private String email;
    private String role;
}
