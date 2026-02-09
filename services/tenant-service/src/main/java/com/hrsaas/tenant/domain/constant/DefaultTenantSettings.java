package com.hrsaas.tenant.domain.constant;

public final class DefaultTenantSettings {

    private DefaultTenantSettings() {}

    public static final String DEFAULT_BRANDING =
        "{\"primaryColor\":\"#2563eb\",\"secondaryColor\":\"#1e40af\"}";

    public static final String DEFAULT_SETTINGS =
        "{\"locale\":\"ko\",\"timezone\":\"Asia/Seoul\",\"dateFormat\":\"yyyy-MM-dd\"," +
        "\"timeFormat\":\"HH:mm\",\"currency\":\"KRW\",\"fiscalYearStartMonth\":1}";

    public static final String DEFAULT_HIERARCHY =
        "{\"levels\":[" +
        "{\"levelName\":\"사업부\",\"levelOrder\":1,\"isRequired\":true}," +
        "{\"levelName\":\"본부\",\"levelOrder\":2,\"isRequired\":true}," +
        "{\"levelName\":\"부서\",\"levelOrder\":3,\"isRequired\":true}," +
        "{\"levelName\":\"팀\",\"levelOrder\":4,\"isRequired\":false}," +
        "{\"levelName\":\"파트\",\"levelOrder\":5,\"isRequired\":false}" +
        "]}";

    public static final String DEFAULT_MODULES =
        "[\"EMPLOYEE\",\"ORGANIZATION\",\"ATTENDANCE\",\"LEAVE\",\"APPROVAL\",\"MDM\",\"NOTIFICATION\"]";
}
