package com.hrsaas.recruitment.client.dto;

public enum NotificationType {
    APPROVAL_REQUESTED,     // 결재 요청됨
    APPROVAL_APPROVED,      // 결재 승인됨
    APPROVAL_REJECTED,      // 결재 반려됨
    LEAVE_REQUESTED,        // 휴가 신청됨
    LEAVE_APPROVED,         // 휴가 승인됨
    LEAVE_REJECTED,         // 휴가 반려됨
    EMPLOYEE_JOINED,        // 신규 입사
    EMPLOYEE_RESIGNED,      // 퇴사
    ANNOUNCEMENT,           // 공지사항
    SYSTEM,                 // 시스템 알림
    INTERVIEW_FEEDBACK_REMINDER // 면접 피드백 리마인더
}
