import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Configuration ───────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// ─── Custom Metrics ──────────────────────────────────────────
const loginDuration = new Trend('login_duration', true);
const employeeListDuration = new Trend('employee_list_duration', true);
const employeeDetailDuration = new Trend('employee_detail_duration', true);
const checkinDuration = new Trend('checkin_duration', true);
const checkoutDuration = new Trend('checkout_duration', true);
const overallFailRate = new Rate('overall_failures');

// ─── Test Options ────────────────────────────────────────────
export const options = {
  scenarios: {
    combined_load: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 50 },   // Ramp up to 50
        { duration: '1m', target: 100 },   // Ramp up to 100
        { duration: '2m', target: 100 },   // Hold at 100
        { duration: '30s', target: 50 },   // Ramp down to 50
        { duration: '30s', target: 1 },    // Ramp down to 1
      ],
    },
  },
  thresholds: {
    http_req_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    login_duration: ['p(95)<500'],
    employee_list_duration: ['p(95)<500'],
    employee_detail_duration: ['p(95)<500'],
    checkin_duration: ['p(95)<500'],
    checkout_duration: ['p(95)<500'],
    overall_failures: ['rate<0.01'],
  },
};

// ─── Test Users ──────────────────────────────────────────────
const TEST_USERS = [
  { username: 'admin', password: 'admin123!', tenantCode: 'TENANT001' },
  { username: 'user01', password: 'user123!', tenantCode: 'TENANT001' },
  { username: 'manager01', password: 'manager123!', tenantCode: 'TENANT001' },
];

// ─── Helper Functions ────────────────────────────────────────
function doLogin(username, password, tenantCode) {
  const payload = JSON.stringify({
    username: username,
    password: password,
    tenantCode: tenantCode,
  });

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'login' },
  });

  loginDuration.add(res.timings.duration);

  const success = check(res, {
    'login returns 200': (r) => r.status === 200,
  });

  if (success) {
    try {
      const body = JSON.parse(res.body);
      return body.data.accessToken;
    } catch (e) {
      return null;
    }
  }
  return null;
}

function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

// ─── Main Test Flow ──────────────────────────────────────────
export default function () {
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  const token = doLogin(user.username, user.password, user.tenantCode);

  if (!token) {
    overallFailRate.add(true);
    sleep(1);
    return;
  }

  const headers = authHeaders(token);

  // Randomly pick a scenario to simulate mixed workload
  const scenario = Math.random();

  if (scenario < 0.4) {
    // 40% - Employee operations
    group('Employee Operations', () => {
      // List employees
      const listRes = http.get(
        `${BASE_URL}/api/v1/employees?page=0&size=20`,
        Object.assign({}, headers, { tags: { name: 'employee_list' } })
      );
      employeeListDuration.add(listRes.timings.duration);

      const listOk = check(listRes, {
        'employee list 200': (r) => r.status === 200,
      });
      overallFailRate.add(!listOk);

      sleep(0.5);

      // Get detail of first employee
      try {
        const body = JSON.parse(listRes.body);
        if (body.data && body.data.content && body.data.content.length > 0) {
          const empId = body.data.content[0].id;
          const detailRes = http.get(
            `${BASE_URL}/api/v1/employees/${empId}`,
            Object.assign({}, headers, { tags: { name: 'employee_detail' } })
          );
          employeeDetailDuration.add(detailRes.timings.duration);

          const detailOk = check(detailRes, {
            'employee detail 200': (r) => r.status === 200,
          });
          overallFailRate.add(!detailOk);
        }
      } catch (e) {
        // ignore
      }
    });
  } else if (scenario < 0.7) {
    // 30% - Attendance operations
    group('Attendance Operations', () => {
      // Check-in
      const checkInRes = http.post(
        `${BASE_URL}/api/v1/attendance/check-in`,
        JSON.stringify({ checkInTime: new Date().toISOString(), location: 'Office' }),
        Object.assign({}, headers, { tags: { name: 'check_in' } })
      );
      checkinDuration.add(checkInRes.timings.duration);

      const checkInOk = check(checkInRes, {
        'check-in 200': (r) => r.status === 200,
      });
      overallFailRate.add(!checkInOk);

      sleep(1);

      // Check-out
      const checkOutRes = http.post(
        `${BASE_URL}/api/v1/attendance/check-out`,
        JSON.stringify({ checkOutTime: new Date().toISOString() }),
        Object.assign({}, headers, { tags: { name: 'check_out' } })
      );
      checkoutDuration.add(checkOutRes.timings.duration);

      const checkOutOk = check(checkOutRes, {
        'check-out 200': (r) => r.status === 200,
      });
      overallFailRate.add(!checkOutOk);
    });
  } else {
    // 30% - Read-heavy mixed operations
    group('Mixed Read Operations', () => {
      // Employee summary
      const summaryRes = http.get(
        `${BASE_URL}/api/v1/employees/summary`,
        Object.assign({}, headers, { tags: { name: 'employee_summary' } })
      );
      check(summaryRes, {
        'summary 200': (r) => r.status === 200,
      });

      sleep(0.3);

      // Attendance today
      const todayRes = http.get(
        `${BASE_URL}/api/v1/attendance/today`,
        Object.assign({}, headers, { tags: { name: 'attendance_today' } })
      );
      check(todayRes, {
        'today 200': (r) => r.status === 200,
      });

      sleep(0.3);

      // My attendance records
      const now = new Date();
      const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const endDate = now.toISOString().split('T')[0];
      const recordsRes = http.get(
        `${BASE_URL}/api/v1/attendance/my?startDate=${startDate}&endDate=${endDate}`,
        Object.assign({}, headers, { tags: { name: 'my_attendance' } })
      );
      check(recordsRes, {
        'my attendance 200': (r) => r.status === 200,
      });
    });
  }

  sleep(Math.random() * 2 + 0.5); // 0.5-2.5s think time
}
