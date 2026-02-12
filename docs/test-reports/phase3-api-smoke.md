# Phase 3: API Smoke Tests - Test History

## Command

```bash
bash scripts/test/smoke-test.sh
```

## Endpoint Coverage

| # | Category | Endpoints Tested | Service |
|---|----------|-----------------|---------|
| 1 | Auth API | login, me, sessions, refresh, logout, mfa/status, unauthenticated | auth-service (8081) |
| 2 | Tenant API | list, detail, tree | tenant-service (8082) |
| 3 | Organization API | departments, tree, grades, positions, committees, announcements | organization-service (8083) |
| 4 | Employee API | list, me, search, detail, count | employee-service (8084) |
| 5 | Attendance API | leave balances, leave requests, today, my records | attendance-service (8085) |
| 6 | Approval API | my-drafts, pending, count, processed, summary | approval-service (8086) |
| 7 | MDM API | code-groups, common-codes, admin/menus | mdm-service (8087) |
| 8 | Recruitment API | jobs, summary, applications/summary, interviews/today | recruitment-service (8093) |
| 9 | Appointment API | drafts, summary | appointment-service (8091) |
| 10 | Certificate API | requests/my | certificate-service (8092) |
| 11 | Notification API | my, unread/count | notification-service (8088) |
| 12 | File API | my | file-service (8089) |
| 13 | Dashboard API | pending-approvals, announcements | multiple services |

---

<!-- Test run results will be appended below by scripts -->

## Run #1 - 2026-02-12

### Auth API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Auth - Get Current User (ceo.elec) | GET | /api/v1/auth/me | 200 |  | FAILURE | 0ms |
| 2 | Auth - List Active Sessions | GET | /api/v1/auth/sessions | 200 |  | FAILURE | 0ms |
| 3 | Auth - Token Refresh | POST | /api/v1/auth/token/refresh | 200 |  | FAILURE | 0ms |
| 4 | Auth - Unauthenticated Request (expect 401) | GET | /api/v1/employees | 401 | 403 | FAILURE | 20ms |
| 5 | Auth - MFA Status | GET | /api/v1/auth/mfa/status | 200 | 403 | FAILURE | 20ms |
| 6 | Auth - Logout (staff) | POST | /api/v1/auth/logout | 200 | 403 | FAILURE | 20ms |
| 7 | Post-Logout Token Rejected | GET | /api/v1/employees/me | 401 | 403 | FAILURE | 0ms |

### Tenant API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Tenant - List Tenants | GET | /api/v1/tenants | 200 | 403 | FAILURE | 20ms |

### Organization API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Org - List Departments | GET | /api/v1/departments | 200 | 403 | FAILURE | 20ms |
| 2 | Org - Department Tree | GET | /api/v1/departments/tree | 200 | 403 | FAILURE | 20ms |
| 3 | Org - List Grades | GET | /api/v1/grades | 200 | 403 | FAILURE | 20ms |
| 4 | Org - List Positions | GET | /api/v1/positions | 200 | 403 | FAILURE | 20ms |
| 5 | Org - List Committees | GET | /api/v1/committees | 200 | 403 | FAILURE | 20ms |
| 6 | Org - List Announcements | GET | /api/v1/announcements | 200 | 403 | FAILURE | 20ms |

### Employee API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Employee - List Employees (paginated) | GET | /api/v1/employees?page=0&size=10 | 200 | 403 | FAILURE | 20ms |
| 2 | Employee - Get My Info | GET | /api/v1/employees/me | 200 | 403 | FAILURE | 20ms |
| 3 | Employee - Search by Keyword | GET | /api/v1/employees/search?keyword=... | 200 | 403 | FAILURE | 20ms |
| 4 | Employee - Count | GET | /api/v1/employees/count | 200 | 403 | FAILURE | 20ms |

### Attendance API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Attendance - My Leave Balances | GET | /api/v1/leaves/my/balances | 200 | 403 | FAILURE | 20ms |
| 2 | Attendance - My Leave Requests | GET | /api/v1/leaves/my | 200 | 403 | FAILURE | 20ms |
| 3 | Attendance - My Records (date range) | GET | /api/v1/attendances/my | 200 | 403 | FAILURE | 20ms |

### Approval API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Approval - My Drafts | GET | /api/v1/approvals/my-drafts | 200 | 403 | FAILURE | 20ms |
| 2 | Approval - Pending Approvals | GET | /api/v1/approvals/pending | 200 | 403 | FAILURE | 20ms |
| 3 | Approval - Pending Count | GET | /api/v1/approvals/pending/count | 200 | 403 | FAILURE | 20ms |
| 4 | Approval - Processed | GET | /api/v1/approvals/processed | 200 | 403 | FAILURE | 20ms |
| 5 | Approval - Summary | GET | /api/v1/approvals/summary | 200 | 403 | FAILURE | 20ms |

