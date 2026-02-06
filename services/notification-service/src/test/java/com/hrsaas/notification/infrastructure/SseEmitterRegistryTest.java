package com.hrsaas.notification.infrastructure;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for {@link SseEmitterRegistry}.
 * Tests the ConcurrentHashMap-based SSE emitter registration and lookup logic.
 */
class SseEmitterRegistryTest {

    private SseEmitterRegistry registry;

    @BeforeEach
    void setUp() {
        registry = new SseEmitterRegistry();
    }

    @Test
    @DisplayName("register - new user - stores emitter in registry")
    void register_newUser_storesEmitter() {
        // given
        UUID userId = UUID.randomUUID();
        SseEmitter emitter = new SseEmitter();

        // when
        registry.register(userId, emitter);

        // then
        assertThat(registry.get(userId)).isSameAs(emitter);
        assertThat(registry.hasEmitter(userId)).isTrue();
    }

    @Test
    @DisplayName("register - existing user - replaces old emitter with new one")
    void register_existingUser_replacesOldEmitter() {
        // given
        UUID userId = UUID.randomUUID();
        SseEmitter oldEmitter = new SseEmitter();
        SseEmitter newEmitter = new SseEmitter();

        registry.register(userId, oldEmitter);

        // when
        registry.register(userId, newEmitter);

        // then
        assertThat(registry.get(userId)).isSameAs(newEmitter);
        assertThat(registry.get(userId)).isNotSameAs(oldEmitter);
        assertThat(registry.getActiveCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("remove - registered user - removes emitter from registry")
    void remove_registeredUser_removesEmitter() {
        // given
        UUID userId = UUID.randomUUID();
        SseEmitter emitter = new SseEmitter();
        registry.register(userId, emitter);

        // when
        registry.remove(userId);

        // then
        assertThat(registry.get(userId)).isNull();
        assertThat(registry.hasEmitter(userId)).isFalse();
        assertThat(registry.getActiveCount()).isZero();
    }

    @Test
    @DisplayName("get - registered user - returns the stored emitter")
    void get_registeredUser_returnsEmitter() {
        // given
        UUID userId = UUID.randomUUID();
        SseEmitter emitter = new SseEmitter();
        registry.register(userId, emitter);

        // when
        SseEmitter result = registry.get(userId);

        // then
        assertThat(result).isSameAs(emitter);
    }

    @Test
    @DisplayName("get - unregistered user - returns null")
    void get_unregisteredUser_returnsNull() {
        // given
        UUID userId = UUID.randomUUID();

        // when
        SseEmitter result = registry.get(userId);

        // then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("hasEmitter - registered user - returns true")
    void hasEmitter_registeredUser_returnsTrue() {
        // given
        UUID userId = UUID.randomUUID();
        SseEmitter emitter = new SseEmitter();
        registry.register(userId, emitter);

        // when
        boolean result = registry.hasEmitter(userId);

        // then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("getActiveCount - multiple registered users - returns correct count")
    void getActiveCount_multipleRegistered_returnsCorrectCount() {
        // given
        UUID userId1 = UUID.randomUUID();
        UUID userId2 = UUID.randomUUID();
        UUID userId3 = UUID.randomUUID();

        registry.register(userId1, new SseEmitter());
        registry.register(userId2, new SseEmitter());
        registry.register(userId3, new SseEmitter());

        // when
        int count = registry.getActiveCount();

        // then
        assertThat(count).isEqualTo(3);
    }
}
