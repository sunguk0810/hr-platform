package com.hrsaas.gateway.filter;

import com.hrsaas.common.core.constant.HeaderConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Set;

/**
 * Global filter that validates and propagates tenant context.
 * Ensures tenant isolation by validating X-Tenant-ID header.
 */
@Slf4j
@Component
public class TenantContextFilter implements GlobalFilter, Ordered {

    private static final Set<String> TENANT_FREE_PATHS = Set.of(
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/auth/token/refresh",
        "/api/v1/auth/password/reset",
        "/actuator"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        // Skip tenant validation for public endpoints
        if (isTenantFreePath(path)) {
            return chain.filter(exchange);
        }

        String tenantId = exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_TENANT_ID);

        // If tenant ID is present (from JWT propagation), validate and continue
        if (tenantId != null && !tenantId.isBlank()) {
            if (!isValidTenantId(tenantId)) {
                log.warn("Invalid tenant ID format: {}", tenantId);
                exchange.getResponse().setStatusCode(HttpStatus.BAD_REQUEST);
                return exchange.getResponse().setComplete();
            }

            ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                .headers(headers -> {
                    // Ensure tenant ID is set (might already be set by JwtHeaderPropagationFilter)
                    headers.set(HeaderConstants.X_TENANT_ID, tenantId);
                })
                .build();

            log.debug("Tenant context set: tenantId={}, path={}", tenantId, path);
            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        }

        // For authenticated requests without tenant ID, log warning but allow
        // The downstream service should handle tenant validation
        log.debug("No tenant ID in request: path={}", path);
        return chain.filter(exchange);
    }

    private boolean isTenantFreePath(String path) {
        return TENANT_FREE_PATHS.stream().anyMatch(path::startsWith);
    }

    private boolean isValidTenantId(String tenantId) {
        // UUID format validation
        return tenantId.matches("^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$");
    }

    @Override
    public int getOrder() {
        // Execute after JWT header propagation filter
        return Ordered.HIGHEST_PRECEDENCE + 101;
    }
}
