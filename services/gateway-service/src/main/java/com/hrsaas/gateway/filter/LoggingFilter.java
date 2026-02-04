package com.hrsaas.gateway.filter;

import com.hrsaas.common.core.constant.HeaderConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.time.Instant;
import java.util.Set;

/**
 * Global filter for request/response logging.
 * Logs request details, response status, and execution time.
 */
@Slf4j
@Component
public class LoggingFilter implements GlobalFilter, Ordered {

    private static final String START_TIME_ATTR = "startTime";

    private static final Set<String> SENSITIVE_HEADERS = Set.of(
        "authorization",
        "cookie",
        "set-cookie",
        "x-api-key"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        Instant startTime = Instant.now();
        exchange.getAttributes().put(START_TIME_ATTR, startTime);

        String requestId = request.getHeaders().getFirst(HeaderConstants.X_REQUEST_ID);
        String userId = request.getHeaders().getFirst(HeaderConstants.X_USER_ID);
        String tenantId = request.getHeaders().getFirst(HeaderConstants.X_TENANT_ID);

        // Log incoming request
        if (log.isInfoEnabled()) {
            log.info(">>> Request: {} {} | requestId={} | userId={} | tenantId={} | clientIp={}",
                request.getMethod(),
                request.getURI().getPath(),
                requestId,
                maskValue(userId),
                tenantId,
                getClientIp(request)
            );
        }

        if (log.isDebugEnabled()) {
            logRequestHeaders(request.getHeaders(), requestId);
        }

        return chain.filter(exchange)
            .then(Mono.fromRunnable(() -> logResponse(exchange)));
    }

    private void logResponse(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        Instant startTime = exchange.getAttribute(START_TIME_ATTR);

        long durationMs = 0;
        if (startTime != null) {
            durationMs = Duration.between(startTime, Instant.now()).toMillis();
        }

        String requestId = exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_REQUEST_ID);
        String path = exchange.getRequest().getURI().getPath();
        Integer statusCode = response.getStatusCode() != null ? response.getStatusCode().value() : 0;

        if (log.isInfoEnabled()) {
            log.info("<<< Response: {} {} | status={} | duration={}ms | requestId={}",
                exchange.getRequest().getMethod(),
                path,
                statusCode,
                durationMs,
                requestId
            );
        }

        // Log slow requests as warnings
        if (durationMs > 5000) {
            log.warn("Slow request detected: {} {} took {}ms | requestId={}",
                exchange.getRequest().getMethod(),
                path,
                durationMs,
                requestId
            );
        }

        // Log error responses
        if (statusCode >= 400) {
            log.warn("Error response: {} {} | status={} | requestId={}",
                exchange.getRequest().getMethod(),
                path,
                statusCode,
                requestId
            );
        }
    }

    private void logRequestHeaders(HttpHeaders headers, String requestId) {
        StringBuilder sb = new StringBuilder("Request headers [requestId=").append(requestId).append("]: ");
        headers.forEach((name, values) -> {
            String headerName = name.toLowerCase();
            if (SENSITIVE_HEADERS.contains(headerName)) {
                sb.append(name).append("=[REDACTED] ");
            } else {
                sb.append(name).append("=").append(values).append(" ");
            }
        });
        log.debug(sb.toString());
    }

    private String getClientIp(ServerHttpRequest request) {
        String xForwardedFor = request.getHeaders().getFirst("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        if (request.getRemoteAddress() != null) {
            return request.getRemoteAddress().getAddress().getHostAddress();
        }

        return "unknown";
    }

    private String maskValue(String value) {
        if (value == null || value.length() <= 8) {
            return value;
        }
        return value.substring(0, 4) + "****" + value.substring(value.length() - 4);
    }

    @Override
    public int getOrder() {
        // Execute first to capture timing
        return Ordered.HIGHEST_PRECEDENCE + 1;
    }
}
