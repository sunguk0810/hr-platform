import { BaseEntity, PageRequest, TenantBranding } from './common';

export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

// 계층 구조 레벨: 0 = 그룹사, 1 = 계열사
export type TenantLevel = 0 | 1;

// 정책 타입 7종
export type PolicyType =
  | 'LEAVE'
  | 'ATTENDANCE'
  | 'APPROVAL'
  | 'PASSWORD'
  | 'SECURITY'
  | 'NOTIFICATION'
  | 'ORGANIZATION';

// 기능 코드
export type FeatureCode =
  | 'PARALLEL_APPROVAL'
  | 'CONSENSUS'
  | 'DIRECT_APPROVAL'
  | 'PROXY_APPROVAL'
  | 'AUTO_APPROVAL_LINE'
  | 'CONDITIONAL_BRANCH'
  | 'OKR'
  | 'KPI';

// 결재 범위 타입
export type ApprovalScope = 'LEAVE' | 'EXPENSE' | 'DOCUMENT' | 'PURCHASE' | 'GENERAL';

// 결재선 기준 타입
export type ApprovalLineBase = 'ORGANIZATION' | 'POSITION' | 'ROLE';

// 테넌트 트리 노드 (계층 구조 표시용)
export interface TenantTreeNode {
  id: string;
  code: string;
  name: string;
  status: TenantStatus;
  employeeCount: number;
  level: TenantLevel;
  children: TenantTreeNode[];
}

// 기능별 config 타입 정의
export interface ParallelApprovalConfig {
  minApprovers: 'all' | 'majority' | 'one'; // 전원, 과반수, 1인
  approvalMode: 'and' | 'or'; // 모두 승인 필요 / 하나만 승인해도 됨
}

export interface ConsensusConfig {
  consensusTypes: ('협조' | '검토' | '참조')[]; // 허용되는 합의 유형
  isBlocking: boolean; // 합의 미완료 시 다음 단계 차단
}

export interface DirectApprovalConfig {
  maxAmount: number; // 전결 가능 최대 금액 (0이면 무제한)
  allowedDocTypes: string[]; // 전결 가능 문서 유형 코드
}

export interface ProxyApprovalConfig {
  maxDays: number; // 최대 대결 기간 (일)
  allowedDocTypes: string[]; // 대결 가능 문서 유형 (빈 배열이면 전체)
  requireReason: boolean; // 대결 사유 필수 여부
}

export interface AutoApprovalLineConfig {
  defaultLines: {
    docType: string;
    lineName: string;
    steps: { role: string; count: number }[];
  }[];
}

export interface OkrConfig {
  evaluationCycle: 'quarterly' | 'half' | 'yearly'; // 분기, 반기, 연간
  maxKeyResultsPerObjective: number; // 목표당 최대 핵심결과 수
  allowSelfEvaluation: boolean; // 자기 평가 허용
}

export interface KpiConfig {
  evaluationCycle: 'monthly' | 'quarterly' | 'half' | 'yearly';
  ratingScale: 3 | 5 | 7; // 등급 단계 수
  weightingEnabled: boolean; // 가중치 사용 여부
  maxIndicatorsPerEmployee: number; // 직원당 최대 지표 수
}

// 조건 분기 config
export interface ConditionalBranchConfig {
  conditions: {
    field: string; // 조건 필드 (예: amount, department)
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in';
    value: string | number | string[];
    targetLine: string; // 분기할 결재선 ID
  }[];
}

// 기능 코드별 config 타입 매핑
export type FeatureConfigMap = {
  PARALLEL_APPROVAL: ParallelApprovalConfig;
  CONSENSUS: ConsensusConfig;
  DIRECT_APPROVAL: DirectApprovalConfig;
  PROXY_APPROVAL: ProxyApprovalConfig;
  AUTO_APPROVAL_LINE: AutoApprovalLineConfig;
  CONDITIONAL_BRANCH: ConditionalBranchConfig;
  OKR: OkrConfig;
  KPI: KpiConfig;
};

// 테넌트 기능 설정
export interface TenantFeature<T extends FeatureCode = FeatureCode> {
  code: T;
  enabled: boolean;
  config?: T extends keyof FeatureConfigMap ? FeatureConfigMap[T] : Record<string, unknown>;
}

