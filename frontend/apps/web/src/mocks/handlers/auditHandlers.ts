import { http, HttpResponse } from 'msw';
import type { AuditLog, AuditAction, AuditResult, AuditTargetType } from '@hr-platform/shared-types';
import { subDays, subHours, subMinutes } from 'date-fns';

const now = new Date();

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    tenantId: 'tenant-1',
    createdAt: subMinutes(now, 5).toISOString(),
    updatedAt: subMinutes(now, 5).toISOString(),
    userId: 'user-1',
    userName: '홍길동',
    userEmail: 'hong@company.com',
    ipAddress: '192.168.1.100',
    action: 'LOGIN' as AuditAction,
    targetType: 'USER' as AuditTargetType,
    targetId: 'user-1',
    targetName: '홍길동',
    result: 'SUCCESS' as AuditResult,
    details: { browser: 'Chrome 120', os: 'Windows 11' },
  },
  {
    id: '2',
    tenantId: 'tenant-1',
    createdAt: subMinutes(now, 15).toISOString(),
    updatedAt: subMinutes(now, 15).toISOString(),
    userId: 'user-2',
    userName: '김철수',
    userEmail: 'kim@company.com',
    ipAddress: '192.168.1.101',
    action: 'UPDATE' as AuditAction,
    targetType: 'EMPLOYEE' as AuditTargetType,
    targetId: 'emp-001',
    targetName: '이영희',
    result: 'SUCCESS' as AuditResult,
    details: { changedFields: ['email', 'phone'] },
  },
  {
    id: '3',
    tenantId: 'tenant-1',
    createdAt: subHours(now, 1).toISOString(),
    updatedAt: subHours(now, 1).toISOString(),
    userId: 'user-3',
    userName: '박지성',
    userEmail: 'park@company.com',
    ipAddress: '192.168.1.102',
    action: 'CREATE' as AuditAction,
    targetType: 'APPROVAL' as AuditTargetType,
    targetId: 'appr-001',
    targetName: '휴가 신청',
    result: 'SUCCESS' as AuditResult,
    details: { approvalType: 'LEAVE_REQUEST' },
  },
  {
    id: '4',
    tenantId: 'tenant-1',
    createdAt: subHours(now, 2).toISOString(),
    updatedAt: subHours(now, 2).toISOString(),
    userId: 'user-1',
    userName: '홍길동',
    userEmail: 'hong@company.com',
    ipAddress: '192.168.1.100',
    action: 'DELETE' as AuditAction,
    targetType: 'DOCUMENT' as AuditTargetType,
    targetId: 'doc-001',
    targetName: '2024년 계약서.pdf',
    result: 'SUCCESS' as AuditResult,
    details: { fileSize: '2.5MB' },
  },
  {
    id: '5',
    tenantId: 'tenant-1',
    createdAt: subHours(now, 3).toISOString(),
    updatedAt: subHours(now, 3).toISOString(),
    userId: 'user-4',
    userName: '최수진',
    userEmail: 'choi@company.com',
    ipAddress: '10.0.0.50',
    action: 'LOGIN' as AuditAction,
    targetType: 'USER' as AuditTargetType,
    targetId: 'user-4',
    targetName: '최수진',
    result: 'FAILURE' as AuditResult,
    errorMessage: '비밀번호 불일치',
    details: { attemptCount: 3 },
  },
  {
    id: '6',
    tenantId: 'tenant-1',
    createdAt: subDays(now, 1).toISOString(),
    updatedAt: subDays(now, 1).toISOString(),
    userId: 'user-2',
    userName: '김철수',
    userEmail: 'kim@company.com',
    ipAddress: '192.168.1.101',
    action: 'APPROVE' as AuditAction,
    targetType: 'APPROVAL' as AuditTargetType,
    targetId: 'appr-002',
    targetName: '출장 신청',
    result: 'SUCCESS' as AuditResult,
    details: { comment: '승인합니다.' },
  },
  {
    id: '7',
    tenantId: 'tenant-1',
    createdAt: subDays(now, 1).toISOString(),
    updatedAt: subDays(now, 1).toISOString(),
    userId: 'admin-1',
    userName: '관리자',
    userEmail: 'admin@company.com',
    ipAddress: '192.168.1.1',
    action: 'UPDATE' as AuditAction,
    targetType: 'ORGANIZATION' as AuditTargetType,
    targetId: 'dept-001',
    targetName: '개발팀',
    result: 'SUCCESS' as AuditResult,
    details: { changedFields: ['name', 'parentId'] },
  },
  {
    id: '8',
    tenantId: 'tenant-1',
    createdAt: subDays(now, 2).toISOString(),
    updatedAt: subDays(now, 2).toISOString(),
    userId: 'admin-1',
    userName: '관리자',
    userEmail: 'admin@company.com',
    ipAddress: '192.168.1.1',
    action: 'CREATE' as AuditAction,
    targetType: 'EMPLOYEE' as AuditTargetType,
    targetId: 'emp-010',
    targetName: '신입사원',
    result: 'SUCCESS' as AuditResult,
    details: { department: '개발팀', grade: '사원' },
  },
  {
    id: '9',
    tenantId: 'tenant-1',
    createdAt: subDays(now, 3).toISOString(),
    updatedAt: subDays(now, 3).toISOString(),
    userId: 'user-5',
    userName: '이민수',
    userEmail: 'lee@company.com',
    ipAddress: '192.168.1.105',
    action: 'EXPORT' as AuditAction,
    targetType: 'EMPLOYEE' as AuditTargetType,
    targetId: undefined,
    targetName: '직원 목록',
    result: 'SUCCESS' as AuditResult,
    details: { recordCount: 150, format: 'xlsx' },
  },
  {
    id: '10',
    tenantId: 'tenant-1',
    createdAt: subDays(now, 4).toISOString(),
    updatedAt: subDays(now, 4).toISOString(),
    userId: 'user-1',
    userName: '홍길동',
    userEmail: 'hong@company.com',
    ipAddress: '192.168.1.100',
    action: 'LOGOUT' as AuditAction,
    targetType: 'USER' as AuditTargetType,
    targetId: 'user-1',
    targetName: '홍길동',
    result: 'SUCCESS' as AuditResult,
    details: { sessionDuration: '4h 30m' },
  },
];

