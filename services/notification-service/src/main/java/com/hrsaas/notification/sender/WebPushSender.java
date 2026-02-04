package com.hrsaas.notification.sender;

import com.hrsaas.notification.domain.entity.Notification;
import com.hrsaas.notification.domain.entity.NotificationChannel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Web push notification sender using WebSocket/STOMP.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebPushSender implements NotificationSender {

    private final SimpMessagingTemplate messagingTemplate;

    private static final String NOTIFICATION_DESTINATION = "/queue/notifications";

    @Override
    public boolean send(Notification notification) {
        try {
            String destination = "/user/" + notification.getRecipientId() + NOTIFICATION_DESTINATION;

            Map<String, Object> payload = new HashMap<>();
            payload.put("id", notification.getId().toString());
            payload.put("type", notification.getNotificationType().name());
            payload.put("title", notification.getTitle());
            payload.put("content", notification.getContent());
            payload.put("linkUrl", notification.getLinkUrl());
            payload.put("createdAt", notification.getCreatedAt().toString());

            messagingTemplate.convertAndSend(destination, payload);

            log.debug("Web push sent: recipientId={}, title={}",
                notification.getRecipientId(), notification.getTitle());
            return true;
        } catch (Exception e) {
            log.error("Failed to send web push: recipientId={}, error={}",
                notification.getRecipientId(), e.getMessage());
            return false;
        }
    }

    @Override
    public boolean supports(Notification notification) {
        return notification.getChannel() == NotificationChannel.WEB_PUSH;
    }

    @Override
    public int getPriority() {
        return 1;
    }
}
