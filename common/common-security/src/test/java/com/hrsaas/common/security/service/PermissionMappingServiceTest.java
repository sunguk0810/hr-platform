package com.hrsaas.common.security.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("PermissionMappingService Tests")
class PermissionMappingServiceTest {

    private PermissionMappingService service;

    @BeforeEach
    void setUp() {
        service = new PermissionMappingService();
    }

    @Nested
    @DisplayName("getPermissionsForRoles Method")
    class GetPermissionsForRolesMethod {

        @Test
        @DisplayName("SUPER_ADMIN 역할은 *:* 권한을 가짐")
        void getPermissions_superAdmin_hasWildcard() {
            Set<String> permissions = service.getPermissionsForRoles(Set.of("ROLE_SUPER_ADMIN"));

            assertThat(permissions).contains("*:*");
        }

        @Test
        @DisplayName("HR_MANAGER 역할은 employee 관련 권한을 가짐")
        void getPermissions_hrManager_hasEmployeePermissions() {
            Set<String> permissions = service.getPermissionsForRoles(Set.of("ROLE_HR_MANAGER"));

            assertThat(permissions).contains("employee:read", "employee:write");
        }

        @Test
        @DisplayName("EMPLOYEE 역할은 self 스코프 권한만 가짐")
        void getPermissions_employee_hasSelfScopeOnly() {
            Set<String> permissions = service.getPermissionsForRoles(Set.of("ROLE_EMPLOYEE"));

            assertThat(permissions).contains("employee:read:self", "employee:write:self");
            assertThat(permissions).doesNotContain("employee:read", "employee:write");
        }

        @Test
        @DisplayName("null 역할은 빈 권한 반환")
        void getPermissions_nullRoles_returnsEmpty() {
            Set<String> permissions = service.getPermissionsForRoles(null);

            assertThat(permissions).isEmpty();
        }

        @Test
        @DisplayName("빈 역할은 빈 권한 반환")
        void getPermissions_emptyRoles_returnsEmpty() {
            Set<String> permissions = service.getPermissionsForRoles(Collections.emptySet());

            assertThat(permissions).isEmpty();
        }

        @Test
        @DisplayName("여러 역할의 권한을 합산")
        void getPermissions_multipleRoles_combinedPermissions() {
            Set<String> permissions = service.getPermissionsForRoles(
                Set.of("ROLE_HR_MANAGER", "ROLE_DEPT_MANAGER")
            );

            // HR_MANAGER permissions
            assertThat(permissions).contains("employee:read", "employee:write");
            // DEPT_MANAGER specific permissions
            assertThat(permissions).contains("attendance:approve:department");
        }
    }

    @Nested
    @DisplayName("hasPermission Method")
    class HasPermissionMethod {

        @Test
        @DisplayName("직접 매칭되는 권한 확인")
        void hasPermission_directMatch_returnsTrue() {
            Set<String> permissions = Set.of("employee:read");

            assertThat(service.hasPermission(permissions, "employee:read")).isTrue();
        }

        @Test
        @DisplayName("권한이 없으면 false")
        void hasPermission_noMatch_returnsFalse() {
            Set<String> permissions = Set.of("employee:read");

            assertThat(service.hasPermission(permissions, "employee:write")).isFalse();
        }

        @Test
        @DisplayName("와일드카드(*:*) 권한은 모든 권한 허용")
        void hasPermission_wildcard_grantsAll() {
            Set<String> permissions = Set.of("*:*");

            assertThat(service.hasPermission(permissions, "employee:read")).isTrue();
            assertThat(service.hasPermission(permissions, "any:permission")).isTrue();
        }

        @Test
        @DisplayName("리소스 와일드카드(employee:*)는 해당 리소스 모든 액션 허용")
        void hasPermission_resourceWildcard_grantsAllActions() {
            Set<String> permissions = Set.of("employee:*");

            assertThat(service.hasPermission(permissions, "employee:read")).isTrue();
            assertThat(service.hasPermission(permissions, "employee:write")).isTrue();
            assertThat(service.hasPermission(permissions, "employee:delete")).isTrue();
        }

