package com.hrsaas.common.privacy;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;
import java.util.Set;
import java.util.UUID;

/**
 * Filter that sets up the PrivacyContext based on the authenticated user's roles.
 * Determines whether masking should be applied based on user privileges.
 */
@Component
@Order(100)
public class PrivacyFilter extends OncePerRequestFilter {

    /**
     * Roles that can view unmasked personal information.
     */
    private static final Set<String> PRIVILEGED_ROLES = Set.of(
            "ROLE_SUPER_ADMIN",
            "ROLE_TENANT_ADMIN",
            "ROLE_HR_ADMIN",
            "SUPER_ADMIN",
            "TENANT_ADMIN",
            "HR_ADMIN"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        try {
            setupPrivacyContext();
            filterChain.doFilter(request, response);
        } finally {
            PrivacyContext.clear();
        }
    }

    private void setupPrivacyContext() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return;
        }

        // Check if user has privileged role
        if (hasPrivilegedRole(authentication)) {
            PrivacyContext.setSkipMasking(true);
        }

        // Extract employee ID from JWT
        if (authentication instanceof JwtAuthenticationToken jwtAuth) {
            Jwt jwt = jwtAuth.getToken();
            String employeeIdClaim = jwt.getClaimAsString("employee_id");
            if (employeeIdClaim != null) {
                try {
                    UUID employeeId = UUID.fromString(employeeIdClaim);
                    PrivacyContext.setCurrentEmployeeId(employeeId);
                } catch (IllegalArgumentException ignored) {
                    // Invalid UUID format, ignore
                }
            }
        }
    }

    private boolean hasPrivilegedRole(Authentication authentication) {
        Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();
        if (authorities == null) {
            return false;
        }

        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(PRIVILEGED_ROLES::contains);
    }
}
