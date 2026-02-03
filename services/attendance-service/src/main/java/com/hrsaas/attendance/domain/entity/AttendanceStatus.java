package com.hrsaas.attendance.domain.entity;

public enum AttendanceStatus {
    NORMAL,         // 정상출근
    LATE,           // 지각
    EARLY_LEAVE,    // 조퇴
    ABSENT,         // 결근
    ON_LEAVE,       // 휴가
    BUSINESS_TRIP,  // 출장
    REMOTE_WORK,    // 재택근무
    HOLIDAY         // 휴일
}
