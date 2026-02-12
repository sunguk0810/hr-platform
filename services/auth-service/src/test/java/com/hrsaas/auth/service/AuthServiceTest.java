package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.dto.request.LoginRequest;
import com.hrsaas.auth.domain.dto.request.RefreshTokenRequest;
import com.hrsaas.auth.domain.dto.response.TokenResponse;
import com.hrsaas.auth.domain.dto.response.UserResponse;
import com.hrsaas.auth.domain.entity.UserEntity;
import com.hrsaas.auth.repository.UserRepository;
import com.hrsaas.auth.client.TenantServiceClient;
import com.hrsaas.auth.service.impl.AuthServiceImpl;
import com.hrsaas.auth.service.impl.MfaServiceImpl;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.common.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Tests")
class AuthServiceTest {

    private AuthServiceImpl authService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @Mock
    private SessionService sessionService;

    @Mock
    private LoginHistoryService loginHistoryService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private MfaServiceImpl mfaService;

    @Mock
    private TenantServiceClient tenantServiceClient;

    private static final UUID USER_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String IP_ADDRESS = "192.168.1.1";
    private static final String USER_AGENT = "Mozilla/5.0 Chrome";

    private UserEntity createMockUser() {
        UserEntity user = new UserEntity();
        user.setId(USER_ID);
        user.setTenantId(TENANT_ID);
        user.setEmployeeId(UUID.fromString("20000000-0000-0000-0000-000000000001"));
        user.setUsername("admin");
        user.setEmail("admin@hrsaas.com");
        user.setPasswordHash("$2a$10$encoded");
        user.setRoles(new String[]{"SUPER_ADMIN"});
        user.setPermissions(new String[]{"*"});
        user.setStatus("ACTIVE");
        user.setFailedLoginAttempts(0);
        return user;
    }

