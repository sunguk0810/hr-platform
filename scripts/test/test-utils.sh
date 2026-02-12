#!/bin/bash
# =============================================================================
# HR SaaS Platform - Test Utilities
# Common functions for all test scripts
# =============================================================================

set -euo pipefail

# --- Configuration ---
GATEWAY_URL="${GATEWAY_URL:-http://localhost:18080}"
RESULTS_DIR="${RESULTS_DIR:-$(dirname "$0")/results}"
REPORTS_DIR="${REPORTS_DIR:-$(dirname "$0")/../../docs/test-reports}"
RESULTS_FILE="${RESULTS_DIR}/results_$(date +%Y%m%d_%H%M%S).json"
RUN_DATE=$(date +%Y-%m-%d)
RUN_TIMESTAMP=$(date +%Y-%m-%dT%H:%M:%S)

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# --- Counters ---
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# --- HTTP State ---
LAST_HTTP_CODE=""
LAST_RESPONSE_TIME="0"

# --- Token Storage ---
declare -A TOKENS

# =============================================================================
# Output Functions
# =============================================================================

print_header() {
    echo -e "\n${BOLD}${BLUE}============================================================${NC}"
    echo -e "${BOLD}${BLUE}  $1${NC}"
    echo -e "${BOLD}${BLUE}============================================================${NC}\n"
}

print_section() {
    echo -e "\n${BOLD}${CYAN}--- $1 ---${NC}\n"
}

print_pass() {
    echo -e "  ${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "  ${RED}[FAIL]${NC} $1"
}

print_skip() {
    echo -e "  ${YELLOW}[SKIP]${NC} $1"
}

print_info() {
    echo -e "  ${BLUE}[INFO]${NC} $1"
}

print_summary() {
    echo -e "\n${BOLD}============================================================${NC}"
    echo -e "${BOLD}  TEST SUMMARY${NC}"
    echo -e "${BOLD}============================================================${NC}"
    echo -e "  Total:   ${TOTAL_TESTS}"
    echo -e "  ${GREEN}Passed:  ${PASSED_TESTS}${NC}"
    echo -e "  ${RED}Failed:  ${FAILED_TESTS}${NC}"
    echo -e "  ${YELLOW}Skipped: ${SKIPPED_TESTS}${NC}"

    if [ "$FAILED_TESTS" -eq 0 ] && [ "$TOTAL_TESTS" -gt 0 ]; then
        echo -e "\n  ${GREEN}${BOLD}ALL TESTS PASSED${NC}"
    elif [ "$FAILED_TESTS" -gt 0 ]; then
        echo -e "\n  ${RED}${BOLD}SOME TESTS FAILED${NC}"
    fi
    echo -e "${BOLD}============================================================${NC}\n"
}

# =============================================================================
# Results Recording
# =============================================================================

init_results() {
    mkdir -p "$RESULTS_DIR"
    echo "[]" > "$RESULTS_FILE"
    print_info "Results file: $RESULTS_FILE"
}

record_result() {
    local phase="$1"
    local category="$2"
    local test_name="$3"
    local method="${4:-GET}"
    local endpoint="${5:-}"
    local expected="${6:-200}"
    local actual="${7:-}"
    local status="${8:-FAILURE}"
    local response_time="${9:-0}"
    local notes="${10:-}"

    # Append to results file using python for proper JSON handling
    python3 -c "
import json, sys
with open('$RESULTS_FILE', 'r') as f:
    results = json.load(f)
results.append({
    'phase': '$phase',
    'category': '$category',
    'test': '$test_name',
    'method': '$method',
    'endpoint': '$endpoint',
    'expected': '$expected',
    'actual': '$actual',
    'status': '$status',
    'response_time': '$response_time',
    'notes': $(python3 -c "import json; print(json.dumps('$notes'))")
})
with open('$RESULTS_FILE', 'w') as f:
    json.dump(results, f, indent=2)
" 2>/dev/null || true
}

# =============================================================================
# HTTP Request Functions
# =============================================================================

