package com.hrsaas.auth.service.impl;

import com.hrsaas.auth.domain.dto.request.LoginRequest;
import com.hrsaas.auth.domain.dto.request.RefreshTokenRequest;
import com.hrsaas.auth.domain.dto.response.TokenResponse;
import com.hrsaas.auth.domain.dto.response.UserResponse;
import com.hrsaas.auth.domain.entity.UserEntity;
import com.hrsaas.auth.repository.UserRepository;
import com.hrsaas.auth.service.AuthService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.common.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
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

    private static final String BLACKLIST_PREFIX = "token:blacklist:";
    private static final String REFRESH_PREFIX = "token:refresh:";
    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 30;

    @Override
    @Transactional
    public TokenResponse login(LoginRequest request) {
        log.info("Login attempt: username={}", request.getUsername());

        UserEntity user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> {
                    log.warn("Login failed: user not found username={}", request.getUsername());
                    return new BusinessException("AUTH_001", "아이디 또는 비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED);
                });

        if (!user.isActive()) {
            throw new BusinessException("AUTH_008", "비활성화된 계정입니다.", HttpStatus.UNAUTHORIZED);
        }

        if (user.isLocked()) {
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
            throw new BusinessException("AUTH_001", "아이디 또는 비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED);
        }

        // Reset failed attempts on successful login
        user.resetFailedAttempts();
        user.setLastLoginAt(OffsetDateTime.now());
        userRepository.save(user);

        // Build UserContext and generate tokens
        UserContext context = buildUserContext(user);
        String accessToken = jwtTokenProvider.generateAccessToken(context);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        // Store refresh token in Redis
        String refreshKey = REFRESH_PREFIX + user.getId();
        redisTemplate.opsForValue().set(refreshKey, refreshToken,
                jwtTokenProvider.getRefreshTokenExpiry(), TimeUnit.SECONDS);

        log.info("Login successful: username={}", request.getUsername());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpiry())
                .refreshExpiresIn(jwtTokenProvider.getRefreshTokenExpiry())
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
    public void logout(String authorization) {
        if (authorization != null && authorization.startsWith("Bearer ")) {
            String token = authorization.substring(7);
            // Add token to blacklist
            String blacklistKey = BLACKLIST_PREFIX + token;
            redisTemplate.opsForValue().set(blacklistKey, "1",
                    jwtTokenProvider.getAccessTokenExpiry(), TimeUnit.SECONDS);
            log.info("Token added to blacklist");
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
