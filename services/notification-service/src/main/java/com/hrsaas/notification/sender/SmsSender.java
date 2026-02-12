package com.hrsaas.notification.sender;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.common.security.jwt.JwtTokenProvider;
import com.hrsaas.notification.client.EmployeeServiceClient;
import com.hrsaas.notification.client.SystemTokenHolder;
import com.hrsaas.notification.client.dto.EmployeeResponse;
import com.hrsaas.notification.domain.entity.Notification;
import com.hrsaas.notification.domain.entity.NotificationChannel;
import com.twilio.Twilio;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.sns.model.PublishResponse;

import jakarta.annotation.PostConstruct;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

/**
 * SMS notification sender.
 * Integrates with external SMS gateway (e.g., AWS SNS, Twilio, or local provider).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SmsSender implements NotificationSender {

    private final EmployeeServiceClient employeeClient;
    private final JwtTokenProvider jwtTokenProvider;
    private final Optional<SnsClient> snsClient;

    @Value("${notification.sms.enabled:false}")
    private boolean smsEnabled;

    @Value("${notification.sms.provider:none}")
    private String smsProvider;

    @Value("${notification.sms.twilio.account-sid:}")
    private String twilioAccountSid;

    @Value("${notification.sms.twilio.auth-token:}")
    private String twilioAuthToken;

    @Value("${notification.sms.twilio.from-number:}")
    private String twilioFromNumber;

    @PostConstruct
    public void init() {
        if ("twilio".equalsIgnoreCase(smsProvider)) {
            if (twilioAccountSid.isBlank() || twilioAuthToken.isBlank()) {
                log.warn("Twilio credentials are missing, SMS sending via Twilio will fail.");
            } else {
                try {
                    Twilio.init(twilioAccountSid, twilioAuthToken);
                    log.info("Twilio initialized successfully.");
                } catch (Exception e) {
                    log.error("Failed to initialize Twilio: {}", e.getMessage());
                }
            }
        }
    }

    @Override
    public boolean send(Notification notification) {
        if (!smsEnabled) {
            log.debug("SMS sending is disabled");
            return true;
        }

        String recipientPhone = fetchRecipientPhoneNumber(notification);
        if (recipientPhone == null || recipientPhone.isBlank()) {
            log.warn("No phone number found for recipient: {}", notification.getRecipientId());
            return false;
        }

        log.info("Sending SMS via {}: to={}, title={}", smsProvider, recipientPhone, notification.getTitle());

        try {
            return switch (smsProvider.toLowerCase()) {
                case "aws-sns" -> sendViaSns(recipientPhone, notification);
                case "twilio" -> sendViaTwilio(recipientPhone, notification);
                case "local" -> sendViaLocalProvider(recipientPhone, notification);
                default -> {
                    log.warn("Unknown SMS provider: {}", smsProvider);
                    yield false;
                }
            };
        } catch (Exception e) {
            log.error("Failed to send SMS: {}", e.getMessage(), e);
            return false;
        }
    }

    private String fetchRecipientPhoneNumber(Notification notification) {
        // Generate System Token
        UserContext systemContext = UserContext.builder()
            .userId(UUID.fromString("00000000-0000-0000-0000-000000000000")) // System User
            .tenantId(notification.getTenantId())
            .username("system-notification")
            .roles(Set.of("ROLE_HR_ADMIN")) // High privilege to see unmasked data
            .permissions(Set.of("employee:read", "employee:read:all")) // Ensure permission check passes
            .build();

        String token = jwtTokenProvider.generateAccessToken(systemContext);
        SystemTokenHolder.setToken(token);

        try {
            ApiResponse<EmployeeResponse> response = employeeClient.getEmployee(notification.getRecipientId());
            if (response != null && response.getData() != null) {
                EmployeeResponse employee = response.getData();
                if (employee.getMobile() != null && !employee.getMobile().isBlank()) {
                    return employee.getMobile();
                }
                return employee.getPhone();
            }
        } catch (Exception e) {
            log.error("Failed to fetch employee data for SMS: {}", e.getMessage());
        } finally {
            SystemTokenHolder.clear();
        }
        return null;
    }

    private boolean sendViaSns(String phoneNumber, Notification notification) {
        if (snsClient.isEmpty()) {
            log.error("AWS SNS Client is not available");
            return false;
        }

        try {
            PublishRequest request = PublishRequest.builder()
                .phoneNumber(phoneNumber)
                .message("[" + notification.getTitle() + "] " + notification.getContent())
                .build();

            PublishResponse response = snsClient.get().publish(request);
            log.info("SMS sent via AWS SNS: messageId={}", response.messageId());
            return true;
        } catch (Exception e) {
            log.error("AWS SNS send failed: {}", e.getMessage(), e);
            return false;
        }
    }

    private boolean sendViaTwilio(String phoneNumber, Notification notification) {
        try {
            Message message = Message.creator(
                new PhoneNumber(phoneNumber),
                new PhoneNumber(twilioFromNumber),
                "[" + notification.getTitle() + "] " + notification.getContent()
            ).create();

            log.info("SMS sent via Twilio: sid={}, status={}", message.getSid(), message.getStatus());
            return true;
        } catch (Exception e) {
            log.error("Twilio send failed: {}", e.getMessage(), e);
            return false;
        }
    }

    private boolean sendViaLocalProvider(String phoneNumber, Notification notification) {
        // Local simulation
        log.info("[LOCAL SMS] To: {}, Message: [{}] {}", phoneNumber, notification.getTitle(), notification.getContent());
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
