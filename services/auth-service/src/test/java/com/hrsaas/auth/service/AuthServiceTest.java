package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.dto.request.LoginRequest;
import com.hrsaas.auth.domain.dto.request.RefreshTokenRequest;
import com.hrsaas.auth.domain.dto.response.TokenResponse;
import com.hrsaas.auth.domain.dto.response.UserResponse;
import com.hrsaas.auth.domain.entity.UserEntity;
import com.hrsaas.auth.repository.UserRepository;
import com.hrsaas.auth.service.impl.AuthServiceImpl;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.common.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Tests")
class AuthServiceTest {

    @InjectMocks
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

    private static final UUID USER_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

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
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);
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
                    .build();

            UserEntity user = createMockUser();
            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("admin123!", "$2a$10$encoded")).thenReturn(true);
            when(jwtTokenProvider.generateAccessToken(any(UserContext.class))).thenReturn("access-token");
            when(jwtTokenProvider.generateRefreshToken(any(UUID.class))).thenReturn("refresh-token");
            when(jwtTokenProvider.getRefreshTokenExpiry()).thenReturn(86400L);
            when(jwtTokenProvider.getAccessTokenExpiry()).thenReturn(3600L);

            TokenResponse response = authService.login(request);

            assertThat(response).isNotNull();
            assertThat(response.getAccessToken()).isEqualTo("access-token");
            assertThat(response.getRefreshToken()).isEqualTo("refresh-token");
        }

        @Test
        @DisplayName("존재하지 않는 사용자 - 예외 발생")
        void login_userNotFound_throwsException() {
            LoginRequest request = LoginRequest.builder()
                    .username("nonexistent")
                    .password("password")
                    .build();

            when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("잘못된 비밀번호 - 예외 발생")
        void login_wrongPassword_throwsException() {
            LoginRequest request = LoginRequest.builder()
                    .username("admin")
                    .password("wrong")
                    .build();

            UserEntity user = createMockUser();
            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrong", "$2a$10$encoded")).thenReturn(false);

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("잠긴 계정 - 예외 발생")
        void login_lockedAccount_throwsException() {
            LoginRequest request = LoginRequest.builder()
                    .username("admin")
                    .password("admin123!")
                    .build();

            UserEntity user = createMockUser();
            user.setStatus("LOCKED");

            when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(RuntimeException.class);
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
    }
}
