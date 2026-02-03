package com.hrsaas.common.security;

import com.hrsaas.common.core.constant.HeaderConstants;
import com.hrsaas.common.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;
import java.util.UUID;

/**
 * Filter to extract user context from headers and propagate to context holders.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class SecurityFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            extractFromHeaders(request);
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clear();
        }
    }

    private void extractFromHeaders(HttpServletRequest request) {
        // Extract from gateway-propagated headers
        String userIdHeader = request.getHeader(HeaderConstants.X_USER_ID);
        String tenantIdHeader = request.getHeader(HeaderConstants.X_TENANT_ID);
        String employeeIdHeader = request.getHeader(HeaderConstants.X_EMPLOYEE_ID);
        String rolesHeader = request.getHeader(HeaderConstants.X_USER_ROLES);
        String permissionsHeader = request.getHeader(HeaderConstants.X_USER_PERMISSIONS);

        UserContext.UserContextBuilder builder = UserContext.builder();

        if (userIdHeader != null && !userIdHeader.isBlank()) {
            try {
                UUID userId = UUID.fromString(userIdHeader);
                builder.userId(userId);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid user ID format: {}", userIdHeader);
            }
        }

        if (tenantIdHeader != null && !tenantIdHeader.isBlank()) {
            try {
                UUID tenantId = UUID.fromString(tenantIdHeader);
                builder.tenantId(tenantId);
                TenantContext.setCurrentTenant(tenantId);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid tenant ID format: {}", tenantIdHeader);
            }
        }

        if (employeeIdHeader != null && !employeeIdHeader.isBlank()) {
            try {
                builder.employeeId(UUID.fromString(employeeIdHeader));
            } catch (IllegalArgumentException e) {
                log.warn("Invalid employee ID format: {}", employeeIdHeader);
            }
        }

        if (rolesHeader != null && !rolesHeader.isBlank()) {
            builder.roles(Set.of(rolesHeader.split(",")));
        }

        if (permissionsHeader != null && !permissionsHeader.isBlank()) {
            builder.permissions(Set.of(permissionsHeader.split(",")));
        }

        SecurityContextHolder.setContext(builder.build());
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator") ||
               path.startsWith("/health") ||
               path.equals("/favicon.ico");
    }
}
