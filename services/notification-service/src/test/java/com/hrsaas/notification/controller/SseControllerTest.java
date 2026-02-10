package com.hrsaas.notification.controller;

import com.hrsaas.common.security.SecurityContextHolder;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.notification.infrastructure.SseEmitterRegistry;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class SseControllerTest {

    @Mock
    private SseEmitterRegistry emitterRegistry;

    @InjectMocks
    private SseController sseController;

    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        UserContext userContext = UserContext.builder()
                .userId(userId)
                .username("testuser")
                .roles(Set.of("ROLE_USER"))
                .build();
        SecurityContextHolder.setContext(userContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clear();
    }

    @Test
    @DisplayName("subscribe - authenticated user - returns emitter and registers it")
    void subscribe_authenticatedUser_returnsEmitterAndRegisters() {
        // when
        SseEmitter result = sseController.subscribe();

        // then
        assertThat(result).isNotNull();
        verify(emitterRegistry).register(eq(userId), any(SseEmitter.class));
    }

    @Test
    @DisplayName("unsubscribe - authenticated user - removes emitter from registry")
    void unsubscribe_authenticatedUser_removesFromRegistry() {
        // when
        sseController.unsubscribe();

        // then
        verify(emitterRegistry).remove(userId);
    }
}
