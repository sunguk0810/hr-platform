package com.hrsaas.common.security;

import com.hrsaas.common.security.jwt.JwtTokenProvider;
import com.hrsaas.common.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.stream.Collectors;

/**
 * Filter to extract user context from JWT in Authorization header.
 * Each service directly validates JWT tokens (no gateway header propagation).
 *
 * NOTE: @Component removed to prevent double registration (servlet filter + SecurityFilterChain).
 * SecurityFilter is now created as @Bean in each service's SecurityConfig.
 */
@Slf4j
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
@RequiredArgsConstructor
public class SecurityFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            extractFromJwt(request);
            filterChain.doFilter(request, response);
        } finally {
            SecurityContextHolder.clear();
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
            TenantContext.clear();
        }
    }

    private void extractFromJwt(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        String token = null;
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
        }

        // EventSource cannot set custom Authorization headers in browsers.
        // Allow access_token query parameter for SSE subscription endpoints only.
        if (token == null && request.getRequestURI() != null &&
            request.getRequestURI().startsWith("/api/v1/notifications/sse/")) {
            String queryToken = request.getParameter("access_token");
            if (queryToken != null && !queryToken.isBlank()) {
                token = queryToken;
            }
        }

        if (token == null) {
            return;
        }

        try {
            UserContext context = jwtTokenProvider.parseToken(token);
            SecurityContextHolder.setContext(context);

            // Bridge to Spring Security's SecurityContextHolder
            var authorities = context.getRoles() != null
                    ? context.getRoles().stream()
                        .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                        .collect(Collectors.toList())
                    : java.util.Collections.<SimpleGrantedAuthority>emptyList();
            var authentication = new UsernamePasswordAuthenticationToken(
                    context, null, authorities);
            org.springframework.security.core.context.SecurityContextHolder
                    .getContext().setAuthentication(authentication);

            if (context.getTenantId() != null) {
                TenantContext.setCurrentTenant(context.getTenantId());
            }

            log.debug("JWT authenticated: userId={}, tenantId={}", context.getUserId(), context.getTenantId());
        } catch (Exception e) {
            log.debug("JWT validation failed: {}", e.getMessage());
        }
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/actuator/health") ||
               path.equals("/actuator/info") ||
               path.startsWith("/health") ||
               path.equals("/favicon.ico");
    }
}
