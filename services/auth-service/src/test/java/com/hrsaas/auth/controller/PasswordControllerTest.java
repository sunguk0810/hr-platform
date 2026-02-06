package com.hrsaas.auth.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.auth.domain.dto.request.ChangePasswordRequest;
import com.hrsaas.auth.domain.dto.request.ResetPasswordConfirmRequest;
import com.hrsaas.auth.domain.dto.request.ResetPasswordRequest;
import com.hrsaas.auth.service.PasswordService;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Set;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PasswordController.class)
@AutoConfigureMockMvc(addFilters = false)
@DisplayName("PasswordController Tests")
class PasswordControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PasswordService passwordService;

    @MockBean
    private com.hrsaas.common.security.SecurityFilter securityFilter;

    @MockBean
    private com.hrsaas.common.security.jwt.JwtTokenProvider jwtTokenProvider;

    private static final UUID USER_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @BeforeEach
    void setUp() {
        SecurityContextHolder.setContext(UserContext.builder()
                .userId(USER_ID)
                .tenantId(TENANT_ID)
                .roles(Set.of("SUPER_ADMIN"))
                .permissions(Set.of("*"))
                .build());
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    @Nested
    @DisplayName("POST /api/v1/auth/password/change (비밀번호 변경)")
    class ChangePassword {

        @Test
        @DisplayName("정상 비밀번호 변경 (X-User-ID 헤더 없이 SecurityContextHolder 사용)")
        void changePassword_authenticated_success() throws Exception {
            ChangePasswordRequest request = ChangePasswordRequest.builder()
                    .currentPassword("oldPassword123!")
                    .newPassword("NewPassword456!")
                    .confirmPassword("NewPassword456!")
                    .build();

            doNothing().when(passwordService).changePassword(eq(USER_ID.toString()), any());

            mockMvc.perform(post("/api/v1/auth/password/change")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("비밀번호가 성공적으로 변경되었습니다."));

            verify(passwordService).changePassword(eq(USER_ID.toString()), any());
        }

        @Test
        @DisplayName("약한 비밀번호 - 400")
        void changePassword_weakPassword_returns400() throws Exception {
            ChangePasswordRequest request = ChangePasswordRequest.builder()
                    .currentPassword("oldPassword123!")
                    .newPassword("weak")
                    .confirmPassword("weak")
                    .build();

            mockMvc.perform(post("/api/v1/auth/password/change")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest());
        }

        @Test
        @DisplayName("confirmPassword 누락 - 400")
        void changePassword_missingConfirm_returns400() throws Exception {
            String json = "{\"currentPassword\":\"oldPassword123!\",\"newPassword\":\"NewPassword456!\"}";

            mockMvc.perform(post("/api/v1/auth/password/change")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json))
                    .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("POST /api/v1/auth/password/reset (비밀번호 초기화 요청)")
    class ResetPassword {

        @Test
        @DisplayName("정상 초기화 요청")
        void resetPassword_validEmail_success() throws Exception {
            ResetPasswordRequest request = ResetPasswordRequest.builder()
                    .username("hong.gildong")
                    .email("hong@hansung.com")
                    .build();

            doNothing().when(passwordService).requestPasswordReset(any());

            mockMvc.perform(post("/api/v1/auth/password/reset")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("비밀번호 초기화 이메일이 발송되었습니다."));
        }
    }

    @Nested
    @DisplayName("POST /api/v1/auth/password/reset/confirm (비밀번호 초기화 확인)")
    class ConfirmPasswordReset {

        @Test
        @DisplayName("정상 초기화 확인")
        void confirmPasswordReset_validToken_success() throws Exception {
            ResetPasswordConfirmRequest request = ResetPasswordConfirmRequest.builder()
                    .token("valid-reset-token-001")
                    .newPassword("NewPassword789!")
                    .confirmPassword("NewPassword789!")
                    .build();

            doNothing().when(passwordService).confirmPasswordReset(any());

            mockMvc.perform(post("/api/v1/auth/password/reset/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.success").value(true))
                    .andExpect(jsonPath("$.message").value("비밀번호가 성공적으로 초기화되었습니다."));
        }
    }
}
