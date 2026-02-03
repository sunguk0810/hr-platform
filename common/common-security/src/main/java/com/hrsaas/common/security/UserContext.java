package com.hrsaas.common.security;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

/**
 * Authenticated user context information.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserContext {

    private UUID userId;
    private UUID tenantId;
    private UUID employeeId;
    private String username;
    private String email;
    private Set<String> roles;
    private Set<String> permissions;
}
