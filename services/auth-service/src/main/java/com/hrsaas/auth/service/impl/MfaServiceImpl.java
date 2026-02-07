package com.hrsaas.auth.service.impl;

import com.hrsaas.auth.domain.dto.response.TokenResponse;
import com.hrsaas.auth.domain.entity.MfaRecoveryCode;
import com.hrsaas.auth.domain.entity.UserEntity;
import com.hrsaas.auth.domain.entity.UserMfa;
import com.hrsaas.auth.repository.MfaRecoveryCodeRepository;
import com.hrsaas.auth.repository.UserMfaRepository;
import com.hrsaas.auth.repository.UserRepository;
import com.hrsaas.auth.service.LoginHistoryService;
import com.hrsaas.auth.service.MfaService;
import com.hrsaas.auth.service.SessionService;
import com.hrsaas.common.core.exception.BusinessException;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.common.security.jwt.JwtTokenProvider;
import com.warrenstrange.googleauth.GoogleAuthenticator;
import com.warrenstrange.googleauth.GoogleAuthenticatorKey;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MfaServiceImpl implements MfaService {

    private final UserMfaRepository userMfaRepository;
    private final MfaRecoveryCodeRepository recoveryCodeRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, String> redisTemplate;
    private final SessionService sessionService;
    private final LoginHistoryService loginHistoryService;

    private static final String MFA_TOKEN_PREFIX = "mfa:pending:";
    private static final String REFRESH_PREFIX = "token:refresh:";
    private static final int RECOVERY_CODES_COUNT = 10;
    private static final String ISSUER = "HR-SaaS";

    private final GoogleAuthenticator googleAuthenticator = new GoogleAuthenticator();

    @Override
    @Transactional
    public MfaSetupResponse setupMfa(UUID userId) {
        log.info("Setting up MFA for user: {}", userId);

        UserEntity user = findUser(userId);

        // Check if MFA already enabled
        Optional<UserMfa> existingMfa = userMfaRepository.findByUserIdAndMfaTypeAndEnabledTrue(userId, "TOTP");
        if (existingMfa.isPresent()) {
            throw new BusinessException("AUTH_011", "MFA가 이미 활성화되어 있습니다.", HttpStatus.BAD_REQUEST);
        }

        // Generate secret key
        GoogleAuthenticatorKey key = googleAuthenticator.createCredentials();
        String secretKey = key.getKey();

        // Save or update MFA record
        UserMfa mfa = userMfaRepository.findByUserIdAndMfaType(userId, "TOTP")
                .orElse(UserMfa.builder()
                        .userId(userId)
                        .mfaType("TOTP")
                        .build());
        mfa.setSecretKey(secretKey);
        mfa.setEnabled(false);
        mfa.setVerifiedAt(null);
        userMfaRepository.save(mfa);

        // Generate QR code URI
        String qrCodeUri = String.format(
                "otpauth://totp/%s:%s?secret=%s&issuer=%s",
                ISSUER, user.getUsername(), secretKey, ISSUER
        );

        return new MfaSetupResponse(secretKey, qrCodeUri);
    }

    @Override
    @Transactional
    public List<String> verifySetup(UUID userId, String code) {
        log.info("Verifying MFA setup for user: {}", userId);

        UserMfa mfa = userMfaRepository.findByUserIdAndMfaType(userId, "TOTP")
                .orElseThrow(() -> new BusinessException("AUTH_011", "MFA 설정을 먼저 진행해주세요.", HttpStatus.BAD_REQUEST));

        if (mfa.isEnabled()) {
            throw new BusinessException("AUTH_011", "MFA가 이미 활성화되어 있습니다.", HttpStatus.BAD_REQUEST);
        }

        // Verify TOTP code
        if (!googleAuthenticator.authorize(mfa.getSecretKey(), Integer.parseInt(code))) {
            throw new BusinessException("AUTH_001", "유효하지 않은 인증 코드입니다.", HttpStatus.UNAUTHORIZED);
        }

        // Activate MFA
        mfa.setEnabled(true);
        mfa.setVerifiedAt(OffsetDateTime.now());
        userMfaRepository.save(mfa);

        // Generate recovery codes
        List<String> recoveryCodes = generateRecoveryCodes(userId);

        log.info("MFA setup verified and activated for user: {}", userId);
        return recoveryCodes;
    }

    @Override
    @Transactional
    public TokenResponse verifyLogin(String mfaToken, String code, String ipAddress, String userAgent) {
        log.info("MFA verification during login");

        // Retrieve pending MFA context from Redis
        String userIdStr = redisTemplate.opsForValue().get(MFA_TOKEN_PREFIX + mfaToken);
        if (userIdStr == null) {
            throw new BusinessException("AUTH_002", "MFA 토큰이 만료되었거나 유효하지 않습니다.", HttpStatus.UNAUTHORIZED);
        }

        UUID userId = UUID.fromString(userIdStr);
        UserEntity user = findUser(userId);

        // Try TOTP verification first
        UserMfa mfa = userMfaRepository.findByUserIdAndMfaTypeAndEnabledTrue(userId, "TOTP")
                .orElseThrow(() -> new BusinessException("AUTH_011", "MFA가 활성화되어 있지 않습니다.", HttpStatus.BAD_REQUEST));

        boolean verified = false;
        try {
            verified = googleAuthenticator.authorize(mfa.getSecretKey(), Integer.parseInt(code));
        } catch (NumberFormatException e) {
            // Not a numeric code - try recovery code
        }

        // If TOTP failed, try recovery code
        if (!verified) {
            Optional<MfaRecoveryCode> recoveryCode = recoveryCodeRepository
                    .findByUserIdAndCodeAndUsedAtIsNull(userId, code);
            if (recoveryCode.isPresent()) {
                recoveryCode.get().setUsedAt(OffsetDateTime.now());
                recoveryCodeRepository.save(recoveryCode.get());
                verified = true;
                log.info("MFA verified via recovery code for user: {}", userId);
            }
        }

        if (!verified) {
            loginHistoryService.recordFailure(user.getUsername(), user.getTenantId(), ipAddress, userAgent, "INVALID_MFA_CODE");
            throw new BusinessException("AUTH_001", "유효하지 않은 인증 코드입니다.", HttpStatus.UNAUTHORIZED);
        }

        // Remove MFA pending token
        redisTemplate.delete(MFA_TOKEN_PREFIX + mfaToken);

        // Generate full tokens
        Set<String> roles = user.getRoles() != null
                ? new HashSet<>(Arrays.asList(user.getRoles()))
                : Set.of();
        Set<String> permissions = user.getPermissions() != null
                ? new HashSet<>(Arrays.asList(user.getPermissions()))
                : Set.of();

        UserContext context = UserContext.builder()
                .userId(user.getId())
                .tenantId(user.getTenantId())
                .employeeId(user.getEmployeeId())
                .username(user.getUsername())
                .email(user.getEmail())
                .roles(roles)
                .permissions(permissions)
                .build();

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
            log.warn("Failed to create session after MFA verification: {}", e.getMessage());
        }

        loginHistoryService.recordSuccess(user.getUsername(), user.getTenantId(), ipAddress, userAgent);

        log.info("MFA login verified for user: {}", userId);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtTokenProvider.getAccessTokenExpiry())
                .refreshExpiresIn(jwtTokenProvider.getRefreshTokenExpiry())
                .build();
    }

    @Override
    @Transactional
    public void disableMfa(UUID userId, String code) {
        log.info("Disabling MFA for user: {}", userId);

        UserMfa mfa = userMfaRepository.findByUserIdAndMfaTypeAndEnabledTrue(userId, "TOTP")
                .orElseThrow(() -> new BusinessException("AUTH_011", "MFA가 활성화되어 있지 않습니다.", HttpStatus.BAD_REQUEST));

        // Verify code before disabling
        if (!googleAuthenticator.authorize(mfa.getSecretKey(), Integer.parseInt(code))) {
            throw new BusinessException("AUTH_001", "유효하지 않은 인증 코드입니다.", HttpStatus.UNAUTHORIZED);
        }

        mfa.setEnabled(false);
        userMfaRepository.save(mfa);

        // Remove recovery codes
        recoveryCodeRepository.deleteAllByUserId(userId);

        log.info("MFA disabled for user: {}", userId);
    }

    @Override
    public boolean isMfaEnabled(UUID userId) {
        return userMfaRepository.existsByUserIdAndEnabledTrue(userId);
    }

    @Override
    public int getRecoveryCodesCount(UUID userId) {
        return recoveryCodeRepository.findByUserIdAndUsedAtIsNull(userId).size();
    }

    /**
     * Store a pending MFA token in Redis and return it.
     * Called from AuthServiceImpl when MFA is required during login.
     */
    public String createMfaPendingToken(UUID userId) {
        String mfaToken = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(MFA_TOKEN_PREFIX + mfaToken, userId.toString(), 5, TimeUnit.MINUTES);
        return mfaToken;
    }

    private List<String> generateRecoveryCodes(UUID userId) {
        // Remove existing codes
        recoveryCodeRepository.deleteAllByUserId(userId);

        List<String> codes = new ArrayList<>();
        for (int i = 0; i < RECOVERY_CODES_COUNT; i++) {
            String code = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            codes.add(code);

            MfaRecoveryCode recoveryCode = MfaRecoveryCode.builder()
                    .userId(userId)
                    .code(code)
                    .build();
            recoveryCodeRepository.save(recoveryCode);
        }
        return codes;
    }

    private UserEntity findUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException("AUTH_004", "사용자를 찾을 수 없습니다.", HttpStatus.NOT_FOUND));
    }
}
