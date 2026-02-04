package com.hrsaas.employee.domain.entity;

public enum HistoryChangeType {
    HIRE,           // 입사
    TRANSFER,       // 전보 (부서 이동)
    PROMOTION,      // 승진
    GRADE_CHANGE,   // 직급 변경
    POSITION_CHANGE,// 직책 변경
    LEAVE,          // 휴직
    RETURN,         // 복직
    RESIGN          // 퇴사
}
