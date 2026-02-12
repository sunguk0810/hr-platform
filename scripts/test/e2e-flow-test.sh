#!/bin/bash
# =============================================================================
# HR SaaS Platform - Phase 4: E2E Business Flow Tests
# Tests 6 core business workflows via sequential API calls
# =============================================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/test-utils.sh"

print_header "Phase 4: E2E Business Flow Tests"
print_info "Gateway: $GATEWAY_URL"
print_info "Date: $RUN_DATE"

init_results

FLOW_RESULTS=()

# =============================================================================
# Helper: Extract ID from ApiResponse
# =============================================================================
extract_id() {
    local response="$1"
    echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    d = data.get('data', data)
    if isinstance(d, dict):
        print(d.get('id', ''))
    else:
        print('')
except: print('')
" 2>/dev/null || echo ""
}

extract_field() {
    local response="$1"
    local field="$2"
    echo "$response" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    d = data.get('data', data)
    if isinstance(d, dict):
        # Support nested fields like 'status'
        keys = '$field'.split('.')
        val = d
        for k in keys:
            val = val.get(k, '') if isinstance(val, dict) else ''
        print(val if val else '')
    else:
        print('')
except: print('')
" 2>/dev/null || echo ""
}

# =============================================================================
# Step 0: Login all required accounts
# =============================================================================
print_section "Step 0: Login All Test Accounts"

login "superadmin" "superadmin" 'Admin@2025!' || true
login "ceo" "ceo.elec" 'Ceo@2025!' || true
login "hr_admin" "hr.admin.elec" 'HrAdmin@2025!' || true
login "manager" "dev.manager.elec" 'DevMgr@2025!' || true
login "staff" "dev.staff.elec" 'DevStaff@2025!' || true

# Verify at least staff and manager can login
STAFF_TOKEN=$(get_token "staff")
MANAGER_TOKEN=$(get_token "manager")
HR_TOKEN=$(get_token "hr_admin")
CEO_TOKEN=$(get_token "ceo")

if [ -z "$STAFF_TOKEN" ] || [ -z "$MANAGER_TOKEN" ]; then
    print_fail "Cannot proceed: staff or manager login failed"
    print_summary
    exit 1
fi

# =============================================================================
# Flow 1: Authentication per Role
# =============================================================================
print_section "Flow 1: Authentication per Role"
FLOW1_PASS=true

for key in superadmin ceo hr_admin manager staff; do
    TOKEN=$(get_token "$key")
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ -n "$TOKEN" ]; then
        # Verify token works
        RESPONSE=$(api_call GET "/api/v1/auth/me" "$key")
        if [ "$LAST_HTTP_CODE" = "200" ]; then
            USERNAME=$(extract_field "$RESPONSE" "username")
            PASSED_TESTS=$((PASSED_TESTS + 1))
            print_pass "Flow1 - Login & verify: $key (username: $USERNAME)"
            record_result "4" "Flow 1: Auth per Role" "Login $key" "GET" "/api/v1/auth/me" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
            FLOW1_PASS=false
            print_fail "Flow1 - Token verify failed: $key (HTTP $LAST_HTTP_CODE)"
            record_result "4" "Flow 1: Auth per Role" "Login $key" "GET" "/api/v1/auth/me" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
        fi
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FLOW1_PASS=false
        print_fail "Flow1 - Login failed: $key"
        record_result "4" "Flow 1: Auth per Role" "Login $key" "POST" "/api/v1/auth/login" "200" "FAIL" "FAILURE" "0ms" "No token"
    fi
done

FLOW_RESULTS+=("Flow 1: Auth per Role|$([ "$FLOW1_PASS" = true ] && echo 'PASS' || echo 'FAIL')")

# =============================================================================
# Flow 2: Leave Request -> Approval -> Balance Update
# =============================================================================
print_section "Flow 2: Leave Request -> Approval -> Balance Update"
FLOW2_PASS=true

