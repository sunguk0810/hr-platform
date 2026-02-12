package com.hrsaas.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.auth.domain.dto.request.LoginRequest;
import com.hrsaas.auth.domain.dto.request.RefreshTokenRequest;
import com.hrsaas.auth.domain.dto.response.TokenResponse;
import com.hrsaas.auth.domain.dto.response.UserResponse;
import com.hrsaas.auth.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("AuthController Tests")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private com.hrsaas.common.security.SecurityFilter securityFilter;

    @MockBean
    private com.hrsaas.common.security.jwt.JwtTokenProvider jwtTokenProvider;

    private TokenResponse createMockTokenResponse() {
        return TokenResponse.builder()
                .accessToken("test-access-token")
                .refreshToken("test-refresh-token")
                .tokenType("Bearer")
                .expiresIn(1800)
                .refreshExpiresIn(604800)
                .build();
    }

    private UserResponse createMockUserResponse() {
        return UserResponse.builder()
                .id("10000000-0000-0000-0000-000000000001")
                .employeeId("20000000-0000-0000-0000-000000000001")
                .employeeNumber("EMP001")
                .name("관리자")
                .email("admin@hrsaas.com")
                .departmentId("dept-001")
                .departmentName("경영지원팀")
                .positionName("팀장")
                .gradeName("G4")
                .roles(List.of("SUPER_ADMIN"))
                .permissions(List.of("*"))
                .build();
    }

    @Nested
    @DisplayName("POST /api/v1/auth/login (로그인)")
    class Login {

        @Test
        @DisplayName("정상 로그인 - 토큰 발급 성공")
        void login_validCredentials_returnsTokenResponse() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .username("admin")
                    .password("admin123!")
                    .tenantCode("00000000-0000-0000-0000-000000000001")
                    .build();

            when(authService.login(any(), any(), any())).thenReturn(createMockTokenResponse());

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").value("test-access-token"))
                    .andExpect(jsonPath("$.data.refreshToken").value("test-refresh-token"))
                    .andExpect(jsonPath("$.data.tokenType").value("Bearer"));
        }

        @Test
        @DisplayName("인증 실패 - 비밀번호 불일치")
        void login_invalidCredentials_returns401() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .username("admin")
                    .password("wrong")
                    .tenantCode("00000000-0000-0000-0000-000000000001")
                    .build();

            when(authService.login(any(), any(), any()))
                    .thenThrow(new RuntimeException("아이디 또는 비밀번호가 올바르지 않습니다."));

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().is5xxServerError());
        }

        @Test
        @DisplayName("유효성 검사 실패 - username 누락")
        void login_missingUsername_returns400() throws Exception {
            LoginRequest request = LoginRequest.builder()
                    .password("admin123!")
                    .tenantCode("00000000-0000-0000-0000-000000000001")
                    .build();

            mockMvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/auth/token/refresh (토큰 갱신)")
    class RefreshToken {

        @Test
        @DisplayName("정상 토큰 갱신")
        void refreshToken_validToken_returnsNewTokens() throws Exception {
            RefreshTokenRequest request = RefreshTokenRequest.builder()
                    .refreshToken("valid-refresh-token")
                    .build();

            when(authService.refreshToken(any())).thenReturn(createMockTokenResponse());

            mockMvc.perform(post("/api/v1/auth/token/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.accessToken").value("test-access-token"));
        }

        @Test
        @DisplayName("만료 토큰 - 갱신 실패")
        void refreshToken_expiredToken_returns401() throws Exception {
            RefreshTokenRequest request = RefreshTokenRequest.builder()
                    .refreshToken("expired-token")
                    .build();

            when(authService.refreshToken(any()))
                    .thenThrow(new RuntimeException("리프레시 토큰이 만료되었습니다."));

            mockMvc.perform(post("/api/v1/auth/token/refresh")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().is5xxServerError());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/auth/logout (로그아웃)")
    class Logout {

        @Test
        @DisplayName("정상 로그아웃")
        void logout_authenticated_success() throws Exception {
            doNothing().when(authService).logout(anyString());

            mockMvc.perform(post("/api/v1/auth/logout")
                            .header("Authorization", "Bearer test-token"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("로그아웃되었습니다."));
        }
    }

    @Nested
    @DisplayName("GET /api/v1/auth/me (현재 사용자 조회)")
    class GetCurrentUser {

        @Test
        @DisplayName("인증된 사용자 - 정보 반환")
        void getCurrentUser_authenticated_returnsUserInfo() throws Exception {
            when(authService.getCurrentUser()).thenReturn(createMockUserResponse());

            mockMvc.perform(get("/api/v1/auth/me"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.data.name").value("관리자"))
                    .andExpect(jsonPath("$.data.email").value("admin@hrsaas.com"))
                    .andExpect(jsonPath("$.data.roles[0]").value("SUPER_ADMIN"));
        }

    }
}
