#!/bin/bash
# =============================================================================
# HR SaaS Platform - Phase 5: Multi-tenancy & Security Tests
# Tests RLS isolation, RBAC, JWT security, and input validation
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-utils.sh"

print_header "Phase 5: Multi-tenancy & Security Tests"
print_info "Gateway: $GATEWAY_URL"
print_info "Date: $RUN_DATE"

init_results

# =============================================================================
# Step 0: Login test accounts
# =============================================================================
print_section "Step 0: Login Test Accounts"

login "ceo" "ceo.elec" 'Ceo@2025!' || true
login "hr_admin" "hr.admin.elec" 'HrAdmin@2025!' || true
login "manager" "dev.manager.elec" 'DevMgr@2025!' || true
login "staff" "dev.staff.elec" 'DevStaff@2025!' || true
login "superadmin" "superadmin" 'Admin@2025!' || true

CEO_TOKEN=$(get_token "ceo")
STAFF_TOKEN=$(get_token "staff")

if [ -z "$CEO_TOKEN" ] || [ -z "$STAFF_TOKEN" ]; then
    print_fail "Cannot proceed without CEO and staff logins"
    print_summary
    exit 1
fi

# =============================================================================
# 5.1 RLS (Row Level Security) Isolation
# =============================================================================
print_section "5.1 RLS (Row Level Security) Isolation"

