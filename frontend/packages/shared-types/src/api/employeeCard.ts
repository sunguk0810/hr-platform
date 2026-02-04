/**
 * 사원증 관리 API Types
 */

// 사원증 상태
export type EmployeeCardStatus = 'ACTIVE' | 'EXPIRED' | 'LOST' | 'REVOKED' | 'PENDING';

// 사원증 발급 유형
export type CardIssueType = 'NEW' | 'REISSUE' | 'RENEWAL';

// 사원증
export interface EmployeeCard {
  id: string;
  cardNumber: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  departmentName: string;
  positionName: string | null;
  gradeName: string | null;
  photoUrl: string | null;
  status: EmployeeCardStatus;
  issueType: CardIssueType;
  issueDate: string;
  expiryDate: string;
  accessLevel: string;
  rfidEnabled: boolean;
  qrCode: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}

// 사원증 목록 아이템
export interface EmployeeCardListItem {
  id: string;
  cardNumber: string;
  employeeName: string;
  employeeNumber: string;
  departmentName: string;
  status: EmployeeCardStatus;
  issueDate: string;
  expiryDate: string;
}

// 사원증 발급 요청
export interface CardIssueRequest {
  id: string;
  requestNumber: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  departmentName: string;
  issueType: CardIssueType;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED';
  requesterId: string;
  requesterName: string;
  approverId: string | null;
  approverName: string | null;
  approvedAt: string | null;
  issuedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// 사원증 발급 요청 목록 아이템
export interface CardIssueRequestListItem {
  id: string;
  requestNumber: string;
  employeeName: string;
  employeeNumber: string;
  departmentName: string;
  issueType: CardIssueType;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED';
  createdAt: string;
}

// 사원증 발급 신청 생성
export interface CreateCardIssueRequest {
  employeeId: string;
  issueType: CardIssueType;
  reason: string;
}

// 사원증 분실 신고
export interface ReportLostCardRequest {
  cardId: string;
  lostDate: string;
  location: string;
  description: string;
}

// 사원증 검색 파라미터
export interface EmployeeCardSearchParams {
  status?: EmployeeCardStatus;
  keyword?: string;
  departmentId?: string;
  page?: number;
  size?: number;
}

// 사원증 상태 라벨
export const EMPLOYEE_CARD_STATUS_LABELS: Record<EmployeeCardStatus, string> = {
  ACTIVE: '사용중',
  EXPIRED: '만료',
  LOST: '분실',
  REVOKED: '회수',
  PENDING: '발급대기',
};

// 사원증 발급 유형 라벨
export const CARD_ISSUE_TYPE_LABELS: Record<CardIssueType, string> = {
  NEW: '신규발급',
  REISSUE: '재발급',
  RENEWAL: '갱신',
};
