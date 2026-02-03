package com.hrsaas.common.security;

import org.springframework.security.oauth2.jwt.Jwt;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Utility class to extract claims from JWT token.
 */
public final class JwtClaimExtractor {

    private JwtClaimExtractor() {
        // Utility class
    }

    public static UserContext extractUserContext(Jwt jwt) {
        return UserContext.builder()
            .userId(extractUUID(jwt, "sub"))
            .tenantId(extractUUID(jwt, "tenant_id"))
            .employeeId(extractUUID(jwt, "employee_id"))
            .username(jwt.getClaimAsString("preferred_username"))
            .email(jwt.getClaimAsString("email"))
            .roles(extractRoles(jwt))
            .permissions(extractPermissions(jwt))
            .build();
    }

    public static UUID extractUUID(Jwt jwt, String claimName) {
        String value = jwt.getClaimAsString(claimName);
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public static Set<String> extractRoles(Jwt jwt) {
        Set<String> roles = new HashSet<>();

        // Extract from realm_access.roles
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null) {
            Object realmRoles = realmAccess.get("roles");
            if (realmRoles instanceof Collection) {
                roles.addAll(((Collection<String>) realmRoles));
            }
        }

        // Extract from resource_access.{client}.roles
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            for (Object clientAccess : resourceAccess.values()) {
                if (clientAccess instanceof Map) {
                    Object clientRoles = ((Map<String, Object>) clientAccess).get("roles");
                    if (clientRoles instanceof Collection) {
                        roles.addAll(((Collection<String>) clientRoles));
                    }
                }
            }
        }

        return roles;
    }

    @SuppressWarnings("unchecked")
    public static Set<String> extractPermissions(Jwt jwt) {
        Object permissions = jwt.getClaim("permissions");
        if (permissions instanceof Collection) {
            return ((Collection<Object>) permissions).stream()
                .map(Object::toString)
                .collect(Collectors.toSet());
        }
        return Set.of();
    }
}
