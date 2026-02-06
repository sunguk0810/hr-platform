package com.hrsaas.notification.controller;

import com.hrsaas.notification.infrastructure.SseEmitterRegistry;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

/**
 * Unit tests for {@link SseController}.
 * Tests the SSE subscribe/unsubscribe endpoints by calling controller methods directly.
 */
@ExtendWith(MockitoExtension.class)
class SseControllerTest {

    @Mock
    private SseEmitterRegistry emitterRegistry;

    @InjectMocks
    private SseController sseController;

    @Test
    @DisplayName("subscribe - authenticated user - returns emitter and registers it")
    void subscribe_authenticatedUser_returnsEmitterAndRegisters() {
        // given
        UUID userId = UUID.randomUUID();

        // when
        SseEmitter result = sseController.subscribe(userId);

        // then
        assertThat(result).isNotNull();
        verify(emitterRegistry).register(eq(userId), any(SseEmitter.class));
    }

    @Test
    @DisplayName("unsubscribe - authenticated user - removes emitter from registry")
    void unsubscribe_authenticatedUser_removesFromRegistry() {
        // given
        UUID userId = UUID.randomUUID();

        // when
        sseController.unsubscribe(userId);

        // then
        verify(emitterRegistry).remove(userId);
    }
}
