package com.hrsaas.common.security;

import com.hrsaas.common.core.exception.ForbiddenException;
import com.hrsaas.common.security.service.PermissionMappingService;
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
    private PermissionMappingService permissionMappingService;

    @BeforeEach
    void setUp() {
        permissionMappingService = new PermissionMappingService();
        permissionChecker = new PermissionChecker(permissionMappingService, null);
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

    private void setUpUserWithEmployeeIdAndPermissions(UUID employeeId, Set<String> roles, Set<String> permissions) {
        UserContext context = UserContext.builder()
            .userId(UUID.randomUUID())
            .tenantId(UUID.randomUUID())
            .employeeId(employeeId)
            .departmentId(UUID.randomUUID())
            .teamId(UUID.randomUUID())
            .roles(roles)
            .permissions(permissions)
            .build();
        SecurityContextHolder.setContext(context);
    }

    @Nested
    @DisplayName("requireRole Method")
    class RequireRoleMethod {

        @Test
        @DisplayName("필요한 역할이 있으면 통과")
        void requireRole_hasRole_noException() {
            setUpUserWithRoles("ROLE_HR_MANAGER");

            permissionChecker.requireRole("ROLE_HR_MANAGER");
            // No exception
        }

        @Test
        @DisplayName("필요한 역할이 없으면 ForbiddenException")
        void requireRole_noRole_throwsForbiddenException() {
            setUpUserWithRoles("ROLE_EMPLOYEE");

            assertThatThrownBy(() -> permissionChecker.requireRole("ROLE_HR_MANAGER"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("ROLE_HR_MANAGER");
        }
    }

    @Nested
    @DisplayName("requireAnyRole Method")
    class RequireAnyRoleMethod {

        @Test
        @DisplayName("여러 역할 중 하나라도 있으면 통과")
        void requireAnyRole_hasOneRole_noException() {
            setUpUserWithRoles("ROLE_HR_MANAGER");

            permissionChecker.requireAnyRole("ROLE_SUPER_ADMIN", "ROLE_HR_MANAGER");
            // No exception
        }

        @Test
        @DisplayName("여러 역할 중 하나도 없으면 ForbiddenException")
        void requireAnyRole_noRoles_throwsForbiddenException() {
            setUpUserWithRoles("ROLE_EMPLOYEE");

            assertThatThrownBy(() -> permissionChecker.requireAnyRole("ROLE_SUPER_ADMIN", "ROLE_HR_MANAGER"))
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

        @Test
        @DisplayName("와일드카드 권한으로 통과")
        void requirePermission_wildcardPermission_noException() {
            setUpUserWithRolesAndPermissions(Set.of(), Set.of("*:*"));

            permissionChecker.requirePermission("employee:write");
            // No exception - wildcard grants all permissions
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
            setUpUserWithRoles("ROLE_HR_MANAGER");

            assertThat(permissionChecker.hasRole("ROLE_HR_MANAGER")).isTrue();
        }

        @Test
        @DisplayName("역할이 없으면 false")
        void hasRole_roleNotExists_returnsFalse() {
            setUpUserWithRoles("ROLE_EMPLOYEE");

            assertThat(permissionChecker.hasRole("ROLE_HR_MANAGER")).isFalse();
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

        @Test
        @DisplayName("와일드카드 권한으로 모든 권한 보유")
        void hasPermission_wildcardGrantsAll_returnsTrue() {
            setUpUserWithRolesAndPermissions(Set.of(), Set.of("*:*"));

            assertThat(permissionChecker.hasPermission("any:permission")).isTrue();
        }

        @Test
        @DisplayName("상위 권한이 하위 스코프 권한을 포함")
        void hasPermission_broaderPermissionIncludesScoped_returnsTrue() {
            setUpUserWithRolesAndPermissions(Set.of(), Set.of("employee:read"));

            // employee:read should grant employee:read:self and employee:read:department
            assertThat(permissionChecker.hasPermission("employee:read:self")).isTrue();
            assertThat(permissionChecker.hasPermission("employee:read:department")).isTrue();
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
        @DisplayName("isGroupAdmin: SUPER_ADMIN도 GROUP_ADMIN으로 취급")
        void isGroupAdmin_superAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_SUPER_ADMIN");

            assertThat(permissionChecker.isGroupAdmin()).isTrue();
        }

        @Test
        @DisplayName("isGroupAdmin: GROUP_ADMIN 역할 확인")
        void isGroupAdmin_groupAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_GROUP_ADMIN");

            assertThat(permissionChecker.isGroupAdmin()).isTrue();
        }

        @Test
        @DisplayName("isTenantAdmin: SUPER_ADMIN도 TENANT_ADMIN으로 취급")
        void isTenantAdmin_superAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_SUPER_ADMIN");

            assertThat(permissionChecker.isTenantAdmin()).isTrue();
        }

        @Test
        @DisplayName("isTenantAdmin: GROUP_ADMIN도 TENANT_ADMIN으로 취급")
        void isTenantAdmin_groupAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_GROUP_ADMIN");

            assertThat(permissionChecker.isTenantAdmin()).isTrue();
        }

        @Test
        @DisplayName("isTenantAdmin: TENANT_ADMIN 역할 확인")
        void isTenantAdmin_tenantAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_TENANT_ADMIN");

            assertThat(permissionChecker.isTenantAdmin()).isTrue();
        }

        @Test
        @DisplayName("isTenantAdmin: HR_MANAGER은 TENANT_ADMIN이 아님")
        void isTenantAdmin_hrManager_returnsFalse() {
            setUpUserWithRoles("ROLE_HR_MANAGER");

            assertThat(permissionChecker.isTenantAdmin()).isFalse();
        }

        @Test
        @DisplayName("isHrManager: 상위 역할들도 HR_MANAGER으로 취급")
        void isHrManager_superAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_SUPER_ADMIN");

            assertThat(permissionChecker.isHrManager()).isTrue();
        }

        @Test
        @DisplayName("isHrManager: TENANT_ADMIN도 HR_MANAGER으로 취급")
        void isHrManager_tenantAdmin_returnsTrue() {
            setUpUserWithRoles("ROLE_TENANT_ADMIN");

            assertThat(permissionChecker.isHrManager()).isTrue();
        }

        @Test
        @DisplayName("isHrManager: HR_MANAGER 역할 확인")
        void isHrManager_hrManager_returnsTrue() {
            setUpUserWithRoles("ROLE_HR_MANAGER");

            assertThat(permissionChecker.isHrManager()).isTrue();
        }

        @Test
        @DisplayName("isHrManager: EMPLOYEE는 HR_MANAGER이 아님")
        void isHrManager_employee_returnsFalse() {
            setUpUserWithRoles("ROLE_EMPLOYEE");

            assertThat(permissionChecker.isHrManager()).isFalse();
        }

        @Test
        @DisplayName("isDeptManager: HR_MANAGER도 DEPT_MANAGER으로 취급")
        void isDeptManager_hrManager_returnsTrue() {
            setUpUserWithRoles("ROLE_HR_MANAGER");

            assertThat(permissionChecker.isDeptManager()).isTrue();
        }

        @Test
        @DisplayName("isDeptManager: DEPT_MANAGER 역할 확인")
        void isDeptManager_deptManager_returnsTrue() {
            setUpUserWithRoles("ROLE_DEPT_MANAGER");

            assertThat(permissionChecker.isDeptManager()).isTrue();
        }

        @Test
        @DisplayName("isTeamLeader: DEPT_MANAGER도 TEAM_LEADER로 취급")
        void isTeamLeader_deptManager_returnsTrue() {
            setUpUserWithRoles("ROLE_DEPT_MANAGER");

            assertThat(permissionChecker.isTeamLeader()).isTrue();
        }

        @Test
        @DisplayName("isTeamLeader: TEAM_LEADER 역할 확인")
        void isTeamLeader_teamLeader_returnsTrue() {
            setUpUserWithRoles("ROLE_TEAM_LEADER");

            assertThat(permissionChecker.isTeamLeader()).isTrue();
        }

        @Test
        @DisplayName("isHrAdmin (deprecated): HR_MANAGER와 동일하게 동작")
        @SuppressWarnings("deprecation")
        void isHrAdmin_deprecated_sameAsIsHrManager() {
            setUpUserWithRoles("ROLE_HR_MANAGER");

            assertThat(permissionChecker.isHrAdmin()).isTrue();
        }
    }

    @Nested
    @DisplayName("canAccessEmployee Method")
    class CanAccessEmployeeMethod {

        @Test
        @DisplayName("employee:read 권한으로 모든 직원 접근 가능")
        void canAccessEmployee_employeeReadPermission_returnsTrue() {
            UUID anyEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeIdAndPermissions(
                UUID.randomUUID(),
                Set.of(),
                Set.of("employee:read")
            );

            assertThat(permissionChecker.canAccessEmployee(anyEmployeeId)).isTrue();
        }

        @Test
        @DisplayName("employee:read:self 권한으로 본인만 접근 가능")
        void canAccessEmployee_selfPermission_canAccessSelf() {
            UUID myEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeIdAndPermissions(
                myEmployeeId,
                Set.of(),
                Set.of("employee:read:self")
            );

            assertThat(permissionChecker.canAccessEmployee(myEmployeeId)).isTrue();
        }

        @Test
        @DisplayName("employee:read:self 권한으로 다른 직원 접근 불가")
        void canAccessEmployee_selfPermission_cannotAccessOthers() {
            UUID myEmployeeId = UUID.randomUUID();
            UUID otherEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeIdAndPermissions(
                myEmployeeId,
                Set.of(),
                Set.of("employee:read:self")
            );

            assertThat(permissionChecker.canAccessEmployee(otherEmployeeId)).isFalse();
        }

        @Test
        @DisplayName("null employeeId는 접근 불가")
        void canAccessEmployee_nullEmployeeId_returnsFalse() {
            setUpUserWithRolesAndPermissions(Set.of("ROLE_EMPLOYEE"), Set.of("employee:read:self"));

            assertThat(permissionChecker.canAccessEmployee(null)).isFalse();
        }

        @Test
        @DisplayName("와일드카드 권한으로 모든 직원 접근 가능")
        void canAccessEmployee_wildcardPermission_returnsTrue() {
            UUID anyEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeIdAndPermissions(
                UUID.randomUUID(),
                Set.of(),
                Set.of("*:*")
            );

            assertThat(permissionChecker.canAccessEmployee(anyEmployeeId)).isTrue();
        }
    }

    @Nested
    @DisplayName("canModifyEmployee Method")
    class CanModifyEmployeeMethod {

        @Test
        @DisplayName("employee:write 권한으로 모든 직원 수정 가능")
        void canModifyEmployee_employeeWritePermission_returnsTrue() {
            UUID anyEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeIdAndPermissions(
                UUID.randomUUID(),
                Set.of(),
                Set.of("employee:write")
            );

            assertThat(permissionChecker.canModifyEmployee(anyEmployeeId)).isTrue();
        }

        @Test
        @DisplayName("employee:write:self 권한으로 본인만 수정 가능")
        void canModifyEmployee_selfPermission_canModifySelf() {
            UUID myEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeIdAndPermissions(
                myEmployeeId,
                Set.of(),
                Set.of("employee:write:self")
            );

            assertThat(permissionChecker.canModifyEmployee(myEmployeeId)).isTrue();
        }

        @Test
        @DisplayName("employee:write:self 권한으로 다른 직원 수정 불가")
        void canModifyEmployee_selfPermission_cannotModifyOthers() {
            UUID myEmployeeId = UUID.randomUUID();
            UUID otherEmployeeId = UUID.randomUUID();
            setUpUserWithEmployeeIdAndPermissions(
                myEmployeeId,
                Set.of(),
                Set.of("employee:write:self")
            );

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
