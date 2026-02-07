package com.hrsaas.auth.service;

import com.hrsaas.auth.domain.dto.response.TokenResponse;

import java.util.List;
import java.util.UUID;

public interface MfaService {

    /**
     * Set up MFA for a user. Returns the TOTP secret and QR code URI.
     */
    MfaSetupResponse setupMfa(UUID userId);

    /**
     * Verify TOTP code during MFA setup to activate it.
     */
    List<String> verifySetup(UUID userId, String code);

    /**
     * Verify TOTP code during login. Returns full token on success.
     */
    TokenResponse verifyLogin(String mfaToken, String code, String ipAddress, String userAgent);

    /**
     * Disable MFA for a user.
     */
    void disableMfa(UUID userId, String code);

    /**
     * Check if MFA is enabled for a user.
     */
    boolean isMfaEnabled(UUID userId);

    /**
     * Get remaining recovery codes count.
     */
    int getRecoveryCodesCount(UUID userId);

    record MfaSetupResponse(String secretKey, String qrCodeUri) {}
}
