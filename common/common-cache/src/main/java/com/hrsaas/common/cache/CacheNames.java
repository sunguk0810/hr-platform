package com.hrsaas.common.cache;

/**
 * Cache name constants.
 * All services should use these constants for cache names instead of hardcoded strings.
 */
public interface CacheNames {

    // Tenant related
    String TENANT = "tenant";
    String TENANT_POLICY = "tenant:policy";
    String TENANT_FEATURE = "tenant:feature";
    String TENANT_FEATURE_ENABLED = "tenant:feature:enabled";

    // MDM related
    String CODE_GROUP = "mdm:codeGroup";
    String COMMON_CODE = "mdm:commonCode";
    String TENANT_CODE = "mdm:tenantCode";
    String CODE_TREE = "mdm:codeTree";

    // Organization related
    String ORGANIZATION = "organization";
    String ORGANIZATION_TREE = "organization:tree";
    String DEPARTMENT = "department";
    String POSITION = "position";
    String GRADE = "grade";
    String COMMITTEE = "committee";

    // Employee related
    String EMPLOYEE = "employee";
    String EMPLOYEE_PROFILE = "employee:profile";

    // Auth related
    String SESSION = "session";
    String TOKEN = "token";
    String PERMISSIONS = "permissions";

    // Attendance related
    String HOLIDAY = "attendance:holiday";

    // Approval related
    String APPROVAL_TEMPLATE = "approval:template";

    // Appointment related
    String APPOINTMENT_DRAFT = "appointment:draft";

    // Certificate related
    String CERTIFICATE_TYPE = "certificate:type";
    String CERTIFICATE_TYPES = "certificate:types";
    String CERTIFICATE_TEMPLATE = "certificate:template";
    String CERTIFICATE_TEMPLATES = "certificate:templates";

    // Menu related
    String MENU_TREE = "menu:tree";
    String MENU_TENANT = "menu:tenant";
    String MENU_USER = "menu:user";

    // Recruitment related
    String JOB_POSTING = "recruitment:jobPosting";
    String JOB_POSTINGS = "recruitment:jobPostings";
}
