package com.hrsaas.common.security;

import io.jsonwebtoken.Claims;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Utility class to extract claims from JWT token claims.
 */
public final class JwtClaimExtractor {

    private JwtClaimExtractor() {
        // Utility class
    }

    public static UserContext extractUserContext(Claims claims) {
        return UserContext.builder()
            .userId(extractUUID(claims, "sub"))
            .tenantId(extractUUID(claims, "tenant_id"))
            .employeeId(extractUUID(claims, "employee_id"))
            .username(claims.get("preferred_username", String.class))
            .email(claims.get("email", String.class))
            .roles(extractStringSet(claims, "roles"))
            .permissions(extractStringSet(claims, "permissions"))
            .build();
    }

    public static UUID extractUUID(Claims claims, String claimName) {
        Object value = claims.get(claimName);
        if (value == null) {
            // For "sub", it's the subject
            if ("sub".equals(claimName)) {
                String sub = claims.getSubject();
                if (sub == null || sub.isBlank()) return null;
                try {
                    return UUID.fromString(sub);
                } catch (IllegalArgumentException e) {
                    return null;
                }
            }
            return null;
        }
        try {
            return UUID.fromString(value.toString());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    public static Set<String> extractStringSet(Claims claims, String key) {
        Object value = claims.get(key);
        if (value instanceof Collection) {
            return ((Collection<Object>) value).stream()
                .map(Object::toString)
                .collect(Collectors.toSet());
        }
        return Set.of();
    }
}