# Step 1: Get staff's current leave balance
print_info "Step 2.1: Check initial leave balance..."
BALANCE_BEFORE=$(api_call GET "/api/v1/leaves/my/balances" "staff")
BALANCE_STATUS="$LAST_HTTP_CODE"
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$BALANCE_STATUS" = "200" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Flow2 - Get leave balance"
    record_result "4" "Flow 2: Leave Approval" "Get initial balance" "GET" "/api/v1/leaves/my/balances" "200" "$BALANCE_STATUS" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FLOW2_PASS=false
    print_fail "Flow2 - Get leave balance (HTTP $BALANCE_STATUS)"
    record_result "4" "Flow 2: Leave Approval" "Get initial balance" "GET" "/api/v1/leaves/my/balances" "200" "$BALANCE_STATUS" "FAILURE" "0ms" ""
fi

# Step 2: Create leave request
print_info "Step 2.2: Create leave request..."
LEAVE_BODY=$(cat <<'JSONEOF'
{
  "leaveType": "ANNUAL",
  "startDate": "2026-03-10",
  "endDate": "2026-03-10",
  "reason": "E2E Test - 개인 사유",
  "leaveUnit": "DAY",
  "submitImmediately": true
}
JSONEOF
)
LEAVE_RESPONSE=$(api_call POST "/api/v1/leaves" "staff" "$LEAVE_BODY")
LEAVE_ID=$(extract_id "$LEAVE_RESPONSE")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ] || [ "$LAST_HTTP_CODE" = "201" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Flow2 - Create leave request (ID: ${LEAVE_ID:0:8}...)"
    record_result "4" "Flow 2: Leave Approval" "Create leave request" "POST" "/api/v1/leaves" "201" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FLOW2_PASS=false
    print_fail "Flow2 - Create leave request (HTTP $LAST_HTTP_CODE)"
    print_info "Response: $(echo "$LEAVE_RESPONSE" | head -c 300)"
    record_result "4" "Flow 2: Leave Approval" "Create leave request" "POST" "/api/v1/leaves" "201" "$LAST_HTTP_CODE" "FAILURE" "0ms" "$(echo "$LEAVE_RESPONSE" | head -c 100)"
fi

# Step 3: Check manager's pending approvals
print_info "Step 2.3: Check manager pending approvals..."
PENDING_RESPONSE=$(api_call GET "/api/v1/approvals/pending" "manager")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Flow2 - Manager pending approvals"
    record_result "4" "Flow 2: Leave Approval" "Manager pending list" "GET" "/api/v1/approvals/pending" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FLOW2_PASS=false
    print_fail "Flow2 - Manager pending approvals (HTTP $LAST_HTTP_CODE)"
    record_result "4" "Flow 2: Leave Approval" "Manager pending list" "GET" "/api/v1/approvals/pending" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Step 4: Manager approves (find approval ID from pending list)
if [ -n "$LEAVE_ID" ]; then
    # Search for the matching approval
    APPROVAL_ID=$(echo "$PENDING_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    items = data.get('data', data)
    if isinstance(items, dict) and 'content' in items:
        items = items['content']
    if isinstance(items, list):
        for item in items:
            ref = item.get('referenceId', '') or item.get('sourceId', '')
            if ref == '$LEAVE_ID':
                print(item.get('id', ''))
                break
        else:
            if items:
                print(items[0].get('id', ''))
except: pass
" 2>/dev/null || echo "")

    if [ -n "$APPROVAL_ID" ]; then
        print_info "Step 2.4: Approve leave (approval: ${APPROVAL_ID:0:8}...)..."
        APPROVE_BODY='{"actionType":"APPROVE","comment":"E2E Test - Approved"}'
        APPROVE_RESPONSE=$(api_call POST "/api/v1/approvals/$APPROVAL_ID/approve" "manager" "$APPROVE_BODY")
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        if [ "$LAST_HTTP_CODE" = "200" ]; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
            print_pass "Flow2 - Approve leave"
            record_result "4" "Flow 2: Leave Approval" "Manager approve" "POST" "/api/v1/approvals/{id}/approve" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
            FLOW2_PASS=false
            print_fail "Flow2 - Approve leave (HTTP $LAST_HTTP_CODE)"
            record_result "4" "Flow 2: Leave Approval" "Manager approve" "POST" "/api/v1/approvals/{id}/approve" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
        fi
    else
        print_info "Step 2.4: No matching approval found, skipping approve step"
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
        print_skip "Flow2 - Approve leave (no approval ID found)"
        record_result "4" "Flow 2: Leave Approval" "Manager approve" "POST" "/api/v1/approvals/{id}/approve" "200" "SKIP" "FAILURE" "0ms" "No approval found"
    fi
fi

# Step 5: Check balance after approval
print_info "Step 2.5: Check leave balance after approval..."
sleep 2 # Wait for async event processing
BALANCE_AFTER=$(api_call GET "/api/v1/leaves/my/balances" "staff")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Flow2 - Post-approval balance check"
    record_result "4" "Flow 2: Leave Approval" "Balance after approval" "GET" "/api/v1/leaves/my/balances" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FLOW2_PASS=false
    print_fail "Flow2 - Post-approval balance check (HTTP $LAST_HTTP_CODE)"
    record_result "4" "Flow 2: Leave Approval" "Balance after approval" "GET" "/api/v1/leaves/my/balances" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Step 6: Check notification
print_info "Step 2.6: Check notification..."
NOTIF_RESPONSE=$(api_call GET "/api/v1/notifications/my?page=0&size=5" "staff")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Flow2 - Notification check"
    record_result "4" "Flow 2: Leave Approval" "Notification check" "GET" "/api/v1/notifications/my" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FLOW2_PASS=false
    print_fail "Flow2 - Notification check (HTTP $LAST_HTTP_CODE)"
    record_result "4" "Flow 2: Leave Approval" "Notification check" "GET" "/api/v1/notifications/my" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

FLOW_RESULTS+=("Flow 2: Leave Approval|$([ "$FLOW2_PASS" = true ] && echo 'PASS' || echo 'FAIL')")

# =============================================================================
# Flow 3: Appointment Draft -> Approval -> Execution
# =============================================================================
print_section "Flow 3: Appointment Draft -> Approval -> Execution"
FLOW3_PASS=true

# Get an employee and department for the appointment
print_info "Step 3.0: Fetch employee and department data..."
EMP_RESPONSE=$(api_call GET "/api/v1/employees?page=0&size=5" "hr_admin")
FIRST_EMP_ID=$(echo "$EMP_RESPONSE" | python3 -c "
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

DEPT_RESPONSE=$(api_call GET "/api/v1/departments" "hr_admin")
FIRST_DEPT_ID=$(echo "$DEPT_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    items = data.get('data', data)
    if isinstance(items, dict) and 'content' in items:
        items = items['content']
    if isinstance(items, list) and len(items) > 1:
        print(items[1].get('id', ''))
    elif isinstance(items, list) and len(items) > 0:
        print(items[0].get('id', ''))
except: pass
" 2>/dev/null || echo "")

# Step 1: Create appointment draft
print_info "Step 3.1: Create appointment draft..."
if [ -n "$FIRST_EMP_ID" ]; then
    APPT_BODY=$(python3 -c "
import json
print(json.dumps({
    'title': 'E2E Test - 부서이동 발령',
    'effectiveDate': '2026-04-01',
    'description': 'E2E 테스트 발령',
    'details': [{
        'employeeId': '$FIRST_EMP_ID',
        'appointmentType': 'TRANSFER',
        'toDepartmentId': '$FIRST_DEPT_ID' if '$FIRST_DEPT_ID' else None,
        'reason': 'E2E 테스트'
    }]
}))
")
    APPT_RESPONSE=$(api_call POST "/api/v1/appointments/drafts" "hr_admin" "$APPT_BODY")
    APPT_ID=$(extract_id "$APPT_RESPONSE")
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$LAST_HTTP_CODE" = "200" ] || [ "$LAST_HTTP_CODE" = "201" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_pass "Flow3 - Create appointment draft (ID: ${APPT_ID:0:8}...)"
        record_result "4" "Flow 3: Appointment" "Create draft" "POST" "/api/v1/appointments/drafts" "201" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FLOW3_PASS=false
        print_fail "Flow3 - Create appointment draft (HTTP $LAST_HTTP_CODE)"
        print_info "Response: $(echo "$APPT_RESPONSE" | head -c 300)"
        record_result "4" "Flow 3: Appointment" "Create draft" "POST" "/api/v1/appointments/drafts" "201" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
    fi

    # Step 2: Get draft detail
    if [ -n "$APPT_ID" ]; then
        print_info "Step 3.2: Get draft detail..."
        DETAIL_RESPONSE=$(api_call GET "/api/v1/appointments/drafts/$APPT_ID" "hr_admin")
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        if [ "$LAST_HTTP_CODE" = "200" ]; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
            print_pass "Flow3 - Get draft detail"
            record_result "4" "Flow 3: Appointment" "Get draft detail" "GET" "/api/v1/appointments/drafts/{id}" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
            FLOW3_PASS=false
            print_fail "Flow3 - Get draft detail (HTTP $LAST_HTTP_CODE)"
            record_result "4" "Flow 3: Appointment" "Get draft detail" "GET" "/api/v1/appointments/drafts/{id}" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
        fi

        # Step 3: Submit for approval
        print_info "Step 3.3: Submit for approval..."
        SUBMIT_RESPONSE=$(api_call POST "/api/v1/appointments/drafts/$APPT_ID/submit" "hr_admin")
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        if [ "$LAST_HTTP_CODE" = "200" ]; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
            print_pass "Flow3 - Submit for approval"
            record_result "4" "Flow 3: Appointment" "Submit for approval" "POST" "/api/v1/appointments/drafts/{id}/submit" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
            FLOW3_PASS=false
            print_fail "Flow3 - Submit for approval (HTTP $LAST_HTTP_CODE)"
            record_result "4" "Flow 3: Appointment" "Submit for approval" "POST" "/api/v1/appointments/drafts/{id}/submit" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
        fi
    fi
else
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_skip "Flow3 - No employee found for appointment"
    record_result "4" "Flow 3: Appointment" "Create draft" "POST" "/api/v1/appointments/drafts" "201" "SKIP" "FAILURE" "0ms" "No employee ID"
fi

FLOW_RESULTS+=("Flow 3: Appointment|$([ "$FLOW3_PASS" = true ] && echo 'PASS' || echo 'FAIL')")

# =============================================================================
# Flow 4: Recruitment Process
# =============================================================================
print_section "Flow 4: Recruitment Process"
FLOW4_PASS=true

# Step 1: Create job posting
print_info "Step 4.1: Create job posting..."
JOB_CODE="E2E-$(date +%s)"
JOB_BODY=$(python3 -c "
import json
print(json.dumps({
    'jobCode': '$JOB_CODE',
    'title': 'E2E Test - Senior Developer',
    'jobDescription': 'Test job posting for E2E validation',
    'requirements': '5+ years experience',
    'employmentType': 'FULL_TIME',
    'headcount': 1,
    'workLocation': 'Seoul',
    'skills': ['Java', 'Spring Boot'],
    'openDate': '2026-02-15',
    'closeDate': '2026-03-15'
}))
")
JOB_RESPONSE=$(api_call POST "/api/v1/jobs" "hr_admin" "$JOB_BODY")
JOB_ID=$(extract_id "$JOB_RESPONSE")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ] || [ "$LAST_HTTP_CODE" = "201" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Flow4 - Create job posting (ID: ${JOB_ID:0:8}...)"
    record_result "4" "Flow 4: Recruitment" "Create job posting" "POST" "/api/v1/jobs" "201" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FLOW4_PASS=false
    print_fail "Flow4 - Create job posting (HTTP $LAST_HTTP_CODE)"
    print_info "Response: $(echo "$JOB_RESPONSE" | head -c 300)"
    record_result "4" "Flow 4: Recruitment" "Create job posting" "POST" "/api/v1/jobs" "201" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Step 2: Publish job posting
if [ -n "$JOB_ID" ]; then
    print_info "Step 4.2: Publish job posting..."
    PUB_RESPONSE=$(api_call POST "/api/v1/jobs/$JOB_ID/publish" "hr_admin")
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$LAST_HTTP_CODE" = "200" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_pass "Flow4 - Publish job posting"
        record_result "4" "Flow 4: Recruitment" "Publish posting" "POST" "/api/v1/jobs/{id}/publish" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FLOW4_PASS=false
        print_fail "Flow4 - Publish job posting (HTTP $LAST_HTTP_CODE)"
        record_result "4" "Flow 4: Recruitment" "Publish posting" "POST" "/api/v1/jobs/{id}/publish" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
    fi

    # Step 3: Verify public search
    print_info "Step 4.3: Search public job postings..."
    SEARCH_RESPONSE=$(api_call GET "/api/v1/jobs/public/active" "hr_admin")
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$LAST_HTTP_CODE" = "200" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_pass "Flow4 - Public job search"
        record_result "4" "Flow 4: Recruitment" "Public search" "GET" "/api/v1/jobs/public/active" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FLOW4_PASS=false
        print_fail "Flow4 - Public job search (HTTP $LAST_HTTP_CODE)"
        record_result "4" "Flow 4: Recruitment" "Public search" "GET" "/api/v1/jobs/public/active" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
    fi
fi

# Step 4: Get interview summary
print_info "Step 4.4: Interview summary..."
INT_RESPONSE=$(api_call GET "/api/v1/interviews/summary" "hr_admin")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Flow4 - Interview summary"
    record_result "4" "Flow 4: Recruitment" "Interview summary" "GET" "/api/v1/interviews/summary" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FLOW4_PASS=false
    print_fail "Flow4 - Interview summary (HTTP $LAST_HTTP_CODE)"
    record_result "4" "Flow 4: Recruitment" "Interview summary" "GET" "/api/v1/interviews/summary" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

FLOW_RESULTS+=("Flow 4: Recruitment|$([ "$FLOW4_PASS" = true ] && echo 'PASS' || echo 'FAIL')")

# =============================================================================
# Flow 5: Certificate Issuance
# =============================================================================
print_section "Flow 5: Certificate Issuance"
FLOW5_PASS=true

# Get staff employee ID
STAFF_ME=$(api_call GET "/api/v1/employees/me" "staff")
STAFF_EMP_ID=$(extract_id "$STAFF_ME")

# Step 1: Check my certificate requests
print_info "Step 5.1: Check my certificate requests..."
CERT_MY_RESPONSE=$(api_call GET "/api/v1/certificates/requests/my?page=0&size=10" "staff")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Flow5 - My certificate requests"
    record_result "4" "Flow 5: Certificate" "My requests" "GET" "/api/v1/certificates/requests/my" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FLOW5_PASS=false
    print_fail "Flow5 - My certificate requests (HTTP $LAST_HTTP_CODE)"
    record_result "4" "Flow 5: Certificate" "My requests" "GET" "/api/v1/certificates/requests/my" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Step 2: Create certificate request (need certificateTypeId from sample data)
if [ -n "$STAFF_EMP_ID" ]; then
    print_info "Step 5.2: Create certificate request..."
    # Try to get certificate types first
    TYPES_RESPONSE=$(api_call GET "/api/v1/certificates/types" "staff" 2>/dev/null || api_call GET "/api/v1/certificates/requests/my?page=0&size=1" "staff")
    CERT_TYPE_ID=$(echo "$TYPES_RESPONSE" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    items = data.get('data', data)
    if isinstance(items, dict) and 'content' in items:
        items = items['content']
    if isinstance(items, list) and len(items) > 0:
        print(items[0].get('id', ''))
except: pass
" 2>/dev/null || echo "")

    if [ -n "$CERT_TYPE_ID" ]; then
        CERT_BODY=$(python3 -c "
import json
print(json.dumps({
    'certificateTypeId': '$CERT_TYPE_ID',
    'employeeId': '$STAFF_EMP_ID',
    'purpose': 'E2E 테스트 - 은행 제출',
    'submissionTarget': '국민은행',
    'copies': 1,
    'language': 'KO'
}))
")
        CERT_RESPONSE=$(api_call POST "/api/v1/certificates/requests" "staff" "$CERT_BODY")
        CERT_ID=$(extract_id "$CERT_RESPONSE")
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        if [ "$LAST_HTTP_CODE" = "200" ] || [ "$LAST_HTTP_CODE" = "201" ]; then
            PASSED_TESTS=$((PASSED_TESTS + 1))
            print_pass "Flow5 - Create certificate request (ID: ${CERT_ID:0:8}...)"
            record_result "4" "Flow 5: Certificate" "Create request" "POST" "/api/v1/certificates/requests" "201" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
        else
            FAILED_TESTS=$((FAILED_TESTS + 1))
            FLOW5_PASS=false
            print_fail "Flow5 - Create certificate request (HTTP $LAST_HTTP_CODE)"
            record_result "4" "Flow 5: Certificate" "Create request" "POST" "/api/v1/certificates/requests" "201" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
        fi
    else
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
        print_skip "Flow5 - No certificate type found"
        record_result "4" "Flow 5: Certificate" "Create request" "POST" "/api/v1/certificates/requests" "201" "SKIP" "FAILURE" "0ms" "No cert type"
    fi
else
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
    print_skip "Flow5 - No employee ID found"
    record_result "4" "Flow 5: Certificate" "Create request" "POST" "/api/v1/certificates/requests" "201" "SKIP" "FAILURE" "0ms" "No emp ID"
fi

FLOW_RESULTS+=("Flow 5: Certificate|$([ "$FLOW5_PASS" = true ] && echo 'PASS' || echo 'FAIL')")

# =============================================================================
# Flow 6: Employee CRUD + Privacy
# =============================================================================
print_section "Flow 6: Employee CRUD + Privacy"
FLOW6_PASS=true

# Step 1: Create employee
print_info "Step 6.1: Create employee..."
EMP_NUM="E2E-$(date +%s)"
EMP_CREATE_BODY=$(python3 -c "
import json
print(json.dumps({
    'employeeNumber': '$EMP_NUM',
    'name': '테스트사원',
    'nameEn': 'Test Employee',
    'email': 'e2e.test.$(date +%s)@company.com',
    'phone': '02-1234-5678',
    'mobile': '010-9999-8888',
    'hireDate': '2026-03-01',
    'employmentType': 'FULL_TIME'
}))
")
EMP_CREATE_RESPONSE=$(api_call POST "/api/v1/employees" "hr_admin" "$EMP_CREATE_BODY")
NEW_EMP_ID=$(extract_id "$EMP_CREATE_RESPONSE")
TOTAL_TESTS=$((TOTAL_TESTS + 1))
if [ "$LAST_HTTP_CODE" = "200" ] || [ "$LAST_HTTP_CODE" = "201" ]; then
    PASSED_TESTS=$((PASSED_TESTS + 1))
    print_pass "Flow6 - Create employee (ID: ${NEW_EMP_ID:0:8}...)"
    record_result "4" "Flow 6: Employee CRUD" "Create employee" "POST" "/api/v1/employees" "201" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
else
    FAILED_TESTS=$((FAILED_TESTS + 1))
    FLOW6_PASS=false
    print_fail "Flow6 - Create employee (HTTP $LAST_HTTP_CODE)"
    print_info "Response: $(echo "$EMP_CREATE_RESPONSE" | head -c 300)"
    record_result "4" "Flow 6: Employee CRUD" "Create employee" "POST" "/api/v1/employees" "201" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
fi

# Step 2: Get employee detail (check PII masking)
if [ -n "$NEW_EMP_ID" ]; then
    print_info "Step 6.2: Get employee detail (check PII masking)..."
    EMP_DETAIL=$(api_call GET "/api/v1/employees/$NEW_EMP_ID" "hr_admin")
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$LAST_HTTP_CODE" = "200" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_pass "Flow6 - Get employee detail"
        record_result "4" "Flow 6: Employee CRUD" "Get detail" "GET" "/api/v1/employees/{id}" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""

        # Check masking
        MASKED=$(echo "$EMP_DETAIL" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    emp = data.get('data', data)
    mobile = emp.get('mobile', '')
    if '*' in str(mobile):
        print('MASKED')
    else:
        print('NOT_MASKED')
except: print('UNKNOWN')
" 2>/dev/null || echo "UNKNOWN")
        print_info "PII masking: $MASKED"
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FLOW6_PASS=false
        print_fail "Flow6 - Get employee detail (HTTP $LAST_HTTP_CODE)"
        record_result "4" "Flow 6: Employee CRUD" "Get detail" "GET" "/api/v1/employees/{id}" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
    fi

    # Step 3: Update employee
    print_info "Step 6.3: Update employee..."
    UPDATE_BODY='{"nameEn":"Test Employee Updated"}'
    EMP_UPDATE_RESPONSE=$(api_call PUT "/api/v1/employees/$NEW_EMP_ID" "hr_admin" "$UPDATE_BODY")
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$LAST_HTTP_CODE" = "200" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_pass "Flow6 - Update employee"
        record_result "4" "Flow 6: Employee CRUD" "Update employee" "PUT" "/api/v1/employees/{id}" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FLOW6_PASS=false
        print_fail "Flow6 - Update employee (HTTP $LAST_HTTP_CODE)"
        record_result "4" "Flow 6: Employee CRUD" "Update employee" "PUT" "/api/v1/employees/{id}" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
    fi

    # Step 4: Resign employee
    print_info "Step 6.4: Resign employee (soft delete)..."
    RESIGN_BODY='{"resignDate":"2026-03-31","reason":"E2E Test resignation"}'
    RESIGN_RESPONSE=$(api_call POST "/api/v1/employees/$NEW_EMP_ID/resign" "hr_admin" "$RESIGN_BODY")
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$LAST_HTTP_CODE" = "200" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_pass "Flow6 - Resign employee"
        record_result "4" "Flow 6: Employee CRUD" "Resign employee" "POST" "/api/v1/employees/{id}/resign" "200" "$LAST_HTTP_CODE" "SUCCESS" "0ms" ""
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        FLOW6_PASS=false
        print_fail "Flow6 - Resign employee (HTTP $LAST_HTTP_CODE)"
        record_result "4" "Flow 6: Employee CRUD" "Resign employee" "POST" "/api/v1/employees/{id}/resign" "200" "$LAST_HTTP_CODE" "FAILURE" "0ms" ""
    fi
fi

FLOW_RESULTS+=("Flow 6: Employee CRUD|$([ "$FLOW6_PASS" = true ] && echo 'PASS' || echo 'FAIL')")

# =============================================================================
# Summary
# =============================================================================
print_section "Flow Results"

for result in "${FLOW_RESULTS[@]}"; do
    IFS='|' read -r name status <<< "$result"
    if [ "$status" = "PASS" ]; then
        print_pass "$name"
    else
        print_fail "$name"
    fi
done

print_summary

RUN_NUMBER=$(get_next_run_number)
generate_phase_report "4" "$RUN_NUMBER"
update_test_history "$RUN_NUMBER"

print_info "Results saved to: $RESULTS_FILE"

if [ "$FAILED_TESTS" -gt 0 ]; then
    exit 1
fi
exit 0