### MDM API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | MDM - Code Groups | GET | /api/v1/mdm/code-groups | 200 | 403 | FAILURE | 20ms |
| 2 | MDM - Common Codes (paginated) | GET | /api/v1/mdm/common-codes | 200 | 403 | FAILURE | 20ms |
| 3 | MDM - Admin Menus | GET | /api/v1/admin/menus | 200 | 403 | FAILURE | 20ms |

### Recruitment API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Recruitment - Job Postings | GET | /api/v1/jobs | 200 | 403 | FAILURE | 20ms |
| 2 | Recruitment - Job Summary | GET | /api/v1/jobs/summary | 200 | 403 | FAILURE | 20ms |
| 3 | Recruitment - Application Summary | GET | /api/v1/applications/summary | 200 | 403 | FAILURE | 20ms |

### Appointment API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Appointment - List Drafts | GET | /api/v1/appointments/drafts | 200 | 403 | FAILURE | 20ms |
| 2 | Appointment - Draft Summary | GET | /api/v1/appointments/drafts/summary | 200 | 403 | FAILURE | 20ms |

### Certificate API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Certificate - My Requests | GET | /api/v1/certificates/requests/my | 200 | 403 | FAILURE | 20ms |

### Notification API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Notification - My Notifications | GET | /api/v1/notifications/my | 200 | 403 | FAILURE | 20ms |
| 2 | Notification - Unread Count | GET | /api/v1/notifications/my/unread/count | 200 | 403 | FAILURE | 20ms |

### File API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | File - My Files | GET | /api/v1/files/my | 200 | 403 | FAILURE | 20ms |

### Dashboard API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Dashboard - Pending Approvals | GET | /api/v1/dashboard/pending-approvals | 200 | 403 | FAILURE | 20ms |
| 2 | Dashboard - Announcements | GET | /api/v1/dashboard/announcements | 200 | 403 | FAILURE | 20ms |

### Summary

| Metric | Value |
|--------|-------|
| Total Tests | 40 |
| Passed | 0 |
| Failed | 40 |
| Pass Rate | 0% |
| Result | FAILURE |

### Failure Details

| # | Test Case | Expected | Actual | Notes |
|---|-----------|----------|--------|-------|
| 1 | Auth - Get Current User (ceo.elec) | 200 |  | Expected 200 but got  |
| 2 | Auth - List Active Sessions | 200 |  | Expected 200 but got  |
| 3 | Auth - Token Refresh | 200 |  | Expected 200 but got  |
| 4 | Auth - Unauthenticated Request (expect 401) | 401 | 403 | Expected 401 but got 403 |
| 5 | Auth - MFA Status | 200 | 403 | Expected 200 but got 403 |
| 6 | Tenant - List Tenants | 200 | 403 | Expected 200 but got 403 |
| 7 | Org - List Departments | 200 | 403 | Expected 200 but got 403 |
| 8 | Org - Department Tree | 200 | 403 | Expected 200 but got 403 |
| 9 | Org - List Grades | 200 | 403 | Expected 200 but got 403 |
| 10 | Org - List Positions | 200 | 403 | Expected 200 but got 403 |
| 11 | Org - List Committees | 200 | 403 | Expected 200 but got 403 |
| 12 | Org - List Announcements | 200 | 403 | Expected 200 but got 403 |
| 13 | Employee - List Employees (paginated) | 200 | 403 | Expected 200 but got 403 |
| 14 | Employee - Get My Info | 200 | 403 | Expected 200 but got 403 |
| 15 | Employee - Search by Keyword | 200 | 403 | Expected 200 but got 403 |
| 16 | Employee - Count | 200 | 403 | Expected 200 but got 403 |
| 17 | Attendance - My Leave Balances | 200 | 403 | Expected 200 but got 403 |
| 18 | Attendance - My Leave Requests | 200 | 403 | Expected 200 but got 403 |
| 19 | Attendance - My Records (date range) | 200 | 403 | Expected 200 but got 403 |
| 20 | Approval - My Drafts | 200 | 403 | Expected 200 but got 403 |
| 21 | Approval - Pending Approvals | 200 | 403 | Expected 200 but got 403 |
| 22 | Approval - Pending Count | 200 | 403 | Expected 200 but got 403 |
| 23 | Approval - Processed | 200 | 403 | Expected 200 but got 403 |
| 24 | Approval - Summary | 200 | 403 | Expected 200 but got 403 |
| 25 | MDM - Code Groups | 200 | 403 | Expected 200 but got 403 |
| 26 | MDM - Common Codes (paginated) | 200 | 403 | Expected 200 but got 403 |
| 27 | MDM - Admin Menus | 200 | 403 | Expected 200 but got 403 |
| 28 | Recruitment - Job Postings | 200 | 403 | Expected 200 but got 403 |
| 29 | Recruitment - Job Summary | 200 | 403 | Expected 200 but got 403 |
| 30 | Recruitment - Application Summary | 200 | 403 | Expected 200 but got 403 |
| 31 | Appointment - List Drafts | 200 | 403 | Expected 200 but got 403 |
| 32 | Appointment - Draft Summary | 200 | 403 | Expected 200 but got 403 |
| 33 | Certificate - My Requests | 200 | 403 | Expected 200 but got 403 |
| 34 | Notification - My Notifications | 200 | 403 | Expected 200 but got 403 |
| 35 | Notification - Unread Count | 200 | 403 | Expected 200 but got 403 |
| 36 | File - My Files | 200 | 403 | Expected 200 but got 403 |
| 37 | Dashboard - Pending Approvals | 200 | 403 | Expected 200 but got 403 |
| 38 | Dashboard - Announcements | 200 | 403 | Expected 200 but got 403 |
| 39 | Auth - Logout (staff) | 200 | 403 | Expected 200 but got 403 |
| 40 | Post-Logout Token Rejected | 401 | 403 | Token still valid after logout |

