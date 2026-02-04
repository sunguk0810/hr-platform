import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Query Keys Factory
export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    user: () => [...queryKeys.auth.all, 'user'] as const,
    session: () => [...queryKeys.auth.all, 'session'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    widgets: () => [...queryKeys.dashboard.all, 'widgets'] as const,
    attendance: () => [...queryKeys.dashboard.all, 'attendance'] as const,
    leaveBalance: () => [...queryKeys.dashboard.all, 'leaveBalance'] as const,
    pendingApprovals: () => [...queryKeys.dashboard.all, 'pendingApprovals'] as const,
    orgSummary: () => [...queryKeys.dashboard.all, 'orgSummary'] as const,
    statistics: () => [...queryKeys.dashboard.all, 'statistics'] as const,
    announcements: () => [...queryKeys.dashboard.all, 'announcements'] as const,
    birthdays: () => [...queryKeys.dashboard.all, 'birthdays'] as const,
    teamLeave: () => [...queryKeys.dashboard.all, 'teamLeave'] as const,
  },
  employees: {
    all: ['employees'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.employees.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.employees.all, 'detail', id] as const,
  },
  organizations: {
    all: ['organizations'] as const,
    tree: () => [...queryKeys.organizations.all, 'tree'] as const,
    departments: (filters?: Record<string, unknown>) => [...queryKeys.organizations.all, 'departments', filters] as const,
    department: (id: string) => [...queryKeys.organizations.all, 'department', id] as const,
    positions: () => [...queryKeys.organizations.all, 'positions'] as const,
    grades: () => [...queryKeys.organizations.all, 'grades'] as const,
  },
  tenants: {
    all: ['tenants'] as const,
    current: () => [...queryKeys.tenants.all, 'current'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.tenants.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.tenants.all, 'detail', id] as const,
  },
  attendance: {
    all: ['attendance'] as const,
    today: () => [...queryKeys.attendance.all, 'today'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.attendance.all, 'list', filters] as const,
    monthly: (yearMonth: string) => [...queryKeys.attendance.all, 'monthly', yearMonth] as const,
    summary: (yearMonth: string) => [...queryKeys.attendance.all, 'summary', yearMonth] as const,
    workHours: (filters?: Record<string, unknown>) => [...queryKeys.attendance.all, 'workHours', filters] as const,
    record: (id: string) => [...queryKeys.attendance.all, 'record', id] as const,
  },
  leaves: {
    all: ['leaves'] as const,
    balance: () => [...queryKeys.leaves.all, 'balance'] as const,
    balanceByType: () => [...queryKeys.leaves.all, 'balanceByType'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.leaves.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.leaves.all, 'detail', id] as const,
    myList: (filters?: Record<string, unknown>) => [...queryKeys.leaves.all, 'myList', filters] as const,
    pending: (filters?: Record<string, unknown>) => [...queryKeys.leaves.all, 'pending', filters] as const,
    pendingSummary: () => [...queryKeys.leaves.all, 'pending', 'summary'] as const,
  },
  approvals: {
    all: ['approvals'] as const,
    list: (filters?: Record<string, unknown>) => [...queryKeys.approvals.all, 'list', filters] as const,
    detail: (id: string) => [...queryKeys.approvals.all, 'detail', id] as const,
    history: (id: string) => [...queryKeys.approvals.all, 'detail', id, 'history'] as const,
    pending: () => [...queryKeys.approvals.all, 'pending'] as const,
    myRequests: (filters?: Record<string, unknown>) => [...queryKeys.approvals.all, 'myRequests', filters] as const,
    summary: () => [...queryKeys.approvals.all, 'summary'] as const,
    templates: () => [...queryKeys.approvals.all, 'templates'] as const,
    template: (id: string) => [...queryKeys.approvals.all, 'templates', id] as const,
    delegations: () => [...queryKeys.approvals.all, 'delegations'] as const,
  },
  mdm: {
    all: ['mdm'] as const,
    codeGroups: (filters?: Record<string, unknown>) => [...queryKeys.mdm.all, 'codeGroups', filters] as const,
    codeGroup: (id: string) => [...queryKeys.mdm.all, 'codeGroup', id] as const,
    commonCodes: (filters?: Record<string, unknown>) => [...queryKeys.mdm.all, 'commonCodes', filters] as const,
    commonCode: (id: string) => [...queryKeys.mdm.all, 'commonCode', id] as const,
    codesByGroup: (groupCode: string) => [...queryKeys.mdm.all, 'codesByGroup', groupCode] as const,
  },
  appointments: {
    all: ['appointments'] as const,
    drafts: (filters?: Record<string, unknown>) => [...queryKeys.appointments.all, 'drafts', filters] as const,
    draft: (id: string) => [...queryKeys.appointments.all, 'draft', id] as const,
    summary: () => [...queryKeys.appointments.all, 'summary'] as const,
  },
} as const;
