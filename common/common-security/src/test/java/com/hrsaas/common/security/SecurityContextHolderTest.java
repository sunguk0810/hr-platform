package com.hrsaas.common.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("SecurityContextHolder Tests")
class SecurityContextHolderTest {

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    private UserContext createTestContext() {
        return UserContext.builder()
            .userId(UUID.randomUUID())
            .tenantId(UUID.randomUUID())
            .employeeId(UUID.randomUUID())
            .username("testuser")
            .email("test@example.com")
            .roles(Set.of("ROLE_EMPLOYEE", "ROLE_HR_ADMIN"))
            .permissions(Set.of("employee:read", "employee:write"))
            .build();
    }

    @Nested
    @DisplayName("Context Management")
    class ContextManagement {

        @Test
        @DisplayName("setContext/getContext: 컨텍스트 설정 및 조회")
        void setAndGetContext_validContext_returnsSameContext() {
            UserContext context = createTestContext();

            SecurityContextHolder.setContext(context);

            assertThat(SecurityContextHolder.getContext()).isEqualTo(context);
        }

        @Test
        @DisplayName("getContext: 설정 전에는 null 반환")
        void getContext_notSet_returnsNull() {
            assertThat(SecurityContextHolder.getContext()).isNull();
        }

        @Test
        @DisplayName("clear: 컨텍스트 초기화")
        void clear_afterSettingContext_removesContext() {
            SecurityContextHolder.setContext(createTestContext());

            SecurityContextHolder.clear();

            assertThat(SecurityContextHolder.getContext()).isNull();
        }
    }

    @Nested
    @DisplayName("ID Getters")
    class IdGetters {

        @Test
        @DisplayName("getCurrentUserId: 현재 사용자 ID 반환")
        void getCurrentUserId_contextSet_returnsUserId() {
            UserContext context = createTestContext();
            SecurityContextHolder.setContext(context);

            assertThat(SecurityContextHolder.getCurrentUserId()).isEqualTo(context.getUserId());
        }

        @Test
        @DisplayName("getCurrentUserId: 컨텍스트 없으면 null")
        void getCurrentUserId_noContext_returnsNull() {
            assertThat(SecurityContextHolder.getCurrentUserId()).isNull();
        }

        @Test
        @DisplayName("getCurrentTenantId: 현재 테넌트 ID 반환")
        void getCurrentTenantId_contextSet_returnsTenantId() {
            UserContext context = createTestContext();
            SecurityContextHolder.setContext(context);

            assertThat(SecurityContextHolder.getCurrentTenantId()).isEqualTo(context.getTenantId());
        }

        @Test
        @DisplayName("getCurrentTenantId: 컨텍스트 없으면 null")
        void getCurrentTenantId_noContext_returnsNull() {
            assertThat(SecurityContextHolder.getCurrentTenantId()).isNull();
        }

        @Test
        @DisplayName("getCurrentEmployeeId: 현재 직원 ID 반환")
        void getCurrentEmployeeId_contextSet_returnsEmployeeId() {
            UserContext context = createTestContext();
            SecurityContextHolder.setContext(context);

            assertThat(SecurityContextHolder.getCurrentEmployeeId()).isEqualTo(context.getEmployeeId());
        }

        @Test
        @DisplayName("getCurrentEmployeeId: 컨텍스트 없으면 null")
        void getCurrentEmployeeId_noContext_returnsNull() {
            assertThat(SecurityContextHolder.getCurrentEmployeeId()).isNull();
        }
    }

    @Nested
    @DisplayName("Roles and Permissions Getters")
    class RolesPermissionsGetters {

        @Test
        @DisplayName("getCurrentRoles: 현재 역할 목록 반환")
        void getCurrentRoles_contextSet_returnsRoles() {
            UserContext context = createTestContext();
            SecurityContextHolder.setContext(context);

            assertThat(SecurityContextHolder.getCurrentRoles())
                .containsExactlyInAnyOrder("ROLE_EMPLOYEE", "ROLE_HR_ADMIN");
        }

        @Test
        @DisplayName("getCurrentRoles: 컨텍스트 없으면 빈 Set")
        void getCurrentRoles_noContext_returnsEmptySet() {
            assertThat(SecurityContextHolder.getCurrentRoles()).isEmpty();
        }

        @Test
        @DisplayName("getCurrentPermissions: 현재 권한 목록 반환")
        void getCurrentPermissions_contextSet_returnsPermissions() {
            UserContext context = createTestContext();
            SecurityContextHolder.setContext(context);

            assertThat(SecurityContextHolder.getCurrentPermissions())
                .containsExactlyInAnyOrder("employee:read", "employee:write");
        }

        @Test
        @DisplayName("getCurrentPermissions: 컨텍스트 없으면 빈 Set")
        void getCurrentPermissions_noContext_returnsEmptySet() {
            assertThat(SecurityContextHolder.getCurrentPermissions()).isEmpty();
        }
    }

    @Nested
    @DisplayName("hasRole Methods")
    class HasRoleMethods {