        @Test
        @DisplayName("상위 권한은 하위 스코프 권한 포함")
        void hasPermission_broaderPermission_includesScoped() {
            Set<String> permissions = Set.of("employee:read");

            // employee:read includes employee:read:self, employee:read:department, etc.
            assertThat(service.hasPermission(permissions, "employee:read:self")).isTrue();
            assertThat(service.hasPermission(permissions, "employee:read:department")).isTrue();
            assertThat(service.hasPermission(permissions, "employee:read:team")).isTrue();
        }

        @Test
        @DisplayName("스코프 권한만 있으면 상위 권한 불가")
        void hasPermission_scopedPermission_doesNotGrantBroader() {
            Set<String> permissions = Set.of("employee:read:self");

            assertThat(service.hasPermission(permissions, "employee:read")).isFalse();
            assertThat(service.hasPermission(permissions, "employee:read:department")).isFalse();
        }

        @Test
        @DisplayName("null 권한은 false")
        void hasPermission_nullPermissions_returnsFalse() {
            assertThat(service.hasPermission(null, "employee:read")).isFalse();
        }

        @Test
        @DisplayName("빈 권한은 false")
        void hasPermission_emptyPermissions_returnsFalse() {
            assertThat(service.hasPermission(Collections.emptySet(), "employee:read")).isFalse();
        }
    }

    @Nested
    @DisplayName("hasAnyPermission Method")
    class HasAnyPermissionMethod {

        @Test
        @DisplayName("여러 권한 중 하나라도 있으면 true")
        void hasAnyPermission_hasOne_returnsTrue() {
            Set<String> permissions = Set.of("employee:read");

            assertThat(service.hasAnyPermission(permissions, "employee:read", "employee:write")).isTrue();
        }

        @Test
        @DisplayName("여러 권한 중 하나도 없으면 false")
        void hasAnyPermission_hasNone_returnsFalse() {
            Set<String> permissions = Set.of("other:permission");

            assertThat(service.hasAnyPermission(permissions, "employee:read", "employee:write")).isFalse();
        }
    }

    @Nested
    @DisplayName("hasAllPermissions Method")
    class HasAllPermissionsMethod {

        @Test
        @DisplayName("모든 권한이 있으면 true")
        void hasAllPermissions_hasAll_returnsTrue() {
            Set<String> permissions = Set.of("employee:read", "employee:write");

            assertThat(service.hasAllPermissions(permissions, "employee:read", "employee:write")).isTrue();
        }

        @Test
        @DisplayName("일부 권한만 있으면 false")
        void hasAllPermissions_hasSome_returnsFalse() {
            Set<String> permissions = Set.of("employee:read");

            assertThat(service.hasAllPermissions(permissions, "employee:read", "employee:write")).isFalse();
        }

        @Test
        @DisplayName("와일드카드는 모든 권한 충족")
        void hasAllPermissions_wildcard_returnsTrue() {
            Set<String> permissions = Set.of("*:*");

            assertThat(service.hasAllPermissions(permissions, "employee:read", "employee:write")).isTrue();
        }
    }

    @Nested
    @DisplayName("getPermissionScope Method")
    class GetPermissionScopeMethod {

        @Test
        @DisplayName("스코프 있는 권한에서 스코프 추출")
        void getPermissionScope_scopedPermission_returnsScope() {
            assertThat(service.getPermissionScope("employee:read:self")).isEqualTo("self");
            assertThat(service.getPermissionScope("employee:read:department")).isEqualTo("department");
            assertThat(service.getPermissionScope("employee:read:team")).isEqualTo("team");
        }

        @Test
        @DisplayName("스코프 없는 권한은 null 반환")
        void getPermissionScope_unscopedPermission_returnsNull() {
            assertThat(service.getPermissionScope("employee:read")).isNull();
            assertThat(service.getPermissionScope("*:*")).isNull();
        }
    }

    @Nested
    @DisplayName("hasScope Method")
    class HasScopeMethod {

        @Test
        @DisplayName("권한에 특정 스코프가 있으면 true")
        void hasScope_matchingScope_returnsTrue() {
            assertThat(service.hasScope("employee:read:self", "self")).isTrue();
        }

        @Test
        @DisplayName("권한에 다른 스코프가 있으면 false")
        void hasScope_differentScope_returnsFalse() {
            assertThat(service.hasScope("employee:read:department", "self")).isFalse();
        }

        @Test
        @DisplayName("스코프 없는 권한은 false")
        void hasScope_noScope_returnsFalse() {
            assertThat(service.hasScope("employee:read", "self")).isFalse();
        }
    }
}