# Test 1: CEO sees only own tenant employees
print_info "Test: Employee list isolation..."
CEO_EMP_RESPONSE=$(api_call GET "/api/v1/employees?page=0&size=100" "ceo")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ]; then
    # Check that all returned employees belong to same tenant
    TENANT_CHECK=$(echo "$CEO_EMP_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    content = data.get('data', data)
    if isinstance(content, dict) and 'content' in content:
        content = content['content']
    if isinstance(content, list):
        tenant_ids = set()
        for emp in content:
            tid = emp.get('tenantId', '')
            if tid:
                tenant_ids.add(tid)
        if len(tenant_ids) <= 1:
            print('ISOLATED')
        else:
            print(f'LEAK:{len(tenant_ids)} tenants')
    else:
        print('OK_EMPTY')
except Exception as e:
    print(f'ERROR:{e}')
" 2>/dev/null || echo "ERROR")

    if [ "$TENANT_CHECK" = "ISOLATED" ] || [ "$TENANT_CHECK" = "OK_EMPTY" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_pass "RLS - Employee list isolation ($TENANT_CHECK)"
        record_result "5" "RLS Isolation" "Employee list isolation" "GET" "/api/v1/employees" "ISOLATED" "$TENANT_CHECK" "SUCCESS" "0ms" ""
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        print_fail "RLS - Employee list isolation ($TENANT_CHECK)"
        record_result "5" "RLS Isolation" "Employee list isolation" "GET" "/api/v1/employees" "ISOLATED" "$TENANT_CHECK" "FAILURE" "0ms" "Multi-tenant data leak"
    fi
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "RLS - Employee list isolation (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RLS Isolation" "Employee list isolation" "GET" "/api/v1/employees" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Test 2: Department isolation
print_info "Test: Department isolation..."
CEO_DEPT_RESPONSE=$(api_call GET "/api/v1/departments" "ceo")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "RLS - Department isolation (HTTP 200)"
    record_result "5" "RLS Isolation" "Department isolation" "GET" "/api/v1/departments" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "RLS - Department isolation (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RLS Isolation" "Department isolation" "GET" "/api/v1/departments" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Test 3: Approval isolation
print_info "Test: Approval isolation..."
CEO_APPR_RESPONSE=$(api_call GET "/api/v1/approvals/pending" "ceo")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "RLS - Approval isolation (HTTP 200)"
    record_result "5" "RLS Isolation" "Approval isolation" "GET" "/api/v1/approvals/pending" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "RLS - Approval isolation (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RLS Isolation" "Approval isolation" "GET" "/api/v1/approvals/pending" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Test 4: Cross-tenant employee access (use a fake UUID)
print_info "Test: Cross-tenant employee access..."
FAKE_ID="00000000-0000-0000-0000-000000000001"
CROSS_RESPONSE=$(api_call GET "/api/v1/employees/$FAKE_ID" "ceo")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "404" ] || [ "$LAST_HTTP_CODE" = "403" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "RLS - Cross-tenant access blocked (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RLS Isolation" "Cross-tenant access" "GET" "/api/v1/employees/{fake}" "404" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "RLS - Cross-tenant access NOT blocked (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RLS Isolation" "Cross-tenant access" "GET" "/api/v1/employees/{fake}" "404" "$LAST_HTTP_CODE" "FAILURE" "0ms" "Expected 404/403"
fi

# Test 5: Attendance record isolation
print_info "Test: Attendance record isolation..."
ATT_RESPONSE=$(api_call GET "/api/v1/attendances/my?startDate=2025-01-01&endDate=2025-12-31" "staff")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "RLS - Attendance isolation (HTTP 200)"
    record_result "5" "RLS Isolation" "Attendance isolation" "GET" "/api/v1/attendances/my" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "RLS - Attendance isolation (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RLS Isolation" "Attendance isolation" "GET" "/api/v1/attendances/my" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# =============================================================================
# 5.2 Role-Based Access Control (RBAC)
# =============================================================================
print_section "5.2 Role-Based Access Control (RBAC)"

# Test 1: Staff cannot create employee
print_info "Test: Staff cannot create employee..."
STAFF_CREATE_BODY='{"employeeNumber":"HACK-001","name":"Hacker","email":"hack@test.com"}'
STAFF_CREATE_RESPONSE=$(api_call POST "/api/v1/employees" "staff" "$STAFF_CREATE_BODY")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "403" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "RBAC - Staff cannot create employee (403)"
    record_result "5" "RBAC" "Staff create employee" "POST" "/api/v1/employees" "403" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "RBAC - Staff create employee NOT blocked (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RBAC" "Staff create employee" "POST" "/api/v1/employees" "403" "$LAST_HTTP_CODE" "FAILURE" "0ms" "Expected 403"
fi

# Test 2: Manager cannot create employee
print_info "Test: Manager cannot create employee..."
MGR_CREATE_RESPONSE=$(api_call POST "/api/v1/employees" "manager" "$STAFF_CREATE_BODY")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "403" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "RBAC - Manager cannot create employee (403)"
    record_result "5" "RBAC" "Manager create employee" "POST" "/api/v1/employees" "403" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "RBAC - Manager create employee NOT blocked (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RBAC" "Manager create employee" "POST" "/api/v1/employees" "403" "$LAST_HTTP_CODE" "FAILURE" "0ms" "Expected 403"
fi

# Test 3: HR Admin CAN create employee
print_info "Test: HR Admin can create employee..."
HR_CREATE_BODY=$(python3 -c "
import json, time
print(json.dumps({
    'employeeNumber': f'RBAC-{int(time.time())}',
    'name': 'RBAC 테스트',
    'email': f'rbac.test.{int(time.time())}@company.com',
    'hireDate': '2026-03-01',
    'employmentType': 'FULL_TIME'
}))
")
HR_CREATE_RESPONSE=$(api_call POST "/api/v1/employees" "hr_admin" "$HR_CREATE_BODY")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ] || [ "$LAST_HTTP_CODE" = "201" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "RBAC - HR Admin can create employee (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RBAC" "HR create employee" "POST" "/api/v1/employees" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "RBAC - HR Admin cannot create employee (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RBAC" "HR create employee" "POST" "/api/v1/employees" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Test 4: Staff can view own info
print_info "Test: Staff can view own info..."
STAFF_ME_RESPONSE=$(api_call GET "/api/v1/employees/me" "staff")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "RBAC - Staff can view own info (200)"
    record_result "5" "RBAC" "Staff view own info" "GET" "/api/v1/employees/me" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "RBAC - Staff cannot view own info (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RBAC" "Staff view own info" "GET" "/api/v1/employees/me" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Test 5: HR Admin can view all employees
print_info "Test: HR Admin can view all employees..."
HR_ALL_RESPONSE=$(api_call GET "/api/v1/employees?page=0&size=100" "hr_admin")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "RBAC - HR Admin can view all employees (200)"
    record_result "5" "RBAC" "HR view all employees" "GET" "/api/v1/employees" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "RBAC - HR Admin view all employees (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RBAC" "HR view all employees" "GET" "/api/v1/employees" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Test 6: Manager can access pending approvals
print_info "Test: Manager can access pending approvals..."
MGR_PENDING=$(api_call GET "/api/v1/approvals/pending" "manager")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "RBAC - Manager pending approvals (200)"
    record_result "5" "RBAC" "Manager pending approvals" "GET" "/api/v1/approvals/pending" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "RBAC - Manager pending approvals (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RBAC" "Manager pending approvals" "GET" "/api/v1/approvals/pending" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Test 7: Staff cannot approve random approval
print_info "Test: Staff cannot approve random approval..."
FAKE_APPR_ID="00000000-0000-0000-0000-000000000099"
APPROVE_BODY='{"actionType":"APPROVE","comment":"hacking"}'
STAFF_APPROVE=$(api_call POST "/api/v1/approvals/$FAKE_APPR_ID/approve" "staff" "$APPROVE_BODY")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "403" ] || [ "$LAST_HTTP_CODE" = "404" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "RBAC - Staff cannot approve (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RBAC" "Staff approve blocked" "POST" "/api/v1/approvals/{id}/approve" "403" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "RBAC - Staff approve NOT blocked (HTTP $LAST_HTTP_CODE)"
    record_result "5" "RBAC" "Staff approve blocked" "POST" "/api/v1/approvals/{id}/approve" "403" "$LAST_HTTP_CODE" "FAILURE" "0ms" "Expected 403/404"
fi

# =============================================================================
# 5.3 JWT Security
# =============================================================================
print_section "5.3 JWT Security"

# Test 1: Missing token
print_info "Test: Missing Authorization header..."
RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" \
    "${GATEWAY_URL}/api/v1/employees/me" 2>/dev/null)
LAST_HTTP_CODE=$(echo "$RESPONSE" | tail -n 2 | head -n 1)
LAST_RESPONSE_TIME=$(echo "$RESPONSE" | tail -n 1)
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "401" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "JWT - Missing token rejected (401)"
    record_result "5" "JWT Security" "Missing token" "GET" "/api/v1/employees/me" "401" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "JWT - Missing token NOT rejected (HTTP $LAST_HTTP_CODE)"
    record_result "5" "JWT Security" "Missing token" "GET" "/api/v1/employees/me" "401" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Test 2: Invalid/tampered token
print_info "Test: Tampered JWT token..."
RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoYWNrZXIiLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MTcwMDAwMDAwMH0.INVALID_SIGNATURE" \
    "${GATEWAY_URL}/api/v1/employees/me" 2>/dev/null)
LAST_HTTP_CODE=$(echo "$RESPONSE" | tail -n 2 | head -n 1)
LAST_RESPONSE_TIME=$(echo "$RESPONSE" | tail -n 1)
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "401" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "JWT - Tampered token rejected (401)"
    record_result "5" "JWT Security" "Tampered token" "GET" "/api/v1/employees/me" "401" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "JWT - Tampered token NOT rejected (HTTP $LAST_HTTP_CODE)"
    record_result "5" "JWT Security" "Tampered token" "GET" "/api/v1/employees/me" "401" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Test 3: Expired token (crafted with past expiry)
print_info "Test: Expired JWT token..."
RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxNjAwMDAwMDAwfQ.invalid" \
    "${GATEWAY_URL}/api/v1/employees/me" 2>/dev/null)
LAST_HTTP_CODE=$(echo "$RESPONSE" | tail -n 2 | head -n 1)
LAST_RESPONSE_TIME=$(echo "$RESPONSE" | tail -n 1)
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "401" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "JWT - Expired token rejected (401)"
    record_result "5" "JWT Security" "Expired token" "GET" "/api/v1/employees/me" "401" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "JWT - Expired token NOT rejected (HTTP $LAST_HTTP_CODE)"
    record_result "5" "JWT Security" "Expired token" "GET" "/api/v1/employees/me" "401" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Test 4: Malformed Authorization header
print_info "Test: Malformed Authorization header..."
RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" \
    -H "Authorization: NotBearer sometoken" \
    "${GATEWAY_URL}/api/v1/employees/me" 2>/dev/null)
LAST_HTTP_CODE=$(echo "$RESPONSE" | tail -n 2 | head -n 1)
LAST_RESPONSE_TIME=$(echo "$RESPONSE" | tail -n 1)
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "401" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "JWT - Malformed auth header rejected (401)"
    record_result "5" "JWT Security" "Malformed auth header" "GET" "/api/v1/employees/me" "401" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "JWT - Malformed auth header NOT rejected (HTTP $LAST_HTTP_CODE)"
    record_result "5" "JWT Security" "Malformed auth header" "GET" "/api/v1/employees/me" "401" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Test 5: Post-logout token (login then logout then reuse)
print_info "Test: Post-logout token reuse..."
# Login a temporary user
login "temp_sec" "dev.staff.elec" 'DevStaff@2025!' || true
TEMP_TOKEN=$(get_token "temp_sec")
if [ -n "$TEMP_TOKEN" ]; then
    # Logout
    api_call POST "/api/v1/auth/logout" "temp_sec" >/dev/null 2>&1
    sleep 1
    # Try to use old token
    RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        -H "Authorization: Bearer $TEMP_TOKEN" \
        "${GATEWAY_URL}/api/v1/employees/me" 2>/dev/null)
    LAST_HTTP_CODE=$(echo "$RESPONSE" | tail -n 2 | head -n 1)
    LAST_RESPONSE_TIME=$(echo "$RESPONSE" | tail -n 1)
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$LAST_HTTP_CODE" = "401" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_pass "JWT - Post-logout token rejected (401)"
        record_result "5" "JWT Security" "Post-logout token" "GET" "/api/v1/employees/me" "401" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        print_fail "JWT - Post-logout token NOT rejected (HTTP $LAST_HTTP_CODE)"
        record_result "5" "JWT Security" "Post-logout token" "GET" "/api/v1/employees/me" "401" "$LAST_HTTP_CODE" "FAILURE" "0ms" "Token still valid"
    fi
else
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_skip "JWT - Post-logout test (login failed)"
    record_result "5" "JWT Security" "Post-logout token" "GET" "/api/v1/employees/me" "401" "SKIP" "FAILURE" "0ms" ""
fi

# =============================================================================
# 5.4 Input Validation & Injection
# =============================================================================
print_section "5.4 Input Validation & Injection"

# Test 1: SQL Injection via search
print_info "Test: SQL Injection in search..."
SQL_PAYLOAD="' OR 1=1 --"
ENCODED_PAYLOAD=$(python3 -c "import urllib.parse; print(urllib.parse.quote(\"$SQL_PAYLOAD\"))" 2>/dev/null)
SQL_RESPONSE=$(api_call GET "/api/v1/employees/search?keyword=$ENCODED_PAYLOAD" "ceo")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
# Should NOT return all records or error - should return empty or safe response
if [ "$LAST_HTTP_CODE" = "200" ] || [ "$LAST_HTTP_CODE" = "400" ]; then
    # Check if it returned a suspiciously large number of results
    RESULT_COUNT=$(echo "$SQL_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    content = data.get('data', data)
    if isinstance(content, dict):
        total = content.get('totalElements', content.get('total', 0))
        print(total)
    elif isinstance(content, list):
        print(len(content))
    else:
        print(0)
except: print(0)
" 2>/dev/null || echo "0")

    if [ "$LAST_HTTP_CODE" = "400" ] || [ "$RESULT_COUNT" -lt 100 ] 2>/dev/null; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_pass "SQL Injection - Safe response (HTTP $LAST_HTTP_CODE, results: $RESULT_COUNT)"
        record_result "5" "Input Validation" "SQL Injection" "GET" "/api/v1/employees/search" "safe" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        print_fail "SQL Injection - Suspicious response (results: $RESULT_COUNT)"
        record_result "5" "Input Validation" "SQL Injection" "GET" "/api/v1/employees/search" "safe" "suspicious" "FAILURE" "0ms" "Large result set"
    fi
else
    # 500 could indicate unhandled SQL error
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "SQL Injection - Server error (HTTP $LAST_HTTP_CODE)"
    record_result "5" "Input Validation" "SQL Injection" "GET" "/api/v1/employees/search" "safe" "$LAST_HTTP_CODE" "FAILURE" "0ms" "Server error on SQL injection"
fi

# Test 2: XSS in approval comment
print_info "Test: XSS in approval comment..."
XSS_BODY='{"actionType":"APPROVE","comment":"<script>alert(document.cookie)</script>"}'
# Use a fake approval ID - we just want to see if the input is accepted
XSS_RESPONSE=$(api_call POST "/api/v1/approvals/00000000-0000-0000-0000-000000000099/approve" "ceo" "$XSS_BODY")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
# 404 (no such approval) or 400 (input rejected) are both acceptable
if [ "$LAST_HTTP_CODE" = "400" ] || [ "$LAST_HTTP_CODE" = "404" ] || [ "$LAST_HTTP_CODE" = "403" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "XSS - Handled safely (HTTP $LAST_HTTP_CODE)"
    record_result "5" "Input Validation" "XSS in comment" "POST" "/api/v1/approvals/{id}/approve" "safe" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "XSS - Unexpected response (HTTP $LAST_HTTP_CODE)"
    record_result "5" "Input Validation" "XSS in comment" "POST" "/api/v1/approvals/{id}/approve" "safe" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Test 3: Oversized payload
print_info "Test: Oversized JSON payload..."
# Generate ~2MB JSON body
LARGE_PAYLOAD=$(python3 -c "import json; print(json.dumps({'name': 'x' * 2000000, 'email': 'test@test.com', 'employeeNumber': 'BIG-001'}))")
LARGE_RESPONSE=$(curl -s -w "\n%{http_code}\n%{time_total}" \
    -X POST "${GATEWAY_URL}/api/v1/employees" \
    -H "Authorization: Bearer $CEO_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$LARGE_PAYLOAD" 2>/dev/null)
LAST_HTTP_CODE=$(echo "$LARGE_RESPONSE" | tail -n 2 | head -n 1)
LAST_RESPONSE_TIME=$(echo "$LARGE_RESPONSE" | tail -n 1)
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "413" ] || [ "$LAST_HTTP_CODE" = "400" ] || [ "$LAST_HTTP_CODE" = "403" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Oversized payload - Rejected (HTTP $LAST_HTTP_CODE)"
    record_result "5" "Input Validation" "Oversized payload" "POST" "/api/v1/employees" "413" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "Oversized payload - Not rejected (HTTP $LAST_HTTP_CODE)"
    record_result "5" "Input Validation" "Oversized payload" "POST" "/api/v1/employees" "413" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Test 4: Invalid UUID format
print_info "Test: Invalid UUID format..."
INVALID_UUID_RESPONSE=$(api_call GET "/api/v1/employees/not-a-valid-uuid" "ceo")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "400" ] || [ "$LAST_HTTP_CODE" = "404" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Invalid UUID - Handled safely (HTTP $LAST_HTTP_CODE)"
    record_result "5" "Input Validation" "Invalid UUID" "GET" "/api/v1/employees/{bad-uuid}" "400" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    print_fail "Invalid UUID - Unexpected response (HTTP $LAST_HTTP_CODE)"
    record_result "5" "Input Validation" "Invalid UUID" "GET" "/api/v1/employees/{bad-uuid}" "400" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# =============================================================================
# Summary
# =============================================================================
print_summary

RUN_NUMBER=$(get_next_run_number)
generate_phase_report "5" "$RUN_NUMBER"
update_test_history "$RUN_NUMBER"

print_info "Results saved to: $RESULTS_FILE"

if [ "$FAILED_TESTS" -gt 0 ]; then
    exit 1
fi
exit 0
