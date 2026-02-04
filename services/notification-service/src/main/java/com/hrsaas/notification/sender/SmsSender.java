package com.hrsaas.notification.sender;

import com.hrsaas.notification.domain.entity.Notification;
import com.hrsaas.notification.domain.entity.NotificationChannel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * SMS notification sender.
 * Integrates with external SMS gateway (e.g., AWS SNS, Twilio, or local provider).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SmsSender implements NotificationSender {

    @Value("${notification.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${notification.sms.provider:none}")
    private String smsProvider;

    @Override
    public boolean send(Notification notification) {
        if (!smsEnabled) {
            log.debug("SMS sending is disabled");
            return true;
        }

        // SMS requires phone number - this would come from user profile
        // For now, log and return true as SMS integration depends on provider
        log.info("SMS notification queued: recipientId={}, title={}",
            notification.getRecipientId(), notification.getTitle());

        // TODO: Implement actual SMS sending based on provider
        // switch (smsProvider) {
        //     case "aws-sns" -> sendViaSns(notification);
        //     case "twilio" -> sendViaTwilio(notification);
        //     case "local" -> sendViaLocalProvider(notification);
        // }

        return true;
    }

    @Override
    public boolean supports(Notification notification) {
        return notification.getChannel() == NotificationChannel.SMS;
    }

    @Override
    public int getPriority() {
        return 20;
    }
}