# Login and store token for a user
# Usage: login <key> <username> <password> [tenantCode]
login() {
    local key="$1"
    local username="$2"
    local password="$3"
    local tenant_code="${4:-}"

    local body
    if [ -n "$tenant_code" ]; then
        body=$(python3 -c "import json; print(json.dumps({'username': '$username', 'password': '$password', 'tenantCode': '$tenant_code'}))")
    else
        body=$(python3 -c "import json; print(json.dumps({'username': '$username', 'password': '$password'}))")
    fi

    local response
    response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        -X POST "${GATEWAY_URL}/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "$body" 2>/dev/null)

    local body_content
    body_content=$(echo "$response" | head -n -2)
    local http_code
    http_code=$(echo "$response" | tail -n 2 | head -n 1)
    local time_total
    time_total=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
        local token
        token=$(echo "$body_content" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('data',{}).get('accessToken','') or data.get('accessToken',''))" 2>/dev/null || echo "")

        local refresh_token
        refresh_token=$(echo "$body_content" | python3 -c "import sys,json; data=json.load(sys.stdin); print(data.get('data',{}).get('refreshToken','') or data.get('refreshToken',''))" 2>/dev/null || echo "")

        if [ -n "$token" ]; then
            TOKENS["${key}_access"]="$token"
            TOKENS["${key}_refresh"]="$refresh_token"
            print_pass "Login [$key]: $username (${time_total}s)"
            return 0
        else
            print_fail "Login [$key]: $username - No token in response"
            return 1
        fi
    else
        print_fail "Login [$key]: $username - HTTP $http_code (${time_total}s)"
        print_info "Response: $(echo "$body_content" | head -c 200)"
        return 1
    fi
}

# Get stored access token
get_token() {
    local key="$1"
    echo "${TOKENS["${key}_access"]:-}"
}

# Get stored refresh token
get_refresh_token() {
    local key="$1"
    echo "${TOKENS["${key}_refresh"]:-}"
}

# Temp file for passing HTTP status from subshell to parent
_API_CALL_TMPDIR="${TMPDIR:-/tmp}/hr-saas-test-$$"
mkdir -p "$_API_CALL_TMPDIR"

# Generic API call with auth
# Usage: api_call <method> <endpoint> [token_key] [body] [extra_headers]
# Returns: response body via stdout
# Sets globals: LAST_HTTP_CODE, LAST_RESPONSE_TIME (via temp files to survive subshell)
api_call() {
    local method="$1"
    local endpoint="$2"
    local token_key="${3:-}"
    local body="${4:-}"
    local extra_headers="${5:-}"

    local url="${GATEWAY_URL}${endpoint}"
    local curl_args=(-s -w "\n%{http_code}\n%{time_total}" -X "$method")

    # Add auth header
    if [ -n "$token_key" ]; then
        local token
        token=$(get_token "$token_key")
        if [ -n "$token" ]; then
            curl_args+=(-H "Authorization: Bearer $token")
        fi
    fi

    # Add content type and body
    if [ -n "$body" ]; then
        curl_args+=(-H "Content-Type: application/json" -d "$body")
    fi

    curl_args+=("$url")

    local response
    response=$(curl "${curl_args[@]}" 2>/dev/null)

    local body_content
    body_content=$(echo "$response" | head -n -2)
    local http_code
    http_code=$(echo "$response" | tail -n 2 | head -n 1)
    local response_time
    response_time=$(echo "$response" | tail -n 1)

    # Write to temp files so parent shell can read them
    echo "$http_code" > "$_API_CALL_TMPDIR/http_code"
    echo "$response_time" > "$_API_CALL_TMPDIR/response_time"

    # Also set globals (works when not called from subshell)
    LAST_HTTP_CODE="$http_code"
    LAST_RESPONSE_TIME="$response_time"

    echo "$body_content"
}

# Read HTTP status after api_call (call this after RESPONSE=$(api_call ...))
_read_api_status() {
    LAST_HTTP_CODE=$(cat "$_API_CALL_TMPDIR/http_code" 2>/dev/null || echo "")
    LAST_RESPONSE_TIME=$(cat "$_API_CALL_TMPDIR/response_time" 2>/dev/null || echo "0")
}

# =============================================================================
# Test Assertion Functions
# =============================================================================

