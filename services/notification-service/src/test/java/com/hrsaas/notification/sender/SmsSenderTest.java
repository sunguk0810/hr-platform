package com.hrsaas.notification.sender;

import com.hrsaas.common.response.ApiResponse;
import com.hrsaas.common.security.UserContext;
import com.hrsaas.common.security.jwt.JwtTokenProvider;
import com.hrsaas.notification.client.EmployeeClient;
import com.hrsaas.notification.domain.dto.external.EmployeeResponse;
import com.hrsaas.notification.domain.entity.Notification;
import com.hrsaas.notification.domain.entity.NotificationChannel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.test.util.ReflectionTestUtils;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmsSenderTest {

    @Mock
    private EmployeeClient employeeClient;

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private SnsClient snsClient;

    @Mock
    private ObjectProvider<SnsClient> snsClientProvider;

    @InjectMocks
    private SmsSender smsSender;

    private Notification notification;

    @BeforeEach
    void setUp() {
        notification = Notification.builder()
                .recipientId(UUID.randomUUID())
                .tenantId(UUID.randomUUID())
                .channel(NotificationChannel.SMS)
                .content("Test SMS")
                .build();

        ReflectionTestUtils.setField(smsSender, "smsEnabled", true);
        ReflectionTestUtils.setField(smsSender, "smsProvider", "aws-sns");
    }

    @Test
    @DisplayName("Should send SMS successfully via AWS SNS")
    void send_Success() {
        // Given
        when(jwtTokenProvider.generateAccessToken(any(UserContext.class))).thenReturn("token");
        when(snsClientProvider.getIfAvailable()).thenReturn(snsClient);

        EmployeeResponse employeeResponse = EmployeeResponse.builder()
                .id(notification.getRecipientId())
                .mobile("+1234567890")
                .build();
        when(employeeClient.getEmployee(anyString(), any(UUID.class)))
                .thenReturn(ApiResponse.success(employeeResponse));

        // When
        boolean result = smsSender.send(notification);

        // Then
        assertTrue(result);
        verify(employeeClient).getEmployee(eq("Bearer token"), eq(notification.getRecipientId()));
        verify(snsClient).publish(any(PublishRequest.class));
    }

    @Test
    @DisplayName("Should skip sending if SMS is disabled")
    void send_Disabled() {
        // Given
        ReflectionTestUtils.setField(smsSender, "smsEnabled", false);

        // When
        boolean result = smsSender.send(notification);

        // Then
        assertTrue(result);
        verifyNoInteractions(employeeClient);
        verifyNoInteractions(snsClientProvider);
    }

    @Test
    @DisplayName("Should skip sending if mobile number is missing")
    void send_MissingMobile() {
        // Given
        when(jwtTokenProvider.generateAccessToken(any(UserContext.class))).thenReturn("token");

        EmployeeResponse employeeResponse = EmployeeResponse.builder()
                .id(notification.getRecipientId())
                .mobile(null)
                .build();
        when(employeeClient.getEmployee(anyString(), any(UUID.class)))
                .thenReturn(ApiResponse.success(employeeResponse));

        // When
        boolean result = smsSender.send(notification);

        // Then
        assertTrue(result); // Marked as processed
        verify(employeeClient).getEmployee(anyString(), eq(notification.getRecipientId()));
        verifyNoInteractions(snsClientProvider);
    }

    @Test
    @DisplayName("Should handle employee service error gracefully")
    void send_EmployeeServiceError() {
        // Given
        when(jwtTokenProvider.generateAccessToken(any(UserContext.class))).thenReturn("token");
        when(employeeClient.getEmployee(anyString(), any(UUID.class)))
                .thenThrow(new RuntimeException("Service unavailable"));

        // When
        boolean result = smsSender.send(notification);

        // Then
        assertFalse(result); // Marked as failed
        verify(snsClientProvider, never()).getIfAvailable();
    }

    @Test
    @DisplayName("Should return false if unsupported provider")
    void send_UnsupportedProvider() {
        // Given
        ReflectionTestUtils.setField(smsSender, "smsProvider", "twilio");
        when(jwtTokenProvider.generateAccessToken(any(UserContext.class))).thenReturn("token");

        EmployeeResponse employeeResponse = EmployeeResponse.builder()
                .id(notification.getRecipientId())
                .mobile("+1234567890")
                .build();
        when(employeeClient.getEmployee(anyString(), any(UUID.class)))
                .thenReturn(ApiResponse.success(employeeResponse));

        // When
        boolean result = smsSender.send(notification);

        // Then
        assertFalse(result);
        verify(snsClientProvider, never()).getIfAvailable();
    }

    @Test
    @DisplayName("Should return false if SnsClient is missing")
    void send_MissingSnsClient() {
        // Given
        when(jwtTokenProvider.generateAccessToken(any(UserContext.class))).thenReturn("token");
        when(snsClientProvider.getIfAvailable()).thenReturn(null);

        EmployeeResponse employeeResponse = EmployeeResponse.builder()
                .id(notification.getRecipientId())
                .mobile("+1234567890")
                .build();
        when(employeeClient.getEmployee(anyString(), any(UUID.class)))
                .thenReturn(ApiResponse.success(employeeResponse));

        // When
        boolean result = smsSender.send(notification);

        // Then
        assertFalse(result);
        verify(snsClient, never()).publish(any(PublishRequest.class));
    }
}
