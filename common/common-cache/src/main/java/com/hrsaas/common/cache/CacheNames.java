package com.hrsaas.common.cache;

/**
 * Cache name constants.
 */
public interface CacheNames {

    // Tenant related
    String TENANT = "tenant";
    String TENANT_POLICY = "tenant:policy";
    String TENANT_FEATURE = "tenant:feature";

    // MDM related
    String CODE_GROUP = "mdm:codeGroup";
    String COMMON_CODE = "mdm:commonCode";

    // Organization related
    String ORGANIZATION = "organization";
    String ORGANIZATION_TREE = "organization:tree";
    String DEPARTMENT = "department";
    String POSITION = "position";

    // Employee related
    String EMPLOYEE = "employee";
    String EMPLOYEE_PROFILE = "employee:profile";

    // Auth related
    String SESSION = "session";
    String TOKEN = "token";
    String PERMISSIONS = "permissions";
}
