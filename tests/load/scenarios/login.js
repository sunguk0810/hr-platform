import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const loginDuration = new Trend('login_duration', true);
const loginFailRate = new Rate('login_failures');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

const TEST_USERS = [
  { username: 'admin', password: 'admin123!', tenantCode: 'TENANT001' },
  { username: 'user01', password: 'user123!', tenantCode: 'TENANT001' },
  { username: 'manager01', password: 'manager123!', tenantCode: 'TENANT001' },
];

export const options = {
  scenarios: {
    login_flow: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    login_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    login_failures: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export function login(username, password, tenantCode) {
  const payload = JSON.stringify({
    username: username,
    password: password,
    tenantCode: tenantCode,
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'login' },
  };

  const res = http.post(`${BASE_URL}/api/v1/auth/login`, payload, params);
  loginDuration.add(res.timings.duration);

  const success = check(res, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.accessToken;
      } catch (e) {
        return false;
      }
    },
  });

  loginFailRate.add(!success);

  if (success) {
    const body = JSON.parse(res.body);
    return body.data.accessToken;
  }
  return null;
}

export default function () {
  const user = TEST_USERS[Math.floor(Math.random() * TEST_USERS.length)];
  const token = login(user.username, user.password, user.tenantCode);

  if (token) {
    // Verify token by calling a protected endpoint
    const meRes = http.get(`${BASE_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      tags: { name: 'get_me' },
    });

    check(meRes, {
      'me endpoint returns 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
