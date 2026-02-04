/**
 * 정현원 관리 (Headcount Management) API Types
 */

// 정현원 상태
export type HeadcountStatus = 'DRAFT' | 'APPROVED' | 'ACTIVE' | 'CLOSED';

// 정현원 요청 상태
export type HeadcountRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

// 정현원 요청 유형
export type HeadcountRequestType = 'INCREASE' | 'DECREASE' | 'TRANSFER';

// 정현원 계획 (부서별 정현원)
export interface HeadcountPlan {
  id: string;
  year: number;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  gradeId: string;
  gradeName: string;
  plannedCount: number;
  actualCount: number;
  variance: number;
  status: HeadcountStatus;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

// 정현원 계획 목록 아이템
export interface HeadcountPlanListItem {
  id: string;
  year: number;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  gradeId: string;
  gradeName: string;
  plannedCount: number;
  actualCount: number;
  variance: number;
  status: HeadcountStatus;
}

// 정현원 요약
export interface HeadcountSummary {
  year: number;
  totalPlanned: number;
  totalActual: number;
  totalVariance: number;
  departmentSummaries: DepartmentHeadcountSummary[];
}

// 부서별 정현원 요약
export interface DepartmentHeadcountSummary {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  plannedCount: number;
  actualCount: number;
  variance: number;
  vacancies: number;
}

// 정현원 변경 요청
export interface HeadcountRequest {
  id: string;
  requestNumber: string;
  type: HeadcountRequestType;
  status: HeadcountRequestStatus;
  departmentId: string;
  departmentName: string;
  gradeId: string;
  gradeName: string;
  requestedCount: number;
  currentCount: number;
  reason: string;
  effectiveDate: string;
  requesterId: string;
  requesterName: string;
  approverId: string | null;
  approverName: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

// 정현원 변경 요청 목록 아이템
export interface HeadcountRequestListItem {
  id: string;
  requestNumber: string;
  type: HeadcountRequestType;
  status: HeadcountRequestStatus;
  departmentName: string;
  gradeName: string;
  requestedCount: number;
  currentCount: number;
  requesterName: string;
  effectiveDate: string;
  createdAt: string;
}

// 정현원 계획 생성 요청
export interface CreateHeadcountPlanRequest {
  year: number;
  departmentId: string;
  gradeId: string;
  plannedCount: number;
  remarks?: string;
}

// 정현원 계획 수정 요청
export interface UpdateHeadcountPlanRequest {
  plannedCount?: number;
  remarks?: string;
}

// 정현원 변경 요청 생성
export interface CreateHeadcountRequest {
  type: HeadcountRequestType;
  departmentId: string;
  gradeId: string;
  requestedCount: number;
  reason: string;
  effectiveDate: string;
  remarks?: string;
}

// 정현원 계획 검색 파라미터
export interface HeadcountPlanSearchParams {
  year?: number;
  departmentId?: string;
  gradeId?: string;
  status?: HeadcountStatus;
  page?: number;
  size?: number;
}

// 정현원 요청 검색 파라미터
export interface HeadcountRequestSearchParams {
  type?: HeadcountRequestType;
  status?: HeadcountRequestStatus;
  departmentId?: string;
  page?: number;
  size?: number;
}

// 정현원 상태 라벨
export const HEADCOUNT_STATUS_LABELS: Record<HeadcountStatus, string> = {
  DRAFT: '초안',
  APPROVED: '승인됨',
  ACTIVE: '적용중',
  CLOSED: '종료',
};

// 정현원 요청 상태 라벨
export const HEADCOUNT_REQUEST_STATUS_LABELS: Record<HeadcountRequestStatus, string> = {
  PENDING: '대기중',
  APPROVED: '승인',
  REJECTED: '반려',
  CANCELLED: '취소',
};

// 정현원 요청 유형 라벨
export const HEADCOUNT_REQUEST_TYPE_LABELS: Record<HeadcountRequestType, string> = {
  INCREASE: '증원',
  DECREASE: '감원',
  TRANSFER: '전환',
};