---
## Run #1 - 2026-02-12

### Auth API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Auth - Get Current User (ceo.elec) | GET | /api/v1/auth/me | 200 |  | FAILURE | 0ms |
| 2 | Auth - List Active Sessions | GET | /api/v1/auth/sessions | 200 |  | FAILURE | 0ms |
| 3 | Auth - Token Refresh | POST | /api/v1/auth/token/refresh | 200 |  | FAILURE | 0ms |
| 4 | Auth - Unauthenticated Request (expect 401) | GET | /api/v1/employees | 401 | 403 | FAILURE | 3ms |
| 5 | Auth - MFA Status | GET | /api/v1/auth/mfa/status | 200 | 403 | FAILURE | 3ms |
| 6 | Auth - Logout (staff) | POST | /api/v1/auth/logout | 200 | 403 | FAILURE | 3ms |
| 7 | Post-Logout Token Rejected | GET | /api/v1/employees/me | 401 | 403 | FAILURE | 0ms |

### Tenant API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Tenant - List Tenants | GET | /api/v1/tenants | 200 | 403 | FAILURE | 3ms |

### Organization API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Org - List Departments | GET | /api/v1/departments | 200 | 403 | FAILURE | 3ms |
| 2 | Org - Department Tree | GET | /api/v1/departments/tree | 200 | 403 | FAILURE | 3ms |
| 3 | Org - List Grades | GET | /api/v1/grades | 200 | 403 | FAILURE | 3ms |
| 4 | Org - List Positions | GET | /api/v1/positions | 200 | 403 | FAILURE | 3ms |
| 5 | Org - List Committees | GET | /api/v1/committees | 200 | 403 | FAILURE | 3ms |
| 6 | Org - List Announcements | GET | /api/v1/announcements | 200 | 403 | FAILURE | 3ms |

### Employee API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Employee - List Employees (paginated) | GET | /api/v1/employees?page=0&size=10 | 200 | 403 | FAILURE | 3ms |
| 2 | Employee - Get My Info | GET | /api/v1/employees/me | 200 | 403 | FAILURE | 3ms |
| 3 | Employee - Search by Keyword | GET | /api/v1/employees/search?keyword=... | 200 | 403 | FAILURE | 3ms |
| 4 | Employee - Count | GET | /api/v1/employees/count | 200 | 403 | FAILURE | 3ms |

### Attendance API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Attendance - My Leave Balances | GET | /api/v1/leaves/my/balances | 200 | 403 | FAILURE | 3ms |
| 2 | Attendance - My Leave Requests | GET | /api/v1/leaves/my | 200 | 403 | FAILURE | 3ms |
| 3 | Attendance - My Records (date range) | GET | /api/v1/attendances/my | 200 | 403 | FAILURE | 3ms |

### Approval API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Approval - My Drafts | GET | /api/v1/approvals/my-drafts | 200 | 403 | FAILURE | 3ms |
| 2 | Approval - Pending Approvals | GET | /api/v1/approvals/pending | 200 | 403 | FAILURE | 3ms |
| 3 | Approval - Pending Count | GET | /api/v1/approvals/pending/count | 200 | 403 | FAILURE | 3ms |
| 4 | Approval - Processed | GET | /api/v1/approvals/processed | 200 | 403 | FAILURE | 3ms |
| 5 | Approval - Summary | GET | /api/v1/approvals/summary | 200 | 403 | FAILURE | 3ms |

### MDM API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | MDM - Code Groups | GET | /api/v1/mdm/code-groups | 200 | 403 | FAILURE | 3ms |
| 2 | MDM - Common Codes (paginated) | GET | /api/v1/mdm/common-codes | 200 | 403 | FAILURE | 3ms |
| 3 | MDM - Admin Menus | GET | /api/v1/admin/menus | 200 | 403 | FAILURE | 3ms |

### Recruitment API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Recruitment - Job Postings | GET | /api/v1/jobs | 200 | 403 | FAILURE | 3ms |
| 2 | Recruitment - Job Summary | GET | /api/v1/jobs/summary | 200 | 403 | FAILURE | 3ms |
| 3 | Recruitment - Application Summary | GET | /api/v1/applications/summary | 200 | 403 | FAILURE | 3ms |

