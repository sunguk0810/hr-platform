package com.hrsaas.notification.domain.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 알림 설정 수정 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateNotificationSettingsRequest {

    private Boolean emailEnabled;
    private Boolean pushEnabled;
    private Boolean browserEnabled;
    private Boolean smsEnabled;
    private Boolean approvalNotifications;
    private Boolean leaveNotifications;
    private Boolean announcementNotifications;
    private Boolean reminderNotifications;
    private Boolean systemNotifications;
    private Boolean digestEnabled;
    private Boolean quietHoursEnabled;
}
