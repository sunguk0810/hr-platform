package com.hrsaas.common.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.access.expression.method.DefaultMethodSecurityExpressionHandler;
import org.springframework.security.access.hierarchicalroles.RoleHierarchy;
import org.springframework.security.access.hierarchicalroles.RoleHierarchyImpl;

/**
 * Role hierarchy configuration based on PRD requirements.
 *
 * Role Hierarchy (higher roles inherit all permissions of lower roles):
 *
 * SUPER_ADMIN (System Administrator)
 *     ↓
 * GROUP_ADMIN (Group HR Manager)
 *     ↓
 * TENANT_ADMIN (Tenant HR Administrator)
 *     ↓
 * HR_MANAGER (HR Staff)
 *     ↓
 * DEPT_MANAGER (Department Manager)
 *     ↓
 * TEAM_LEADER (Team Leader)
 *     ↓
 * EMPLOYEE (Regular Employee)
 */
@Configuration
public class RoleHierarchyConfig {

    /**
     * Defines the role hierarchy where higher roles automatically inherit
     * all permissions of lower roles.
     */
    @Bean
    public RoleHierarchy roleHierarchy() {
        RoleHierarchyImpl hierarchy = new RoleHierarchyImpl();
        hierarchy.setHierarchy("""
            ROLE_SUPER_ADMIN > ROLE_GROUP_ADMIN
            ROLE_GROUP_ADMIN > ROLE_TENANT_ADMIN
            ROLE_TENANT_ADMIN > ROLE_HR_MANAGER
            ROLE_HR_MANAGER > ROLE_DEPT_MANAGER
            ROLE_DEPT_MANAGER > ROLE_TEAM_LEADER
            ROLE_TEAM_LEADER > ROLE_EMPLOYEE
            """);
        return hierarchy;
    }

    /**
     * Configure method security expression handler with role hierarchy.
     * This enables @PreAuthorize annotations to respect the role hierarchy.
     */
    @Bean
    public DefaultMethodSecurityExpressionHandler methodSecurityExpressionHandler(
            RoleHierarchy roleHierarchy) {
        DefaultMethodSecurityExpressionHandler handler =
            new DefaultMethodSecurityExpressionHandler();
        handler.setRoleHierarchy(roleHierarchy);
        return handler;
    }
}
