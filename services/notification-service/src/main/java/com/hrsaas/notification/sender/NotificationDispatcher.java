package com.hrsaas.notification.sender;

import com.hrsaas.notification.domain.entity.Notification;
import com.hrsaas.notification.repository.NotificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

/**
 * Dispatches notifications to appropriate senders based on channel.
 */
@Slf4j
@Component
public class NotificationDispatcher {

    private final List<NotificationSender> senders;
    private final NotificationRepository notificationRepository;

    public NotificationDispatcher(List<NotificationSender> senders,
                                  NotificationRepository notificationRepository) {
        this.senders = senders.stream()
            .sorted(Comparator.comparingInt(NotificationSender::getPriority))
            .toList();
        this.notificationRepository = notificationRepository;
        log.info("NotificationDispatcher initialized with {} senders", senders.size());
    }

    /**
     * Dispatches a notification asynchronously.
     */
    @Async
    public void dispatch(Notification notification) {
        log.debug("Dispatching notification: id={}, channel={}",
            notification.getId(), notification.getChannel());

        NotificationSender sender = findSender(notification);
        if (sender == null) {
            log.warn("No sender found for notification channel: {}", notification.getChannel());
            notification.markAsFailed("No sender available for channel: " + notification.getChannel());
            notificationRepository.save(notification);
            return;
        }

        try {
            boolean success = sender.send(notification);
            if (success) {
                notification.markAsSent();
                log.info("Notification sent successfully: id={}, channel={}",
                    notification.getId(), notification.getChannel());
            } else {
                notification.markAsFailed("Send returned false");
                log.warn("Notification send failed: id={}, channel={}",
                    notification.getId(), notification.getChannel());
            }
        } catch (Exception e) {
            notification.markAsFailed(e.getMessage());
            log.error("Exception while sending notification: id={}, channel={}, error={}",
                notification.getId(), notification.getChannel(), e.getMessage());
        }

        notificationRepository.save(notification);
    }

    /**
     * Dispatches multiple notifications.
     */
    public void dispatchAll(List<Notification> notifications) {
        notifications.forEach(this::dispatch);
    }

    private NotificationSender findSender(Notification notification) {
        return senders.stream()
            .filter(s -> s.supports(notification))
            .findFirst()
            .orElse(null);
    }
}
