import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { login } from './login.js';

const employeeListDuration = new Trend('employee_list_duration', true);
const employeeDetailDuration = new Trend('employee_detail_duration', true);
const employeeCreateDuration = new Trend('employee_create_duration', true);
const employeeFailRate = new Rate('employee_failures');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
  scenarios: {
    employee_crud: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 20 },
        { duration: '2m', target: 20 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    employee_list_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    employee_detail_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    employee_create_duration: ['p(50)<300', 'p(95)<800', 'p(99)<1500'],
    employee_failures: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

export default function () {
  const token = login('admin', 'admin123!', 'TENANT001');
  if (!token) {
    employeeFailRate.add(true);
    return;
  }

  const headers = authHeaders(token);

  group('Employee List', () => {
    const listRes = http.get(
      `${BASE_URL}/api/v1/employees?page=0&size=20`,
      Object.assign({}, headers, { tags: { name: 'employee_list' } })
    );
    employeeListDuration.add(listRes.timings.duration);

    const listOk = check(listRes, {
      'list status is 200': (r) => r.status === 200,
      'list returns array': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.data !== undefined;
        } catch (e) {
          return false;
        }
      },
    });
    employeeFailRate.add(!listOk);
  });

  sleep(0.5);

  group('Employee Detail', () => {
    // Get first employee from list to use for detail
    const listRes = http.get(
      `${BASE_URL}/api/v1/employees?page=0&size=1`,
      headers
    );

    let employeeId = null;
    try {
      const body = JSON.parse(listRes.body);
      if (body.data && body.data.content && body.data.content.length > 0) {
        employeeId = body.data.content[0].id;
      }
    } catch (e) {
      // ignore parse errors
    }

    if (employeeId) {
      const detailRes = http.get(
        `${BASE_URL}/api/v1/employees/${employeeId}`,
        Object.assign({}, headers, { tags: { name: 'employee_detail' } })
      );
      employeeDetailDuration.add(detailRes.timings.duration);

      const detailOk = check(detailRes, {
        'detail status is 200': (r) => r.status === 200,
        'detail has employee data': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.data && body.data.id;
          } catch (e) {
            return false;
          }
        },
      });
      employeeFailRate.add(!detailOk);
    }
  });

  sleep(0.5);

  group('Employee Create', () => {
    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const payload = JSON.stringify({
      name: `LoadTest User ${uniqueSuffix}`,
      email: `loadtest-${uniqueSuffix}@test.com`,
      employeeNumber: `LT${uniqueSuffix.slice(-8)}`,
      departmentId: null,
      positionId: null,
      hireDate: '2026-01-01',
      status: 'ACTIVE',
    });

    const createRes = http.post(
      `${BASE_URL}/api/v1/employees`,
      payload,
      Object.assign({}, headers, { tags: { name: 'employee_create' } })
    );
    employeeCreateDuration.add(createRes.timings.duration);

    const createOk = check(createRes, {
      'create status is 200 or 201': (r) =>
        r.status === 200 || r.status === 201,
    });
    employeeFailRate.add(!createOk);
  });

  sleep(1);
}
