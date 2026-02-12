package com.hrsaas.auth.service.impl;

import com.hrsaas.auth.domain.dto.request.CreateUserRequest;
import com.hrsaas.auth.domain.dto.request.UpdateUserRolesRequest;
import com.hrsaas.auth.domain.dto.request.UpdateUserStatusRequest;
import com.hrsaas.auth.domain.dto.response.UserDetailResponse;
import com.hrsaas.auth.domain.entity.UserEntity;
import com.hrsaas.auth.domain.event.PasswordResetCompletedEvent;
import com.hrsaas.auth.repository.UserRepository;
import com.hrsaas.auth.repository.UserSessionRepository;
import com.hrsaas.auth.service.SessionService;
import com.hrsaas.auth.service.UserManagementService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.event.EventPublisher;
import com.hrsaas.common.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserManagementServiceImpl implements UserManagementService {

    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final SessionService sessionService;
    private final EventPublisher eventPublisher;

    @Override
    @Transactional
    public UserDetailResponse createUser(CreateUserRequest request) {
        log.info("Creating user: {}", request.getUsername());

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BusinessException("COMMON_005", "이미 존재하는 사용자명입니다.", HttpStatus.CONFLICT);
        }
        if (request.getEmail() != null && userRepository.existsByEmailAndTenantId(request.getEmail(), request.getTenantId())) {
            throw new BusinessException("COMMON_005", "이미 존재하는 이메일입니다.", HttpStatus.CONFLICT);
        }

        UserEntity user = UserEntity.builder()
                .tenantId(request.getTenantId())
                .employeeId(request.getEmployeeId())
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .roles(request.getRoles() != null ? request.getRoles().toArray(new String[0]) : new String[]{"USER"})
                .permissions(new String[]{})
                .status("ACTIVE")
                .build();

        user = userRepository.save(user);
        log.info("User created: {}", user.getId());

        return mapToDetailResponse(user);
    }

    @Override
    @Transactional(readOnly = true)
    public List<UserDetailResponse> getUsers() {
        UUID tenantId = TenantContext.getCurrentTenant();
        if (tenantId == null) {
            return Collections.emptyList();
        }
        return userRepository.findAllByTenantId(tenantId).stream()
                .map(this::mapToDetailResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetailResponse getUser(UUID userId) {
        UserEntity user = findUserById(userId);
        return mapToDetailResponse(user);
    }

    @Override
    @Transactional
    public void updateStatus(UUID userId, UpdateUserStatusRequest request) {
        log.info("Updating user status: userId={}, status={}", userId, request.getStatus());

        UserEntity user = findUserById(userId);
        user.setStatus(request.getStatus());
        userRepository.save(user);

        if ("INACTIVE".equals(request.getStatus())) {
            sessionService.terminateAllSessions(userId.toString());
        }
    }

    @Override
    @Transactional
    public void updateRoles(UUID userId, UpdateUserRolesRequest request) {
        log.info("Updating user roles: userId={}", userId);

        UserEntity user = findUserById(userId);
        user.setRoles(request.getRoles().toArray(new String[0]));
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void unlockUser(UUID userId) {
        log.info("Unlocking user: userId={}", userId);

        UserEntity user = findUserById(userId);
        user.resetFailedAttempts();
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void resetUserPassword(UUID userId) {
        log.info("Admin password reset for user: userId={}", userId);

        UserEntity user = findUserById(userId);
        // Generate temporary password
        String tempPassword = UUID.randomUUID().toString().substring(0, 12) + "A1!";
        user.setPasswordHash(passwordEncoder.encode(tempPassword));
        user.setPasswordChangedAt(null); // Force password change on next login
        user.resetFailedAttempts();
        userRepository.save(user);

        log.info("Password reset completed for user: {}", userId);

        // Send notification with temporary password via event
        PasswordResetCompletedEvent event = PasswordResetCompletedEvent.of(user, tempPassword);
        eventPublisher.publish(event);
    }

    private UserEntity findUserById(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("AUTH_004", "사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }

    private UserDetailResponse mapToDetailResponse(UserEntity user) {
        long sessionCount = userSessionRepository.countByUserIdAndActiveTrue(user.getId().toString());

        return UserDetailResponse.builder()
                .id(user.getId().toString())
                .tenantId(user.getTenantId().toString())
                .employeeId(user.getEmployeeId() != null ? user.getEmployeeId().toString() : null)
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(user.getRoles() != null ? Arrays.asList(user.getRoles()) : List.of())
                .permissions(user.getPermissions() != null ? Arrays.asList(user.getPermissions()) : List.of())
                .status(user.getStatus())
                .failedLoginAttempts(user.getFailedLoginAttempts())
                .locked(user.isLocked())
                .lastLoginAt(user.getLastLoginAt())
                .passwordChangedAt(user.getPasswordChangedAt())
                .createdAt(user.getCreatedAt())
                .activeSessionCount(sessionCount)
                .build();
    }
}
