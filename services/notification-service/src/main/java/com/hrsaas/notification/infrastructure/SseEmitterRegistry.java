package com.hrsaas.notification.infrastructure;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Registry for managing Server-Sent Event emitters per user.
 * Thread-safe via ConcurrentHashMap.
 */
@Slf4j
@Component
public class SseEmitterRegistry {

    private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();

    /**
     * Registers an SSE emitter for the given user.
     * Any previous emitter for the same user is replaced.
     *
     * @param userId  the user identifier
     * @param emitter the SSE emitter to register
     */
    public void register(UUID userId, SseEmitter emitter) {
        emitters.put(userId, emitter);
        emitter.onCompletion(() -> {
            emitters.remove(userId);
            log.debug("SSE emitter completed for user: {}", userId);
        });
        emitter.onTimeout(() -> {
            emitters.remove(userId);
            log.debug("SSE emitter timed out for user: {}", userId);
        });
        emitter.onError(e -> {
            emitters.remove(userId);
            log.debug("SSE emitter error for user: {}", userId);
        });
        log.info("SSE emitter registered for user: {}", userId);
    }

    /**
     * Removes and completes the emitter for the given user.
     *
     * @param userId the user identifier
     */
    public void remove(UUID userId) {
        SseEmitter emitter = emitters.remove(userId);
        if (emitter != null) {
            emitter.complete();
        }
    }

    /**
     * Returns the emitter for the given user, or null if none.
     *
     * @param userId the user identifier
     * @return the SSE emitter, or null
     */
    public SseEmitter get(UUID userId) {
        return emitters.get(userId);
    }

    /**
     * Checks whether an active emitter exists for the given user.
     *
     * @param userId the user identifier
     * @return true if an emitter is registered
     */
    public boolean hasEmitter(UUID userId) {
        return emitters.containsKey(userId);
    }

    /**
     * Returns the number of currently active SSE connections.
     *
     * @return the active emitter count
     */
    public int getActiveCount() {
        return emitters.size();
    }
}