# Assert HTTP status code
# Usage: assert_status <test_name> <expected_code> [phase] [category] [method] [endpoint]
assert_status() {
    local test_name="$1"
    local expected="$2"
    local phase="${3:-3}"
    local category="${4:-General}"
    local method="${5:-GET}"
    local endpoint="${6:-}"

    # Always read from temp files to handle subshell context
    _read_api_status

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    local time_ms
    time_ms=$(echo "$LAST_RESPONSE_TIME" | awk '{printf "%.0f", $1 * 1000}')

    if [ "$LAST_HTTP_CODE" = "$expected" ]; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
        print_pass "$test_name (HTTP $LAST_HTTP_CODE, ${time_ms}ms)"
        record_result "$phase" "$category" "$test_name" "$method" "$endpoint" "$expected" "$LAST_HTTP_CODE" "SUCCESS" "${time_ms}ms" ""
        return 0
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
        print_fail "$test_name (Expected: $expected, Got: $LAST_HTTP_CODE, ${time_ms}ms)"
        record_result "$phase" "$category" "$test_name" "$method" "$endpoint" "$expected" "$LAST_HTTP_CODE" "FAILURE" "${time_ms}ms" "Expected $expected but got $LAST_HTTP_CODE"
        return 1
    fi
}

# Assert response contains field
# Usage: assert_contains <test_name> <response> <field_path>
assert_contains() {
    local test_name="$1"
    local response="$2"
    local field="$3"

    if echo "$response" | python3 -c "import sys,json; data=json.load(sys.stdin); assert $field" 2>/dev/null; then
        print_pass "$test_name - field check OK"
        return 0
    else
        print_fail "$test_name - field check failed: $field"
        return 1
    fi
}

# =============================================================================
# Report Generation
# =============================================================================

get_next_run_number() {
    local history_file="$REPORTS_DIR/TEST_HISTORY.md"
    if [ ! -f "$history_file" ]; then
        echo "1"
        return
    fi
    local last_run
    last_run=$(grep -oP 'Run #\K\d+' "$history_file" 2>/dev/null | sort -n | tail -1)
    echo $((${last_run:-0} + 1))
}

generate_phase_report() {
    local phase="$1"
    local run_number="$2"
    local phase_file=""

    case "$phase" in
        1) phase_file="$REPORTS_DIR/phase1-infrastructure.md" ;;
        3) phase_file="$REPORTS_DIR/phase3-api-smoke.md" ;;
        4) phase_file="$REPORTS_DIR/phase4-e2e-flows.md" ;;
        5) phase_file="$REPORTS_DIR/phase5-security.md" ;;
        *) return ;;
    esac

    if [ ! -f "$RESULTS_FILE" ]; then
        return
    fi

    python3 -c "
import json
from datetime import datetime

with open('$RESULTS_FILE') as f:
    results = json.load(f)

phase_results = [r for r in results if r['phase'] == '$phase']
if not phase_results:
    exit(0)

# Group by category
categories = {}
for r in phase_results:
    cat = r['category']
    if cat not in categories:
        categories[cat] = []
    categories[cat].append(r)

lines = []
lines.append('')
lines.append('## Run #$run_number - $RUN_DATE')
lines.append('')

for cat, tests in categories.items():
    lines.append(f'### {cat}')
    lines.append('')
    lines.append('| # | Test Case | Method | Endpoint | Expected | Actual | Status | Response Time |')
    lines.append('|---|-----------|--------|----------|----------|--------|--------|---------------|')
    for i, t in enumerate(tests, 1):
        status_emoji = 'SUCCESS' if t['status'] == 'SUCCESS' else 'FAILURE'
        lines.append(f'| {i} | {t[\"test\"]} | {t[\"method\"]} | {t[\"endpoint\"]} | {t[\"expected\"]} | {t[\"actual\"]} | {status_emoji} | {t[\"response_time\"]} |')
    lines.append('')

total = len(phase_results)
passed = sum(1 for r in phase_results if r['status'] == 'SUCCESS')
failed = total - passed
rate = f'{(passed/total*100):.0f}%' if total > 0 else '0%'

lines.append('### Summary')
lines.append('')
lines.append(f'| Metric | Value |')
lines.append(f'|--------|-------|')
lines.append(f'| Total Tests | {total} |')
lines.append(f'| Passed | {passed} |')
lines.append(f'| Failed | {failed} |')
lines.append(f'| Pass Rate | {rate} |')
lines.append(f'| Result | {\"SUCCESS\" if failed == 0 else \"FAILURE\"} |')
lines.append('')

