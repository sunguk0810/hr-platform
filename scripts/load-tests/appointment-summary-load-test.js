/**
 * Appointment Summary API Load Test
 *
 * Tests the optimized /api/v1/appointments/drafts/summary endpoint
 * Expected improvement: 75% latency reduction (22ms → 6ms)
 *
 * Usage:
 *   k6 run --env JWT_TOKEN=$JWT_TOKEN --env TENANT_ID=$TENANT_ID appointment-summary-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const appointmentSummaryDuration = new Trend('appointment_summary_duration');
const cacheHitRate = new Rate('cache_hits');
const totalRequests = new Counter('total_requests');

// Test configuration
export const options = {
  scenarios: {
    // Warm-up phase
    warmup: {
      executor: 'constant-vus',
      vus: 10,
      duration: '30s',
      startTime: '0s',
      gracefulStop: '5s',
    },
    // Load test phase
    load_test: {
      executor: 'ramping-vus',
      startVUs: 10,
      stages: [
        { duration: '1m', target: 50 },   // Ramp up to 50 users
        { duration: '3m', target: 50 },   // Stay at 50 users
        { duration: '1m', target: 100 },  // Spike to 100 users
        { duration: '2m', target: 100 },  // Stay at 100 users
        { duration: '1m', target: 0 },    // Ramp down
      ],
      startTime: '30s',
      gracefulStop: '10s',
    },
  },

  thresholds: {
    // Response time thresholds
    'http_req_duration': [
      'p(95)<100',  // 95% of requests should complete within 100ms
      'p(99)<200',  // 99% of requests should complete within 200ms
    ],
    'appointment_summary_duration': [
      'p(95)<100',
      'p(99)<200',
      'avg<50',     // Average should be under 50ms (optimized from 22ms)
    ],
    // Error rate thresholds
    'errors': ['rate<0.01'],  // Error rate should be less than 1%
    'http_req_failed': ['rate<0.01'],
    // Cache performance
    'cache_hits': ['rate>0.8'],  // Cache hit rate should be > 80%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:18080';
const JWT_TOKEN = __ENV.JWT_TOKEN;
const TENANT_ID = __ENV.TENANT_ID || 'a0000001-0000-0000-0000-000000000002';

export function setup() {
  if (!JWT_TOKEN) {
    throw new Error('JWT_TOKEN environment variable is required. Run: export JWT_TOKEN=$(curl -s ... | jq -r .data.accessToken)');
  }

  console.log('🚀 Starting Appointment Summary Load Test');
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
    tags: { name: 'AppointmentSummary' },
  };

  // Test: Get appointment summary
  const response = http.get(
    `${BASE_URL}/api/v1/appointments/drafts/summary`,
    params
  );

  // Record custom metrics
  totalRequests.add(1);
  appointmentSummaryDuration.add(response.timings.duration);

  // Check for cache hits (via response time - cached responses are typically <5ms)
  const isCacheHit = response.timings.duration < 10;
  cacheHitRate.add(isCacheHit ? 1 : 0);

  // Validations
  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
    'response time < 50ms (avg target)': (r) => r.timings.duration < 50,
    'has success field': (r) => r.json('success') === true,
    'has data field': (r) => r.json('data') !== null,
    'has draftCount': (r) => r.json('data.draftCount') !== undefined,
    'has pendingApprovalCount': (r) => r.json('data.pendingApprovalCount') !== undefined,
    'has approvedCount': (r) => r.json('data.approvedCount') !== undefined,
    'has executedCount': (r) => r.json('data.executedCount') !== undefined,
    'all counts are numbers': (r) => {
      const data = r.json('data');
      return typeof data.draftCount === 'number' &&
             typeof data.pendingApprovalCount === 'number' &&
             typeof data.approvedCount === 'number' &&
             typeof data.executedCount === 'number';
    },
  });

  if (!success) {
    errorRate.add(1);
    console.error(`❌ Request failed: ${response.status} - ${response.body.substring(0, 200)}`);
  } else {
    errorRate.add(0);
  }

  // Think time: simulate realistic user behavior
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

export function teardown(data) {
  console.log('✅ Appointment Summary Load Test Completed');
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  return {
    [`results/appointment-summary-${timestamp}.json`]: JSON.stringify(data, null, 2),
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const colors = options.enableColors;

  let summary = '\n' + indent + '📊 Appointment Summary Load Test Results\n';
  summary += indent + '═'.repeat(60) + '\n\n';

  const metrics = data.metrics;

  // Request stats
  summary += indent + '🔹 Request Statistics:\n';
  summary += indent + `  Total Requests: ${metrics.total_requests.values.count}\n`;
  summary += indent + `  Failed Requests: ${metrics.http_req_failed ? (metrics.http_req_failed.values.rate * 100).toFixed(2) : 0}%\n`;
  summary += indent + `  Error Rate: ${(metrics.errors.values.rate * 100).toFixed(2)}%\n\n`;

  // Response time stats
  summary += indent + '🔹 Response Time:\n';
  summary += indent + `  Average: ${metrics.appointment_summary_duration.values.avg.toFixed(2)}ms\n`;
  summary += indent + `  Median: ${metrics.appointment_summary_duration.values.med.toFixed(2)}ms\n`;
  summary += indent + `  P95: ${metrics.appointment_summary_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += indent + `  P99: ${metrics.appointment_summary_duration.values['p(99)'].toFixed(2)}ms\n`;
  summary += indent + `  Min: ${metrics.appointment_summary_duration.values.min.toFixed(2)}ms\n`;
  summary += indent + `  Max: ${metrics.appointment_summary_duration.values.max.toFixed(2)}ms\n\n`;

  // Cache performance
  if (metrics.cache_hits) {
    summary += indent + '🔹 Cache Performance:\n';
    summary += indent + `  Cache Hit Rate: ${(metrics.cache_hits.values.rate * 100).toFixed(2)}%\n\n`;
  }

  // Throughput
  summary += indent + '🔹 Throughput:\n';
  summary += indent + `  Requests/sec: ${metrics.http_reqs ? metrics.http_reqs.values.rate.toFixed(2) : 'N/A'}\n\n`;

  // Performance verdict
  const avgDuration = metrics.appointment_summary_duration.values.avg;
  const p95Duration = metrics.appointment_summary_duration.values['p(95)'];
  const errorRateValue = metrics.errors.values.rate;

  summary += indent + '🔹 Performance Verdict:\n';

  if (avgDuration < 50 && p95Duration < 100 && errorRateValue < 0.01) {
    summary += indent + '  ✅ EXCELLENT - All targets met!\n';
  } else if (avgDuration < 100 && p95Duration < 200 && errorRateValue < 0.05) {
    summary += indent + '  ✓ GOOD - Performance acceptable\n';
  } else if (errorRateValue < 0.1) {
    summary += indent + '  ⚠️  NEEDS IMPROVEMENT - Some targets missed\n';
  } else {
    summary += indent + '  ❌ POOR - Performance issues detected\n';
  }

  summary += indent + '\n' + '═'.repeat(60) + '\n';

  return summary;
}
