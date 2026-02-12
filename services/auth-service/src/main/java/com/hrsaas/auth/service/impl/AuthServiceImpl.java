package com.hrsaas.auth.service.impl;

import com.hrsaas.auth.domain.dto.request.LoginRequest;
import com.hrsaas.auth.domain.dto.request.RefreshTokenRequest;
import com.hrsaas.auth.domain.dto.response.TokenResponse;
import com.hrsaas.auth.domain.dto.response.UserResponse;
import com.hrsaas.auth.domain.entity.UserEntity;
import com.hrsaas.auth.repository.UserRepository;
import com.hrsaas.auth.client.TenantServiceClient;
import com.hrsaas.auth.service.AuthService;
import com.hrsaas.auth.service.LoginHistoryService;
import com.hrsaas.auth.service.SessionService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.common.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.hrsaas.auth.domain.dto.TenantDto;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, String> redisTemplate;
    private final SessionService sessionService;
    private final LoginHistoryService loginHistoryService;
    private final MfaServiceImpl mfaService;
    private final Optional<TenantServiceClient> tenantServiceClient;

    @Value("${auth.password.expiry-days:90}")
    private int passwordExpiryDays;

    private static final String BLACKLIST_PREFIX = "token:blacklist:";
    private static final String REFRESH_PREFIX = "token:refresh:";
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 30;

    @Override
    @Transactional
    public TokenResponse login(LoginRequest request, String ipAddress, String userAgent) {
        log.info("Login attempt: username={}", request.getUsername());

        UserEntity user;

        if (request.getTenantCode() != null && !request.getTenantCode().isBlank()) {
            // Path A: tenantCode 제공 → 기존 흐름 (하위 호환)
            final UUID tenantId = resolveTenantId(request.getTenantCode());
            user = userRepository.findByUsernameAndTenantId(request.getUsername(), tenantId)
                    .orElseThrow(() -> {
                        log.warn("Login failed: user not found username={}, tenantId={}", request.getUsername(), tenantId);
                        loginHistoryService.recordFailure(request.getUsername(), tenantId, ipAddress, userAgent, "USER_NOT_FOUND");
                        return new BusinessException("AUTH_001", "아이디 또는 비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED);
                    });
        } else {
            // Path B: tenantCode 없음 → username만으로 조회
            List<UserEntity> users = userRepository.findAllByUsername(request.getUsername());
            if (users.isEmpty()) {
                log.warn("Login failed: user not found username={}", request.getUsername());
                loginHistoryService.recordFailure(request.getUsername(), null, ipAddress, userAgent, "USER_NOT_FOUND");
                throw new BusinessException("AUTH_001", "아이디 또는 비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED);
            }
            if (users.size() > 1) {
                log.warn("Login failed: multiple users found for username={}, count={}", request.getUsername(), users.size());
                throw new BusinessException("AUTH_015",
                        "동일한 사용자명이 여러 회사에 등록되어 있습니다. 회사코드를 입력해주세요.", HttpStatus.CONFLICT);
            }
            user = users.get(0);
        }

        // Check tenant status
        if (user.getTenantId() != null) {
            checkTenantStatus(user.getTenantId(), user.getUsername(), ipAddress, userAgent);
        }

        if (!user.isActive()) {
            loginHistoryService.recordFailure(user.getUsername(), user.getTenantId(), ipAddress, userAgent, "INACTIVE_ACCOUNT");
            throw new BusinessException("AUTH_008", "비활성화된 계정입니다.", HttpStatus.UNAUTHORIZED);
        }

        if (user.isLocked()) {
            loginHistoryService.recordFailure(user.getUsername(), user.getTenantId(), ipAddress, userAgent, "ACCOUNT_LOCKED");
            throw new BusinessException("AUTH_009", "계정이 잠겨있습니다. 잠시 후 다시 시도해주세요.", HttpStatus.UNAUTHORIZED);
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.incrementFailedAttempts();
            if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
                user.setLockedUntil(OffsetDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
                log.warn("Account locked due to failed attempts: username={}", request.getUsername());
            }
            userRepository.save(user);
            log.warn("Login failed: invalid password username={}", request.getUsername());
            loginHistoryService.recordFailure(user.getUsername(), user.getTenantId(), ipAddress, userAgent, "INVALID_PASSWORD");
            throw new BusinessException("AUTH_001", "아이디 또는 비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED);
        }

        // Reset failed attempts on successful login
        user.resetFailedAttempts();
        user.setLastLoginAt(OffsetDateTime.now());
        userRepository.save(user);

        // Check MFA requirement
        if (mfaService.isMfaEnabled(user.getId())) {
            String mfaToken = mfaService.createMfaPendingToken(user.getId());
            log.info("MFA required for user: {}", request.getUsername());
            return TokenResponse.builder()
                    .tokenType("Bearer")
                    .mfaRequired(true)
                    .accessToken(mfaToken)
                    .build();
        }

        // Build UserContext and generate tokens
        UserContext context = buildUserContext(user);
        String accessToken = jwtTokenProvider.generateAccessToken(context);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        // Store refresh token in Redis
        String refreshKey = REFRESH_PREFIX + user.getId();
        redisTemplate.opsForValue().set(refreshKey, refreshToken,
                jwtTokenProvider.getRefreshTokenExpiry(), TimeUnit.SECONDS);

        // Create session
        try {
            sessionService.createSession(
                    user.getId().toString(),
                    user.getTenantId(),
                    accessToken,
                    refreshToken,
                    userAgent,
                    ipAddress,
                    userAgent
            );
        } catch (Exception e) {
            log.warn("Failed to create session for user: {}", user.getUsername(), e);
        }

        // Record login success
        loginHistoryService.recordSuccess(user.getUsername(), user.getTenantId(), ipAddress, userAgent);

        log.info("Login successful: username={}", request.getUsername());

        // Check password expiry
        boolean passwordExpired = false;
        Integer passwordExpiresInDays = null;
        if (passwordExpiryDays > 0) {
            OffsetDateTime passwordChangedAt = user.getPasswordChangedAt();
            if (passwordChangedAt == null) {
                passwordExpired = true;
                passwordExpiresInDays = 0;
            } else {
                long daysSinceChange = ChronoUnit.DAYS.between(passwordChangedAt, OffsetDateTime.now());
                int remaining = passwordExpiryDays - (int) daysSinceChange;
                passwordExpired = remaining <= 0;
                passwordExpiresInDays = Math.max(remaining, 0);
            }
        }

        // Resolve tenant info for response
        TenantDto tenantInfo = resolveTenantInfo(user.getTenantId());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpiry())
                .refreshExpiresIn(jwtTokenProvider.getRefreshTokenExpiry())
                .passwordExpired(passwordExpired)
                .passwordExpiresInDays(passwordExpiresInDays)
                .tenantId(user.getTenantId() != null ? user.getTenantId().toString() : null)
                .tenantCode(tenantInfo != null ? tenantInfo.getCode() : null)
                .tenantName(tenantInfo != null ? tenantInfo.getName() : null)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        log.debug("Token refresh attempt");

        String refreshToken = request.getRefreshToken();

        // Check if token is blacklisted
        String blacklistKey = BLACKLIST_PREFIX + refreshToken;
        if (Boolean.TRUE.equals(redisTemplate.hasKey(blacklistKey))) {
            throw new BusinessException("AUTH_002", "토큰이 만료되었습니다.", HttpStatus.UNAUTHORIZED);
        }

        // Validate refresh token
        try {
            if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
                throw new BusinessException("AUTH_002", "유효하지 않은 리프레시 토큰입니다.", HttpStatus.UNAUTHORIZED);
            }

            UUID userId = jwtTokenProvider.extractUserId(refreshToken);
            if (userId == null) {
                throw new BusinessException("AUTH_002", "토큰에서 사용자 정보를 추출할 수 없습니다.", HttpStatus.UNAUTHORIZED);
            }

            UserEntity user = userRepository.findById(userId)
                    .orElseThrow(() -> new BusinessException("AUTH_002", "사용자를 찾을 수 없습니다.", HttpStatus.UNAUTHORIZED));

            if (!user.isActive()) {
                throw new BusinessException("AUTH_008", "비활성화된 계정입니다.", HttpStatus.UNAUTHORIZED);
            }

            // Blacklist old refresh token (rotation)
            String oldBlacklistKey = BLACKLIST_PREFIX + refreshToken;
            redisTemplate.opsForValue().set(oldBlacklistKey, "1",
                    jwtTokenProvider.getRefreshTokenExpiry(), TimeUnit.SECONDS);

            // Generate new tokens
            UserContext context = buildUserContext(user);
            String newAccessToken = jwtTokenProvider.generateAccessToken(context);
            String newRefreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

            // Store new refresh token
            String refreshKey = REFRESH_PREFIX + user.getId();
            redisTemplate.opsForValue().set(refreshKey, newRefreshToken,
                    jwtTokenProvider.getRefreshTokenExpiry(), TimeUnit.SECONDS);

            return TokenResponse.builder()
                    .accessToken(newAccessToken)
                    .refreshToken(newRefreshToken)
                    .tokenType("Bearer")
                    .expiresIn(jwtTokenProvider.getAccessTokenExpiry())
                    .refreshExpiresIn(jwtTokenProvider.getRefreshTokenExpiry())
                    .build();
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.warn("Token refresh failed: {}", e.getMessage());
            throw new BusinessException("AUTH_002", "토큰 갱신에 실패했습니다.", HttpStatus.UNAUTHORIZED);
        }
    }

    @Override
    @Transactional
    public void logout(String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7);

            // Add access token to blacklist
            String blacklistKey = BLACKLIST_PREFIX + token;
            redisTemplate.opsForValue().set(blacklistKey, "1",
                    jwtTokenProvider.getAccessTokenExpiry(), TimeUnit.SECONDS);

            // Terminate session and blacklist refresh token
            try {
                sessionService.terminateByAccessToken(token);
            } catch (Exception e) {
                log.warn("Failed to terminate session on logout: {}", e.getMessage());
            }

            // Delete refresh token from Redis
            try {
                UUID userId = jwtTokenProvider.extractUserId(token);
                if (userId != null) {
                    String refreshKey = REFRESH_PREFIX + userId;
                    redisTemplate.delete(refreshKey);
                }
            } catch (Exception e) {
                log.warn("Failed to delete refresh token on logout: {}", e.getMessage());
            }

            log.info("Logout completed: token blacklisted, session terminated");
        }
    }

    @Override
    public UserResponse getCurrentUser() {
        UserContext context = SecurityContextHolder.getCurrentUser();

        if (context == null) {
            throw new BusinessException("AUTH_003", "인증 정보를 찾을 수 없습니다.", HttpStatus.UNAUTHORIZED);
        }

        return UserResponse.builder()
            .id(context.getUserId() != null ? context.getUserId().toString() : null)
            .employeeId(context.getEmployeeId() != null ? context.getEmployeeId().toString() : null)
            .employeeNumber(null)
            .name(context.getUsername())
            .email(context.getEmail())
            .departmentId(context.getDepartmentId() != null ? context.getDepartmentId().toString() : null)
            .departmentName(context.getDepartmentName())
            .positionName(null)
            .gradeName(null)
            .profileImageUrl(null)
            .roles(context.getRoles() != null ? new ArrayList<>(context.getRoles()) : new ArrayList<>())
            .permissions(context.getPermissions() != null ? new ArrayList<>(context.getPermissions()) : new ArrayList<>())
            .build();
    }

    private void checkTenantStatus(UUID tenantId, String username, String ipAddress, String userAgent) {
        tenantServiceClient.ifPresent(client -> {
            try {
                var response = client.getTenantStatus(tenantId);
                if (response != null && response.getData() != null) {
                    String status = response.getData();
                    if ("SUSPENDED".equals(status)) {
                        loginHistoryService.recordFailure(username, tenantId, ipAddress, userAgent, "TENANT_SUSPENDED");
                        throw new BusinessException("AUTH_010", "테넌트가 일시 중지되었습니다. 관리자에게 문의하세요.", HttpStatus.FORBIDDEN);
                    }
                    if ("TERMINATED".equals(status)) {
                        loginHistoryService.recordFailure(username, tenantId, ipAddress, userAgent, "TENANT_TERMINATED");
                        throw new BusinessException("AUTH_011", "테넌트 계약이 종료되었습니다.", HttpStatus.FORBIDDEN);
                    }
                }
            } catch (BusinessException e) {
                throw e;
            } catch (Exception e) {
                log.warn("Failed to check tenant status for tenantId={}: {}", tenantId, e.getMessage());
            }
        });
    }

    private UUID resolveTenantId(String tenantCode) {
        // Try parsing as UUID first (backward compatibility)
        try {
            return UUID.fromString(tenantCode);
        } catch (IllegalArgumentException | NullPointerException e) {
            // Not a UUID, resolve via tenant-service
            return tenantServiceClient
                    .map(client -> client.getByTenantCode(tenantCode))
                    .map(response -> response.getData())
                    .map(tenant -> tenant.getId())
                    .orElseThrow(() -> new BusinessException("AUTH_001", "올바르지 않은 테넌트 코드입니다.", HttpStatus.BAD_REQUEST));
        }
    }

    private TenantDto resolveTenantInfo(UUID tenantId) {
        if (tenantId == null) {
            return null;
        }
        return tenantServiceClient
                .map(client -> {
                    try {
                        var response = client.getTenantBasicInfo(tenantId);
                        return response != null ? response.getData() : null;
                    } catch (Exception e) {
                        log.warn("Failed to resolve tenant info for tenantId={}: {}", tenantId, e.getMessage());
                        return null;
                    }
                })
                .orElse(null);
    }

    private UserContext buildUserContext(UserEntity user) {
        Set<String> roles = user.getRoles() != null
                ? new HashSet<>(Arrays.asList(user.getRoles()))
                : Set.of();
        Set<String> permissions = user.getPermissions() != null
                ? new HashSet<>(Arrays.asList(user.getPermissions()))
                : Set.of();

        return UserContext.builder()
                .userId(user.getId())
                .tenantId(user.getTenantId())
                .employeeId(user.getEmployeeId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(roles)
                .permissions(permissions)
                .build();
    }
}
