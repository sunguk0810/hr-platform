package com.hrsaas.tenant.domain.entity;

public enum PolicyType {
    PASSWORD,       // 비밀번호 정책 (길이, 복잡도, 만료기간 등)
    ATTENDANCE,     // 근태 정책 (근무시간, 유연근무 등)
    LEAVE,          // 휴가 정책 (연차, 병가 기준 등)
    APPROVAL,       // 결재 정책 (에스컬레이션, 리마인드 등)
    SECURITY,       // 보안 정책 (세션 만료, 접근 제한 등)
    NOTIFICATION,   // 알림 정책 (발송 채널, 빈도 등)
    ORGANIZATION    // 조직 정책 (부서 레벨, 직급 체계 등)
}
