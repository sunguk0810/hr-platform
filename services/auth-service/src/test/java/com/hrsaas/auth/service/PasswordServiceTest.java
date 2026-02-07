package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.dto.request.ChangePasswordRequest;
import com.hrsaas.auth.domain.dto.request.ResetPasswordConfirmRequest;
import com.hrsaas.auth.domain.dto.request.ResetPasswordRequest;
import com.hrsaas.auth.domain.entity.PasswordResetToken;
import com.hrsaas.auth.domain.entity.UserEntity;
import com.hrsaas.auth.repository.PasswordResetTokenRepository;
import com.hrsaas.auth.repository.UserRepository;
import com.hrsaas.auth.service.impl.PasswordServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.hrsaas.common.event.EventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("PasswordService Tests")
class PasswordServiceTest {

    @InjectMocks
    private PasswordServiceImpl passwordService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private SessionService sessionService;

    @Mock
    private EventPublisher eventPublisher;

    @Mock
    private PasswordHistoryService passwordHistoryService;

    private static final String USER_ID = "10000000-0000-0000-0000-000000000001";

    private UserEntity createMockUser() {
        UserEntity user = new UserEntity();
        user.setId(UUID.fromString(USER_ID));
        user.setTenantId(UUID.fromString("00000000-0000-0000-0000-000000000001"));
        user.setUsername("admin");
        user.setEmail("admin@hrsaas.com");
        user.setPasswordHash("$2a$10$encoded");
        user.setRoles(new String[]{"SUPER_ADMIN"});
        user.setStatus("ACTIVE");
        user.setFailedLoginAttempts(0);
        return user;
    }

    @Nested
    @DisplayName("changePassword")
    class ChangePasswordTest {

        @Test
        @DisplayName("정상 비밀번호 변경")
        void changePassword_validRequest_success() {
            ChangePasswordRequest request = ChangePasswordRequest.builder()
                    .currentPassword("oldPassword123!")
                    .newPassword("NewPassword456!")
                    .confirmPassword("NewPassword456!")
                    .build();

            UserEntity user = createMockUser();
            when(userRepository.findByUsername(USER_ID)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("oldPassword123!", "$2a$10$encoded")).thenReturn(true);
            when(passwordEncoder.encode("NewPassword456!")).thenReturn("$2a$10$newencoded");
            when(passwordHistoryService.isRecentlyUsed(any(), anyString(), anyInt())).thenReturn(false);

            passwordService.changePassword(USER_ID, request);

            verify(userRepository).save(user);
            verify(sessionService).terminateAllSessions(USER_ID);
            verify(passwordHistoryService).saveHistory(user.getId(), "$2a$10$encoded");
        }

        @Test
        @DisplayName("현재 비밀번호 불일치 - 예외")
        void changePassword_wrongCurrentPassword_throwsException() {
            ChangePasswordRequest request = ChangePasswordRequest.builder()
                    .currentPassword("wrongPassword")
                    .newPassword("NewPassword456!")
                    .confirmPassword("NewPassword456!")
                    .build();

            UserEntity user = createMockUser();
            when(userRepository.findByUsername(USER_ID)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("wrongPassword", "$2a$10$encoded")).thenReturn(false);

            assertThatThrownBy(() -> passwordService.changePassword(USER_ID, request))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("새 비밀번호 불일치 - 예외")
        void changePassword_passwordMismatch_throwsException() {
            ChangePasswordRequest request = ChangePasswordRequest.builder()
                    .currentPassword("oldPassword123!")
                    .newPassword("NewPassword456!")
                    .confirmPassword("DifferentPassword789!")
                    .build();

            assertThatThrownBy(() -> passwordService.changePassword(USER_ID, request))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("최근 사용한 비밀번호 재사용 - 예외")
        void changePassword_recentlyUsedPassword_throwsException() {
            ChangePasswordRequest request = ChangePasswordRequest.builder()
                    .currentPassword("oldPassword123!")
                    .newPassword("ReusedPassword!")
                    .confirmPassword("ReusedPassword!")
                    .build();

            UserEntity user = createMockUser();
            when(userRepository.findByUsername(USER_ID)).thenReturn(Optional.of(user));
            when(passwordEncoder.matches("oldPassword123!", "$2a$10$encoded")).thenReturn(true);
            when(passwordHistoryService.isRecentlyUsed(any(), eq("ReusedPassword!"), anyInt())).thenReturn(true);

            assertThatThrownBy(() -> passwordService.changePassword(USER_ID, request))
                    .isInstanceOf(RuntimeException.class);
        }
    }

    @Nested
    @DisplayName("requestPasswordReset")
    class RequestPasswordResetTest {

        @Test
        @DisplayName("정상 초기화 요청 - 토큰 생성")
        void requestPasswordReset_validUser_createsToken() {
            ResetPasswordRequest request = ResetPasswordRequest.builder()
                    .username("admin")
                    .email("admin@hrsaas.com")
                    .build();

            passwordService.requestPasswordReset(request);

            verify(passwordResetTokenRepository).invalidateAllTokensByUserId(anyString(), any());
            verify(passwordResetTokenRepository).save(any(PasswordResetToken.class));
            verify(eventPublisher).publish(any());
        }
    }

    @Nested
    @DisplayName("confirmPasswordReset")
    class ConfirmPasswordResetTest {

        @Test
        @DisplayName("유효한 토큰 - 비밀번호 초기화 성공")
        void confirmPasswordReset_validToken_resetsPassword() {
            ResetPasswordConfirmRequest request = ResetPasswordConfirmRequest.builder()
                    .token("valid-token")
                    .newPassword("NewPassword789!")
                    .confirmPassword("NewPassword789!")
                    .build();

            PasswordResetToken resetToken = PasswordResetToken.builder()
                    .userId(USER_ID)
                    .token("valid-token")
                    .expiresAt(LocalDateTime.now().plusHours(1))
                    .used(false)
                    .build();

            UserEntity user = createMockUser();

            when(passwordResetTokenRepository.findByTokenAndUsedFalse("valid-token"))
                    .thenReturn(Optional.of(resetToken));
            when(userRepository.findByUsername(USER_ID))
                    .thenReturn(Optional.of(user));
            when(passwordEncoder.encode("NewPassword789!"))
                    .thenReturn("$2a$10$newencoded");
            when(passwordHistoryService.isRecentlyUsed(any(), anyString(), anyInt())).thenReturn(false);

            passwordService.confirmPasswordReset(request);

            verify(userRepository).save(user);
            verify(passwordResetTokenRepository).save(resetToken);
            verify(sessionService).terminateAllSessions(USER_ID);
            verify(passwordHistoryService).saveHistory(user.getId(), "$2a$10$encoded");
        }

        @Test
        @DisplayName("만료된 토큰 - 예외")
        void confirmPasswordReset_expiredToken_throwsException() {
            ResetPasswordConfirmRequest request = ResetPasswordConfirmRequest.builder()
                    .token("expired-token")
                    .newPassword("NewPassword789!")
                    .confirmPassword("NewPassword789!")
                    .build();

            PasswordResetToken resetToken = new PasswordResetToken();
            resetToken.setUserId(USER_ID);
            resetToken.setToken("expired-token");
            resetToken.setExpiresAt(LocalDateTime.now().minusHours(1));
            resetToken.setUsed(false);

            when(passwordResetTokenRepository.findByTokenAndUsedFalse("expired-token"))
                    .thenReturn(Optional.of(resetToken));

            assertThatThrownBy(() -> passwordService.confirmPasswordReset(request))
                    .isInstanceOf(RuntimeException.class);
        }
    }
}
