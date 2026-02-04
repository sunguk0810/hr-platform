import { TenantAwareEntity, PageRequest } from './common';

// ============================================
// 발령 상태 (Draft Status)
// ============================================
export type DraftStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTED' | 'CANCELLED';

// ============================================
// 발령 상세 상태 (Detail Status)
// ============================================
export type DetailStatus = 'PENDING' | 'EXECUTED' | 'CANCELLED' | 'ROLLED_BACK';

// ============================================
// 발령 유형 (Appointment Type)
// ============================================
export type AppointmentType =
  | 'PROMOTION'        // 승진
  | 'TRANSFER'         // 전보
  | 'POSITION_CHANGE'  // 보직변경
  | 'JOB_CHANGE'       // 직무변경
  | 'LEAVE_OF_ABSENCE' // 휴직
  | 'REINSTATEMENT'    // 복직
  | 'RESIGNATION'      // 사직
  | 'RETIREMENT'       // 정년퇴직
  | 'DEMOTION'         // 강등
  | 'CONCURRENT';      // 겸직

// ============================================
// 발령 기안자 정보
// ============================================
export interface AppointmentCreator {
  id: string;
  name: string;
}

// ============================================
// 발령안 (Appointment Draft)
// ============================================
export interface AppointmentDraft extends TenantAwareEntity {
  draftNumber: string;
  title: string;
  effectiveDate: string;
  description?: string;
  status: DraftStatus;
  detailCount: number;
  approvalId?: string;
  approvedAt?: string;
  executedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  draftCreatedBy: AppointmentCreator;
  details?: AppointmentDetail[];
}

// ============================================
// 발령안 목록 아이템
// ============================================
export interface AppointmentDraftListItem {
  id: string;
  draftNumber: string;
  title: string;
  effectiveDate: string;
  status: DraftStatus;
  detailCount: number;
  draftCreatedBy: AppointmentCreator;
  createdAt: string;
}

// ============================================
// 발령 상세 (Appointment Detail)
// ============================================
export interface AppointmentDetail {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  appointmentType: AppointmentType;
  // 이동 전 정보
  fromDepartmentId?: string;
  fromDepartmentName?: string;
  fromPositionId?: string;
  fromPositionName?: string;
  fromGradeId?: string;
  fromGradeName?: string;
  fromJobId?: string;
  fromJobName?: string;
  // 이동 후 정보
  toDepartmentId?: string;
  toDepartmentName?: string;
  toPositionId?: string;
  toPositionName?: string;
  toGradeId?: string;
  toGradeName?: string;
  toJobId?: string;
  toJobName?: string;
  reason?: string;
  status: DetailStatus;
}

// ============================================
// 발령 이력 (Appointment History)
// ============================================
export interface AppointmentHistory {
  id: string;
  appointmentType: AppointmentType;
  effectiveDate: string;
  from: Record<string, string>;
  to: Record<string, string>;
  reason?: string;
  draftNumber?: string;
  createdAt: string;
}

// ============================================
// 요청 DTO
// ============================================
export interface CreateAppointmentDraftRequest {
  title: string;
  effectiveDate: string;
  description?: string;
  details?: CreateAppointmentDetailRequest[];
}

export interface UpdateAppointmentDraftRequest {
  title?: string;
  effectiveDate?: string;
  description?: string;
}

export interface CreateAppointmentDetailRequest {
  employeeId: string;
  appointmentType: AppointmentType;
  toDepartmentId?: string;
  toPositionId?: string;
  toGradeId?: string;
  toJobId?: string;
  reason?: string;
}

export interface CancelAppointmentDraftRequest {
  reason: string;
}

// ============================================
// 검색 파라미터
// ============================================
export interface AppointmentSearchParams extends PageRequest {
  status?: DraftStatus;
  effectiveDateFrom?: string;
  effectiveDateTo?: string;
  keyword?: string;
}

// ============================================
// 통계 (Statistics)
// ============================================
export interface AppointmentStatistics {
  period: string;
  byType: { type: AppointmentType; count: number }[];
  byDepartment: { departmentId: string; departmentName: string; count: number }[];
  total: number;
}

// ============================================
// 상태별 요약
// ============================================
export interface AppointmentSummary {
  draftCount: number;
  pendingApprovalCount: number;
  approvedCount: number;
  executedCount: number;
}

// ============================================
// 라벨
// ============================================
export const APPOINTMENT_TYPE_LABELS: Record<AppointmentType, string> = {
  PROMOTION: '승진',
  TRANSFER: '전보',
  POSITION_CHANGE: '보직변경',
  JOB_CHANGE: '직무변경',
  LEAVE_OF_ABSENCE: '휴직',
  REINSTATEMENT: '복직',
  RESIGNATION: '사직',
  RETIREMENT: '정년퇴직',
  DEMOTION: '강등',
  CONCURRENT: '겸직',
};

export const DRAFT_STATUS_LABELS: Record<DraftStatus, string> = {
  DRAFT: '임시저장',
  PENDING_APPROVAL: '결재대기',
  APPROVED: '승인',
  REJECTED: '반려',
  EXECUTED: '시행완료',
  CANCELLED: '취소',
};

export const DETAIL_STATUS_LABELS: Record<DetailStatus, string> = {
  PENDING: '대기',
  EXECUTED: '시행완료',
  CANCELLED: '취소',
  ROLLED_BACK: '롤백',
};