export interface TenantDetail extends BaseEntity {
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  logoUrl?: string;
  status: TenantStatus;
  branding: TenantBranding;
  policies: TenantPolicies;
  settings: TenantSettings;
  features: TenantFeature[];
  hierarchy?: TenantHierarchy;
  employeeCount: number;
  departmentCount: number;
  adminEmail?: string;
  adminName?: string;
  contractStartDate?: string;
  contractEndDate?: string;
  // 계층 구조 관련
  parentId?: string;
  parentName?: string;
  level: TenantLevel;
}

export interface TenantListItem {
  id: string;
  code: string;
  name: string;
  status: TenantStatus;
  employeeCount: number;
  adminEmail?: string;
  createdAt: string;
  // 계층 구조 관련
  parentId?: string;
  parentName?: string;
  level: TenantLevel;
}

export interface TenantPolicies {
  maxEmployees: number;
  maxDepartments: number;
  allowedModules: string[];
  leavePolicy: LeavePolicy;
  attendancePolicy: AttendancePolicy;
  approvalPolicy: ApprovalPolicy;
  passwordPolicy: PasswordPolicy;
  securityPolicy: SecurityPolicy;
  notificationPolicy: NotificationPolicy;
  organizationPolicy: OrganizationPolicy;
}

// 휴가 유형 정책 정의 (테넌트 정책용)
export interface LeavePolicyType {
  code: string;
  name: string;
  paid: boolean;
  requiresApproval: boolean;
  minDays?: number;
  maxConsecutiveDays?: number;
  requiresDocument?: boolean;
  documentRequiredDays?: number;
}

// 휴가 결재 임계값
export interface LeaveApprovalThreshold {
  maxDays: number;
  approvalLevels: number;
}

// 휴가 정책 (SDD 3.3.1 기준 중첩 구조)
export interface LeavePolicy {
  annualLeave: {
    baseDays: number;
    additionalDaysPerYear: number;
    maxAnnualDays: number;
    carryoverAllowed: boolean;
    carryoverMaxDays: number;
    carryoverExpireMonths: number;
  };
  leaveTypes: LeavePolicyType[];
  approvalRules: {
    daysThreshold: LeaveApprovalThreshold[];
  };
}

// 근태 정책 (SDD 3.3.3 기준 중첩 구조)
export interface AttendancePolicy {
  workHours: {
    standardHoursPerDay: number;
    standardHoursPerWeek: number;
    maxHoursPerWeek: number;
    flexTimeEnabled: boolean;
  };
  coreTime: {
    enabled: boolean;
    start: string; // "HH:mm"
    end: string;
  };
  overtime: {
    requiresApproval: boolean;
    maxHoursPerMonth: number;
    autoCalculate: boolean;
  };
  latePolicy: {
    gracePeriodMinutes: number;
    penaltyEnabled: boolean;
  };
}

// 결재 정책 (SDD 3.3.2 기준 중첩 구조)
export interface ApprovalPolicy {
  features: {
    parallelApproval: boolean;
    consensus: boolean;
    directApproval: boolean;
    proxyApproval: boolean;
    autoApprovalLine: boolean;
    conditionalBranch: boolean;
  };
  autoApprovalLine: {
    enabled: boolean;
    baseOn: ApprovalLineBase;
    maxLevels: number;
  };
  escalation: {
    enabled: boolean;
    reminderAfterHours: number;
    escalateAfterHours: number;
    autoRejectAfterHours: number;
  };
  proxyRules: {
    maxDurationDays: number;
    requiresApproval: boolean;
    allowedScope: ApprovalScope[];
  };
}

// 비밀번호 정책
export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecialChar: boolean;
  expiryDays: number;
  historyCount: number;
}

// 보안 정책
export interface SecurityPolicy {
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  mfaEnabled: boolean;
  ipWhitelistEnabled: boolean;
  allowedIps?: string[];
}