        @Test
        @DisplayName("hasRole: 역할이 있으면 true")
        void hasRole_roleExists_returnsTrue() {
            SecurityContextHolder.setContext(createTestContext());

            assertThat(SecurityContextHolder.hasRole("ROLE_EMPLOYEE")).isTrue();
            assertThat(SecurityContextHolder.hasRole("ROLE_HR_ADMIN")).isTrue();
        }

        @Test
        @DisplayName("hasRole: 역할이 없으면 false")
        void hasRole_roleNotExists_returnsFalse() {
            SecurityContextHolder.setContext(createTestContext());

            assertThat(SecurityContextHolder.hasRole("ROLE_SUPER_ADMIN")).isFalse();
        }

        @Test
        @DisplayName("hasRole: 컨텍스트 없으면 false")
        void hasRole_noContext_returnsFalse() {
            assertThat(SecurityContextHolder.hasRole("ROLE_EMPLOYEE")).isFalse();
        }

        @Test
        @DisplayName("hasAnyRole: 여러 역할 중 하나라도 있으면 true")
        void hasAnyRole_hasOneRole_returnsTrue() {
            SecurityContextHolder.setContext(createTestContext());

            assertThat(SecurityContextHolder.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_EMPLOYEE")).isTrue();
        }

        @Test
        @DisplayName("hasAnyRole: 여러 역할 중 하나도 없으면 false")
        void hasAnyRole_hasNoRoles_returnsFalse() {
            SecurityContextHolder.setContext(createTestContext());

            assertThat(SecurityContextHolder.hasAnyRole("ROLE_SUPER_ADMIN", "ROLE_TENANT_ADMIN")).isFalse();
        }

        @Test
        @DisplayName("hasAnyRole: 컨텍스트 없으면 false")
        void hasAnyRole_noContext_returnsFalse() {
            assertThat(SecurityContextHolder.hasAnyRole("ROLE_EMPLOYEE", "ROLE_HR_ADMIN")).isFalse();
        }
    }

    @Nested
    @DisplayName("hasPermission Methods")
    class HasPermissionMethods {

        @Test
        @DisplayName("hasPermission: 권한이 있으면 true")
        void hasPermission_permissionExists_returnsTrue() {
            SecurityContextHolder.setContext(createTestContext());

            assertThat(SecurityContextHolder.hasPermission("employee:read")).isTrue();
        }

        @Test
        @DisplayName("hasPermission: 권한이 없으면 false")
        void hasPermission_permissionNotExists_returnsFalse() {
            SecurityContextHolder.setContext(createTestContext());

            assertThat(SecurityContextHolder.hasPermission("employee:delete")).isFalse();
        }

        @Test
        @DisplayName("hasAnyPermission: 여러 권한 중 하나라도 있으면 true")
        void hasAnyPermission_hasOnePermission_returnsTrue() {
            SecurityContextHolder.setContext(createTestContext());

            assertThat(SecurityContextHolder.hasAnyPermission("employee:delete", "employee:read")).isTrue();
        }

        @Test
        @DisplayName("hasAnyPermission: 여러 권한 중 하나도 없으면 false")
        void hasAnyPermission_hasNoPermissions_returnsFalse() {
            SecurityContextHolder.setContext(createTestContext());

            assertThat(SecurityContextHolder.hasAnyPermission("tenant:read", "tenant:write")).isFalse();
        }
    }

    @Nested
    @DisplayName("isAuthenticated Method")
    class IsAuthenticatedMethod {

        @Test
        @DisplayName("isAuthenticated: 컨텍스트 있으면 true")
        void isAuthenticated_contextSet_returnsTrue() {
            SecurityContextHolder.setContext(createTestContext());

            assertThat(SecurityContextHolder.isAuthenticated()).isTrue();
        }

        @Test
        @DisplayName("isAuthenticated: 컨텍스트 없으면 false")
        void isAuthenticated_noContext_returnsFalse() {
            assertThat(SecurityContextHolder.isAuthenticated()).isFalse();
        }

        @Test
        @DisplayName("isAuthenticated: clear 후에는 false")
        void isAuthenticated_afterClear_returnsFalse() {
            SecurityContextHolder.setContext(createTestContext());
            SecurityContextHolder.clear();

            assertThat(SecurityContextHolder.isAuthenticated()).isFalse();
        }
    }

    @Nested
    @DisplayName("Thread Safety")
    class ThreadSafety {

        @Test
        @DisplayName("다른 스레드는 독립적인 컨텍스트를 가짐")
        void differentThreads_haveIsolatedContext() throws InterruptedException {
            UserContext mainContext = createTestContext();
            SecurityContextHolder.setContext(mainContext);

            AtomicReference<UserContext> otherThreadContext = new AtomicReference<>();
            CountDownLatch latch = new CountDownLatch(1);

            Thread otherThread = new Thread(() -> {
                // 다른 스레드에서는 메인 스레드의 컨텍스트를 볼 수 없어야 함
                otherThreadContext.set(SecurityContextHolder.getContext());
                latch.countDown();
            });

            otherThread.start();
            latch.await();

            // 다른 스레드는 null을 봤어야 함
            assertThat(otherThreadContext.get()).isNull();

            // 메인 스레드의 컨텍스트는 영향받지 않아야 함
            assertThat(SecurityContextHolder.getContext()).isEqualTo(mainContext);
        }
    }
}
