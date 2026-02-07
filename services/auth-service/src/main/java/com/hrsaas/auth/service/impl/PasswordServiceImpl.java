package com.hrsaas.auth.service.impl;

import com.hrsaas.auth.domain.dto.request.ChangePasswordRequest;
import com.hrsaas.auth.domain.dto.request.ResetPasswordConfirmRequest;
import com.hrsaas.auth.domain.dto.request.ResetPasswordRequest;
import com.hrsaas.auth.domain.entity.PasswordResetToken;
import com.hrsaas.auth.domain.entity.UserEntity;
import com.hrsaas.auth.repository.PasswordResetTokenRepository;
import com.hrsaas.auth.repository.UserRepository;
import com.hrsaas.auth.service.PasswordHistoryService;
import com.hrsaas.auth.service.PasswordService;
import com.hrsaas.auth.service.SessionService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.event.DomainEvent;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.event.EventTopics;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordServiceImpl implements PasswordService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final SessionService sessionService;
    private final EventPublisher eventPublisher;
    private final PasswordHistoryService passwordHistoryService;

    @Value("${auth.password.history-count:5}")
    private int passwordHistoryCount;

    @Override
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        log.info("Password change requested for user: {}", userId);

        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("AUTH_011", "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.", HttpStatus.BAD_REQUEST);
        }

        UserEntity user = userRepository.findByUsername(userId)
                .orElseThrow(() -> new BusinessException("AUTH_004", "사용자를 찾을 수 없습니다.", HttpStatus.BAD_REQUEST));

        // Validate current password
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            log.warn("Current password validation failed for user: {}", userId);
            throw new BusinessException("AUTH_012", "현재 비밀번호가 올바르지 않습니다.", HttpStatus.BAD_REQUEST);
        }

        // Check password history
        if (passwordHistoryService.isRecentlyUsed(user.getId(), request.getNewPassword(), passwordHistoryCount)) {
            throw new BusinessException("AUTH_014", "최근 사용한 비밀번호는 재사용할 수 없습니다.", HttpStatus.BAD_REQUEST);
        }

        // Save current password to history before changing
        passwordHistoryService.saveHistory(user.getId(), user.getPasswordHash());

        // Change password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(OffsetDateTime.now());
        userRepository.save(user);
        log.info("Password changed successfully for user: {}", userId);

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
        PasswordResetRequestedEvent event = PasswordResetRequestedEvent.builder()
            .userId(request.getUsername())
            .email(request.getEmail())
            .resetToken(token)
            .build();
        eventPublisher.publish(event);

        log.info("Password reset token created and notification sent for user: {}", request.getUsername());
    }

    @Override
    @Transactional
    public void confirmPasswordReset(ResetPasswordConfirmRequest request) {
        log.info("Password reset confirmation requested");

        // Validate passwords match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessException("AUTH_011", "새 비밀번호와 확인 비밀번호가 일치하지 않습니다.", HttpStatus.BAD_REQUEST);
        }

        // Find and validate token
        PasswordResetToken resetToken = passwordResetTokenRepository.findByTokenAndUsedFalse(request.getToken())
            .orElseThrow(() -> new BusinessException("AUTH_006", "유효하지 않은 토큰입니다.", HttpStatus.BAD_REQUEST));

        if (!resetToken.isValid()) {
            throw new BusinessException("AUTH_007", "만료되었거나 이미 사용된 토큰입니다.", HttpStatus.BAD_REQUEST);
        }

        // Reset password in database
        UserEntity user = userRepository.findByUsername(resetToken.getUserId())
                .orElseThrow(() -> new BusinessException("AUTH_004", "사용자를 찾을 수 없습니다.", HttpStatus.BAD_REQUEST));

        // Check password history
        if (passwordHistoryService.isRecentlyUsed(user.getId(), request.getNewPassword(), passwordHistoryCount)) {
            throw new BusinessException("AUTH_014", "최근 사용한 비밀번호는 재사용할 수 없습니다.", HttpStatus.BAD_REQUEST);
        }

        // Save current password to history before changing
        passwordHistoryService.saveHistory(user.getId(), user.getPasswordHash());

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setPasswordChangedAt(OffsetDateTime.now());
        user.resetFailedAttempts();
        userRepository.save(user);
        log.info("Password reset successfully for user: {}", resetToken.getUserId());

        // Mark token as used
        resetToken.markAsUsed();
        passwordResetTokenRepository.save(resetToken);

        // Terminate all sessions
        sessionService.terminateAllSessions(resetToken.getUserId());
    }

    /**
     * Event published when a password reset is requested.
     */
    @Getter
    @SuperBuilder
    public static class PasswordResetRequestedEvent extends DomainEvent {
        private final String userId;
        private final String email;
        private final String resetToken;

        @Override
        public String getTopic() {
            return EventTopics.NOTIFICATION_SEND;
        }
    }
}
