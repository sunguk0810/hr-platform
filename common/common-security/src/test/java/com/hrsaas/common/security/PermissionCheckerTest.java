package com.hrsaas.common.security;

import com.hrsaas.common.core.exception.ForbiddenException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("PermissionChecker Tests")
class PermissionCheckerTest {

    private PermissionChecker permissionChecker;

    @BeforeEach
    void setUp() {
        permissionChecker = new PermissionChecker();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    private void setUpUserWithRoles(String... roles) {
        UserContext context = UserContext.builder()
            .userId(UUID.randomUUID())
            .tenantId(UUID.randomUUID())
            .employeeId(UUID.randomUUID())
            .roles(Set.of(roles))
            .permissions(Set.of())
            .build();
        SecurityContextHolder.setContext(context);
    }

    private void setUpUserWithRolesAndPermissions(Set<String> roles, Set<String> permissions) {
        UserContext context = UserContext.builder()
            .userId(UUID.randomUUID())
            .tenantId(UUID.randomUUID())
            .employeeId(UUID.randomUUID())
            .roles(roles)
            .permissions(permissions)
            .build();
        SecurityContextHolder.setContext(context);
    }

    private void setUpUserWithEmployeeId(UUID employeeId, String... roles) {
        UserContext context = UserContext.builder()
            .userId(UUID.randomUUID())
            .tenantId(UUID.randomUUID())
            .employeeId(employeeId)
            .roles(Set.of(roles))
            .permissions(Set.of())
            .build();
        SecurityContextHolder.setContext(context);
    }

    @Nested
    @DisplayName("requireRole Method")
    class RequireRoleMethod {

        @Test
        @DisplayName("필요한 역할이 있으면 통과")
        void requireRole_hasRole_noException() {
            setUpUserWithRoles("ROLE_HR_ADMIN");

            permissionChecker.requireRole("ROLE_HR_ADMIN");
            // No exception
        }

        @Test
        @DisplayName("필요한 역할이 없으면 ForbiddenException")
        void requireRole_noRole_throwsForbiddenException() {
            setUpUserWithRoles("ROLE_EMPLOYEE");

            assertThatThrownBy(() -> permissionChecker.requireRole("ROLE_HR_ADMIN"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("ROLE_HR_ADMIN");
        }
    }

    @Nested
    @DisplayName("requireAnyRole Method")
    class RequireAnyRoleMethod {

        @Test
        @DisplayName("여러 역할 중 하나라도 있으면 통과")
        void requireAnyRole_hasOneRole_noException() {
            setUpUserWithRoles("ROLE_HR_ADMIN");

            permissionChecker.requireAnyRole("ROLE_SUPER_ADMIN", "ROLE_HR_ADMIN");
            // No exception
        }

        @Test
        @DisplayName("여러 역할 중 하나도 없으면 ForbiddenException")
        void requireAnyRole_noRoles_throwsForbiddenException() {
            setUpUserWithRoles("ROLE_EMPLOYEE");

            assertThatThrownBy(() -> permissionChecker.requireAnyRole("ROLE_SUPER_ADMIN", "ROLE_HR_ADMIN"))
                .isInstanceOf(ForbiddenException.class);
        }
    }

    @Nested
    @DisplayName("requirePermission Method")
    class RequirePermissionMethod {

        @Test
        @DisplayName("필요한 권한이 있으면 통과")
        void requirePermission_hasPermission_noException() {
            setUpUserWithRolesAndPermissions(Set.of(), Set.of("employee:read"));

            permissionChecker.requirePermission("employee:read");
            // No exception
        }

        @Test
        @DisplayName("필요한 권한이 없으면 ForbiddenException")
        void requirePermission_noPermission_throwsForbiddenException() {
            setUpUserWithRolesAndPermissions(Set.of(), Set.of("employee:read"));

            assertThatThrownBy(() -> permissionChecker.requirePermission("employee:write"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("employee:write");
        }
    }

    @Nested
    @DisplayName("requireAnyPermission Method")
    class RequireAnyPermissionMethod {

        @Test
        @DisplayName("여러 권한 중 하나라도 있으면 통과")
        void requireAnyPermission_hasOnePermission_noException() {
            setUpUserWithRolesAndPermissions(Set.of(), Set.of("employee:read"));

            permissionChecker.requireAnyPermission("employee:read", "employee:write");
            // No exception
        }

        @Test
        @DisplayName("여러 권한 중 하나도 없으면 ForbiddenException")
        void requireAnyPermission_noPermissions_throwsForbiddenException() {
            setUpUserWithRolesAndPermissions(Set.of(), Set.of("other:permission"));

            assertThatThrownBy(() -> permissionChecker.requireAnyPermission("employee:read", "employee:write"))
                .isInstanceOf(ForbiddenException.class);
        }
    }

    @Nested
    @DisplayName("hasRole Method")
    class HasRoleMethod {

        @Test
        @DisplayName("역할이 있으면 true")
        void hasRole_roleExists_returnsTrue() {
            setUpUserWithRoles("ROLE_HR_ADMIN");

            assertThat(permissionChecker.hasRole("ROLE_HR_ADMIN")).isTrue();
        }

        @Test
        @DisplayName("역할이 없으면 false")
        void hasRole_roleNotExists_returnsFalse() {
            setUpUserWithRoles("ROLE_EMPLOYEE");

            assertThat(permissionChecker.hasRole("ROLE_HR_ADMIN")).isFalse();
        }
    }

    @Nested
    @DisplayName("hasPermission Method")
    class HasPermissionMethod {

        @Test
        @DisplayName("권한이 있으면 true")
        void hasPermission_permissionExists_returnsTrue() {
            setUpUserWithRolesAndPermissions(Set.of(), Set.of("employee:read"));

            assertThat(permissionChecker.hasPermission("employee:read")).isTrue();
        }

        @Test
        @DisplayName("권한이 없으면 false")
        void hasPermission_permissionNotExists_returnsFalse() {
            setUpUserWithRolesAndPermissions(Set.of(), Set.of("other:permission"));

            assertThat(permissionChecker.hasPermission("employee:read")).isFalse();
        }
    }

    @Nested
    @DisplayName("Role Hierarchy Check Methods")
    class RoleHierarchyCheckMethods {

        @Test
        @DisplayName("isSuperAdmin: SUPER_ADMIN 역할 확인")
        void isSuperAdmin_hasSuperAdminRole_returnsTrue() {
            setUpUserWithRoles("ROLE_SUPER_ADMIN");

            assertThat(permissionChecker.isSuperAdmin()).isTrue();
        }

        @Test
        @DisplayName("isSuperAdmin: SUPER_ADMIN 역할 없음")
        void isSuperAdmin_noSuperAdminRole_returnsFalse() {
            setUpUserWithRoles("ROLE_TENANT_ADMIN");

            assertThat(permissionChecker.isSuperAdmin()).isFalse();
        }

        @Test
        @DisplayName("isTenantAdmin: SUPER_ADMIN도 TENANT_ADMIN으로 취급")
        void isTenantAdmin_superAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_SUPER_ADMIN");

            assertThat(permissionChecker.isTenantAdmin()).isTrue();
        }

        @Test
        @DisplayName("isTenantAdmin: TENANT_ADMIN 역할 확인")
        void isTenantAdmin_tenantAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_TENANT_ADMIN");

            assertThat(permissionChecker.isTenantAdmin()).isTrue();
        }

        @Test
        @DisplayName("isTenantAdmin: HR_ADMIN은 TENANT_ADMIN이 아님")
        void isTenantAdmin_hrAdmin_returnsFalse() {
            setUpUserWithRoles("ROLE_HR_ADMIN");

            assertThat(permissionChecker.isTenantAdmin()).isFalse();
        }

        @Test
        @DisplayName("isHrAdmin: 상위 역할들도 HR_ADMIN으로 취급")
        void isHrAdmin_superAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_SUPER_ADMIN");

            assertThat(permissionChecker.isHrAdmin()).isTrue();
        }

        @Test
        @DisplayName("isHrAdmin: TENANT_ADMIN도 HR_ADMIN으로 취급")
        void isHrAdmin_tenantAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_TENANT_ADMIN");

            assertThat(permissionChecker.isHrAdmin()).isTrue();
        }

        @Test
        @DisplayName("isHrAdmin: HR_ADMIN 역할 확인")
        void isHrAdmin_hrAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_HR_ADMIN");

            assertThat(permissionChecker.isHrAdmin()).isTrue();
        }

        @Test
        @DisplayName("isHrAdmin: EMPLOYEE는 HR_ADMIN이 아님")
        void isHrAdmin_employee_returnsFalse() {
            setUpUserWithRoles("ROLE_EMPLOYEE");

            assertThat(permissionChecker.isHrAdmin()).isFalse();
        }
    }

