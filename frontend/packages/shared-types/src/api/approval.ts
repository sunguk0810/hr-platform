import { TenantAwareEntity, PageRequest } from './common';

// SDD 3.2.1 기준 확장된 상태
export type ApprovalStatus =
  | 'DRAFT'      // 임시저장
  | 'PENDING'    // 결재 대기
  | 'IN_REVIEW'  // 검토 중
  | 'APPROVED'   // 승인 완료
  | 'REJECTED'   // 반려
  | 'RECALLED'   // 회수됨
  | 'CANCELLED'; // 취소됨

export type ApprovalType = 'LEAVE_REQUEST' | 'EXPENSE' | 'OVERTIME' | 'PERSONNEL' | 'GENERAL';
export type ApprovalUrgency = 'LOW' | 'NORMAL' | 'HIGH';

// BE enum 기준 결재선 타입
export type ApprovalLineType = 'SEQUENTIAL' | 'PARALLEL' | 'AGREEMENT' | 'ARBITRARY';

// BE enum 기준 결재선 상태
export type ApprovalLineStatus = 'WAITING' | 'ACTIVE' | 'APPROVED' | 'REJECTED' | 'AGREED' | 'SKIPPED';

/** 결재 모드: 순차결재, 전결, 병렬결재, 합의결재 */
export type ApprovalMode = 'SEQUENTIAL' | 'DIRECT' | 'PARALLEL' | 'CONSENSUS';

export const APPROVAL_MODE_LABELS: Record<ApprovalMode, string> = {
  SEQUENTIAL: '순차결재',
  DIRECT: '전결',
  PARALLEL: '병렬결재',
  CONSENSUS: '합의결재',
};

// SDD 4.5 기준 결재 이력 액션 타입
export type ApprovalActionType =
  | 'SUBMIT'
  | 'APPROVE'
  | 'REJECT'
  | 'RECALL'
  | 'DELEGATE'
  | 'DIRECT_APPROVE'
  | 'COMMENT'
  | 'RETURN';

/** 연계 모듈 반영 상태 (FR-APR-004-03) */
export interface LinkedModuleStatus {
  module: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  message: string;
}

export interface Approval extends TenantAwareEntity {
  documentNumber: string;
  documentType: string;
  title: string;
  content: string;
  drafterId: string;
  drafterName: string;
  drafterDepartmentName: string;
  drafterDepartmentId?: string;
  status: ApprovalStatus;
  approvalLines: ApprovalLine[];
  // BE 추가 필드
  referenceType?: string;
  referenceId?: string;
  submittedAt?: string;
  completedAt?: string;
  // FE-only optional 필드 (BE 미구현)
  urgency?: ApprovalUrgency;
  mode?: ApprovalMode;
  dueDate?: string;
  attachments?: ApprovalAttachment[];
  recalledAt?: string;
  recallReason?: string;
  directApprovedBy?: string;
  directApprovedAt?: string;
  linkedModules?: LinkedModuleStatus[];
}

export interface ApprovalListItem {
  id: string;
  documentNumber: string;
  documentType: string;
  title: string;
  drafterName: string;
  drafterDepartmentName?: string;
  status: ApprovalStatus;
  createdAt: string;
  // FE-only optional
  urgency?: ApprovalUrgency;
  dueDate?: string;
  currentStepName?: string;
}

export type ApprovalExecutionType = 'SEQUENTIAL' | 'PARALLEL' | 'AGREEMENT';
export type ParallelCompletionCondition = 'ALL' | 'ANY' | 'MAJORITY';

export interface ApprovalLine {
  id: string;
  sequence: number;
  lineType: ApprovalLineType;
  approverId?: string;
  approverName?: string;
  approverPosition?: string;
  approverDepartmentName?: string;
  status: ApprovalLineStatus;
  actionType?: ApprovalActionType;
  comment?: string;
  activatedAt?: string;
  completedAt?: string;
  delegateId?: string;
  delegateName?: string;
  // FE-only optional 필드 (BE 미구현, mock에서만 사용)
  approverImage?: string;
  executionType?: ApprovalExecutionType;
  parallelGroupId?: string;
  parallelCompletionCondition?: ParallelCompletionCondition;
  delegatedAt?: string;
  directApproved?: boolean;
}

