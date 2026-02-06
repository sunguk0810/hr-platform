package com.hrsaas.notification.sender;

import com.hrsaas.notification.domain.entity.Notification;
import com.hrsaas.notification.domain.entity.NotificationChannel;
import com.hrsaas.notification.domain.entity.NotificationType;
import com.hrsaas.notification.infrastructure.SseEmitterRegistry;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link SseSender}.
 * Tests the SSE-based notification delivery logic with mocked {@link SseEmitterRegistry}.
 */
@ExtendWith(MockitoExtension.class)
class SseSenderTest {

    @Mock
    private SseEmitterRegistry emitterRegistry;

    @InjectMocks
    private SseSender sseSender;

    @Test
    @DisplayName("send - emitter exists - sends notification data and returns true")
    void send_emitterExists_sendsNotificationAndReturnsTrue() throws IOException {
        // given
        UUID recipientId = UUID.randomUUID();
        Notification notification = buildNotification(recipientId, NotificationChannel.WEB_PUSH);

        SseEmitter emitter = mock(SseEmitter.class);
        when(emitterRegistry.get(recipientId)).thenReturn(emitter);

        // when
        boolean result = sseSender.send(notification);

        // then
        assertThat(result).isTrue();
        verify(emitter).send(any(SseEmitter.SseEventBuilder.class));
    }

    @Test
    @DisplayName("send - no emitter registered - returns false without sending")
    void send_noEmitter_returnsFalse() {
        // given
        UUID recipientId = UUID.randomUUID();
        Notification notification = buildNotification(recipientId, NotificationChannel.WEB_PUSH);

        when(emitterRegistry.get(recipientId)).thenReturn(null);

        // when
        boolean result = sseSender.send(notification);

        // then
        assertThat(result).isFalse();
        verify(emitterRegistry, never()).remove(any());
    }

    @Test
    @DisplayName("send - IOException during send - removes emitter and returns false")
    void send_ioException_removesEmitterAndReturnsFalse() throws IOException {
        // given
        UUID recipientId = UUID.randomUUID();
        Notification notification = buildNotification(recipientId, NotificationChannel.WEB_PUSH);

        SseEmitter emitter = mock(SseEmitter.class);
        when(emitterRegistry.get(recipientId)).thenReturn(emitter);
        doThrow(new IOException("Connection reset")).when(emitter).send(any(SseEmitter.SseEventBuilder.class));

        // when
        boolean result = sseSender.send(notification);

        // then
        assertThat(result).isFalse();
        verify(emitterRegistry).remove(recipientId);
    }

    @Test
    @DisplayName("supports - WEB_PUSH channel with registered emitter - returns true")
    void supports_webPushWithEmitter_returnsTrue() {
        // given
        UUID recipientId = UUID.randomUUID();
        Notification notification = buildNotification(recipientId, NotificationChannel.WEB_PUSH);

        when(emitterRegistry.hasEmitter(recipientId)).thenReturn(true);

        // when
        boolean result = sseSender.supports(notification);

        // then
        assertThat(result).isTrue();
    }

    @Test
    @DisplayName("supports - WEB_PUSH channel without registered emitter - returns false")
    void supports_webPushWithoutEmitter_returnsFalse() {
        // given
        UUID recipientId = UUID.randomUUID();
        Notification notification = buildNotification(recipientId, NotificationChannel.WEB_PUSH);

        when(emitterRegistry.hasEmitter(recipientId)).thenReturn(false);

        // when
        boolean result = sseSender.supports(notification);

        // then
        assertThat(result).isFalse();
    }

    @Test
    @DisplayName("getPriority - returns zero (highest priority)")
    void getPriority_returnsZero() {
        // when
        int priority = sseSender.getPriority();

        // then
        assertThat(priority).isZero();
    }

    /**
     * Builds a test {@link Notification} entity with required fields populated.
     *
     * @param recipientId the recipient user ID
     * @param channel     the notification channel
     * @return a fully populated Notification instance
     */
    private Notification buildNotification(UUID recipientId, NotificationChannel channel) {
        return Notification.builder()
                .recipientId(recipientId)
                .notificationType(NotificationType.APPROVAL_REQUESTED)
                .channel(channel)
                .title("Test Notification")
                .content("This is a test notification content.")
                .linkUrl("/approvals/123")
                .referenceType("APPROVAL")
                .referenceId(UUID.randomUUID())
                .build();
    }
}
