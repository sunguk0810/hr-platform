package com.hrsaas.gateway.filter;

import com.hrsaas.common.core.constant.HeaderConstants;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Global filter that adds a unique request ID to each request for tracing.
 */
@Slf4j
@Component
public class RequestIdFilter implements GlobalFilter, Ordered {

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String requestId = exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_REQUEST_ID);

        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }

        String correlationId = exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_CORRELATION_ID);
        if (correlationId == null || correlationId.isBlank()) {
            correlationId = requestId;
        }

        final String finalRequestId = requestId;
        final String finalCorrelationId = correlationId;

        ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
            .headers(headers -> {
                headers.set(HeaderConstants.X_REQUEST_ID, finalRequestId);
                headers.set(HeaderConstants.X_CORRELATION_ID, finalCorrelationId);
            })
            .build();

        log.debug("Request: method={}, path={}, requestId={}, correlationId={}",
                  exchange.getRequest().getMethod(),
                  exchange.getRequest().getPath(),
                  finalRequestId,
                  finalCorrelationId);

        return chain.filter(exchange.mutate()
            .request(mutatedRequest)
            .build())
            .then(Mono.fromRunnable(() -> {
                exchange.getResponse().getHeaders().add(HeaderConstants.X_REQUEST_ID, finalRequestId);
                exchange.getResponse().getHeaders().add(HeaderConstants.X_CORRELATION_ID, finalCorrelationId);
            }));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
