package com.hrsaas.common.security.jwt;

import io.jsonwebtoken.security.WeakKeyException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtTokenProviderTest {

    private static final String VALID_SECRET = "hr-saas-secret-key-for-jwt-token-signing-minimum-256-bits-required-for-test";
    private static final String SHORT_SECRET = "short-secret";

    @Test
    @DisplayName("Constructor initializes with valid secret")
    void constructor_withValidSecret_success() {
        JwtTokenProvider provider = new JwtTokenProvider(VALID_SECRET, 1800, 604800);
        assertThat(provider).isNotNull();
        assertThat(provider.getAccessTokenExpiry()).isEqualTo(1800);
        assertThat(provider.getRefreshTokenExpiry()).isEqualTo(604800);
    }

    @Test
    @DisplayName("Constructor fails with short secret (JJWT checks)")
    void constructor_withShortSecret_throwsException() {
        // JJWT hmacShaKeyFor throws WeakKeyException if key is not strong enough for HS256 (32 bytes = 256 bits)
        // "short-secret" is 12 bytes = 96 bits
        assertThatThrownBy(() -> new JwtTokenProvider(SHORT_SECRET, 1800, 604800))
                .isInstanceOf(WeakKeyException.class);
    }

    @Test
    @DisplayName("Constructor fails with null secret")
    void constructor_withNullSecret_throwsException() {
        assertThatThrownBy(() -> new JwtTokenProvider(null, 1800, 604800))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    @DisplayName("Constructor fails with non-positive expiry")
    void constructor_withInvalidExpiry_throwsException() {
        assertThatThrownBy(() -> new JwtTokenProvider(VALID_SECRET, 0, 604800))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Access token expiry must be positive");

        assertThatThrownBy(() -> new JwtTokenProvider(VALID_SECRET, 1800, -1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Refresh token expiry must be positive");
    }
}
