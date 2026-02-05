package com.hrsaas.employee.domain.entity;

/**
 * 경조사 유형
 */
public enum CondolenceEventType {
    // 경사
    MARRIAGE,           // 결혼
    CHILD_BIRTH,        // 출산
    CHILD_FIRST_BIRTHDAY, // 돌

    // 조사
    DEATH_PARENT,       // 부모 사망
    DEATH_SPOUSE,       // 배우자 사망
    DEATH_CHILD,        // 자녀 사망
    DEATH_GRANDPARENT,  // 조부모 사망
    DEATH_SIBLING,      // 형제자매 사망
    DEATH_IN_LAW,       // 시부모/장인장모 사망

    // 기타
    HOSPITALIZATION,    // 입원
    DISASTER,           // 재해
    OTHER               // 기타
}