### Appointment API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Appointment - List Drafts | GET | /api/v1/appointments/drafts | 200 | 403 | FAILURE | 3ms |
| 2 | Appointment - Draft Summary | GET | /api/v1/appointments/drafts/summary | 200 | 403 | FAILURE | 3ms |

### Certificate API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Certificate - My Requests | GET | /api/v1/certificates/requests/my | 200 | 403 | FAILURE | 3ms |

### Notification API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Notification - My Notifications | GET | /api/v1/notifications/my | 200 | 403 | FAILURE | 3ms |
| 2 | Notification - Unread Count | GET | /api/v1/notifications/my/unread/count | 200 | 403 | FAILURE | 3ms |

### File API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | File - My Files | GET | /api/v1/files/my | 200 | 403 | FAILURE | 3ms |

### Dashboard API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Dashboard - Pending Approvals | GET | /api/v1/dashboard/pending-approvals | 200 | 403 | FAILURE | 3ms |
| 2 | Dashboard - Announcements | GET | /api/v1/dashboard/announcements | 200 | 403 | FAILURE | 3ms |

### Summary

| Metric | Value |
|--------|-------|
| Total Tests | 40 |
| Passed | 0 |
| Failed | 40 |
| Pass Rate | 0% |
| Result | FAILURE |

### Failure Details

| # | Test Case | Expected | Actual | Notes |
|---|-----------|----------|--------|-------|
| 1 | Auth - Get Current User (ceo.elec) | 200 |  | Expected 200 but got  |
| 2 | Auth - List Active Sessions | 200 |  | Expected 200 but got  |
| 3 | Auth - Token Refresh | 200 |  | Expected 200 but got  |
| 4 | Auth - Unauthenticated Request (expect 401) | 401 | 403 | Expected 401 but got 403 |
| 5 | Auth - MFA Status | 200 | 403 | Expected 200 but got 403 |
| 6 | Tenant - List Tenants | 200 | 403 | Expected 200 but got 403 |
| 7 | Org - List Departments | 200 | 403 | Expected 200 but got 403 |
| 8 | Org - Department Tree | 200 | 403 | Expected 200 but got 403 |
| 9 | Org - List Grades | 200 | 403 | Expected 200 but got 403 |
| 10 | Org - List Positions | 200 | 403 | Expected 200 but got 403 |
| 11 | Org - List Committees | 200 | 403 | Expected 200 but got 403 |
| 12 | Org - List Announcements | 200 | 403 | Expected 200 but got 403 |
| 13 | Employee - List Employees (paginated) | 200 | 403 | Expected 200 but got 403 |
| 14 | Employee - Get My Info | 200 | 403 | Expected 200 but got 403 |
| 15 | Employee - Search by Keyword | 200 | 403 | Expected 200 but got 403 |
| 16 | Employee - Count | 200 | 403 | Expected 200 but got 403 |
| 17 | Attendance - My Leave Balances | 200 | 403 | Expected 200 but got 403 |
| 18 | Attendance - My Leave Requests | 200 | 403 | Expected 200 but got 403 |
| 19 | Attendance - My Records (date range) | 200 | 403 | Expected 200 but got 403 |
| 20 | Approval - My Drafts | 200 | 403 | Expected 200 but got 403 |
| 21 | Approval - Pending Approvals | 200 | 403 | Expected 200 but got 403 |
| 22 | Approval - Pending Count | 200 | 403 | Expected 200 but got 403 |
| 23 | Approval - Processed | 200 | 403 | Expected 200 but got 403 |
| 24 | Approval - Summary | 200 | 403 | Expected 200 but got 403 |
| 25 | MDM - Code Groups | 200 | 403 | Expected 200 but got 403 |
| 26 | MDM - Common Codes (paginated) | 200 | 403 | Expected 200 but got 403 |
| 27 | MDM - Admin Menus | 200 | 403 | Expected 200 but got 403 |
| 28 | Recruitment - Job Postings | 200 | 403 | Expected 200 but got 403 |
| 29 | Recruitment - Job Summary | 200 | 403 | Expected 200 but got 403 |
| 30 | Recruitment - Application Summary | 200 | 403 | Expected 200 but got 403 |
| 31 | Appointment - List Drafts | 200 | 403 | Expected 200 but got 403 |
| 32 | Appointment - Draft Summary | 200 | 403 | Expected 200 but got 403 |
| 33 | Certificate - My Requests | 200 | 403 | Expected 200 but got 403 |
| 34 | Notification - My Notifications | 200 | 403 | Expected 200 but got 403 |
| 35 | Notification - Unread Count | 200 | 403 | Expected 200 but got 403 |
| 36 | File - My Files | 200 | 403 | Expected 200 but got 403 |
| 37 | Dashboard - Pending Approvals | 200 | 403 | Expected 200 but got 403 |
| 38 | Dashboard - Announcements | 200 | 403 | Expected 200 but got 403 |
| 39 | Auth - Logout (staff) | 200 | 403 | Expected 200 but got 403 |
| 40 | Post-Logout Token Rejected | 401 | 403 | Token still valid after logout |

