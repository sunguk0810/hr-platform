package com.hrsaas.recruitment.client.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendNotificationRequest {

    @NotNull(message = "수신자 ID는 필수입니다")
    private UUID recipientId;

    private String recipientEmail;

    @NotNull(message = "알림 유형은 필수입니다")
    private NotificationType notificationType;

    private List<NotificationChannel> channels;

    @NotBlank(message = "제목은 필수입니다")
    private String title;

    @NotBlank(message = "내용은 필수입니다")
    private String content;

    private String linkUrl;

    private String referenceType;

    private UUID referenceId;
}