export interface ApprovalAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  downloadUrl: string;
}

export interface ApprovalSearchParams extends PageRequest {
  keyword?: string;
  type?: string;
  status?: ApprovalStatus;
  startDate?: string;
  endDate?: string;
}

export interface CreateApprovalRequest {
  title: string;
  content?: string;
  documentType: string;
  referenceType?: string;
  referenceId?: string;
  approvalLines: ApprovalLineCreateRequest[];
  submitImmediately?: boolean;
  // FE-only optional (mock에서만 사용)
  urgency?: ApprovalUrgency;
  dueDate?: string;
  attachmentIds?: string[];
  mode?: ApprovalMode;
  parallelCompletionCondition?: ParallelCompletionCondition;
}

export interface ApprovalLineCreateRequest {
  approverId: string;
  approverName?: string;
  approverPosition?: string;
  approverDepartmentName?: string;
  lineType?: ApprovalLineType;
}

export interface ApproveRequest {
  comment?: string;
}

export interface RejectRequest {
  comment: string;
}

// Approver options for search
export interface ApproverOption {
  id: string;
  name: string;
  departmentName: string;
  positionName?: string;
  profileImageUrl?: string;
}

// Delegation Types
export type DelegationStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

export interface ApprovalDelegation extends TenantAwareEntity {
  delegatorId: string;
  delegatorName: string;
  delegateeId: string;
  delegateeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: DelegationStatus;
}

export interface DelegationListItem {
  id: string;
  delegatorName: string;
  delegateeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: DelegationStatus;
  createdAt: string;
}

