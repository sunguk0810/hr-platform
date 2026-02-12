package com.hrsaas.notification.sender;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.common.security.jwt.JwtTokenProvider;
import com.hrsaas.notification.client.EmployeeClient;
import com.hrsaas.notification.domain.dto.external.EmployeeResponse;
import com.hrsaas.notification.domain.entity.Notification;
import com.hrsaas.notification.domain.entity.NotificationChannel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

import java.util.Set;
import java.util.UUID;

/**
 * SMS notification sender.
 * Integrates with external SMS gateway (e.g., AWS SNS).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SmsSender implements NotificationSender {

    private final EmployeeClient employeeClient;
    private final JwtTokenProvider jwtTokenProvider;
    private final ObjectProvider<SnsClient> snsClientProvider;

    @Value("${notification.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${notification.sms.provider:aws-sns}")
    private String smsProvider;

    @Override
    public boolean send(Notification notification) {
        if (!smsEnabled) {
            log.debug("SMS sending is disabled");
            return true;
        }

        try {
            String mobile = getRecipientMobile(notification.getRecipientId(), notification.getTenantId());
            if (mobile == null || mobile.isBlank()) {
                log.warn("Cannot send SMS: Recipient {} has no mobile number", notification.getRecipientId());
                return true;
            }

            if ("aws-sns".equalsIgnoreCase(smsProvider)) {
                return sendViaSns(mobile, notification.getContent());
            } else {
                log.warn("Unsupported SMS provider: {}", smsProvider);
                return false;
            }
        } catch (Exception e) {
            log.error("Failed to send SMS to recipient {}: {}", notification.getRecipientId(), e.getMessage(), e);
            return false;
        }
    }

    private String getRecipientMobile(UUID recipientId, UUID tenantId) {
        // Create system context with HR_ADMIN role to bypass masking and access tenant data
        UserContext systemContext = UserContext.builder()
                .userId(UUID.randomUUID()) // Dummy system user ID
                .tenantId(tenantId)
                .roles(Set.of("ROLE_HR_ADMIN"))
                .username("system-notification-sender")
                .build();

        String token = "Bearer " + jwtTokenProvider.generateAccessToken(systemContext);

        try {
            ApiResponse<EmployeeResponse> response = employeeClient.getEmployee(token, recipientId);
            if (response != null && response.isSuccess() && response.getData() != null) {
                return response.getData().getMobile();
            }
        } catch (Exception e) {
            log.error("Error fetching employee details for {}: {}", recipientId, e.getMessage());
            throw e;
        }

        return null;
    }

    private boolean sendViaSns(String phoneNumber, String message) {
        SnsClient snsClient = snsClientProvider.getIfAvailable();
        if (snsClient == null) {
            log.error("AWS SNS client is not configured. Cannot send SMS.");
            return false;
        }

        PublishRequest request = PublishRequest.builder()
                .phoneNumber(phoneNumber)
                .message(message)
                .build();

        snsClient.publish(request);
        log.info("SMS sent via AWS SNS to {}", phoneNumber);
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
