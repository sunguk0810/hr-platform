package com.hrsaas.gateway.filter;

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
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitingFilter implements GlobalFilter, Ordered {

    private final ReactiveRedisTemplate<String, String> redisTemplate;

    private static final int MAX_REQUESTS_PER_MINUTE = 100;
    private static final Duration WINDOW = Duration.ofMinutes(1);

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String clientIp = getClientIp(exchange);
        String key = "rate_limit:" + clientIp;

        return redisTemplate.opsForValue().increment(key)
            .flatMap(count -> {
                if (count == 1) {
                    // Set expiration for the first request
                    return redisTemplate.expire(key, WINDOW)
                        .then(chain.filter(exchange));
                }

                if (count > MAX_REQUESTS_PER_MINUTE) {
                    log.warn("Rate limit exceeded for IP: {}", clientIp);
                    exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                    exchange.getResponse().getHeaders().add("Retry-After", "60");
                    return exchange.getResponse().setComplete();
                }

                return chain.filter(exchange);
            });
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
