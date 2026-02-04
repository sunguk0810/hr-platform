/**
 * React Query 캐시 키 상수
 *
 * 사용법:
 * - 단순 키: queryKeys.employees.all
 * - 파라미터 키: queryKeys.employees.list({ page: 0, size: 10 })
 * - 상세 키: queryKeys.employees.detail('emp-123')
 *
 * 키 구조:
 * - all: 해당 도메인의 모든 쿼리 (invalidate 시 유용)
 * - list: 목록 쿼리
 * - detail: 상세 쿼리
 * - 기타 도메인별 특수 키
 */

// 타입 정의
export interface EmployeeListParams {
  page?: number;
  size?: number;
  keyword?: string;
  departmentId?: string;
  employmentStatus?: string;
  hireStartDate?: string;
  hireEndDate?: string;
}

export interface NotificationListParams {
  page?: number;
  size?: number;
  type?: string;
  unreadOnly?: boolean;
}

export interface AttendanceListParams {
  page?: number;
  size?: number;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface LeaveListParams {
  page?: number;
  size?: number;
  employeeId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}

export interface ApprovalListParams {
  page?: number;
  size?: number;
  status?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrganizationListParams {
  parentId?: string;
  includeInactive?: boolean;
}

export interface AuditLogParams {
  page?: number;
  size?: number;
  action?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CertificateRequestParams {
  page?: number;
  size?: number;
  status?: string;
  typeCode?: string;
  startDate?: string;
  endDate?: string;
}

export interface CertificateIssueParams {
  page?: number;
  size?: number;
  typeCode?: string;
  startDate?: string;
  endDate?: string;
  includeExpired?: boolean;
}

export interface JobPostingListParams {
  page?: number;
  size?: number;
  keyword?: string;
  status?: string;
  departmentId?: string;
  employmentType?: string;
  recruiterId?: string;
}

export interface ApplicationListParams {
  page?: number;
  size?: number;
  keyword?: string;
  jobPostingId?: string;
  status?: string;
  stage?: string;
  appliedStartDate?: string;
  appliedEndDate?: string;
}

export interface InterviewListParams {
  page?: number;
  size?: number;
  applicationId?: string;
  interviewerId?: string;
  interviewType?: string;
  status?: string;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
}

export interface OfferListParams {
  page?: number;
  size?: number;
  keyword?: string;
  applicationId?: string;
  jobPostingId?: string;
  status?: string;
  departmentId?: string;
}

// Query Keys
export const queryKeys = {
  // 인증 관련
  auth: {
    all: ['auth'] as const,
    me: () => [...queryKeys.auth.all, 'me'] as const,
    sessions: () => [...queryKeys.auth.all, 'sessions'] as const,
  },

  // 직원 관련
  employees: {
    all: ['employees'] as const,
    list: (params?: EmployeeListParams) => [...queryKeys.employees.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.employees.all, 'detail', id] as const,
    byDepartment: (departmentId: string) => [...queryKeys.employees.all, 'byDepartment', departmentId] as const,
  },

  // 알림 관련
  notifications: {
    all: ['notifications'] as const,
    list: (params?: NotificationListParams) => [...queryKeys.notifications.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.notifications.all, 'detail', id] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
    settings: () => [...queryKeys.notifications.all, 'settings'] as const,
  },

  // 근태 관련
  attendance: {
    all: ['attendance'] as const,
    list: (params?: AttendanceListParams) => [...queryKeys.attendance.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.attendance.all, 'detail', id] as const,
    today: () => [...queryKeys.attendance.all, 'today'] as const,
    summary: (employeeId: string, year: number, month: number) =>
      [...queryKeys.attendance.all, 'summary', employeeId, year, month] as const,
  },

  // 휴가 관련
  leaves: {
    all: ['leaves'] as const,
    list: (params?: LeaveListParams) => [...queryKeys.leaves.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.leaves.all, 'detail', id] as const,
    balance: (employeeId: string) => [...queryKeys.leaves.all, 'balance', employeeId] as const,
    calendar: (year: number, month: number) => [...queryKeys.leaves.all, 'calendar', year, month] as const,
  },

  // 결재 관련
  approvals: {
    all: ['approvals'] as const,
    list: (params?: ApprovalListParams) => [...queryKeys.approvals.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.approvals.all, 'detail', id] as const,
    history: (id: string) => [...queryKeys.approvals.all, 'detail', id, 'history'] as const,
    pending: () => [...queryKeys.approvals.all, 'pending'] as const,
    myRequests: () => [...queryKeys.approvals.all, 'myRequests'] as const,
    templates: () => [...queryKeys.approvals.all, 'templates'] as const,
    template: (id: string) => [...queryKeys.approvals.all, 'templates', id] as const,
    delegations: () => [...queryKeys.approvals.all, 'delegations'] as const,
  },

  // 조직 관련
  organization: {
    all: ['organization'] as const,
    departments: (params?: OrganizationListParams) =>
      [...queryKeys.organization.all, 'departments', params] as const,
    department: (id: string) => [...queryKeys.organization.all, 'department', id] as const,
    tree: () => [...queryKeys.organization.all, 'tree'] as const,
    positions: () => [...queryKeys.organization.all, 'positions'] as const,
    grades: () => [...queryKeys.organization.all, 'grades'] as const,
  },

  // 대시보드 관련
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    announcements: () => [...queryKeys.dashboard.all, 'announcements'] as const,
    birthdays: () => [...queryKeys.dashboard.all, 'birthdays'] as const,
    teamLeaves: () => [...queryKeys.dashboard.all, 'teamLeaves'] as const,
    pendingApprovals: () => [...queryKeys.dashboard.all, 'pendingApprovals'] as const,
  },

