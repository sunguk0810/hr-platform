package com.hrsaas.tenant.domain.constant;

import com.hrsaas.tenant.domain.entity.PolicyType;

import java.util.Collections;
import java.util.EnumMap;
import java.util.Map;

public final class DefaultPolicyData {

    private DefaultPolicyData() {}

    private static final Map<PolicyType, String> DEFAULTS;

    static {
        Map<PolicyType, String> map = new EnumMap<>(PolicyType.class);

        map.put(PolicyType.PASSWORD,
            "{\"minLength\":8,\"maxLength\":20,\"requireUppercase\":true,\"requireLowercase\":true," +
            "\"requireDigit\":true,\"requireSpecialChar\":true,\"minCharTypes\":3," +
            "\"expiryDays\":90,\"historyCount\":5,\"expiryWarningDays\":14}");

        map.put(PolicyType.ATTENDANCE,
            "{\"workStartTime\":\"09:00\",\"workEndTime\":\"18:00\",\"standardWorkHours\":8," +
            "\"flexibleWorkEnabled\":false,\"lateGraceMinutes\":10,\"earlyLeaveGraceMinutes\":10," +
            "\"overtimeRequiresApproval\":true,\"maxOvertimeHoursPerMonth\":52}");

        map.put(PolicyType.LEAVE,
            "{\"annualLeaveBaseCount\":15,\"carryOverEnabled\":true,\"maxCarryOverDays\":10," +
            "\"minLeaveNoticeHours\":24,\"halfDayLeaveEnabled\":true,\"hourlyLeaveEnabled\":false," +
            "\"sickLeaveMaxDays\":30}");

        map.put(PolicyType.APPROVAL,
            "{\"escalationDays\":3,\"maxApprovalLevels\":5,\"parallelApprovalEnabled\":false," +
            "\"reminderIntervalHours\":24,\"autoApproveOnTimeout\":false,\"autoApproveTimeoutDays\":7}");

        map.put(PolicyType.SECURITY,
            "{\"sessionTimeoutMinutes\":30,\"maxSessions\":3,\"mfaPolicy\":\"OPTIONAL\"," +
            "\"ipWhitelist\":[],\"loginNotificationEnabled\":true,\"maxLoginAttempts\":5," +
            "\"lockoutDurationMinutes\":30}");

        map.put(PolicyType.NOTIFICATION,
            "{\"emailEnabled\":true,\"smsEnabled\":false,\"pushEnabled\":true," +
            "\"quietHoursStart\":\"22:00\",\"quietHoursEnd\":\"07:00\"," +
            "\"digestEnabled\":false,\"digestSchedule\":\"DAILY\"}");

        map.put(PolicyType.ORGANIZATION,
            "{\"maxDepartmentDepth\":5,\"positionSystem\":\"GRADE\",\"gradeCount\":10," +
            "\"teamEnabled\":true,\"matrixOrganizationEnabled\":false,\"concurrentPositionEnabled\":false}");

        DEFAULTS = Collections.unmodifiableMap(map);
    }

    public static String get(PolicyType policyType) {
        return DEFAULTS.get(policyType);
    }

    public static Map<PolicyType, String> getAll() {
        return DEFAULTS;
    }
}