export interface CreateDelegationRequest {
  delegateeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface DelegationSearchParams extends PageRequest {
  delegatorId?: string;
  delegateeId?: string;
  status?: DelegationStatus;
}

export const DELEGATION_STATUS_LABELS: Record<DelegationStatus, string> = {
  ACTIVE: '활성',
  EXPIRED: '만료',
  CANCELLED: '취소',
};

// SDD 4.5 기준 결재 이력 타입
export interface ApprovalHistory {
  id: string;
  documentId: string;
  stepOrder: number;
  action: string;
  actorId: string;
  actorName: string;
  actorDepartment?: string;
  comment?: string;
  processedAt: string;
  // FE-only optional (BE에 없음)
  actorPosition?: string;
  delegatorId?: string;
  delegatorName?: string;
  ipAddress?: string;
}

// SDD 3.3.4 기준 결재 양식 타입
export interface ApprovalTemplate {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  formSchema: Record<string, unknown>;  // JSON Schema
  defaultApprovalLine?: ApprovalLineTemplate[];
  conditionalRoutingRules?: ConditionalRoutingRule[];  // FR-APR-003-02: 조건부 라우팅 규칙
  retentionPeriod?: number;  // 보존 기간(일)
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// FR-APR-003-02: 조건부 라우팅 규칙
export type RoutingConditionField = 'AMOUNT' | 'LEAVE_DAYS';
export type RoutingConditionOperator = '>=' | '<=' | '==';

export interface ConditionalRoutingRule {
  id: string;
  conditionField: RoutingConditionField;
  conditionOperator: RoutingConditionOperator;
  conditionValue: number;
  approvalLine: ApprovalLineTemplate[];
}

export const ROUTING_CONDITION_FIELD_LABELS: Record<RoutingConditionField, string> = {
  AMOUNT: '금액',
  LEAVE_DAYS: '휴가일수',
};

export const ROUTING_CONDITION_OPERATOR_LABELS: Record<RoutingConditionOperator, string> = {
  '>=': '이상 (>=)',
  '<=': '이하 (<=)',
  '==': '같음 (==)',
};

// FR-ATT-002-03: 결재선 추천 응답
export interface RecommendedApprover {
  id: string;
  name: string;
  position: string;
  department: string;
}

export interface ApprovalLineRecommendation {
  approvers: RecommendedApprover[];
}

export interface ApprovalLineTemplate {
  stepOrder: number;
  stepType: ApprovalStepType;
  approverType: 'SPECIFIC' | 'ROLE' | 'DEPARTMENT_HEAD';
  approverId?: string;
  approverRole?: string;
  isRequired: boolean;
}

export type ApprovalStepType = 'APPROVAL' | 'AGREEMENT' | 'REFERENCE';

// SDD 4.4 회수 요청
export interface RecallRequest {
  reason: string;
}

// SDD 4.6 대결 요청
export interface DelegateRequest {
  delegateToId: string;
  delegateToName?: string;
  reason?: string;
}

// SDD 4.7 전결 요청
export interface DirectApproveRequest {
  skipToStep?: number;  // 몇 단계까지 전결할지
  reason: string;
}

// 상태 레이블 확장
export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  DRAFT: '임시저장',
  PENDING: '결재대기',
  IN_REVIEW: '검토중',
  APPROVED: '승인완료',
  REJECTED: '반려',
  RECALLED: '회수됨',
  CANCELLED: '취소됨',
};

export const APPROVAL_ACTION_LABELS: Record<ApprovalActionType, string> = {
  SUBMIT: '상신',
  APPROVE: '승인',
  REJECT: '반려',
  RECALL: '회수',
  DELEGATE: '대결',
  DIRECT_APPROVE: '전결',
  COMMENT: '의견',
  RETURN: '반송',
};

// ===== PRD FR-APR-003: 위임전결 규칙 =====

export type DelegationRuleStatus = 'ACTIVE' | 'INACTIVE';
export type DelegationRuleConditionType = 'DOCUMENT_TYPE' | 'AMOUNT_RANGE' | 'ABSENCE' | 'ALWAYS';
export type DelegationRuleTargetType = 'SPECIFIC' | 'ROLE' | 'DEPARTMENT_HEAD' | 'DEPUTY';

export interface DelegationRuleCondition {
  type: DelegationRuleConditionType;
  documentTypes?: ApprovalType[];  // DOCUMENT_TYPE 조건용
  minAmount?: number;              // AMOUNT_RANGE 조건용
  maxAmount?: number;
  absenceDays?: number;            // ABSENCE 조건용 (n일 이상 부재시)
}

export interface DelegationRuleTarget {
  type: DelegationRuleTargetType;
  employeeId?: string;    // SPECIFIC용
  employeeName?: string;
  role?: string;          // ROLE용 (e.g., 'TEAM_LEADER', 'DEPT_MANAGER')
  roleName?: string;
}

export interface DelegationRule {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  delegatorId: string;
  delegatorName: string;
  delegatorDepartment?: string;
  condition: DelegationRuleCondition;
  target: DelegationRuleTarget;
  priority: number;         // 낮을수록 우선순위 높음
  status: DelegationRuleStatus;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
  createdBy: string;
  createdByName?: string;
  updatedAt: string;
  updatedBy?: string;
}

export interface DelegationRuleListItem {
  id: string;
  name: string;
  delegatorName: string;
  delegatorDepartment?: string;
  conditionType: DelegationRuleConditionType;
  conditionSummary: string;
  targetType: DelegationRuleTargetType;
  targetSummary: string;
  priority: number;
  status: DelegationRuleStatus;
  validFrom?: string;
  validTo?: string;
}

export interface CreateDelegationRuleRequest {
  name: string;
  description?: string;
  delegatorId: string;
  condition: DelegationRuleCondition;
  target: DelegationRuleTarget;
  priority?: number;
  validFrom?: string;
  validTo?: string;
}

export interface UpdateDelegationRuleRequest {
  name?: string;
  description?: string;
  condition?: DelegationRuleCondition;
  target?: DelegationRuleTarget;
  priority?: number;
  status?: DelegationRuleStatus;
  validFrom?: string;
  validTo?: string;
}

export interface DelegationRuleSearchParams extends PageRequest {
  delegatorId?: string;
  status?: DelegationRuleStatus;
  conditionType?: DelegationRuleConditionType;
}

export const DELEGATION_RULE_CONDITION_LABELS: Record<DelegationRuleConditionType, string> = {
  DOCUMENT_TYPE: '문서 유형',
  AMOUNT_RANGE: '금액 범위',
  ABSENCE: '부재 시',
  ALWAYS: '항상',
};

export const DELEGATION_RULE_TARGET_LABELS: Record<DelegationRuleTargetType, string> = {
  SPECIFIC: '특정 직원',
  ROLE: '특정 역할',
  DEPARTMENT_HEAD: '부서장',
  DEPUTY: '대리자',
};
