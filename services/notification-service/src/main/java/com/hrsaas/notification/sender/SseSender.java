package com.hrsaas.notification.sender;

import com.hrsaas.notification.domain.entity.Notification;
import com.hrsaas.notification.domain.entity.NotificationChannel;
import com.hrsaas.notification.infrastructure.SseEmitterRegistry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

/**
 * Notification sender that delivers notifications via Server-Sent Events (SSE).
 * Has the highest priority (0) so that SSE is attempted before WebSocket/STOMP.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SseSender implements NotificationSender {

    private final SseEmitterRegistry emitterRegistry;

    @Override
    public boolean send(Notification notification) {
        SseEmitter emitter = emitterRegistry.get(notification.getRecipientId());
        if (emitter == null) {
            log.debug("No SSE emitter found for user: {}", notification.getRecipientId());
            return false;
        }

        try {
            Map<String, Object> data = new HashMap<>();
            data.put("id", notification.getId());
            data.put("type", notification.getNotificationType().name());
            data.put("title", notification.getTitle());
            data.put("content", notification.getContent());
            data.put("linkUrl", notification.getLinkUrl());
            data.put("referenceType", notification.getReferenceType());
            data.put("referenceId", notification.getReferenceId());
            data.put("createdAt", notification.getCreatedAt());

            emitter.send(SseEmitter.event()
                .name("notification")
                .data(data));

            log.debug("SSE notification sent to user: {}", notification.getRecipientId());
            return true;
        } catch (IOException e) {
            log.warn("Failed to send SSE notification to user: {}", notification.getRecipientId(), e);
            emitterRegistry.remove(notification.getRecipientId());
            return false;
        }
    }

    @Override
    public boolean supports(Notification notification) {
        return notification.getChannel() == NotificationChannel.WEB_PUSH
               && emitterRegistry.hasEmitter(notification.getRecipientId());
    }

    @Override
    public int getPriority() {
        return 0; // Highest priority - try SSE first before WebSocket
    }
}
