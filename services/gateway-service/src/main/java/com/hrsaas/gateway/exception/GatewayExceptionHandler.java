package com.hrsaas.gateway.exception;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.common.core.constant.HeaderConstants;
import com.hrsaas.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.web.reactive.error.ErrorWebExceptionHandler;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.ConnectException;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeoutException;

/**
 * Global exception handler for the API Gateway.
 * Handles various exceptions and returns standardized error responses.
 */
@Slf4j
@Order(-1)
@Component
@RequiredArgsConstructor
public class GatewayExceptionHandler implements ErrorWebExceptionHandler {

    private final ObjectMapper objectMapper;

    @Override
    public Mono<Void> handle(ServerWebExchange exchange, Throwable ex) {
        ServerHttpResponse response = exchange.getResponse();
        String requestId = exchange.getRequest().getHeaders().getFirst(HeaderConstants.X_REQUEST_ID);
        String path = exchange.getRequest().getURI().getPath();

        if (response.isCommitted()) {
            return Mono.error(ex);
        }

        HttpStatus status;
        String errorCode;
        String message;

        if (ex instanceof ResponseStatusException rse) {
            status = HttpStatus.valueOf(rse.getStatusCode().value());
            errorCode = "GATEWAY_" + status.value();
            message = rse.getReason() != null ? rse.getReason() : status.getReasonPhrase();
        } else if (ex instanceof ConnectException) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            errorCode = "GATEWAY_503";
            message = "Service temporarily unavailable";
            log.error("Connection error for path {}: {}", path, ex.getMessage());
        } else if (ex instanceof TimeoutException) {
            status = HttpStatus.GATEWAY_TIMEOUT;
            errorCode = "GATEWAY_504";
            message = "Request timeout";
            log.error("Timeout for path {}: {}", path, ex.getMessage());
        } else if (ex instanceof io.netty.channel.ConnectTimeoutException) {
            status = HttpStatus.GATEWAY_TIMEOUT;
            errorCode = "GATEWAY_504";
            message = "Connection timeout";
            log.error("Connection timeout for path {}: {}", path, ex.getMessage());
        } else if (ex instanceof SecurityException) {
            status = HttpStatus.FORBIDDEN;
            errorCode = "GATEWAY_403";
            message = "Access denied";
            log.warn("Security exception for path {}: {}", path, ex.getMessage());
        } else if (ex.getCause() instanceof ConnectException) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            errorCode = "GATEWAY_503";
            message = "Service temporarily unavailable";
            log.error("Downstream service unavailable for path {}", path);
        } else {
            status = HttpStatus.INTERNAL_SERVER_ERROR;
            errorCode = "GATEWAY_500";
            message = "Internal server error";
            log.error("Unexpected error for path {}: {}", path, ex.getMessage(), ex);
        }

        response.setStatusCode(status);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);

        ApiResponse<Void> errorResponse = ApiResponse.<Void>builder()
            .success(false)
            .code(errorCode)
            .message(message)
            .data(null)
            .build();

        return writeResponse(response, errorResponse);
    }

    private Mono<Void> writeResponse(ServerHttpResponse response, ApiResponse<?> apiResponse) {
        try {
            byte[] bytes = objectMapper.writeValueAsBytes(apiResponse);
            DataBuffer buffer = response.bufferFactory().wrap(bytes);
            return response.writeWith(Mono.just(buffer));
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize error response", e);
            String fallback = "{\"success\":false,\"code\":\"GATEWAY_500\",\"message\":\"Internal server error\"}";
            DataBuffer buffer = response.bufferFactory().wrap(fallback.getBytes(StandardCharsets.UTF_8));
            return response.writeWith(Mono.just(buffer));
        }
    }
}
