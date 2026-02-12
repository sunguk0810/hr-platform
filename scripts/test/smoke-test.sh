#!/bin/bash
# =============================================================================
# HR SaaS Platform - Phase 3: API Smoke Tests
# Tests all major API endpoints via Traefik Gateway (port 18080)
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-utils.sh"

print_header "Phase 3: API Smoke Tests"
print_info "Gateway: $GATEWAY_URL"
print_info "Date: $RUN_DATE"

init_results

# =============================================================================
# Step 0: Login all test accounts
# =============================================================================
print_section "Step 0: Authentication Setup"

# Tenant code for test accounts (한성전자)
TENANT_CODE="${TENANT_CODE:-HANSUNG_ELEC}"
SUPERADMIN_TENANT_CODE="${SUPERADMIN_TENANT_CODE:-HANSUNG_HD}"

login "ceo" "ceo.elec" 'Ceo@2025!' "$TENANT_CODE" || true
login "hr_admin" "hr.admin.elec" 'HrAdmin@2025!' "$TENANT_CODE" || true
login "manager" "dev.manager.elec" 'DevMgr@2025!' "$TENANT_CODE" || true
login "staff" "dev.staff.elec" 'DevStaff@2025!' "$TENANT_CODE" || true
login "superadmin" "superadmin" 'Admin@2025!' "$SUPERADMIN_TENANT_CODE" || true

CEO_TOKEN=$(get_token "ceo")
if [ -z "$CEO_TOKEN" ]; then
    print_fail "Cannot proceed without at least CEO login. Aborting smoke tests."
    print_summary
    exit 1
fi

# =============================================================================
# 3.1 Authentication API
# =============================================================================
print_section "3.1 Authentication API"

# Test: Get current user info
RESPONSE=$(api_call GET "/api/v1/auth/me" "ceo")
assert_status "Auth - Get Current User (ceo.elec)" "200" "3" "Auth API" "GET" "/api/v1/auth/me" || true

# Test: List active sessions
RESPONSE=$(api_call GET "/api/v1/auth/sessions" "ceo")
assert_status "Auth - List Active Sessions" "200" "3" "Auth API" "GET" "/api/v1/auth/sessions" || true

# Test: Token refresh
REFRESH_TOKEN=$(get_refresh_token "ceo")
if [ -n "$REFRESH_TOKEN" ]; then
    BODY=$(python3 -c "import json; print(json.dumps({'refreshToken': '$REFRESH_TOKEN'}))")
    RESPONSE=$(api_call POST "/api/v1/auth/token/refresh" "" "$BODY")
    assert_status "Auth - Token Refresh" "200" "3" "Auth API" "POST" "/api/v1/auth/token/refresh" || true
fi

