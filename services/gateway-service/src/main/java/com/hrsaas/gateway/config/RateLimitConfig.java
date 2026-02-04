package com.hrsaas.gateway.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Configuration properties for rate limiting.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "gateway.rate-limit")
public class RateLimitConfig {

    /**
     * Default maximum requests per window.
     */
    private int defaultMaxRequests = 100;

    /**
     * Default time window duration.
     */
    private Duration defaultWindow = Duration.ofMinutes(1);

    /**
     * Whether rate limiting is enabled.
     */
    private boolean enabled = true;

    /**
     * Custom rate limits per path pattern.
     * Key: path pattern (e.g., "/api/v1/auth/**")
     * Value: rate limit configuration
     */
    private Map<String, PathRateLimit> paths = new HashMap<>();

    /**
     * Rate limits per user role.
     * Key: role name
     * Value: max requests per window
     */
    private Map<String, Integer> roleBasedLimits = new HashMap<>();

    @Data
    public static class PathRateLimit {
        private int maxRequests;
        private Duration window;
    }
}
