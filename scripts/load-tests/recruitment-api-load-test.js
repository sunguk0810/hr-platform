/**
 * Recruitment API Load Test (RLS Fix Validation)
 *
 * Tests the Recruitment APIs that were failing with RLS errors:
 * - /api/v1/jobs
 * - /api/v1/applications
 * - /api/v1/interviews/today
 * - /api/v1/interviews/my
 *
 * Validates that RLS context is properly set and no 403/500 errors occur
 *
 * Usage:
 *   k6 run --env JWT_TOKEN=$JWT_TOKEN --env TENANT_ID=$TENANT_ID recruitment-api-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const rlsErrors = new Counter('rls_errors');
const authErrors = new Counter('auth_errors');
const jobsDuration = new Trend('jobs_duration');
const applicationsDuration = new Trend('applications_duration');
const interviewsTodayDuration = new Trend('interviews_today_duration');
const interviewsMyDuration = new Trend('interviews_my_duration');

export const options = {
  scenarios: {
    smoke_test: {
      executor: 'constant-vus',
      vus: 10,
      duration: '1m',
      startTime: '0s',
    },
    load_test: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 30 },
        { duration: '2m', target: 30 },
        { duration: '1m', target: 50 },
        { duration: '2m', target: 50 },
        { duration: '1m', target: 0 },
      ],
      startTime: '1m',
    },
  },

  thresholds: {
    'http_req_duration': ['p(95)<200', 'p(99)<500'],
    'errors': ['rate<0.01'],
    'rls_errors': ['count<1'],     // Zero RLS errors expected
    'auth_errors': ['count<1'],    // Zero 403 errors expected
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:18080';
const JWT_TOKEN = __ENV.JWT_TOKEN;
const TENANT_ID = __ENV.TENANT_ID || 'a0000001-0000-0000-0000-000000000002';

export function setup() {
  if (!JWT_TOKEN) {
    throw new Error('JWT_TOKEN required');
  }

  console.log('🚀 Starting Recruitment API Load Test (RLS Validation)');
  console.log(`📊 Base URL: ${BASE_URL}`);
  console.log(`👤 Tenant ID: ${TENANT_ID}`);

  return { token: JWT_TOKEN, tenantId: TENANT_ID };
}

export default function(data) {
  const params = {
    headers: {
      'Authorization': `Bearer ${data.token}`,
      'X-Tenant-ID': data.tenantId,
      'Content-Type': 'application/json',
    },
  };

  // Test 1: Jobs List (RLS-protected)
  const jobsResponse = http.get(
    `${BASE_URL}/api/v1/jobs?page=0&size=10`,
    params
  );

  jobsDuration.add(jobsResponse.timings.duration);

  const jobsSuccess = check(jobsResponse, {
    'jobs: status 200': (r) => r.status === 200,
    'jobs: no RLS error': (r) => !r.body.includes('app.current_tenant'),
    'jobs: no null pointer': (r) => !r.body.includes('NullPointerException'),
    'jobs: has data': (r) => r.json('data') !== null,
  });

  if (jobsResponse.status === 500) {
    rlsErrors.add(1);
    console.error(`❌ RLS Error in /jobs: ${jobsResponse.body.substring(0, 200)}`);
  }
  if (jobsResponse.status === 403) {
    authErrors.add(1);
    console.error(`❌ Auth Error in /jobs: 403 Forbidden`);
  }

  errorRate.add(jobsSuccess ? 0 : 1);
  sleep(0.2);

  // Test 2: Applications List (RLS-protected)
  const appsResponse = http.get(
    `${BASE_URL}/api/v1/applications?page=0&size=10`,
    params
  );

  applicationsDuration.add(appsResponse.timings.duration);

  const appsSuccess = check(appsResponse, {
    'applications: status 200': (r) => r.status === 200,
    'applications: no RLS error': (r) => !r.body.includes('app.current_tenant'),
    'applications: has data': (r) => r.json('data') !== null,
  });

  if (appsResponse.status === 500) rlsErrors.add(1);
  if (appsResponse.status === 403) authErrors.add(1);

  errorRate.add(appsSuccess ? 0 : 1);
  sleep(0.2);

  // Test 3: Today's Interviews (RLS + Auth protected)
  const todayResponse = http.get(
    `${BASE_URL}/api/v1/interviews/today`,
    params
  );

  interviewsTodayDuration.add(todayResponse.timings.duration);

  const todaySuccess = check(todayResponse, {
    'interviews/today: status 200': (r) => r.status === 200,
    'interviews/today: no auth error': (r) => r.status !== 403,
    'interviews/today: no RLS error': (r) => !r.body.includes('app.current_tenant'),
    'interviews/today: has data': (r) => r.json('data') !== null,
  });

  if (todayResponse.status === 500) rlsErrors.add(1);
  if (todayResponse.status === 403) authErrors.add(1);

  errorRate.add(todaySuccess ? 0 : 1);
  sleep(0.2);

  // Test 4: My Interviews (RLS + Auth protected)
  const myResponse = http.get(
    `${BASE_URL}/api/v1/interviews/my?page=0&size=10`,
    params
  );

  interviewsMyDuration.add(myResponse.timings.duration);

  const mySuccess = check(myResponse, {
    'interviews/my: status 200': (r) => r.status === 200,
    'interviews/my: no auth error': (r) => r.status !== 403,
    'interviews/my: no RLS error': (r) => !r.body.includes('app.current_tenant'),
    'interviews/my: has data': (r) => r.json('data') !== null,
  });

  if (myResponse.status === 500) rlsErrors.add(1);
  if (myResponse.status === 403) authErrors.add(1);

  errorRate.add(mySuccess ? 0 : 1);

  // Think time
  sleep(Math.random() * 2 + 1);
}

export function teardown(data) {
  console.log('✅ Recruitment API Load Test Completed');
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  return {
    [`results/recruitment-api-${timestamp}.json`]: JSON.stringify(data, null, 2),
    'stdout': textSummary(data),
  };
}

function textSummary(data) {
  let summary = '\n📊 Recruitment API Load Test Results (RLS Validation)\n';
  summary += '═'.repeat(60) + '\n\n';

  const metrics = data.metrics;

  summary += '🔹 Request Statistics:\n';
  summary += `  Total Requests: ${metrics.http_reqs.values.count}\n`;
  summary += `  Error Rate: ${(metrics.errors.values.rate * 100).toFixed(2)}%\n\n`;

  summary += '🔹 Critical Errors (Should be ZERO):\n';
  summary += `  RLS Errors (500): ${metrics.rls_errors.values.count}\n`;
  summary += `  Auth Errors (403): ${metrics.auth_errors.values.count}\n\n`;

  summary += '🔹 Response Times by Endpoint:\n';
  summary += `  Jobs         - Avg: ${metrics.jobs_duration.values.avg.toFixed(2)}ms, P95: ${metrics.jobs_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `  Applications - Avg: ${metrics.applications_duration.values.avg.toFixed(2)}ms, P95: ${metrics.applications_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `  Today        - Avg: ${metrics.interviews_today_duration.values.avg.toFixed(2)}ms, P95: ${metrics.interviews_today_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `  My           - Avg: ${metrics.interviews_my_duration.values.avg.toFixed(2)}ms, P95: ${metrics.interviews_my_duration.values['p(95)'].toFixed(2)}ms\n\n`;

  summary += '🔹 RLS Fix Validation:\n';
  const rlsErrorCount = metrics.rls_errors.values.count;
  const authErrorCount = metrics.auth_errors.values.count;

  if (rlsErrorCount === 0 && authErrorCount === 0) {
    summary += '  ✅ PASS - No RLS or Auth errors detected\n';
    summary += '  ✅ RlsInterceptor is working correctly\n';
    summary += '  ✅ SecurityFilter is working correctly\n';
  } else {
    summary += '  ❌ FAIL - Errors detected:\n';
    if (rlsErrorCount > 0) {
      summary += `     - ${rlsErrorCount} RLS errors (check RlsInterceptor)\n`;
    }
    if (authErrorCount > 0) {
      summary += `     - ${authErrorCount} Auth errors (check SecurityFilter)\n`;
    }
  }

  summary += '\n' + '═'.repeat(60) + '\n';

  return summary;
}
