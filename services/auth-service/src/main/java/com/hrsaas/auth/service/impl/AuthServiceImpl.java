package com.hrsaas.auth.service.impl;

import com.hrsaas.auth.domain.dto.request.LoginRequest;
import com.hrsaas.auth.domain.dto.request.RefreshTokenRequest;
import com.hrsaas.auth.domain.dto.response.TokenResponse;
import com.hrsaas.auth.domain.dto.response.UserResponse;
import com.hrsaas.auth.infrastructure.keycloak.KeycloakClient;
import com.hrsaas.auth.service.AuthService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final KeycloakClient keycloakClient;
    private final RedisTemplate<String, String> redisTemplate;

    private static final String BLACKLIST_PREFIX = "token:blacklist:";

    @Override
    public TokenResponse login(LoginRequest request) {
        log.info("Login attempt: username={}", request.getUsername());

        try {
            TokenResponse response = keycloakClient.getToken(
                request.getUsername(),
                request.getPassword()
            );

            log.info("Login successful: username={}", request.getUsername());
            return response;
        } catch (Exception e) {
            log.warn("Login failed: username={}, error={}", request.getUsername(), e.getMessage());
            throw new BusinessException("AUTH_001", "아이디 또는 비밀번호가 올바르지 않습니다.", HttpStatus.UNAUTHORIZED);
        }
    }

    @Override
    public TokenResponse refreshToken(RefreshTokenRequest request) {
        log.debug("Token refresh attempt");

        // Check if token is blacklisted
        String blacklistKey = BLACKLIST_PREFIX + request.getRefreshToken();
        if (Boolean.TRUE.equals(redisTemplate.hasKey(blacklistKey))) {
            throw new BusinessException("AUTH_002", "토큰이 만료되었습니다.", HttpStatus.UNAUTHORIZED);
        }

        try {
            return keycloakClient.refreshToken(request.getRefreshToken());
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
            redisTemplate.opsForValue().set(blacklistKey, "1", 1, TimeUnit.HOURS);
            log.info("Token added to blacklist");
        }

        try {
            keycloakClient.logout();
            log.info("Logout successful");
        } catch (Exception e) {
            log.warn("Logout from Keycloak failed: {}", e.getMessage());
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
            .employeeNumber(null) // Not available in JWT
            .name(context.getUsername())
            .email(context.getEmail())
            .departmentId(context.getDepartmentId() != null ? context.getDepartmentId().toString() : null)
            .departmentName(null) // Not available in JWT, can be fetched from employee-service
            .positionName(null) // Not available in JWT
            .gradeName(null) // Not available in JWT
            .profileImageUrl(null) // Not available in JWT
            .roles(context.getRoles() != null ? new ArrayList<>(context.getRoles()) : new ArrayList<>())
            .permissions(context.getPermissions() != null ? new ArrayList<>(context.getPermissions()) : new ArrayList<>())
            .build();
    }
}