export const auditHandlers = [
  // Get audit logs
  http.get('/api/v1/audit/logs', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const size = parseInt(url.searchParams.get('size') || '10');
    const action = url.searchParams.get('action');
    const result = url.searchParams.get('result');
    const userId = url.searchParams.get('userId');
    const keyword = url.searchParams.get('keyword');

    let filteredLogs = [...mockAuditLogs];

    if (action) {
      filteredLogs = filteredLogs.filter((log) => log.action === action);
    }
    if (result) {
      filteredLogs = filteredLogs.filter((log) => log.result === result);
    }
    if (userId) {
      filteredLogs = filteredLogs.filter((log) => log.userId === userId);
    }
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.userName.toLowerCase().includes(lowerKeyword) ||
          log.targetName?.toLowerCase().includes(lowerKeyword) ||
          log.ipAddress.includes(keyword)
      );
    }

    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

    return HttpResponse.json({
      success: true,
      data: {
        content: paginatedLogs,
        totalElements: filteredLogs.length,
        totalPages: Math.ceil(filteredLogs.length / size),
        page,
        size,
      },
    });
  }),

  // Get audit log detail
  http.get('/api/v1/audit/logs/:id', ({ params }) => {
    const { id } = params;
    const log = mockAuditLogs.find((l) => l.id === id);

    if (!log) {
      return HttpResponse.json(
        { success: false, error: { code: 'AUDIT_001', message: '감사 로그를 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: log,
    });
  }),
];