if failed > 0:
    lines.append('### Failure Details')
    lines.append('')
    lines.append('| # | Test Case | Expected | Actual | Notes |')
    lines.append('|---|-----------|----------|--------|-------|')
    for i, r in enumerate([r for r in phase_results if r['status'] != 'SUCCESS'], 1):
        lines.append(f'| {i} | {r[\"test\"]} | {r[\"expected\"]} | {r[\"actual\"]} | {r[\"notes\"]} |')
    lines.append('')

lines.append('---')

report = '\n'.join(lines)

with open('$phase_file', 'a') as f:
    f.write(report)

print(f'Report appended to $phase_file')
" 2>/dev/null || echo "Warning: Could not generate phase report"
}

update_test_history() {
    local run_number="$1"
    local history_file="$REPORTS_DIR/TEST_HISTORY.md"

    if [ ! -f "$RESULTS_FILE" ]; then
        return
    fi

    python3 -c "
import json

with open('$RESULTS_FILE') as f:
    results = json.load(f)

phase_summary = {}
for r in results:
    p = r['phase']
    if p not in phase_summary:
        phase_summary[p] = {'total': 0, 'passed': 0}
    phase_summary[p]['total'] += 1
    if r['status'] == 'SUCCESS':
        phase_summary[p]['passed'] += 1

def status(p):
    if p not in phase_summary:
        return 'N/A'
    s = phase_summary[p]
    return f'{s[\"passed\"]}/{s[\"total\"]} PASS' if s['passed'] == s['total'] else f'{s[\"passed\"]}/{s[\"total\"]} FAIL'

overall_total = sum(s['total'] for s in phase_summary.values())
overall_passed = sum(s['passed'] for s in phase_summary.values())
overall = 'PASS' if overall_total == overall_passed else 'FAIL'

row = f'| $run_number | $RUN_DATE | {status(\"1\")} | {status(\"2\")} | {status(\"3\")} | {status(\"4\")} | {status(\"5\")} | {overall} |'

# Read existing history
try:
    with open('$history_file', 'r') as f:
        content = f.read()
except FileNotFoundError:
    content = ''

# Find insertion point (after table header)
if '| Run # |' in content:
    lines = content.split('\n')
    insert_idx = None
    for i, line in enumerate(lines):
        if line.startswith('|----'):
            insert_idx = i + 1
            break
    if insert_idx:
        lines.insert(insert_idx, row)
        content = '\n'.join(lines)
else:
    content += '\n' + row

with open('$history_file', 'w') as f:
    f.write(content)

print(f'Test history updated: Run #{\"$run_number\"} - {overall}')
" 2>/dev/null || echo "Warning: Could not update test history"
}

# =============================================================================
# Infrastructure Health Check Functions
# =============================================================================

check_port() {
    local host="$1"
    local port="$2"
    local timeout="${3:-2}"

    if command -v nc &>/dev/null; then
        nc -z -w "$timeout" "$host" "$port" 2>/dev/null
    elif command -v bash &>/dev/null; then
        (echo >/dev/tcp/"$host"/"$port") 2>/dev/null
    else
        curl -s --connect-timeout "$timeout" "http://${host}:${port}" >/dev/null 2>&1
    fi
}

check_service_health() {
    local name="$1"
    local port="$2"
    local path="${3:-/actuator/health}"
    local timeout="${4:-5}"

    local start_time
    start_time=$(date +%s%N)

    local response
    response=$(curl -s -w "\n%{http_code}" --connect-timeout "$timeout" \
        "http://localhost:${port}${path}" 2>/dev/null)

    local end_time
    end_time=$(date +%s%N)
    local duration_ms=$(( (end_time - start_time) / 1000000 ))

    local body
    body=$(echo "$response" | head -n -1)
    local http_code
    http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
        local status
        status=$(echo "$body" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','UNKNOWN'))" 2>/dev/null || echo "OK")
        if [ "$status" = "UP" ] || [ "$status" = "OK" ] || [ "$status" = "ok" ]; then
            print_pass "$name (port $port) - UP (${duration_ms}ms)"
            return 0
        else
            print_fail "$name (port $port) - Status: $status (${duration_ms}ms)"
            return 1
        fi
    else
        print_fail "$name (port $port) - HTTP $http_code (${duration_ms}ms)"
        return 1
    fi
}

# =============================================================================
# Cleanup
# =============================================================================

cleanup() {
    # Clean up temporary files
    rm -rf "$_API_CALL_TMPDIR" 2>/dev/null || true
}

trap cleanup EXIT
