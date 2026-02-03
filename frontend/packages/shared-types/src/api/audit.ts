import { TenantAwareEntity, PageRequest } from './common';

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'IMPORT'
  | 'APPROVE'
  | 'REJECT'
  | 'PASSWORD_CHANGE'
  | 'PERMISSION_CHANGE';

export type AuditResult = 'SUCCESS' | 'FAILURE';

export type AuditTargetType =
  | 'EMPLOYEE'
  | 'DEPARTMENT'
  | 'ORGANIZATION'
  | 'APPROVAL'
  | 'LEAVE'
  | 'ATTENDANCE'
  | 'TENANT'
  | 'SETTINGS'
  | 'USER'
  | 'DOCUMENT';

export interface AuditLog extends TenantAwareEntity {
  userId: string;
  userName: string;
  userEmail: string;
  ipAddress: string;
  userAgent?: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetId?: string;
  targetName?: string;
  result: AuditResult;
  errorMessage?: string;
  details?: Record<string, unknown>;
  requestUrl?: string;
  requestMethod?: string;
}

export interface AuditLogListItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  ipAddress: string;
  action: AuditAction;
  targetType: AuditTargetType;
  targetName?: string;
  result: AuditResult;
}

export interface AuditLogSearchParams extends PageRequest {
  userId?: string;
  action?: AuditAction;
  targetType?: AuditTargetType;
  result?: AuditResult;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  LOGIN: '로그인',
  LOGOUT: '로그아웃',
  CREATE: '생성',
  READ: '조회',
  UPDATE: '수정',
  DELETE: '삭제',
  EXPORT: '내보내기',
  IMPORT: '가져오기',
  APPROVE: '승인',
  REJECT: '반려',
  PASSWORD_CHANGE: '비밀번호 변경',
  PERMISSION_CHANGE: '권한 변경',
};

export const AUDIT_TARGET_TYPE_LABELS: Record<AuditTargetType, string> = {
  EMPLOYEE: '직원',
  DEPARTMENT: '부서',
  ORGANIZATION: '조직',
  APPROVAL: '결재',
  LEAVE: '휴가',
  ATTENDANCE: '근태',
  TENANT: '테넌트',
  SETTINGS: '설정',
  USER: '사용자',
  DOCUMENT: '문서',
};

export const AUDIT_RESULT_LABELS: Record<AuditResult, string> = {
  SUCCESS: '성공',
  FAILURE: '실패',
};
