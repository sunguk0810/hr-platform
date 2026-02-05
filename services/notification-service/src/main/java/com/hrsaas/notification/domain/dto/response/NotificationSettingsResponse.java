package com.hrsaas.notification.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 알림 설정 응답 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationSettingsResponse {

    private boolean emailEnabled;
    private boolean pushEnabled;
    private boolean browserEnabled;
    private boolean smsEnabled;
    private boolean approvalNotifications;
    private boolean leaveNotifications;
    private boolean announcementNotifications;
    private boolean reminderNotifications;
    private boolean systemNotifications;
    private boolean digestEnabled;
    private boolean quietHoursEnabled;
}