  // MDM (마스터 데이터) 관련
  mdm: {
    all: ['mdm'] as const,
    codes: (groupCode?: string) => [...queryKeys.mdm.all, 'codes', groupCode] as const,
    codeGroups: () => [...queryKeys.mdm.all, 'codeGroups'] as const,
  },

  // 테넌트 관련
  tenant: {
    all: ['tenant'] as const,
    current: () => [...queryKeys.tenant.all, 'current'] as const,
    settings: () => [...queryKeys.tenant.all, 'settings'] as const,
    branding: () => [...queryKeys.tenant.all, 'branding'] as const,
  },

  // 감사 로그 관련
  audit: {
    all: ['audit'] as const,
    logs: (params?: AuditLogParams) => [...queryKeys.audit.all, 'logs', params] as const,
    detail: (id: string) => [...queryKeys.audit.all, 'detail', id] as const,
  },

  // 프로필 관련
  profile: {
    all: ['profile'] as const,
    me: () => [...queryKeys.profile.all, 'me'] as const,
  },

  // 도움말/문의 관련
  help: {
    all: ['help'] as const,
    inquiries: () => [...queryKeys.help.all, 'inquiries'] as const,
    inquiry: (id: string) => [...queryKeys.help.all, 'inquiry', id] as const,
    faqs: () => [...queryKeys.help.all, 'faqs'] as const,
    guides: () => [...queryKeys.help.all, 'guides'] as const,
  },

  // 파일 관련
  files: {
    all: ['files'] as const,
    list: (params?: { category?: string }) => [...queryKeys.files.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.files.all, 'detail', id] as const,
  },

  // 공지사항 관련
  announcements: {
    all: ['announcements'] as const,
    list: (params?: { page?: number; size?: number }) =>
      [...queryKeys.announcements.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.announcements.all, 'detail', id] as const,
  },

  // 증명서 관련
  certificates: {
    all: ['certificates'] as const,
    types: () => [...queryKeys.certificates.all, 'types'] as const,
    type: (code: string) => [...queryKeys.certificates.all, 'type', code] as const,
    requests: (params?: CertificateRequestParams) => [...queryKeys.certificates.all, 'requests', params] as const,
    request: (id: string) => [...queryKeys.certificates.all, 'request', id] as const,
    issues: (params?: CertificateIssueParams) => [...queryKeys.certificates.all, 'issues', params] as const,
    verification: (code: string) => [...queryKeys.certificates.all, 'verification', code] as const,
  },

  // 채용 관련
  recruitment: {
    all: ['recruitment'] as const,
    // 채용공고
    jobs: {
      all: () => [...queryKeys.recruitment.all, 'jobs'] as const,
      list: (params?: JobPostingListParams) => [...queryKeys.recruitment.jobs.all(), 'list', params] as const,
      detail: (id: string) => [...queryKeys.recruitment.jobs.all(), 'detail', id] as const,
      summary: () => [...queryKeys.recruitment.jobs.all(), 'summary'] as const,
    },
    // 지원서
    applications: {
      all: () => [...queryKeys.recruitment.all, 'applications'] as const,
      list: (params?: ApplicationListParams) => [...queryKeys.recruitment.applications.all(), 'list', params] as const,
      byJob: (jobId: string, params?: ApplicationListParams) =>
        [...queryKeys.recruitment.applications.all(), 'byJob', jobId, params] as const,
      detail: (id: string) => [...queryKeys.recruitment.applications.all(), 'detail', id] as const,
      summary: (jobId?: string) => [...queryKeys.recruitment.applications.all(), 'summary', jobId] as const,
      stages: (jobId: string) => [...queryKeys.recruitment.applications.all(), 'stages', jobId] as const,
    },
    // 면접
    interviews: {
      all: () => [...queryKeys.recruitment.all, 'interviews'] as const,
      list: (params?: InterviewListParams) => [...queryKeys.recruitment.interviews.all(), 'list', params] as const,
      my: (params?: InterviewListParams) => [...queryKeys.recruitment.interviews.all(), 'my', params] as const,
      today: () => [...queryKeys.recruitment.interviews.all(), 'today'] as const,
      byApplication: (applicationId: string) =>
        [...queryKeys.recruitment.interviews.all(), 'byApplication', applicationId] as const,
      detail: (id: string) => [...queryKeys.recruitment.interviews.all(), 'detail', id] as const,
      summary: () => [...queryKeys.recruitment.interviews.all(), 'summary'] as const,
      scores: (interviewId: string) => [...queryKeys.recruitment.interviews.all(), 'scores', interviewId] as const,
      myScore: (interviewId: string) => [...queryKeys.recruitment.interviews.all(), 'myScore', interviewId] as const,
    },
    // 채용 제안
    offers: {
      all: () => [...queryKeys.recruitment.all, 'offers'] as const,
      list: (params?: OfferListParams) => [...queryKeys.recruitment.offers.all(), 'list', params] as const,
      detail: (id: string) => [...queryKeys.recruitment.offers.all(), 'detail', id] as const,
      byApplication: (applicationId: string) =>
        [...queryKeys.recruitment.offers.all(), 'byApplication', applicationId] as const,
      summary: () => [...queryKeys.recruitment.offers.all(), 'summary'] as const,
    },
  },
} as const;

// 타입 추론을 위한 유틸리티 타입
export type QueryKeys = typeof queryKeys;
