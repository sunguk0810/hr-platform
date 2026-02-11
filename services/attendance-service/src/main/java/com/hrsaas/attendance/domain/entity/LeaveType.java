package com.hrsaas.attendance.domain.entity;

public enum LeaveType {
    ANNUAL,         // 연차
    HALF_DAY_AM,    // 오전반차
    HALF_DAY_PM,    // 오후반차
    SICK,           // 병가
    SPECIAL,        // 경조휴가
    MATERNITY,      // 출산휴가
    PATERNITY,      // 배우자출산휴가
    FAMILY_CARE,    // 가족돌봄휴가
    FAMILY_EVENT,   // 경조사
    PUBLIC_DUTY,    // 공가
    UNPAID          // 무급휴가
}
