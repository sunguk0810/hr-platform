package com.hrsaas.notification.sender;

import com.hrsaas.notification.domain.entity.Notification;

/**
 * Interface for notification senders.
 * Implementations handle specific channels (EMAIL, SMS, WEB_PUSH, etc.)
 */
public interface NotificationSender {

    /**
     * Sends a notification.
     *
     * @param notification The notification to send
     * @return true if sent successfully, false otherwise
     */
    boolean send(Notification notification);

    /**
     * Checks if this sender supports the notification.
     *
     * @param notification The notification to check
     * @return true if this sender can handle the notification
     */
    boolean supports(Notification notification);

    /**
     * Gets the priority of this sender (lower = higher priority).
     *
     * @return the priority value
     */
    default int getPriority() {
        return 100;
    }
}
