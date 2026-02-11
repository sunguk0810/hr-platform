/**
 * Transfer API Load Test (with Caching)
 *
 * Tests the cached Transfer API endpoints:
 * - /api/v1/transfers/tenants/{tenantId}/departments
 * - /api/v1/transfers/tenants/{tenantId}/positions
 * - /api/v1/transfers/tenants/{tenantId}/grades
 *
 * Expected: 95%+ cache hit rate after warm-up
 *
 * Usage:
 *   k6 run --env JWT_TOKEN=$JWT_TOKEN --env TENANT_ID=$TENANT_ID transfer-api-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const departmentsDuration = new Trend('departments_duration');
const positionsDuration = new Trend('positions_duration');
const gradesDuration = new Trend('grades_duration');
const cacheHitRate = new Rate('cache_hits');
const totalRequests = new Counter('total_requests');

export const options = {
  scenarios: {
    // Warm-up: populate cache
    cache_warmup: {
      executor: 'constant-vus',
      vus: 5,
      duration: '30s',
      startTime: '0s',
    },
    // Load test: test cache performance
    load_test: {
      executor: 'ramping-vus',
      startVUs: 20,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '3m', target: 50 },
        { duration: '1m', target: 100 },
        { duration: '2m', target: 100 },
        { duration: '1m', target: 0 },
      ],
      startTime: '30s',
    },
  },

  thresholds: {
    'http_req_duration': ['p(95)<100', 'p(99)<200'],
    'departments_duration': ['p(95)<50', 'avg<20'],  // Should be fast with cache
    'positions_duration': ['p(95)<50', 'avg<20'],
    'grades_duration': ['p(95)<50', 'avg<20'],
    'errors': ['rate<0.01'],
    'cache_hits': ['rate>0.80'],  // 80%+ cache hit rate
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:18080';
const JWT_TOKEN = __ENV.JWT_TOKEN;
const TENANT_ID = __ENV.TENANT_ID || 'a0000001-0000-0000-0000-000000000002';

export function setup() {
  if (!JWT_TOKEN) {
    throw new Error('JWT_TOKEN required');
  }

  console.log('🚀 Starting Transfer API Load Test (Cached)');
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

  // Test scenario: User accessing transfer form (loads all 3 endpoints)
  const endpoints = [
    {
      name: 'departments',
      url: `${BASE_URL}/api/v1/transfers/tenants/${data.tenantId}/departments`,
      metric: departmentsDuration,
    },
    {
      name: 'positions',
      url: `${BASE_URL}/api/v1/transfers/tenants/${data.tenantId}/positions`,
      metric: positionsDuration,
    },
    {
      name: 'grades',
      url: `${BASE_URL}/api/v1/transfers/tenants/${data.tenantId}/grades`,
      metric: gradesDuration,
    },
  ];

  endpoints.forEach(endpoint => {
    const response = http.get(endpoint.url, params);

    totalRequests.add(1);
    endpoint.metric.add(response.timings.duration);

    // Cache detection (Redis responses typically < 10ms)
    const isCacheHit = response.timings.duration < 10;
    cacheHitRate.add(isCacheHit ? 1 : 0);

    const success = check(response, {
      [`${endpoint.name}: status 200`]: (r) => r.status === 200,
      [`${endpoint.name}: fast response (<100ms)`]: (r) => r.timings.duration < 100,
      [`${endpoint.name}: has data`]: (r) => Array.isArray(r.json('data')),
      [`${endpoint.name}: non-empty`]: (r) => r.json('data').length > 0,
    });

    if (!success) {
      errorRate.add(1);
      console.error(`❌ ${endpoint.name} failed: ${response.status}`);
    } else {
      errorRate.add(0);
    }

    // Small delay between requests
    sleep(0.1);
  });

  // Think time
  sleep(Math.random() * 2 + 1);
}

export function teardown(data) {
  console.log('✅ Transfer API Load Test Completed');
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

  return {
    [`results/transfer-api-${timestamp}.json`]: JSON.stringify(data, null, 2),
    'stdout': textSummary(data),
  };
}

function textSummary(data) {
  let summary = '\n📊 Transfer API Load Test Results (Cached)\n';
  summary += '═'.repeat(60) + '\n\n';

  const metrics = data.metrics;

  summary += '🔹 Request Statistics:\n';
  summary += `  Total Requests: ${metrics.total_requests.values.count}\n`;
  summary += `  Error Rate: ${(metrics.errors.values.rate * 100).toFixed(2)}%\n\n`;

  summary += '🔹 Response Times by Endpoint:\n';
  summary += `  Departments - Avg: ${metrics.departments_duration.values.avg.toFixed(2)}ms, P95: ${metrics.departments_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `  Positions   - Avg: ${metrics.positions_duration.values.avg.toFixed(2)}ms, P95: ${metrics.positions_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += `  Grades      - Avg: ${metrics.grades_duration.values.avg.toFixed(2)}ms, P95: ${metrics.grades_duration.values['p(95)'].toFixed(2)}ms\n\n`;

  summary += '🔹 Cache Performance:\n';
  summary += `  Cache Hit Rate: ${(metrics.cache_hits.values.rate * 100).toFixed(2)}%\n\n`;

  const cacheHitRate = metrics.cache_hits.values.rate;
  if (cacheHitRate > 0.9) {
    summary += '  ✅ EXCELLENT cache performance (>90%)\n';
  } else if (cacheHitRate > 0.8) {
    summary += '  ✓ GOOD cache performance (>80%)\n';
  } else {
    summary += '  ⚠️  LOW cache hit rate - check Redis configuration\n';
  }

  summary += '\n' + '═'.repeat(60) + '\n';

  return summary;
}