    @BeforeEach
    void setUp() {
        authService = new AuthServiceImpl(
                userRepository,
                jwtTokenProvider,
                passwordEncoder,
                redisTemplate,
                sessionService,
                loginHistoryService,
                Optional.of(auditLogService),
                mfaService,
                Optional.of(tenantServiceClient)
        );
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
        lenient().when(tenantServiceClient.getTenantStatus(any(UUID.class))).thenReturn(null);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    @Nested
    @DisplayName("login")
    class LoginTest {

        @Test
        @DisplayName("정상 로그인 - 토큰 발급 성공")
        void login_validCredentials_returnsTokenResponse() {
            LoginRequest request = LoginRequest.builder()
                    .username("admin")
                    .password("admin123!")
                    .tenantCode(TENANT_ID.toString())
                    .build();

            UserEntity user = createMockUser();
            when(userRepository.findByUsernameAndTenantId("admin", TENANT_ID)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("admin123!", "$2a$10$encoded")).thenReturn(true);
            when(jwtTokenProvider.generateAccessToken(any(UserContext.class))).thenReturn("access-token");
            when(jwtTokenProvider.generateRefreshToken(any(UUID.class))).thenReturn("refresh-token");
            when(jwtTokenProvider.getRefreshTokenExpiry()).thenReturn(86400L);
            when(jwtTokenProvider.getAccessTokenExpiry()).thenReturn(3600L);

            TokenResponse response = authService.login(request, IP_ADDRESS, USER_AGENT);

            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        }

        @Test
        @DisplayName("정상 로그인 - 세션 생성 호출")
        void login_validCredentials_createsSession() {
            LoginRequest request = LoginRequest.builder()
                    .username("admin")
                    .password("admin123!")
                    .tenantCode(TENANT_ID.toString())
                    .build();

            UserEntity user = createMockUser();
            when(userRepository.findByUsernameAndTenantId("admin", TENANT_ID)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("admin123!", "$2a$10$encoded")).thenReturn(true);
            when(jwtTokenProvider.generateAccessToken(any(UserContext.class))).thenReturn("access-token");
            when(jwtTokenProvider.generateRefreshToken(any(UUID.class))).thenReturn("refresh-token");
            when(jwtTokenProvider.getRefreshTokenExpiry()).thenReturn(86400L);
            when(jwtTokenProvider.getAccessTokenExpiry()).thenReturn(3600L);

            authService.login(request, IP_ADDRESS, USER_AGENT);

            verify(sessionService).createSession(
                    eq(USER_ID.toString()),
                    eq(TENANT_ID),
                    eq("access-token"),
                    eq("refresh-token"),
                    eq(USER_AGENT),
                    eq(IP_ADDRESS),
                    eq(USER_AGENT)
            );
        }

        @Test
        @DisplayName("정상 로그인 - 로그인 이력 기록")
        void login_validCredentials_recordsLoginHistory() {
            LoginRequest request = LoginRequest.builder()
                    .username("admin")
                    .password("admin123!")
                    .tenantCode(TENANT_ID.toString())
                    .build();

            UserEntity user = createMockUser();
            when(userRepository.findByUsernameAndTenantId("admin", TENANT_ID)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("admin123!", "$2a$10$encoded")).thenReturn(true);
            when(jwtTokenProvider.generateAccessToken(any(UserContext.class))).thenReturn("access-token");
            when(jwtTokenProvider.generateRefreshToken(any(UUID.class))).thenReturn("refresh-token");
            when(jwtTokenProvider.getRefreshTokenExpiry()).thenReturn(86400L);
            when(jwtTokenProvider.getAccessTokenExpiry()).thenReturn(3600L);

            authService.login(request, IP_ADDRESS, USER_AGENT);

            verify(loginHistoryService).recordSuccess("admin", TENANT_ID, IP_ADDRESS, USER_AGENT);
        }

        @Test
        @DisplayName("존재하지 않는 사용자 - 예외 발생 + 실패 이력 기록")
        void login_userNotFound_throwsException() {
            LoginRequest request = LoginRequest.builder()
                    .username("nonexistent")
                    .password("password")
                    .tenantCode(TENANT_ID.toString())
                    .build();

            when(userRepository.findByUsernameAndTenantId("nonexistent", TENANT_ID)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request, IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(RuntimeException.class);

            verify(loginHistoryService).recordFailure(eq("nonexistent"), eq(TENANT_ID), eq(IP_ADDRESS), eq(USER_AGENT), eq("USER_NOT_FOUND"));
        }

        @Test
        @DisplayName("잘못된 비밀번호 - 예외 발생 + 실패 이력 기록")
        void login_wrongPassword_throwsException() {
            LoginRequest request = LoginRequest.builder()
                    .username("admin")
                    .password("wrong")
                    .tenantCode(TENANT_ID.toString())
                    .build();

            UserEntity user = createMockUser();
            when(userRepository.findByUsernameAndTenantId("admin", TENANT_ID)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong", "$2a$10$encoded")).thenReturn(false);

            assertThatThrownBy(() -> authService.login(request, IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(RuntimeException.class);

            verify(loginHistoryService).recordFailure("admin", TENANT_ID, IP_ADDRESS, USER_AGENT, "INVALID_PASSWORD");
        }

        @Test
        @DisplayName("잠긴 계정 - 예외 발생")
        void login_lockedAccount_throwsException() {
            LoginRequest request = LoginRequest.builder()
                    .username("admin")
                    .password("admin123!")
                    .tenantCode(TENANT_ID.toString())
                    .build();

            UserEntity user = createMockUser();
            user.setStatus("LOCKED");

            when(userRepository.findByUsernameAndTenantId("admin", TENANT_ID)).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> authService.login(request, IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("테넌트 코드 누락 + 단일 사용자 - 정상 로그인")
        void login_missingTenantCode_singleUser_success() {
            LoginRequest request = LoginRequest.builder()
                    .username("admin")
                    .password("admin123!")
                    .build(); // tenantCode is null

            UserEntity user = createMockUser();
            when(userRepository.findAllByUsername("admin")).thenReturn(List.of(user));
            when(passwordEncoder.matches("admin123!", "$2a$10$encoded")).thenReturn(true);
            when(jwtTokenProvider.generateAccessToken(any(UserContext.class))).thenReturn("access-token");
            when(jwtTokenProvider.generateRefreshToken(any(UUID.class))).thenReturn("refresh-token");
            when(jwtTokenProvider.getRefreshTokenExpiry()).thenReturn(86400L);
            when(jwtTokenProvider.getAccessTokenExpiry()).thenReturn(3600L);

            TokenResponse response = authService.login(request, IP_ADDRESS, USER_AGENT);

            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
            verify(userRepository, never()).findByUsernameAndTenantId(anyString(), any(UUID.class));
        }

        @Test
        @DisplayName("테넌트 코드 누락 + 다수 사용자 - AUTH_015 에러")
        void login_missingTenantCode_multipleUsers_throwsConflict() {
            LoginRequest request = LoginRequest.builder()
                    .username("admin")
                    .password("admin123!")
                    .build();

            UserEntity user1 = createMockUser();
            UserEntity user2 = createMockUser();
            user2.setTenantId(UUID.fromString("00000000-0000-0000-0000-000000000002"));
            when(userRepository.findAllByUsername("admin")).thenReturn(List.of(user1, user2));

            assertThatThrownBy(() -> authService.login(request, IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("동일한 사용자명이 여러 회사에 등록되어 있습니다");
        }

        @Test
        @DisplayName("테넌트 코드 누락 + 미존재 사용자 - AUTH_001 에러")
        void login_missingTenantCode_noUser_throwsUnauthorized() {
            LoginRequest request = LoginRequest.builder()
                    .username("nonexistent")
                    .password("password")
                    .build();

            when(userRepository.findAllByUsername("nonexistent")).thenReturn(List.of());

            assertThatThrownBy(() -> authService.login(request, IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("아이디 또는 비밀번호가 올바르지 않습니다");

            verify(loginHistoryService).recordFailure(eq("nonexistent"), eq(null), eq(IP_ADDRESS), eq(USER_AGENT), eq("USER_NOT_FOUND"));
        }

        @Test
        @DisplayName("잘못된 테넌트 코드 형식 - 예외 발생")
        void login_invalidTenantCode_throwsException() {
            LoginRequest request = LoginRequest.builder()
                    .username("admin")
                    .password("admin123!")
                    .tenantCode("invalid-uuid")
                    .build();

            assertThatThrownBy(() -> authService.login(request, IP_ADDRESS, USER_AGENT))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("올바르지 않은 테넌트 코드입니다.");
        }
    }

    @Nested
    @DisplayName("getCurrentUser")
    class GetCurrentUserTest {

        @Test
        @DisplayName("인증된 사용자 정보 반환")
        void getCurrentUser_authenticated_returnsUserResponse() {
            SecurityContextHolder.setContext(UserContext.builder()
                    .userId(USER_ID)
                    .tenantId(TENANT_ID)
                    .username("관리자")
                    .email("admin@hrsaas.com")
                    .roles(Set.of("SUPER_ADMIN"))
                    .permissions(Set.of("*"))
                    .build());

            UserResponse response = authService.getCurrentUser();

            assertThat(response).isNotNull();
            assertThat(response.getName()).isEqualTo("관리자");
            assertThat(response.getEmail()).isEqualTo("admin@hrsaas.com");
        }
    }

    @Nested
    @DisplayName("refreshToken")
    class RefreshTokenTest {

        @Test
        @DisplayName("유효한 리프레시 토큰 - 새 토큰 발급")
        void refreshToken_validToken_returnsNewTokens() {
            RefreshTokenRequest request = RefreshTokenRequest.builder()
                    .refreshToken("valid-refresh-token")
                    .build();

            UserEntity user = createMockUser();

            when(redisTemplate.hasKey(anyString())).thenReturn(false);
            when(jwtTokenProvider.isRefreshToken("valid-refresh-token")).thenReturn(true);
            when(jwtTokenProvider.extractUserId("valid-refresh-token")).thenReturn(USER_ID);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(jwtTokenProvider.generateAccessToken(any(UserContext.class))).thenReturn("new-access");
            when(jwtTokenProvider.generateRefreshToken(any(UUID.class))).thenReturn("new-refresh");
            when(jwtTokenProvider.getRefreshTokenExpiry()).thenReturn(86400L);
            when(jwtTokenProvider.getAccessTokenExpiry()).thenReturn(3600L);

            TokenResponse response = authService.refreshToken(request);

            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("new-access");
            assertThat(response.getRefreshToken()).isEqualTo("new-refresh");
        }

        @Test
        @DisplayName("리프레시 토큰 갱신 시 이전 토큰 블랙리스트에 추가")
        void refreshToken_validToken_blacklistsOldToken() {
            RefreshTokenRequest request = RefreshTokenRequest.builder()
                    .refreshToken("old-refresh-token")
                    .build();

            UserEntity user = createMockUser();

            when(redisTemplate.hasKey(anyString())).thenReturn(false);
            when(jwtTokenProvider.isRefreshToken("old-refresh-token")).thenReturn(true);
            when(jwtTokenProvider.extractUserId("old-refresh-token")).thenReturn(USER_ID);
            when(userRepository.findById(USER_ID)).thenReturn(Optional.of(user));
            when(jwtTokenProvider.generateAccessToken(any(UserContext.class))).thenReturn("new-access");
            when(jwtTokenProvider.generateRefreshToken(any(UUID.class))).thenReturn("new-refresh");
            when(jwtTokenProvider.getRefreshTokenExpiry()).thenReturn(86400L);
            when(jwtTokenProvider.getAccessTokenExpiry()).thenReturn(3600L);

            authService.refreshToken(request);

            verify(valueOperations).set(eq("token:blacklist:old-refresh-token"), eq("1"), eq(86400L), any());
        }
    }

    @Nested
    @DisplayName("logout")
    class LogoutTest {

        @Test
        @DisplayName("로그아웃 - 토큰 블랙리스트 + 세션 종료")
        void logout_validToken_blacklistsAndTerminatesSession() {
            when(jwtTokenProvider.getAccessTokenExpiry()).thenReturn(3600L);
            when(jwtTokenProvider.extractUserId("test-access-token")).thenReturn(USER_ID);
            when(redisTemplate.delete(anyString())).thenReturn(true);

            authService.logout("Bearer test-access-token");

            verify(valueOperations).set(eq("token:blacklist:test-access-token"), eq("1"), eq(3600L), any());
            verify(sessionService).terminateByAccessToken("test-access-token");
        }

        @Test
        @DisplayName("로그아웃 - 세션 종료 실패해도 예외 전파 안 함")
        void logout_sessionTerminationFails_doesNotThrow() {
            when(jwtTokenProvider.getAccessTokenExpiry()).thenReturn(3600L);
            when(jwtTokenProvider.extractUserId("test-access-token")).thenReturn(USER_ID);
            when(redisTemplate.delete(anyString())).thenReturn(true);
            doThrow(new RuntimeException("session error")).when(sessionService).terminateByAccessToken("test-access-token");

            authService.logout("Bearer test-access-token");

            verify(valueOperations).set(eq("token:blacklist:test-access-token"), eq("1"), eq(3600L), any());
        }
    }
}
