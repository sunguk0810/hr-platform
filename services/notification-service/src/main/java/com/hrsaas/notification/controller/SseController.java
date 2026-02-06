package com.hrsaas.notification.controller;

import com.hrsaas.notification.infrastructure.SseEmitterRegistry;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * REST controller for Server-Sent Events (SSE) based real-time notification delivery.
 * Provides subscribe/unsubscribe endpoints with automatic heartbeat to keep connections alive.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/notifications/sse")
@RequiredArgsConstructor
@Tag(name = "SSE", description = "Server-Sent Events for real-time notifications")
public class SseController {

    private final SseEmitterRegistry emitterRegistry;
    private final ScheduledExecutorService heartbeatExecutor = Executors.newScheduledThreadPool(1);

    /**
     * Creates an SSE subscription for the authenticated user.
     * The connection stays open for up to 30 minutes with heartbeats every 30 seconds.
     *
     * @param userId the user ID from the X-User-ID header
     * @return the SSE emitter streaming real-time notification events
     */
    @GetMapping(value = "/subscribe", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    @Operation(summary = "SSE 구독 (실시간 알림)")
    @PreAuthorize("isAuthenticated()")
    public SseEmitter subscribe(@RequestHeader("X-User-ID") UUID userId) {
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L); // 30 minutes timeout

        emitterRegistry.register(userId, emitter);

        // Send initial connection event
        try {
            emitter.send(SseEmitter.event()
                .name("connected")
                .data("SSE connection established"));
        } catch (IOException e) {
            log.warn("Failed to send initial SSE event", e);
        }

        // Heartbeat every 30 seconds to keep connection alive
        var heartbeat = heartbeatExecutor.scheduleAtFixedRate(() -> {
            try {
                if (emitterRegistry.hasEmitter(userId)) {
                    emitter.send(SseEmitter.event()
                        .name("heartbeat")
                        .data("ping"));
                }
            } catch (IOException e) {
                emitterRegistry.remove(userId);
            }
        }, 30, 30, TimeUnit.SECONDS);

        emitter.onCompletion(() -> heartbeat.cancel(false));
        emitter.onTimeout(() -> heartbeat.cancel(false));
        emitter.onError(e -> heartbeat.cancel(false));

        log.info("SSE subscription created for user: {}", userId);
        return emitter;
    }

    /**
     * Removes the SSE subscription for the authenticated user.
     *
     * @param userId the user ID from the X-User-ID header
     */
    @DeleteMapping("/unsubscribe")
    @Operation(summary = "SSE 구독 해제")
    @PreAuthorize("isAuthenticated()")
    public void unsubscribe(@RequestHeader("X-User-ID") UUID userId) {
        emitterRegistry.remove(userId);
        log.info("SSE subscription removed for user: {}", userId);
    }
}
