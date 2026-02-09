package com.hrsaas.attendance.domain;

/**
 * 근태 서비스 에러코드 상수
 */
public final class AttendanceErrorCode {

    private AttendanceErrorCode() {}

    // 출퇴근 (ATT_001 ~ ATT_007)
    public static final String ALREADY_CHECKED_IN = "ATT_001";
    public static final String NO_CHECK_IN_RECORD = "ATT_002";
    public static final String CHECK_IN_REQUIRED = "ATT_003";
    public static final String ALREADY_CHECKED_OUT = "ATT_004";
    public static final String INVALID_DATE_RANGE = "ATT_005";
    public static final String ATTENDANCE_NOT_FOUND = "ATT_006";
    public static final String REMARKS_REQUIRED = "ATT_007";

    // 공휴일 (HOL_001 ~ HOL_002)
    public static final String HOLIDAY_DUPLICATE = "HOL_001";
    public static final String HOLIDAY_NOT_FOUND = "HOL_002";

    // 휴가 (LEV_001 ~ LEV_007)
    public static final String LEAVE_OVERLAPPING = "LEV_001";
    public static final String LEAVE_NO_BALANCE = "LEV_002";
    public static final String LEAVE_INSUFFICIENT_BALANCE = "LEV_003";
    public static final String LEAVE_FORBIDDEN = "LEV_004";
    public static final String LEAVE_NOT_FOUND = "LEV_005";
    public static final String LEAVE_INVALID_STATUS = "LEV_006";
    public static final String LEAVE_INVALID_HOURS = "LEV_007";

    // 초과근무 (OVT_001)
    public static final String OVERTIME_NOT_FOUND = "OVT_001";
}