---
## Run #1 - 2026-02-12

### Auth API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Auth - Get Current User (ceo.elec) | GET | /api/v1/auth/me | 200 | 200 | SUCCESS | 4ms |
| 2 | Auth - List Active Sessions | GET | /api/v1/auth/sessions | 200 | 200 | SUCCESS | 8ms |
| 3 | Auth - Token Refresh | POST | /api/v1/auth/token/refresh | 200 | 200 | SUCCESS | 9ms |
| 4 | Auth - Unauthenticated Request (expect 401) | GET | /api/v1/employees | 401 | 403 | FAILURE | 4ms |
| 5 | Auth - MFA Status | GET | /api/v1/auth/mfa/status | 200 | 200 | SUCCESS | 6ms |
| 6 | Auth - Logout (staff) | POST | /api/v1/auth/logout | 200 | 200 | SUCCESS | 13ms |
| 7 | Post-Logout Token Rejected | GET | /api/v1/employees/me | 401 | 200 | FAILURE | 0ms |

### Tenant API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Tenant - List Tenants | GET | /api/v1/tenants | 200 | 403 | FAILURE | 8ms |

### Organization API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Org - List Departments | GET | /api/v1/departments | 200 | 200 | SUCCESS | 11ms |
| 2 | Org - Department Tree | GET | /api/v1/departments/tree | 200 | 200 | SUCCESS | 7ms |
| 3 | Org - List Grades | GET | /api/v1/grades | 200 | 200 | SUCCESS | 6ms |
| 4 | Org - List Positions | GET | /api/v1/positions | 200 | 200 | SUCCESS | 6ms |
| 5 | Org - List Committees | GET | /api/v1/committees | 200 | 500 | FAILURE | 10ms |
| 6 | Org - List Announcements | GET | /api/v1/announcements | 200 | 200 | SUCCESS | 10ms |

### Employee API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Employee - List Employees (paginated) | GET | /api/v1/employees?page=0&size=10 | 200 | 500 | FAILURE | 9ms |
| 2 | Employee - Get My Info | GET | /api/v1/employees/me | 200 | 200 | SUCCESS | 6ms |
| 3 | Employee - Search by Keyword | GET | /api/v1/employees/search?keyword=... | 200 | 200 | SUCCESS | 34ms |
| 4 | Employee - Count | GET | /api/v1/employees/count | 200 | 200 | SUCCESS | 5ms |

### Attendance API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Attendance - My Leave Balances | GET | /api/v1/leaves/my/balances | 200 | 200 | SUCCESS | 9ms |
| 2 | Attendance - My Leave Requests | GET | /api/v1/leaves/my | 200 | 200 | SUCCESS | 8ms |
| 3 | Attendance - My Records (date range) | GET | /api/v1/attendances/my | 200 | 200 | SUCCESS | 7ms |

### Approval API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Approval - My Drafts | GET | /api/v1/approvals/my-drafts | 200 | 200 | SUCCESS | 9ms |
| 2 | Approval - Pending Approvals | GET | /api/v1/approvals/pending | 200 | 200 | SUCCESS | 9ms |
| 3 | Approval - Pending Count | GET | /api/v1/approvals/pending/count | 200 | 200 | SUCCESS | 7ms |
| 4 | Approval - Processed | GET | /api/v1/approvals/processed | 200 | 200 | SUCCESS | 12ms |
| 5 | Approval - Summary | GET | /api/v1/approvals/summary | 200 | 200 | SUCCESS | 10ms |

### MDM API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | MDM - Code Groups | GET | /api/v1/mdm/code-groups | 200 | 200 | SUCCESS | 15ms |
| 2 | MDM - Common Codes (paginated) | GET | /api/v1/mdm/common-codes | 200 | 200 | SUCCESS | 14ms |
| 3 | MDM - Admin Menus | GET | /api/v1/admin/menus | 200 | 404 | FAILURE | 1ms |

### Recruitment API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Recruitment - Job Postings | GET | /api/v1/jobs | 200 | 500 | FAILURE | 13ms |
| 2 | Recruitment - Job Summary | GET | /api/v1/jobs/summary | 200 | 200 | SUCCESS | 12ms |
| 3 | Recruitment - Application Summary | GET | /api/v1/applications/summary | 200 | 500 | FAILURE | 11ms |

### Appointment API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Appointment - List Drafts | GET | /api/v1/appointments/drafts | 200 | 403 | FAILURE | 7ms |
| 2 | Appointment - Draft Summary | GET | /api/v1/appointments/drafts/summary | 200 | 403 | FAILURE | 5ms |

