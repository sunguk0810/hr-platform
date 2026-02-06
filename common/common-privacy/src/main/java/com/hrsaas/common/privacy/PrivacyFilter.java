package com.hrsaas.common.privacy;

import com.hrsaas.common.security.UserContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
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
        UserContext context = com.hrsaas.common.security.SecurityContextHolder.getCurrentUser();
        if (context == null) {
            return;
        }

        // Check if user has privileged role
        if (context.getRoles() != null && context.getRoles().stream().anyMatch(PRIVILEGED_ROLES::contains)) {
            PrivacyContext.setSkipMasking(true);
        }

        // Extract employee ID from UserContext
        UUID employeeId = context.getEmployeeId();
        if (employeeId != null) {
            PrivacyContext.setCurrentEmployeeId(employeeId);
        }
    }
}
