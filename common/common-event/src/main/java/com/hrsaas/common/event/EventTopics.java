package com.hrsaas.common.event;

/**
 * SNS topic name constants.
 */
public interface EventTopics {

    // Tenant events
    String TENANT_EVENTS = "tenant-events";
    String TENANT_CREATED = "tenant-created";
    String TENANT_UPDATED = "tenant-updated";
    String TENANT_STATUS_CHANGED = "tenant-status-changed";
    String TENANT_POLICY_CHANGED = "tenant-policy-changed";
    String TENANT_FEATURE_CHANGED = "tenant-feature-changed";
    String TENANT_CONTRACT_EXPIRY = "tenant-contract-expiry";

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
    String DEPARTMENT_DELETED = "department-deleted";
    String DEPARTMENT_MERGED = "department-merged";
    String DEPARTMENT_SPLIT = "department-split";

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

    // Appointment events
    String APPOINTMENT_EXECUTED = "appointment-executed";

    // Affiliation events
    String EMPLOYEE_AFFILIATION_CHANGED = "employee-affiliation-changed";

    // MDM events
    String MDM_EVENTS = "mdm-events";
    String CODE_GROUP_CREATED = "code-group-created";
    String CODE_GROUP_UPDATED = "code-group-updated";
    String COMMON_CODE_CREATED = "common-code-created";
    String COMMON_CODE_UPDATED = "common-code-updated";
    String CODE_DEPRECATED = "code-deprecated";
    String CODE_GRACE_PERIOD_EXPIRING = "code-grace-period-expiring";
    String CODE_GRACE_PERIOD_EXPIRED = "code-grace-period-expired";
}
