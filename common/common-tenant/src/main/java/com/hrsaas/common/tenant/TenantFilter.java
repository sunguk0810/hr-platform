package com.hrsaas.common.tenant;

import com.hrsaas.common.core.constant.HeaderConstants;
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
import java.util.UUID;

/**
 * Filter to extract tenant ID from request headers and set in TenantContext.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class TenantFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String tenantIdHeader = request.getHeader(HeaderConstants.X_TENANT_ID);

            if (tenantIdHeader != null && !tenantIdHeader.isBlank()) {
                try {
                    UUID tenantId = UUID.fromString(tenantIdHeader);
                    TenantContext.setCurrentTenant(tenantId);
                    log.debug("Tenant context set: {}", tenantId);
                } catch (IllegalArgumentException e) {
                    log.warn("Invalid tenant ID format: {}", tenantIdHeader);
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        // Skip filtering for actuator and health endpoints
        return path.startsWith("/actuator") ||
               path.startsWith("/health") ||
               path.equals("/favicon.ico");
    }
}
