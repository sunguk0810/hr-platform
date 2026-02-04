import { TenantAwareEntity, PageRequest } from './common';

// 전출/전입 상태
export type TransferStatus =
  | 'DRAFT'           // 임시저장
  | 'PENDING_SOURCE'  // 전출 테넌트 승인 대기
  | 'PENDING_TARGET'  // 전입 테넌트 승인 대기
  | 'APPROVED'        // 양측 승인 완료
  | 'REJECTED'        // 거부됨
  | 'COMPLETED'       // 이동 완료
  | 'CANCELLED';      // 취소됨

// 전출/전입 유형
export type TransferType =
  | 'TRANSFER_OUT'    // 전출 (다른 계열사로)
  | 'TRANSFER_IN'     // 전입 (다른 계열사에서)
  | 'SECONDMENT';     // 파견

// 전출/전입 요청
export interface TransferRequest extends TenantAwareEntity {
  requestNumber: string;
  type: TransferType;
  status: TransferStatus;

  // 대상 직원
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  currentDepartment: string;
  currentPosition: string;
  currentGrade: string;

  // 전출 테넌트 (현재)
  sourceTenantId: string;
  sourceTenantName: string;
  sourceDepartmentId?: string;
  sourceDepartmentName?: string;

  // 전입 테넌트 (목표)
  targetTenantId: string;
  targetTenantName: string;
  targetDepartmentId?: string;
  targetDepartmentName?: string;
  targetPositionId?: string;
  targetPositionName?: string;
  targetGradeId?: string;
  targetGradeName?: string;

  // 일정
  requestedDate: string;      // 요청일
  effectiveDate: string;      // 발령 예정일
  returnDate?: string;        // 파견 복귀일 (파견인 경우)

  // 상세
  reason: string;             // 이동 사유
  remarks?: string;           // 비고
  handoverItems?: string;     // 인수인계 항목

  // 요청자
  requesterId: string;
  requesterName: string;
  requesterDepartment: string;

  // 승인 정보
  sourceApprovedAt?: string;
  sourceApprovedBy?: string;
  sourceApproverName?: string;
  sourceComment?: string;

  targetApprovedAt?: string;
  targetApprovedBy?: string;
  targetApproverName?: string;
  targetComment?: string;

  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
}

// 목록용
export interface TransferRequestListItem {
  id: string;
  requestNumber: string;
  type: TransferType;
  status: TransferStatus;
  employeeName: string;
  employeeNumber: string;
  sourceTenantName: string;
  targetTenantName: string;
  effectiveDate: string;
  requestedDate: string;
  requesterName: string;
}

// 생성 요청
export interface CreateTransferRequest {
  type: TransferType;
  employeeId: string;
  targetTenantId: string;
  targetDepartmentId?: string;
  targetPositionId?: string;
  targetGradeId?: string;
  effectiveDate: string;
  returnDate?: string;
  reason: string;
  remarks?: string;
  handoverItems?: string;
}

// 수정 요청
export interface UpdateTransferRequest {
  targetDepartmentId?: string;
  targetPositionId?: string;
  targetGradeId?: string;
  effectiveDate?: string;
  returnDate?: string;
  reason?: string;
  remarks?: string;
  handoverItems?: string;
}

// 승인/거부 요청
export interface ApproveTransferRequest {
  comment?: string;
}

export interface RejectTransferRequest {
  comment: string;
}

// 검색 파라미터
export interface TransferSearchParams extends PageRequest {
  keyword?: string;
  type?: TransferType;
  status?: TransferStatus;
  sourceTenantId?: string;
  targetTenantId?: string;
  startDate?: string;
  endDate?: string;
}

// 인수인계 체크리스트 항목
export interface HandoverItem {
  id: string;
  transferId: string;
  category: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
}

// 상태 레이블
export const TRANSFER_STATUS_LABELS: Record<TransferStatus, string> = {
  DRAFT: '임시저장',
  PENDING_SOURCE: '전출 승인대기',
  PENDING_TARGET: '전입 승인대기',
  APPROVED: '승인완료',
  REJECTED: '거부됨',
  COMPLETED: '이동완료',
  CANCELLED: '취소됨',
};

export const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  TRANSFER_OUT: '전출',
  TRANSFER_IN: '전입',
  SECONDMENT: '파견',
};

// 요약 정보
export interface TransferSummary {
  pendingSourceCount: number;
  pendingTargetCount: number;
  approvedCount: number;
  completedThisMonth: number;
}
