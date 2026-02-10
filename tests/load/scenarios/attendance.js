import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';
import { login } from './login.js';

const checkInDuration = new Trend('checkin_duration', true);
const checkOutDuration = new Trend('checkout_duration', true);
const recordsListDuration = new Trend('attendance_list_duration', true);
const attendanceFailRate = new Rate('attendance_failures');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
  scenarios: {
    attendance_flow: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 30 },
        { duration: '2m', target: 30 },
        { duration: '30s', target: 0 },
      ],
    },
  },
  thresholds: {
    checkin_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    checkout_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    attendance_list_duration: ['p(50)<200', 'p(95)<500', 'p(99)<1000'],
    attendance_failures: ['rate<0.01'],
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
  const token = login('user01', 'user123!', 'TENANT001');
  if (!token) {
    attendanceFailRate.add(true);
    return;
  }

  const headers = authHeaders(token);

  group('Check-In', () => {
    const checkInPayload = JSON.stringify({
      checkInTime: new Date().toISOString(),
      location: 'Office',
    });

    const checkInRes = http.post(
      `${BASE_URL}/api/v1/attendance/check-in`,
      checkInPayload,
      Object.assign({}, headers, { tags: { name: 'check_in' } })
    );
    checkInDuration.add(checkInRes.timings.duration);

    const checkInOk = check(checkInRes, {
      'check-in status is 200': (r) => r.status === 200,
    });
    attendanceFailRate.add(!checkInOk);
  });

  sleep(1);

  group('Today Status', () => {
    const todayRes = http.get(
      `${BASE_URL}/api/v1/attendance/today`,
      Object.assign({}, headers, { tags: { name: 'today_status' } })
    );

    check(todayRes, {
      'today status is 200': (r) => r.status === 200,
    });
  });

  sleep(1);

  group('Check-Out', () => {
    const checkOutPayload = JSON.stringify({
      checkOutTime: new Date().toISOString(),
    });

    const checkOutRes = http.post(
      `${BASE_URL}/api/v1/attendance/check-out`,
      checkOutPayload,
      Object.assign({}, headers, { tags: { name: 'check_out' } })
    );
    checkOutDuration.add(checkOutRes.timings.duration);

    const checkOutOk = check(checkOutRes, {
      'check-out status is 200': (r) => r.status === 200,
    });
    attendanceFailRate.add(!checkOutOk);
  });

  sleep(0.5);

  group('Attendance Records', () => {
    const now = new Date();
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const endDate = now.toISOString().split('T')[0];

    const recordsRes = http.get(
      `${BASE_URL}/api/v1/attendance/my?startDate=${startDate}&endDate=${endDate}`,
      Object.assign({}, headers, { tags: { name: 'attendance_records' } })
    );
    recordsListDuration.add(recordsRes.timings.duration);

    const recordsOk = check(recordsRes, {
      'records status is 200': (r) => r.status === 200,
    });
    attendanceFailRate.add(!recordsOk);
  });

  sleep(1);
}
