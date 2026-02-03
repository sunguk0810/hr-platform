package com.hrsaas.gateway.filter;

import com.hrsaas.common.core.constant.HeaderConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Collection;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Global filter that extracts claims from JWT and propagates them as headers to downstream services.
 */
@Slf4j
@Component
public class JwtHeaderPropagationFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        return ReactiveSecurityContextHolder.getContext()
            .filter(ctx -> ctx.getAuthentication() instanceof JwtAuthenticationToken)
            .map(ctx -> (JwtAuthenticationToken) ctx.getAuthentication())
            .map(JwtAuthenticationToken::getToken)
            .flatMap(jwt -> {
                ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                    .headers(headers -> {
                        // Propagate user ID
                        String userId = jwt.getClaimAsString("sub");
                        if (userId != null) {
                            headers.set(HeaderConstants.X_USER_ID, userId);
                        }

                        // Propagate tenant ID
                        String tenantId = jwt.getClaimAsString("tenant_id");
                        if (tenantId != null) {
                            headers.set(HeaderConstants.X_TENANT_ID, tenantId);
                        }

                        // Propagate employee ID
                        String employeeId = jwt.getClaimAsString("employee_id");
                        if (employeeId != null) {
                            headers.set(HeaderConstants.X_EMPLOYEE_ID, employeeId);
                        }

                        // Propagate roles
                        String roles = extractRoles(jwt);
                        if (roles != null && !roles.isEmpty()) {
                            headers.set(HeaderConstants.X_USER_ROLES, roles);
                        }

                        // Propagate permissions
                        String permissions = extractPermissions(jwt);
                        if (permissions != null && !permissions.isEmpty()) {
                            headers.set(HeaderConstants.X_USER_PERMISSIONS, permissions);
                        }

                        log.debug("Propagated JWT claims: userId={}, tenantId={}, employeeId={}",
                                  userId, tenantId, employeeId);
                    })
                    .build();

                return chain.filter(exchange.mutate().request(mutatedRequest).build());
            })
            .switchIfEmpty(chain.filter(exchange));
    }

    @SuppressWarnings("unchecked")
    private String extractRoles(Jwt jwt) {
        StringBuilder roles = new StringBuilder();

        // From realm_access.roles
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess != null) {
            Object realmRoles = realmAccess.get("roles");
            if (realmRoles instanceof Collection) {
                roles.append(((Collection<String>) realmRoles).stream()
                    .collect(Collectors.joining(",")));
            }
        }

        // From resource_access.{client}.roles
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            for (Object clientAccess : resourceAccess.values()) {
                if (clientAccess instanceof Map) {
                    Object clientRoles = ((Map<String, Object>) clientAccess).get("roles");
                    if (clientRoles instanceof Collection) {
                        if (roles.length() > 0) {
                            roles.append(",");
                        }
                        roles.append(((Collection<String>) clientRoles).stream()
                            .collect(Collectors.joining(",")));
                    }
                }
            }
        }

        return roles.toString();
    }

    @SuppressWarnings("unchecked")
    private String extractPermissions(Jwt jwt) {
        Object permissions = jwt.getClaim("permissions");
        if (permissions instanceof Collection) {
            return ((Collection<Object>) permissions).stream()
                .map(Object::toString)
                .collect(Collectors.joining(","));
        }
        return "";
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 100;
    }
}
