package com.hrsaas.common.event;

/**
 * Kafka topic name constants.
 */
public interface EventTopics {

    // Tenant events
    String TENANT_EVENTS = "tenant-events";
    String TENANT_CREATED = "tenant-created";
    String TENANT_UPDATED = "tenant-updated";

    // Employee events
    String EMPLOYEE_EVENTS = "employee-events";
    String EMPLOYEE_CREATED = "employee-created";
    String EMPLOYEE_UPDATED = "employee-updated";
    String EMPLOYEE_TRANSFERRED = "employee-transferred";
    String EMPLOYEE_RETIRED = "employee-retired";

    // Organization events
    String ORGANIZATION_EVENTS = "organization-events";
    String DEPARTMENT_CREATED = "department-created";
    String DEPARTMENT_UPDATED = "department-updated";

    // Approval events
    String APPROVAL_EVENTS = "approval-events";
    String APPROVAL_SUBMITTED = "approval-submitted";
    String APPROVAL_APPROVED = "approval-approved";
    String APPROVAL_REJECTED = "approval-rejected";
    String APPROVAL_CANCELED = "approval-canceled";
    String APPROVAL_COMPLETED = "approval-completed";

    // Attendance events
    String ATTENDANCE_EVENTS = "attendance-events";
    String LEAVE_REQUESTED = "leave-requested";
    String LEAVE_APPROVED = "leave-approved";
    String LEAVE_REJECTED = "leave-rejected";
    String LEAVE_CANCELED = "leave-canceled";

    // Notification events
    String NOTIFICATION_EVENTS = "notification-events";
    String NOTIFICATION_SEND = "notification-send";

    // MDM events
    String MDM_EVENTS = "mdm-events";
    String CODE_GROUP_CREATED = "code-group-created";
    String CODE_GROUP_UPDATED = "code-group-updated";
    String COMMON_CODE_CREATED = "common-code-created";
    String COMMON_CODE_UPDATED = "common-code-updated";
}
