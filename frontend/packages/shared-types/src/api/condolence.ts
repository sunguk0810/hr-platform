/**
 * 경조비 관리 API Types
 */

// 경조 유형
export type CondolenceType =
  | 'MARRIAGE'       // 결혼
  | 'CHILDBIRTH'     // 출산
  | 'FIRST_BIRTHDAY' // 돌잔치
  | 'DEATH_PARENT'   // 부모 사망
  | 'DEATH_SPOUSE'   // 배우자 사망
  | 'DEATH_CHILD'    // 자녀 사망
  | 'DEATH_SIBLING'  // 형제자매 사망
  | 'DEATH_GRANDPARENT' // 조부모 사망
  | 'HOSPITALIZATION' // 본인 입원
  | 'OTHER';         // 기타

// 경조비 신청 상태
export type CondolenceRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'CANCELLED';

// 경조비 신청
export interface CondolenceRequest {
  id: string;
  requestNumber?: string;
  employeeId: string;
  employeeName: string;
  employeeNumber?: string;
  departmentName: string;
  eventType: CondolenceType;
  status: CondolenceRequestStatus;
  relatedPersonName: string;       // 대상자 (본인, 가족 등)
  relation: string;     // 관계
  eventDate: string;        // 경조 발생일
  amount: number;           // 지급 금액
  leaveDays: number;     // 경조휴가 일수
  description: string;      // 상세 내용
  attachments?: string[];    // 첨부파일 ID
  requesterId?: string;
  requesterName?: string;
  approverId?: string | null;
  approverName?: string | null;
  approvedAt?: string | null;
  rejectReason: string | null;
  paidDate: string | null;
  policyId?: string;
  approvalId?: string;
  createdAt: string;
  updatedAt: string;
}

// 경조비 신청 목록 아이템
export interface CondolenceRequestListItem {
  id: string;
  requestNumber: string;
  employeeName: string;
  employeeNumber: string;
  departmentName: string;
  eventType: CondolenceType;
  status: CondolenceRequestStatus;
  eventDate: string;
  amount: number;
  createdAt: string;
}

// 경조비 지급 규정
export interface CondolencePolicy {
  id: string;
  eventType: CondolenceType;
  name?: string;
  amount: number;
  leaveDays: number;
  description: string;
  isActive: boolean;
  sortOrder?: number;
}

// 경조비 신청 생성 요청
export interface CreateCondolenceRequest {
  eventType: CondolenceType;
  relatedPersonName: string;
  relation: string;
  eventDate: string;
  description: string;
  attachments?: string[];
}

// 경조비 검색 파라미터
export interface CondolenceSearchParams {
  eventType?: CondolenceType;
  status?: CondolenceRequestStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
}

// 경조 유형 라벨
export const CONDOLENCE_TYPE_LABELS: Record<CondolenceType, string> = {
  MARRIAGE: '결혼',
  CHILDBIRTH: '출산',
  FIRST_BIRTHDAY: '돌잔치',
  DEATH_PARENT: '부모 상',
  DEATH_SPOUSE: '배우자 상',
  DEATH_CHILD: '자녀 상',
  DEATH_SIBLING: '형제자매 상',
  DEATH_GRANDPARENT: '조부모 상',
  HOSPITALIZATION: '본인 입원',
  OTHER: '기타',
};

// 경조비 상태 라벨
export const CONDOLENCE_STATUS_LABELS: Record<CondolenceRequestStatus, string> = {
  PENDING: '대기중',
  APPROVED: '승인',
  REJECTED: '반려',
  PAID: '지급완료',
  CANCELLED: '취소',
};
