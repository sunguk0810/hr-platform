package com.hrsaas.common.security.jwt;

import com.hrsaas.common.security.UserContext;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

/**
 * JWT token provider for self-managed authentication.
 * Replaces Keycloak-based JWT validation.
 */
@Slf4j
@Component
public class JwtTokenProvider {

    private final SecretKey secretKey;
    private final long accessTokenExpiry;
    private final long refreshTokenExpiry;

    public JwtTokenProvider(
            @Value("${jwt.secret:hr-saas-secret-key-for-jwt-token-signing-minimum-256-bits-required}") String secret,
            @Value("${jwt.access-token-expiry:1800}") long accessTokenExpiry,
            @Value("${jwt.refresh-token-expiry:604800}") long refreshTokenExpiry) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpiry = accessTokenExpiry;
        this.refreshTokenExpiry = refreshTokenExpiry;
    }

    /**
     * Generate access token from UserContext.
     */
    public String generateAccessToken(UserContext context) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpiry * 1000);

        JwtBuilder builder = Jwts.builder()
                .subject(context.getUserId() != null ? context.getUserId().toString() : null)
                .issuedAt(now)
                .expiration(expiry)
                .claim("token_type", "access");

        if (context.getTenantId() != null) {
            builder.claim("tenant_id", context.getTenantId().toString());
        }
        if (context.getEmployeeId() != null) {
            builder.claim("employee_id", context.getEmployeeId().toString());
        }
        if (context.getDepartmentId() != null) {
            builder.claim("department_id", context.getDepartmentId().toString());
        }
        if (context.getUsername() != null) {
            builder.claim("preferred_username", context.getUsername());
        }
        if (context.getEmail() != null) {
            builder.claim("email", context.getEmail());
        }
        if (context.getEmployeeName() != null) {
            builder.claim("employee_name", context.getEmployeeName());
        }
        if (context.getDepartmentName() != null) {
            builder.claim("department_name", context.getDepartmentName());
        }
        if (context.getRoles() != null && !context.getRoles().isEmpty()) {
            builder.claim("roles", new ArrayList<>(context.getRoles()));
        }
        if (context.getPermissions() != null && !context.getPermissions().isEmpty()) {
            builder.claim("permissions", new ArrayList<>(context.getPermissions()));
        }

        return builder.signWith(secretKey).compact();
    }

    /**
     * Generate refresh token for a user.
     */
    public String generateRefreshToken(UUID userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshTokenExpiry * 1000);

        return Jwts.builder()
                .subject(userId.toString())
                .issuedAt(now)
                .expiration(expiry)
                .claim("token_type", "refresh")
                .signWith(secretKey)
                .compact();
    }

    /**
     * Parse and validate a JWT token, returning the UserContext.
     */
    public UserContext parseToken(String token) {
        Claims claims = validateToken(token);

        UserContext.UserContextBuilder builder = UserContext.builder();

        String sub = claims.getSubject();
        if (sub != null && !sub.isBlank()) {
            try {
                builder.userId(UUID.fromString(sub));
            } catch (IllegalArgumentException ignored) {}
        }

        builder.tenantId(extractUUID(claims, "tenant_id"));
        builder.employeeId(extractUUID(claims, "employee_id"));
        builder.departmentId(extractUUID(claims, "department_id"));
        builder.username(claims.get("preferred_username", String.class));
        builder.email(claims.get("email", String.class));
        builder.employeeName(claims.get("employee_name", String.class));
        builder.departmentName(claims.get("department_name", String.class));

        builder.roles(extractStringSet(claims, "roles"));
        builder.permissions(extractStringSet(claims, "permissions"));

        return builder.build();
    }

    /**
     * Validate token and return claims.
     * @throws JwtException if token is invalid or expired
     */
    public Claims validateToken(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Check if token is a refresh token.
     */
    public boolean isRefreshToken(String token) {
        try {
            Claims claims = validateToken(token);
            return "refresh".equals(claims.get("token_type", String.class));
        } catch (JwtException e) {
            return false;
        }
    }

    /**
     * Extract user ID from token without full validation (for blacklist check).
     */
    public UUID extractUserId(String token) {
        try {
            Claims claims = validateToken(token);
            String sub = claims.getSubject();
            return sub != null ? UUID.fromString(sub) : null;
        } catch (Exception e) {
            return null;
        }
    }

    public long getAccessTokenExpiry() {
        return accessTokenExpiry;
    }

    public long getRefreshTokenExpiry() {
        return refreshTokenExpiry;
    }

    private UUID extractUUID(Claims claims, String key) {
        String value = claims.get(key, String.class);
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
    private Set<String> extractStringSet(Claims claims, String key) {
        Object value = claims.get(key);
        if (value instanceof Collection) {
            return ((Collection<Object>) value).stream()
                    .map(Object::toString)
                    .collect(Collectors.toSet());
        }
        return Set.of();
    }
}
