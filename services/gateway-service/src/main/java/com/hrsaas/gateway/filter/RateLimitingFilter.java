package com.hrsaas.gateway.filter;

import com.hrsaas.common.core.constant.HeaderConstants;
import com.hrsaas.gateway.config.RateLimitConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Global filter for rate limiting using Redis.
 * Supports IP-based and user-based rate limiting with configurable limits.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitingFilter implements GlobalFilter, Ordered {

    private final ReactiveRedisTemplate<String, String> redisTemplate;
    private final RateLimitConfig rateLimitConfig;

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!rateLimitConfig.isEnabled()) {
            return chain.filter(exchange);
        }

        String userId = exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_USER_ID);
        String clientIp = getClientIp(exchange);
        String path = exchange.getRequest().getPath().value();

        // Determine rate limit key (prefer user-based over IP-based)
        String key;
        int maxRequests;
        Duration window;

        if (userId != null && !userId.isBlank()) {
            key = "rate_limit:user:" + userId;
            // Check for role-based limits
            String roles = exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_USER_ROLES);
            maxRequests = getRoleLimitOrDefault(roles);
        } else {
            key = "rate_limit:ip:" + clientIp;
            maxRequests = rateLimitConfig.getDefaultMaxRequests();
        }

        // Check for path-specific limits
        RateLimitConfig.PathRateLimit pathLimit = getPathRateLimit(path);
        if (pathLimit != null) {
            maxRequests = pathLimit.getMaxRequests();
            window = pathLimit.getWindow();
        } else {
            window = rateLimitConfig.getDefaultWindow();
        }

        final int finalMaxRequests = maxRequests;
        final Duration finalWindow = window;

        return redisTemplate.opsForValue().increment(key)
            .flatMap(count -> {
                if (count == 1) {
                    return redisTemplate.expire(key, finalWindow)
                        .then(chain.filter(exchange));
                }

                if (count > finalMaxRequests) {
                    log.warn("Rate limit exceeded: key={}, count={}, limit={}", key, count, finalMaxRequests);
                    exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                    exchange.getResponse().getHeaders().add("Retry-After", String.valueOf(finalWindow.toSeconds()));
                    exchange.getResponse().getHeaders().add("X-RateLimit-Limit", String.valueOf(finalMaxRequests));
                    exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", "0");
                    return exchange.getResponse().setComplete();
                }

                // Add rate limit headers
                exchange.getResponse().getHeaders().add("X-RateLimit-Limit", String.valueOf(finalMaxRequests));
                exchange.getResponse().getHeaders().add("X-RateLimit-Remaining", String.valueOf(finalMaxRequests - count));

                return chain.filter(exchange);
            })
            .onErrorResume(ex -> {
                log.error("Rate limiting error, allowing request: {}", ex.getMessage());
                return chain.filter(exchange);
            });
    }

    private int getRoleLimitOrDefault(String roles) {
        if (roles == null || roles.isBlank()) {
            return rateLimitConfig.getDefaultMaxRequests();
        }

        // Check each role for custom limits (use highest limit found)
        int maxLimit = rateLimitConfig.getDefaultMaxRequests();
        for (String role : roles.split(",")) {
            Integer roleLimit = rateLimitConfig.getRoleBasedLimits().get(role.trim());
            if (roleLimit != null && roleLimit > maxLimit) {
                maxLimit = roleLimit;
            }
        }
        return maxLimit;
    }

    private RateLimitConfig.PathRateLimit getPathRateLimit(String path) {
        for (var entry : rateLimitConfig.getPaths().entrySet()) {
            String pattern = entry.getKey();
            if (matchesPattern(path, pattern)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private boolean matchesPattern(String path, String pattern) {
        // Simple pattern matching (supports ** wildcard)
        String regex = pattern
            .replace("**", ".*")
            .replace("*", "[^/]*");
        return path.matches(regex);
    }

    private String getClientIp(ServerWebExchange exchange) {
        String xForwardedFor = exchange.getRequest().getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        if (exchange.getRequest().getRemoteAddress() != null) {
            return exchange.getRequest().getRemoteAddress().getAddress().getHostAddress();
        }

        return "unknown";
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 50;
    }
}
