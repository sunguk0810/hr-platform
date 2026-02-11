#!/bin/bash

#############################################################################
# HR Platform - Performance Testing Quick Start
#
# This script automates the performance testing workflow:
# 1. Authenticates and gets JWT token
# 2. Runs all load tests
# 3. Opens Grafana dashboard
#
# Usage:
#   ./quick-start.sh
#
# Requirements:
#   - k6 installed (https://k6.io/docs/getting-started/installation/)
#   - jq installed (https://stedolan.github.io/jq/download/)
#   - Docker services running
#############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="${BASE_URL:-http://localhost:18080}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:13000}"
TENANT_ID="${TENANT_ID:-a0000001-0000-0000-0000-000000000002}"
LOGIN_FILE="../../test-logins/login-ceo.json"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🚀 HR Platform - Performance Testing Quick Start       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

#############################################################################
# Step 1: Prerequisites Check
#############################################################################

echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

# Check if k6 is installed
if ! command -v k6 &> /dev/null; then
    echo -e "${RED}❌ k6 is not installed${NC}"
    echo "   Install from: https://k6.io/docs/getting-started/installation/"
    exit 1
fi
echo -e "${GREEN}✅ k6 installed: $(k6 version --no-color | head -1)${NC}"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${RED}❌ jq is not installed${NC}"
    echo "   Install from: https://stedolan.github.io/jq/download/"
    exit 1
fi
echo -e "${GREEN}✅ jq installed${NC}"

# Check if Docker services are running
echo -e "${YELLOW}🐳 Checking Docker services...${NC}"
if ! curl -s "${BASE_URL}/actuator/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Gateway service not responding at ${BASE_URL}${NC}"
    echo "   Run: cd ../../docker && docker-compose up -d"
    exit 1
fi
echo -e "${GREEN}✅ Gateway service is running${NC}"

#############################################################################
# Step 2: Authentication
#############################################################################

echo ""
echo -e "${YELLOW}🔐 Authenticating...${NC}"

if [ ! -f "$LOGIN_FILE" ]; then
    echo -e "${RED}❌ Login file not found: $LOGIN_FILE${NC}"
    exit 1
fi

# Login and extract JWT token
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d @"$LOGIN_FILE")

JWT_TOKEN=$(echo "$RESPONSE" | jq -r '.data.accessToken')

if [ "$JWT_TOKEN" == "null" ] || [ -z "$JWT_TOKEN" ]; then
    echo -e "${RED}❌ Authentication failed${NC}"
    echo "   Response: $RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"
echo "   Token: ${JWT_TOKEN:0:20}..."
echo "   Tenant: $TENANT_ID"

export JWT_TOKEN
export TENANT_ID

#############################################################################
# Step 3: Create results directory
#############################################################################

mkdir -p results
echo ""
echo -e "${YELLOW}📁 Results will be saved to: $(pwd)/results/${NC}"

#############################################################################
# Step 4: Run Load Tests
#############################################################################

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🧪 Running Load Tests                                   ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"

# Test 1: Appointment Summary
echo ""
echo -e "${YELLOW}[1/3] 📊 Testing Appointment Summary API...${NC}"
k6 run --env JWT_TOKEN=$JWT_TOKEN --env TENANT_ID=$TENANT_ID \
  --quiet \
  appointment-summary-load-test.js

# Test 2: Transfer API
echo ""
echo -e "${YELLOW}[2/3] 🔄 Testing Transfer API (Cached)...${NC}"
k6 run --env JWT_TOKEN=$JWT_TOKEN --env TENANT_ID=$TENANT_ID \
  --quiet \
  transfer-api-load-test.js

# Test 3: Recruitment API
echo ""
echo -e "${YELLOW}[3/3] 👔 Testing Recruitment API (RLS Validation)...${NC}"
k6 run --env JWT_TOKEN=$JWT_TOKEN --env TENANT_ID=$TENANT_ID \
  --quiet \
  recruitment-api-load-test.js

#############################################################################
# Step 5: Summary
#############################################################################

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   ✅ All Tests Completed Successfully!                    ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${GREEN}📊 View Results:${NC}"
echo "   - JSON files: $(pwd)/results/"
echo "   - Grafana: ${GRAFANA_URL}/d/hr-platform-performance"
echo ""

# Count result files
RESULT_COUNT=$(ls -1 results/*.json 2>/dev/null | wc -l)
echo -e "${GREEN}   Total test results: ${RESULT_COUNT} files${NC}"
echo ""

# Optional: Open Grafana dashboard
read -p "Open Grafana dashboard in browser? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open "${GRAFANA_URL}/d/hr-platform-performance"
    elif command -v open &> /dev/null; then
        open "${GRAFANA_URL}/d/hr-platform-performance"
    elif command -v start &> /dev/null; then
        start "${GRAFANA_URL}/d/hr-platform-performance"
    else
        echo "   Please open manually: ${GRAFANA_URL}/d/hr-platform-performance"
    fi
fi

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   🎯 Performance Targets                                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "   Appointment Summary:"
echo "     • P95 < 100ms (optimized from ~35ms)"
echo "     • Avg < 50ms (optimized from ~22ms)"
echo ""
echo "   Transfer APIs (Cached):"
echo "     • P95 < 50ms"
echo "     • Cache Hit Rate > 80%"
echo ""
echo "   Recruitment APIs:"
echo "     • Zero RLS Errors (500)"
echo "     • Zero Auth Errors (403)"
echo ""

echo -e "${GREEN}✨ Performance testing complete!${NC}"
