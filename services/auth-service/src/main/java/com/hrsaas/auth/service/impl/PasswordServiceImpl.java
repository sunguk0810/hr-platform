package com.hrsaas.auth.service.impl;

import com.hrsaas.auth.domain.dto.request.ChangePasswordRequest;
import com.hrsaas.auth.domain.dto.request.ResetPasswordConfirmRequest;
import com.hrsaas.auth.domain.dto.request.ResetPasswordRequest;
import com.hrsaas.auth.domain.entity.PasswordResetToken;
import com.hrsaas.auth.infrastructure.keycloak.KeycloakClient;
import com.hrsaas.auth.repository.PasswordResetTokenRepository;
import com.hrsaas.auth.service.PasswordService;
import com.hrsaas.auth.service.SessionService;
import com.hrsaas.common.core.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordServiceImpl implements PasswordService {

    private final KeycloakClient keycloakClient;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SessionService sessionService;
    private final KafkaTemplate<String, Object> kafkaTemplate;

    private static final String PASSWORD_RESET_TOPIC = "hr-saas.auth.password-reset-requested";

    @Override
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        log.info("Password change requested for user: {}", userId);

        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("AUTH_003", "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.", HttpStatus.BAD_REQUEST);
        }

        // Validate current password by attempting login
        try {
            keycloakClient.validatePassword(userId, request.getCurrentPassword());
        } catch (Exception e) {
            log.warn("Current password validation failed for user: {}", userId);
            throw new BusinessException("AUTH_004", "현재 비밀번호가 올바르지 않습니다.", HttpStatus.BAD_REQUEST);
        }

        // Change password in Keycloak
        try {
            keycloakClient.changePassword(userId, request.getNewPassword());
            log.info("Password changed successfully for user: {}", userId);
        } catch (Exception e) {
            log.error("Failed to change password for user: {}", userId, e);
            throw new BusinessException("AUTH_005", "비밀번호 변경에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Terminate all other sessions
        sessionService.terminateAllSessions(userId);
    }

    @Override
    @Transactional
    public void requestPasswordReset(ResetPasswordRequest request) {
        log.info("Password reset requested for username: {}", request.getUsername());

        // Invalidate any existing tokens
        passwordResetTokenRepository.invalidateAllTokensByUserId(request.getUsername(), LocalDateTime.now());

        // Create new reset token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = PasswordResetToken.builder()
            .userId(request.getUsername())
            .email(request.getEmail())
            .token(token)
            .expiresAt(LocalDateTime.now().plusHours(24))
            .build();

        passwordResetTokenRepository.save(resetToken);

        // Send notification event
        PasswordResetEvent event = new PasswordResetEvent(
            request.getUsername(),
            request.getEmail(),
            token
        );
        kafkaTemplate.send(PASSWORD_RESET_TOPIC, event);

        log.info("Password reset token created and notification sent for user: {}", request.getUsername());
    }

    @Override
    @Transactional
    public void confirmPasswordReset(ResetPasswordConfirmRequest request) {
        log.info("Password reset confirmation requested");

        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("AUTH_003", "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.", HttpStatus.BAD_REQUEST);
        }

        // Find and validate token
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndUsedFalse(request.getToken())
            .orElseThrow(() -> new BusinessException("AUTH_006", "유효하지 않은 토큰입니다.", HttpStatus.BAD_REQUEST));

        if (!resetToken.isValid()) {
            throw new BusinessException("AUTH_007", "만료되었거나 이미 사용된 토큰입니다.", HttpStatus.BAD_REQUEST);
        }

        // Reset password in Keycloak
        try {
            keycloakClient.changePassword(resetToken.getUserId(), request.getNewPassword());
            log.info("Password reset successfully for user: {}", resetToken.getUserId());
        } catch (Exception e) {
            log.error("Failed to reset password for user: {}", resetToken.getUserId(), e);
            throw new BusinessException("AUTH_005", "비밀번호 변경에 실패했습니다.", HttpStatus.INTERNAL_SERVER_ERROR);
        }

        // Mark token as used
        resetToken.markAsUsed();
        passwordResetTokenRepository.save(resetToken);

        // Terminate all sessions
        sessionService.terminateAllSessions(resetToken.getUserId());
    }

    /**
     * Event to be published when a password reset is requested.
     */
    public record PasswordResetEvent(String userId, String email, String token) {}
}