    @Nested
    @DisplayName("canAccessEmployee Method")
    class CanAccessEmployeeMethod {

        @Test
        @DisplayName("HR Admin은 모든 직원 접근 가능")
        void canAccessEmployee_hrAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_HR_ADMIN");
            UUID anyEmployeeId = UUID.randomUUID();

            assertThat(permissionChecker.canAccessEmployee(anyEmployeeId)).isTrue();
        }

        @Test
        @DisplayName("일반 직원은 본인만 접근 가능")
        void canAccessEmployee_employee_canAccessSelf() {
            UUID myEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeId(myEmployeeId, "ROLE_EMPLOYEE");

            assertThat(permissionChecker.canAccessEmployee(myEmployeeId)).isTrue();
        }

        @Test
        @DisplayName("일반 직원은 다른 직원 접근 불가")
        void canAccessEmployee_employee_cannotAccessOthers() {
            UUID myEmployeeId = UUID.randomUUID();
            UUID otherEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeId(myEmployeeId, "ROLE_EMPLOYEE");

            assertThat(permissionChecker.canAccessEmployee(otherEmployeeId)).isFalse();
        }

        @Test
        @DisplayName("null employeeId는 접근 불가")
        void canAccessEmployee_nullEmployeeId_returnsFalse() {
            setUpUserWithRoles("ROLE_EMPLOYEE");

            assertThat(permissionChecker.canAccessEmployee(null)).isFalse();
        }
    }

    @Nested
    @DisplayName("canModifyEmployee Method")
    class CanModifyEmployeeMethod {

        @Test
        @DisplayName("HR Admin은 모든 직원 수정 가능")
        void canModifyEmployee_hrAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_HR_ADMIN");
            UUID anyEmployeeId = UUID.randomUUID();

            assertThat(permissionChecker.canModifyEmployee(anyEmployeeId)).isTrue();
        }

        @Test
        @DisplayName("일반 직원은 본인만 수정 가능")
        void canModifyEmployee_employee_canModifySelf() {
            UUID myEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeId(myEmployeeId, "ROLE_EMPLOYEE");

            assertThat(permissionChecker.canModifyEmployee(myEmployeeId)).isTrue();
        }

        @Test
        @DisplayName("일반 직원은 다른 직원 수정 불가")
        void canModifyEmployee_employee_cannotModifyOthers() {
            UUID myEmployeeId = UUID.randomUUID();
            UUID otherEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeId(myEmployeeId, "ROLE_EMPLOYEE");

            assertThat(permissionChecker.canModifyEmployee(otherEmployeeId)).isFalse();
        }
    }

    @Nested
    @DisplayName("isSelf Method")
    class IsSelfMethod {

        @Test
        @DisplayName("본인 employeeId면 true")
        void isSelf_sameEmployeeId_returnsTrue() {
            UUID myEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeId(myEmployeeId, "ROLE_EMPLOYEE");

            assertThat(permissionChecker.isSelf(myEmployeeId)).isTrue();
        }

        @Test
        @DisplayName("다른 employeeId면 false")
        void isSelf_differentEmployeeId_returnsFalse() {
            UUID myEmployeeId = UUID.randomUUID();
            UUID otherEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeId(myEmployeeId, "ROLE_EMPLOYEE");

            assertThat(permissionChecker.isSelf(otherEmployeeId)).isFalse();
        }

        @Test
        @DisplayName("null employeeId면 false")
        void isSelf_nullEmployeeId_returnsFalse() {
            UUID myEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeId(myEmployeeId, "ROLE_EMPLOYEE");

            assertThat(permissionChecker.isSelf(null)).isFalse();
        }
    }
}