// 알림 정책
export interface NotificationPolicy {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

// 조직 정책
export interface OrganizationPolicy {
  maxDepartmentLevel: number;
  positionRequired: boolean;
  gradeRequired: boolean;
  allowMultipleDepartments: boolean;
}

// 조직 계층 레벨
export interface OrganizationLevel {
  levelName: string;
  levelOrder: number;
  isRequired: boolean;
}

// 테넌트 조직 계층
export interface TenantHierarchy {
  levels: OrganizationLevel[];
}

// 조직 계층 수정 요청
export interface UpdateHierarchyRequest {
  levels: OrganizationLevel[];
}

export interface TenantSettings {
  locale: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  fiscalYearStartMonth: number;
}

export interface TenantSearchParams extends PageRequest {
  keyword?: string;
  status?: TenantStatus;
}

export interface CreateTenantRequest {
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  adminEmail: string;
  adminName: string;
  policies?: Partial<TenantPolicies>;
  parentId?: string; // 그룹사 ID (계열사 생성 시)
}

export interface UpdateTenantRequest {
  name?: string;
  nameEn?: string;
  description?: string;
  logoUrl?: string;
  status?: TenantStatus;
  branding?: Partial<TenantBranding>;
  policies?: Partial<TenantPolicies>;
  settings?: Partial<TenantSettings>;
}

export const TENANT_STATUS_LABELS: Record<TenantStatus, string> = {
  ACTIVE: '활성',
  INACTIVE: '비활성',
  SUSPENDED: '정지',
  PENDING: '대기',
};

export const TENANT_MODULES = [
  { code: 'EMPLOYEE', name: '직원 관리' },
  { code: 'ORGANIZATION', name: '조직 관리' },
  { code: 'ATTENDANCE', name: '근태 관리' },
  { code: 'LEAVE', name: '휴가 관리' },
  { code: 'APPROVAL', name: '전자결재' },
  { code: 'MDM', name: '기준정보' },
  { code: 'NOTIFICATION', name: '알림' },
] as const;

export type TenantModule = typeof TENANT_MODULES[number]['code'];

// 정책 타입 라벨
export const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  LEAVE: '휴가',
  ATTENDANCE: '근태',
  APPROVAL: '결재',
  PASSWORD: '비밀번호',
  SECURITY: '보안',
  NOTIFICATION: '알림',
  ORGANIZATION: '조직',
};

// 기능 정의
export const TENANT_FEATURES: { code: FeatureCode; name: string; description: string; group: string }[] = [
  { code: 'PARALLEL_APPROVAL', name: '병렬 결재', description: '동일 단계에서 복수 결재자 동시 결재', group: '결재' },
  { code: 'CONSENSUS', name: '합의', description: '결재 라인에 합의자 추가', group: '결재' },
  { code: 'DIRECT_APPROVAL', name: '전결', description: '결재 라인 단축(전결) 처리', group: '결재' },
  { code: 'PROXY_APPROVAL', name: '대결', description: '부재 시 대리 결재자 지정', group: '결재' },
  { code: 'AUTO_APPROVAL_LINE', name: '결재선 자동 생성', description: '문서 유형별 자동 결재선 설정', group: '결재' },
  { code: 'CONDITIONAL_BRANCH', name: '조건 분기', description: '결재 조건에 따른 결재선 분기 처리', group: '결재' },
  { code: 'OKR', name: 'OKR', description: 'OKR(목표-핵심결과) 관리', group: '성과' },
  { code: 'KPI', name: 'KPI', description: 'KPI(핵심성과지표) 관리', group: '성과' },
];

// 정책 상속 요청
export interface InheritPoliciesRequest {
  childIds: string[];
  policyTypes: PolicyType[];
}

// 기능 토글 요청
export interface ToggleFeatureRequest {
  enabled: boolean;
  config?: Record<string, unknown>;
}

// 테넌트 레벨 라벨
export const TENANT_LEVEL_LABELS: Record<TenantLevel, string> = {
  0: '그룹사',
  1: '계열사',
};

// 기능별 기본 config 값
export const DEFAULT_FEATURE_CONFIGS: { [K in FeatureCode]: FeatureConfigMap[K] } = {
  PARALLEL_APPROVAL: {
    minApprovers: 'all',
    approvalMode: 'and',
  },
  CONSENSUS: {
    consensusTypes: ['협조', '검토'],
    isBlocking: false,
  },
  DIRECT_APPROVAL: {
    maxAmount: 0,
    allowedDocTypes: [],
  },
  PROXY_APPROVAL: {
    maxDays: 30,
    allowedDocTypes: [],
    requireReason: true,
  },
  AUTO_APPROVAL_LINE: {
    defaultLines: [],
  },
  CONDITIONAL_BRANCH: {
    conditions: [],
  },
  OKR: {
    evaluationCycle: 'quarterly',
    maxKeyResultsPerObjective: 5,
    allowSelfEvaluation: true,
  },
  KPI: {
    evaluationCycle: 'quarterly',
    ratingScale: 5,
    weightingEnabled: true,
    maxIndicatorsPerEmployee: 10,
  },
};