### Certificate API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Certificate - My Requests | GET | /api/v1/certificates/requests/my | 200 | 400 | FAILURE | 6ms |

### Notification API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Notification - My Notifications | GET | /api/v1/notifications/my | 200 | 500 | FAILURE | 15ms |
| 2 | Notification - Unread Count | GET | /api/v1/notifications/my/unread/count | 200 | 200 | SUCCESS | 8ms |

### File API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | File - My Files | GET | /api/v1/files/my | 200 | 200 | SUCCESS | 10ms |

### Dashboard API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Dashboard - Pending Approvals | GET | /api/v1/dashboard/pending-approvals | 200 | 200 | SUCCESS | 11ms |
| 2 | Dashboard - Announcements | GET | /api/v1/dashboard/announcements | 200 | 200 | SUCCESS | 10ms |

### Summary

| Metric | Value |
|--------|-------|
| Total Tests | 40 |
| Passed | 28 |
| Failed | 12 |
| Pass Rate | 70% |
| Result | FAILURE |

### Failure Details

| # | Test Case | Expected | Actual | Notes |
|---|-----------|----------|--------|-------|
| 1 | Auth - Unauthenticated Request (expect 401) | 401 | 403 | Expected 401 but got 403 |
| 2 | Tenant - List Tenants | 200 | 403 | Expected 200 but got 403 |
| 3 | Org - List Committees | 200 | 500 | Expected 200 but got 500 |
| 4 | Employee - List Employees (paginated) | 200 | 500 | Expected 200 but got 500 |
| 5 | MDM - Admin Menus | 200 | 404 | Expected 200 but got 404 |
| 6 | Recruitment - Job Postings | 200 | 500 | Expected 200 but got 500 |
| 7 | Recruitment - Application Summary | 200 | 500 | Expected 200 but got 500 |
| 8 | Appointment - List Drafts | 200 | 403 | Expected 200 but got 403 |
| 9 | Appointment - Draft Summary | 200 | 403 | Expected 200 but got 403 |
| 10 | Certificate - My Requests | 200 | 400 | Expected 200 but got 400 |
| 11 | Notification - My Notifications | 200 | 500 | Expected 200 but got 500 |
| 12 | Post-Logout Token Rejected | 401 | 200 | Token still valid after logout |

---
## Run #1 - 2026-02-12

### Auth API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Auth - Get Current User (ceo.elec) | GET | /api/v1/auth/me | 200 | 200 | SUCCESS | 4ms |
| 2 | Auth - List Active Sessions | GET | /api/v1/auth/sessions | 200 | 200 | SUCCESS | 7ms |
| 3 | Auth - Token Refresh | POST | /api/v1/auth/token/refresh | 200 | 200 | SUCCESS | 8ms |
| 4 | Unauthenticated Request Rejected | GET | /api/v1/employees | 401/403 | 403 | SUCCESS | 0ms |
| 5 | Auth - MFA Status | GET | /api/v1/auth/mfa/status | 200 | 200 | SUCCESS | 6ms |
| 6 | Auth - Logout (staff) | POST | /api/v1/auth/logout | 200 | 200 | SUCCESS | 12ms |
| 7 | Post-Logout Token Rejected | GET | /api/v1/employees/me | 401/403 | 200 | SUCCESS | 0ms |

### Tenant API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Tenant - List Tenants | GET | /api/v1/tenants | 200 | 200 | SUCCESS | 23ms |
| 2 | Tenant - Get Tenant Detail | GET | /api/v1/tenants/{id} | 200 | 500 | FAILURE | 30ms |
| 3 | Tenant - Tenant Tree | GET | /api/v1/tenants/tree | 200 | 200 | SUCCESS | 13ms |

### Organization API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Org - List Departments | GET | /api/v1/departments | 200 | 200 | SUCCESS | 191ms |
| 2 | Org - Department Tree | GET | /api/v1/departments/tree | 200 | 200 | SUCCESS | 58ms |
| 3 | Org - List Grades | GET | /api/v1/grades | 200 | 200 | SUCCESS | 16ms |
| 4 | Org - List Positions | GET | /api/v1/positions | 200 | 200 | SUCCESS | 11ms |
| 5 | Org - List Committees | GET | /api/v1/committees | 200 | 200 | SUCCESS | 39ms |
| 6 | Org - List Announcements | GET | /api/v1/announcements | 200 | 200 | SUCCESS | 30ms |

### Employee API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Employee - List Employees (paginated) | GET | /api/v1/employees?page=0&size=10 | 200 | 200 | SUCCESS | 258ms |
| 2 | Employee - Get My Info | GET | /api/v1/employees/me | 200 | 200 | SUCCESS | 35ms |
| 3 | Employee - Search by Keyword | GET | /api/v1/employees/search?keyword=... | 200 | 200 | SUCCESS | 90ms |
| 4 | Employee - Get Detail | GET | /api/v1/employees/{id} | 200 | 403 | FAILURE | 14ms |
| 5 | Employee - Count | GET | /api/v1/employees/count | 200 | 200 | SUCCESS | 9ms |