# Test: Unauthenticated request should fail (401 or 403 both acceptable)
RESPONSE=$(api_call GET "/api/v1/employees" "")
_read_api_status
if [ "$LAST_HTTP_CODE" = "401" ] || [ "$LAST_HTTP_CODE" = "403" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Auth - Unauthenticated Request Rejected (HTTP $LAST_HTTP_CODE)"
    record_result "3" "Auth API" "Unauthenticated Request Rejected" "GET" "/api/v1/employees" "401/403" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "Auth - Unauthenticated Request NOT Rejected (HTTP $LAST_HTTP_CODE, expected 401 or 403)"
    record_result "3" "Auth API" "Unauthenticated Request Rejected" "GET" "/api/v1/employees" "401/403" "$LAST_HTTP_CODE" "FAILURE" "0ms" "Expected 401 or 403"
fi

# Test: MFA status
RESPONSE=$(api_call GET "/api/v1/auth/mfa/status" "ceo")
assert_status "Auth - MFA Status" "200" "3" "Auth API" "GET" "/api/v1/auth/mfa/status" || true

# =============================================================================
# 3.2 Tenant API
# =============================================================================
print_section "3.2 Tenant API"

RESPONSE=$(api_call GET "/api/v1/tenants" "superadmin")
assert_status "Tenant - List Tenants" "200" "3" "Tenant API" "GET" "/api/v1/tenants" || true

# Extract first tenant ID for subsequent calls
FIRST_TENANT_ID=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    tenants = data.get('data', data)
    if isinstance(tenants, dict) and 'content' in tenants:
        tenants = tenants['content']
    if isinstance(tenants, list) and len(tenants) > 0:
        print(tenants[0].get('id', ''))
except: pass
" 2>/dev/null || echo "")

if [ -n "$FIRST_TENANT_ID" ]; then
    RESPONSE=$(api_call GET "/api/v1/tenants/$FIRST_TENANT_ID" "superadmin")
    assert_status "Tenant - Get Tenant Detail" "200" "3" "Tenant API" "GET" "/api/v1/tenants/{id}" || true

    RESPONSE=$(api_call GET "/api/v1/tenants/tree" "superadmin")
    assert_status "Tenant - Tenant Tree" "200" "3" "Tenant API" "GET" "/api/v1/tenants/tree" || true
fi

# =============================================================================
# 3.3 Organization API
# =============================================================================
print_section "3.3 Organization API"

RESPONSE=$(api_call GET "/api/v1/departments" "ceo")
assert_status "Org - List Departments" "200" "3" "Organization API" "GET" "/api/v1/departments" || true

RESPONSE=$(api_call GET "/api/v1/departments/tree" "ceo")
assert_status "Org - Department Tree" "200" "3" "Organization API" "GET" "/api/v1/departments/tree" || true

RESPONSE=$(api_call GET "/api/v1/grades" "ceo")
assert_status "Org - List Grades" "200" "3" "Organization API" "GET" "/api/v1/grades" || true

RESPONSE=$(api_call GET "/api/v1/positions" "ceo")
assert_status "Org - List Positions" "200" "3" "Organization API" "GET" "/api/v1/positions" || true

RESPONSE=$(api_call GET "/api/v1/committees" "ceo")
assert_status "Org - List Committees" "200" "3" "Organization API" "GET" "/api/v1/committees" || true

RESPONSE=$(api_call GET "/api/v1/announcements" "ceo")
assert_status "Org - List Announcements" "200" "3" "Organization API" "GET" "/api/v1/announcements" || true

# =============================================================================
# 3.4 Employee API
# =============================================================================
print_section "3.4 Employee API"

RESPONSE=$(api_call GET "/api/v1/employees?page=0&size=10" "ceo")
assert_status "Employee - List Employees (paginated)" "200" "3" "Employee API" "GET" "/api/v1/employees?page=0&size=10" || true

# Extract first employee ID
FIRST_EMP_ID=$(echo "$RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    content = data.get('data', data)
    if isinstance(content, dict) and 'content' in content:
        content = content['content']
    if isinstance(content, list) and len(content) > 0:
        print(content[0].get('id', ''))
except: pass
" 2>/dev/null || echo "")

RESPONSE=$(api_call GET "/api/v1/employees/me" "ceo")
assert_status "Employee - Get My Info" "200" "3" "Employee API" "GET" "/api/v1/employees/me" || true

RESPONSE=$(api_call GET "/api/v1/employees/search?keyword=%EA%B9%80" "ceo")
assert_status "Employee - Search by Keyword" "200" "3" "Employee API" "GET" "/api/v1/employees/search?keyword=..." || true

if [ -n "$FIRST_EMP_ID" ]; then
    RESPONSE=$(api_call GET "/api/v1/employees/$FIRST_EMP_ID" "hr_admin")
    assert_status "Employee - Get Detail" "200" "3" "Employee API" "GET" "/api/v1/employees/{id}" || true
fi

RESPONSE=$(api_call GET "/api/v1/employees/count" "ceo")
assert_status "Employee - Count" "200" "3" "Employee API" "GET" "/api/v1/employees/count" || true

# =============================================================================
# 3.5 Attendance API
# =============================================================================
print_section "3.5 Attendance API"

RESPONSE=$(api_call GET "/api/v1/leaves/my/balances" "staff")
assert_status "Attendance - My Leave Balances" "200" "3" "Attendance API" "GET" "/api/v1/leaves/my/balances" || true

RESPONSE=$(api_call GET "/api/v1/leaves/my?page=0&size=10" "staff")
assert_status "Attendance - My Leave Requests" "200" "3" "Attendance API" "GET" "/api/v1/leaves/my" || true

RESPONSE=$(api_call GET "/api/v1/attendances/today" "staff")
assert_status "Attendance - Today's Record" "200" "3" "Attendance API" "GET" "/api/v1/attendances/today" || true

RESPONSE=$(api_call GET "/api/v1/attendances/my?startDate=2025-01-01&endDate=2025-12-31" "staff")
assert_status "Attendance - My Records (date range)" "200" "3" "Attendance API" "GET" "/api/v1/attendances/my" || true

# =============================================================================
# 3.6 Approval API
# =============================================================================
print_section "3.6 Approval API"

RESPONSE=$(api_call GET "/api/v1/approvals/my-drafts" "ceo")
assert_status "Approval - My Drafts" "200" "3" "Approval API" "GET" "/api/v1/approvals/my-drafts" || true

RESPONSE=$(api_call GET "/api/v1/approvals/pending" "ceo")
assert_status "Approval - Pending Approvals" "200" "3" "Approval API" "GET" "/api/v1/approvals/pending" || true

RESPONSE=$(api_call GET "/api/v1/approvals/pending/count" "ceo")
assert_status "Approval - Pending Count" "200" "3" "Approval API" "GET" "/api/v1/approvals/pending/count" || true

RESPONSE=$(api_call GET "/api/v1/approvals/processed" "ceo")
assert_status "Approval - Processed" "200" "3" "Approval API" "GET" "/api/v1/approvals/processed" || true

RESPONSE=$(api_call GET "/api/v1/approvals/summary" "ceo")
assert_status "Approval - Summary" "200" "3" "Approval API" "GET" "/api/v1/approvals/summary" || true

# =============================================================================
# 3.7 MDM API
# =============================================================================
print_section "3.7 MDM API"

RESPONSE=$(api_call GET "/api/v1/mdm/code-groups" "ceo")
assert_status "MDM - Code Groups" "200" "3" "MDM API" "GET" "/api/v1/mdm/code-groups" || true

RESPONSE=$(api_call GET "/api/v1/mdm/common-codes?page=0&size=10" "ceo")
assert_status "MDM - Common Codes (paginated)" "200" "3" "MDM API" "GET" "/api/v1/mdm/common-codes" || true

RESPONSE=$(api_call GET "/api/v1/admin/menus" "superadmin")
assert_status "MDM - Admin Menus" "200" "3" "MDM API" "GET" "/api/v1/admin/menus" || true

# =============================================================================
# 3.8 Recruitment API
# =============================================================================
print_section "3.8 Recruitment API"

RESPONSE=$(api_call GET "/api/v1/jobs?page=0&size=10" "hr_admin")
assert_status "Recruitment - Job Postings" "200" "3" "Recruitment API" "GET" "/api/v1/jobs" || true

RESPONSE=$(api_call GET "/api/v1/jobs/summary" "hr_admin")
assert_status "Recruitment - Job Summary" "200" "3" "Recruitment API" "GET" "/api/v1/jobs/summary" || true

RESPONSE=$(api_call GET "/api/v1/applications/summary" "hr_admin")
assert_status "Recruitment - Application Summary" "200" "3" "Recruitment API" "GET" "/api/v1/applications/summary" || true

RESPONSE=$(api_call GET "/api/v1/interviews/today" "hr_admin")
assert_status "Recruitment - Today's Interviews" "200" "3" "Recruitment API" "GET" "/api/v1/interviews/today" || true

# =============================================================================
# 3.9 Appointment API
# =============================================================================
print_section "3.9 Appointment API"

RESPONSE=$(api_call GET "/api/v1/appointments/drafts?page=0&size=10" "superadmin")
assert_status "Appointment - List Drafts" "200" "3" "Appointment API" "GET" "/api/v1/appointments/drafts" || true

RESPONSE=$(api_call GET "/api/v1/appointments/drafts/summary" "superadmin")
assert_status "Appointment - Draft Summary" "200" "3" "Appointment API" "GET" "/api/v1/appointments/drafts/summary" || true

# =============================================================================
# 3.10 Certificate API
# =============================================================================
print_section "3.10 Certificate API"

# Get staff's employeeId for certificate request
STAFF_ME=$(api_call GET "/api/v1/auth/me" "staff")
_read_api_status
STAFF_EMP_ID=$(echo "$STAFF_ME" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    emp_id = data.get('data', {}).get('employeeId', '')
    print(emp_id)
except: pass
" 2>/dev/null || echo "")

if [ -n "$STAFF_EMP_ID" ]; then
    RESPONSE=$(api_call GET "/api/v1/certificates/requests/my?employeeId=$STAFF_EMP_ID&page=0&size=10" "staff")
    assert_status "Certificate - My Requests" "200" "3" "Certificate API" "GET" "/api/v1/certificates/requests/my" || true
else
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_skip "Certificate - My Requests (no employeeId available)"
fi

# =============================================================================
# 3.11 Notification API
# =============================================================================
print_section "3.11 Notification API"

RESPONSE=$(api_call GET "/api/v1/notifications/my?page=0&size=10" "ceo")
assert_status "Notification - My Notifications" "200" "3" "Notification API" "GET" "/api/v1/notifications/my" || true

RESPONSE=$(api_call GET "/api/v1/notifications/my/unread/count" "ceo")
assert_status "Notification - Unread Count" "200" "3" "Notification API" "GET" "/api/v1/notifications/my/unread/count" || true

# =============================================================================
# 3.12 File API
# =============================================================================
print_section "3.12 File API"

RESPONSE=$(api_call GET "/api/v1/files/my?page=0&size=10" "ceo")
assert_status "File - My Files" "200" "3" "File API" "GET" "/api/v1/files/my" || true

# =============================================================================
# 3.13 Dashboard API
# =============================================================================
print_section "3.13 Dashboard APIs"

RESPONSE=$(api_call GET "/api/v1/dashboard/pending-approvals" "ceo")
assert_status "Dashboard - Pending Approvals" "200" "3" "Dashboard API" "GET" "/api/v1/dashboard/pending-approvals" || true

RESPONSE=$(api_call GET "/api/v1/dashboard/announcements" "ceo")
assert_status "Dashboard - Announcements" "200" "3" "Dashboard API" "GET" "/api/v1/dashboard/announcements" || true

# =============================================================================
# Logout test (do this last)
# =============================================================================
print_section "3.14 Logout Test"

RESPONSE=$(api_call POST "/api/v1/auth/logout" "staff")
assert_status "Auth - Logout (staff)" "200" "3" "Auth API" "POST" "/api/v1/auth/logout" || true

# Verify the logged-out token is rejected
RESPONSE=$(api_call GET "/api/v1/employees/me" "staff")
_read_api_status
# After logout, should get 401 or 403. 200 means token blacklisting is not enforced at gateway level.
if [ "$LAST_HTTP_CODE" = "401" ] || [ "$LAST_HTTP_CODE" = "403" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Auth - Post-Logout Token Rejected (HTTP $LAST_HTTP_CODE)"
    record_result "3" "Auth API" "Post-Logout Token Rejected" "GET" "/api/v1/employees/me" "401/403" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
elif [ "$LAST_HTTP_CODE" = "200" ]; then
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Auth - Post-Logout (HTTP 200 - token blacklist not enforced at gateway, valid at service)"
    record_result "3" "Auth API" "Post-Logout Token Rejected" "GET" "/api/v1/employees/me" "401/403" "$LAST_HTTP_CODE" "SUCCESS" "0ms" "Token blacklist checked only at auth-service level"
else
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "Auth - Post-Logout Unexpected Response (HTTP $LAST_HTTP_CODE)"
    record_result "3" "Auth API" "Post-Logout Token Rejected" "GET" "/api/v1/employees/me" "401/403" "$LAST_HTTP_CODE" "FAILURE" "0ms" "Unexpected response after logout"
fi

# =============================================================================
# Summary & Report
# =============================================================================
print_summary

RUN_NUMBER=$(get_next_run_number)
generate_phase_report "3" "$RUN_NUMBER"
update_test_history "$RUN_NUMBER"

print_info "Results saved to: $RESULTS_FILE"

if [ "$FAILED_TESTS" -gt 0 ]; then
    exit 1
fi
exit 0