// 기능별 config 옵션 라벨
export const FEATURE_CONFIG_LABELS = {
  minApprovers: {
    all: '전원 승인',
    majority: '과반수 승인',
    one: '1인 승인',
  },
  approvalMode: {
    and: '모두 승인 필요 (AND)',
    or: '하나만 승인 (OR)',
  },
  consensusTypes: {
    협조: '협조',
    검토: '검토',
    참조: '참조',
  },
  evaluationCycle: {
    monthly: '월간',
    quarterly: '분기',
    half: '반기',
    yearly: '연간',
  },
  ratingScale: {
    3: '3단계',
    5: '5단계',
    7: '7단계',
  },
} as const;

// 정책 변경 이력
export type PolicyChangeAction = 'CREATE' | 'UPDATE' | 'INHERIT';

export interface PolicyChangeHistory {
  id: string;
  tenantId: string;
  policyType: PolicyType;
  action: PolicyChangeAction;
  beforeValue?: Record<string, unknown>;
  afterValue: Record<string, unknown>;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  reason?: string;
  sourceId?: string; // 상속 시 원본 테넌트 ID
  sourceName?: string; // 상속 시 원본 테넌트명
}

export const POLICY_CHANGE_ACTION_LABELS: Record<PolicyChangeAction, string> = {
  CREATE: '생성',
  UPDATE: '수정',
  INHERIT: '상속',
};

// 정책 기본값들

export const DEFAULT_LEAVE_POLICY: LeavePolicy = {
  annualLeave: {
    baseDays: 15,
    additionalDaysPerYear: 1,
    maxAnnualDays: 25,
    carryoverAllowed: true,
    carryoverMaxDays: 10,
    carryoverExpireMonths: 3,
  },
  leaveTypes: [
    {
      code: 'ANNUAL',
      name: '연차',
      paid: true,
      requiresApproval: true,
      minDays: 0.5,
      maxConsecutiveDays: 30,
    },
    {
      code: 'SICK',
      name: '병가',
      paid: true,
      requiresApproval: true,
      requiresDocument: true,
      documentRequiredDays: 3,
    },
    {
      code: 'SPECIAL',
      name: '특별휴가',
      paid: true,
      requiresApproval: true,
    },
  ],
  approvalRules: {
    daysThreshold: [
      { maxDays: 3, approvalLevels: 1 },
      { maxDays: 7, approvalLevels: 2 },
      { maxDays: 999, approvalLevels: 3 },
    ],
  },
};

export const DEFAULT_ATTENDANCE_POLICY: AttendancePolicy = {
  workHours: {
    standardHoursPerDay: 8,
    standardHoursPerWeek: 40,
    maxHoursPerWeek: 52,
    flexTimeEnabled: true,
  },
  coreTime: {
    enabled: true,
    start: '10:00',
    end: '16:00',
  },
  overtime: {
    requiresApproval: true,
    maxHoursPerMonth: 52,
    autoCalculate: true,
  },
  latePolicy: {
    gracePeriodMinutes: 10,
    penaltyEnabled: false,
  },
};

export const DEFAULT_APPROVAL_POLICY: ApprovalPolicy = {
  features: {
    parallelApproval: true,
    consensus: true,
    directApproval: true,
    proxyApproval: true,
    autoApprovalLine: true,
    conditionalBranch: false,
  },
  autoApprovalLine: {
    enabled: true,
    baseOn: 'ORGANIZATION',
    maxLevels: 3,
  },
  escalation: {
    enabled: true,
    reminderAfterHours: 24,
    escalateAfterHours: 72,
    autoRejectAfterHours: 168,
  },
  proxyRules: {
    maxDurationDays: 30,
    requiresApproval: true,
    allowedScope: ['LEAVE', 'EXPENSE', 'DOCUMENT'],
  },
};

export const DEFAULT_HIERARCHY_LEVELS: OrganizationLevel[] = [
  { levelName: '사업부', levelOrder: 1, isRequired: true },
  { levelName: '본부', levelOrder: 2, isRequired: true },
  { levelName: '부서', levelOrder: 3, isRequired: true },
  { levelName: '팀', levelOrder: 4, isRequired: false },
  { levelName: '파트', levelOrder: 5, isRequired: false },
];