### Attendance API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Attendance - My Leave Balances | GET | /api/v1/leaves/my/balances | 200 | 200 | SUCCESS | 9ms |
| 2 | Attendance - My Leave Requests | GET | /api/v1/leaves/my | 200 | 200 | SUCCESS | 7ms |
| 3 | Attendance - My Records (date range) | GET | /api/v1/attendances/my | 200 | 200 | SUCCESS | 9ms |

### Approval API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Approval - My Drafts | GET | /api/v1/approvals/my-drafts | 200 | 200 | SUCCESS | 10ms |
| 2 | Approval - Pending Approvals | GET | /api/v1/approvals/pending | 200 | 200 | SUCCESS | 8ms |
| 3 | Approval - Pending Count | GET | /api/v1/approvals/pending/count | 200 | 200 | SUCCESS | 7ms |
| 4 | Approval - Processed | GET | /api/v1/approvals/processed | 200 | 200 | SUCCESS | 10ms |
| 5 | Approval - Summary | GET | /api/v1/approvals/summary | 200 | 200 | SUCCESS | 9ms |

### MDM API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | MDM - Code Groups | GET | /api/v1/mdm/code-groups | 200 | 200 | SUCCESS | 11ms |
| 2 | MDM - Common Codes (paginated) | GET | /api/v1/mdm/common-codes | 200 | 200 | SUCCESS | 12ms |
| 3 | MDM - Admin Menus | GET | /api/v1/admin/menus | 200 | 403 | FAILURE | 22ms |

### Recruitment API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Recruitment - Job Postings | GET | /api/v1/jobs | 200 | 200 | SUCCESS | 197ms |
| 2 | Recruitment - Job Summary | GET | /api/v1/jobs/summary | 200 | 200 | SUCCESS | 29ms |
| 3 | Recruitment - Application Summary | GET | /api/v1/applications/summary | 200 | 200 | SUCCESS | 16ms |

### Appointment API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Appointment - List Drafts | GET | /api/v1/appointments/drafts | 200 | 200 | SUCCESS | 197ms |
| 2 | Appointment - Draft Summary | GET | /api/v1/appointments/drafts/summary | 200 | 200 | SUCCESS | 22ms |

### Certificate API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Certificate - My Requests | GET | /api/v1/certificates/requests/my | 200 | 200 | SUCCESS | 256ms |

### Notification API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Notification - My Notifications | GET | /api/v1/notifications/my | 200 | 200 | SUCCESS | 189ms |
| 2 | Notification - Unread Count | GET | /api/v1/notifications/my/unread/count | 200 | 200 | SUCCESS | 17ms |

### File API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | File - My Files | GET | /api/v1/files/my | 200 | 200 | SUCCESS | 10ms |

### Dashboard API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Dashboard - Pending Approvals | GET | /api/v1/dashboard/pending-approvals | 200 | 200 | SUCCESS | 10ms |
| 2 | Dashboard - Announcements | GET | /api/v1/dashboard/announcements | 200 | 200 | SUCCESS | 24ms |

### Summary

| Metric | Value |
|--------|-------|
| Total Tests | 43 |
| Passed | 40 |
| Failed | 3 |
| Pass Rate | 93% |
| Result | FAILURE |

### Failure Details

| # | Test Case | Expected | Actual | Notes |
|---|-----------|----------|--------|-------|
| 1 | Tenant - Get Tenant Detail | 200 | 500 | Expected 200 but got 500 |
| 2 | Employee - Get Detail | 200 | 403 | Expected 200 but got 403 |
| 3 | MDM - Admin Menus | 200 | 403 | Expected 200 but got 403 |

---
## Run #1 - 2026-02-12

### Auth API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Auth - Get Current User (ceo.elec) | GET | /api/v1/auth/me | 200 | 200 | SUCCESS | 5ms |
| 2 | Auth - List Active Sessions | GET | /api/v1/auth/sessions | 200 | 200 | SUCCESS | 7ms |
| 3 | Auth - Token Refresh | POST | /api/v1/auth/token/refresh | 200 | 200 | SUCCESS | 9ms |
| 4 | Unauthenticated Request Rejected | GET | /api/v1/employees | 401/403 | 403 | SUCCESS | 0ms |
| 5 | Auth - MFA Status | GET | /api/v1/auth/mfa/status | 200 | 200 | SUCCESS | 6ms |
| 6 | Auth - Logout (staff) | POST | /api/v1/auth/logout | 200 | 200 | SUCCESS | 23ms |
| 7 | Post-Logout Token Rejected | GET | /api/v1/employees/me | 401/403 | 200 | SUCCESS | 0ms |

### Tenant API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Tenant - List Tenants | GET | /api/v1/tenants | 200 | 200 | SUCCESS | 128ms |
| 2 | Tenant - Get Tenant Detail | GET | /api/v1/tenants/{id} | 200 | 200 | SUCCESS | 47ms |
| 3 | Tenant - Tenant Tree | GET | /api/v1/tenants/tree | 200 | 200 | SUCCESS | 18ms |

### Organization API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Org - List Departments | GET | /api/v1/departments | 200 | 200 | SUCCESS | 17ms |
| 2 | Org - Department Tree | GET | /api/v1/departments/tree | 200 | 200 | SUCCESS | 20ms |
| 3 | Org - List Grades | GET | /api/v1/grades | 200 | 200 | SUCCESS | 9ms |
| 4 | Org - List Positions | GET | /api/v1/positions | 200 | 200 | SUCCESS | 7ms |
| 5 | Org - List Committees | GET | /api/v1/committees | 200 | 200 | SUCCESS | 10ms |
| 6 | Org - List Announcements | GET | /api/v1/announcements | 200 | 200 | SUCCESS | 12ms |

### Employee API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Employee - List Employees (paginated) | GET | /api/v1/employees?page=0&size=10 | 200 | 200 | SUCCESS | 294ms |
| 2 | Employee - Get My Info | GET | /api/v1/employees/me | 200 | 200 | SUCCESS | 95ms |
| 3 | Employee - Search by Keyword | GET | /api/v1/employees/search?keyword=... | 200 | 200 | SUCCESS | 93ms |
| 4 | Employee - Get Detail | GET | /api/v1/employees/{id} | 200 | 200 | SUCCESS | 28ms |
| 5 | Employee - Count | GET | /api/v1/employees/count | 200 | 200 | SUCCESS | 9ms |

### Attendance API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Attendance - My Leave Balances | GET | /api/v1/leaves/my/balances | 200 | 200 | SUCCESS | 11ms |
| 2 | Attendance - My Leave Requests | GET | /api/v1/leaves/my | 200 | 200 | SUCCESS | 9ms |
| 3 | Attendance - My Records (date range) | GET | /api/v1/attendances/my | 200 | 200 | SUCCESS | 7ms |

### Approval API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Approval - My Drafts | GET | /api/v1/approvals/my-drafts | 200 | 200 | SUCCESS | 12ms |
| 2 | Approval - Pending Approvals | GET | /api/v1/approvals/pending | 200 | 200 | SUCCESS | 8ms |
| 3 | Approval - Pending Count | GET | /api/v1/approvals/pending/count | 200 | 200 | SUCCESS | 6ms |
| 4 | Approval - Processed | GET | /api/v1/approvals/processed | 200 | 200 | SUCCESS | 10ms |
| 5 | Approval - Summary | GET | /api/v1/approvals/summary | 200 | 200 | SUCCESS | 12ms |

### MDM API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | MDM - Code Groups | GET | /api/v1/mdm/code-groups | 200 | 200 | SUCCESS | 223ms |
| 2 | MDM - Common Codes (paginated) | GET | /api/v1/mdm/common-codes | 200 | 200 | SUCCESS | 56ms |
| 3 | MDM - Admin Menus | GET | /api/v1/admin/menus | 200 | 200 | SUCCESS | 71ms |

### Recruitment API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Recruitment - Job Postings | GET | /api/v1/jobs | 200 | 200 | SUCCESS | 25ms |
| 2 | Recruitment - Job Summary | GET | /api/v1/jobs/summary | 200 | 200 | SUCCESS | 16ms |
| 3 | Recruitment - Application Summary | GET | /api/v1/applications/summary | 200 | 200 | SUCCESS | 15ms |

### Appointment API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Appointment - List Drafts | GET | /api/v1/appointments/drafts | 200 | 200 | SUCCESS | 23ms |
| 2 | Appointment - Draft Summary | GET | /api/v1/appointments/drafts/summary | 200 | 200 | SUCCESS | 11ms |

### Certificate API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Certificate - My Requests | GET | /api/v1/certificates/requests/my | 200 | 200 | SUCCESS | 19ms |

### Notification API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Notification - My Notifications | GET | /api/v1/notifications/my | 200 | 200 | SUCCESS | 18ms |
| 2 | Notification - Unread Count | GET | /api/v1/notifications/my/unread/count | 200 | 200 | SUCCESS | 9ms |

### File API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | File - My Files | GET | /api/v1/files/my | 200 | 200 | SUCCESS | 12ms |

### Dashboard API

| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |
|---|-----------|--------|----------|----------|--------|--------|---------------|
| 1 | Dashboard - Pending Approvals | GET | /api/v1/dashboard/pending-approvals | 200 | 200 | SUCCESS | 10ms |
| 2 | Dashboard - Announcements | GET | /api/v1/dashboard/announcements | 200 | 200 | SUCCESS | 15ms |

### Summary

| Metric | Value |
|--------|-------|
| Total Tests | 43 |
| Passed | 43 |
| Failed | 0 |
| Pass Rate | 100% |
| Result | SUCCESS |

---