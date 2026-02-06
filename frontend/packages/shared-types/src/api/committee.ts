/**
 * 위원회 관리 API Types
 */

// 위원회 유형
export type CommitteeType = 'PERMANENT' | 'TEMPORARY' | 'PROJECT';

// 위원회 상태
export type CommitteeStatus = 'ACTIVE' | 'INACTIVE' | 'DISSOLVED';

// 위원 역할
export type MemberRole = 'CHAIR' | 'VICE_CHAIR' | 'SECRETARY' | 'MEMBER';

// 위원회
export interface Committee {
  id: string;
  code: string;
  name: string;
  type: CommitteeType;
  status: CommitteeStatus;
  purpose: string;
  startDate: string;
  endDate: string | null;
  meetingSchedule: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

// 위원회 목록 아이템
export interface CommitteeListItem {
  id: string;
  code: string;
  name: string;
  type: CommitteeType;
  status: CommitteeStatus;
  memberCount: number;
  exOfficioCount: number; // 당연직 위원 수
  startDate: string;
  endDate: string | null;
}

// 위원
export interface CommitteeMember {
  id: string;
  committeeId: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  departmentName: string;
  role: MemberRole;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  isExOfficio: boolean; // 당연직 여부
  exOfficioRole?: string; // 당연직 직책 (e.g., '인사팀장', '재무팀장')
}

// 위원회 회의록
export interface CommitteeMeeting {
  id: string;
  committeeId: string;
  meetingNumber: string;
  title: string;
  meetingDate: string;
  location: string;
  attendees: string[];
  agenda: string;
  minutes: string;
  decisions: string[];
  attachments: string[];
  createdAt: string;
}

// 위원회 생성 요청
export interface CreateCommitteeRequest {
  code: string;
  name: string;
  type: CommitteeType;
  purpose: string;
  startDate: string;
  endDate?: string;
  meetingSchedule?: string;
}

// 위원 추가 요청
export interface AddCommitteeMemberRequest {
  employeeId: string;
  role: MemberRole;
  startDate: string;
  endDate?: string;
}

// 위원회 검색 파라미터
export interface CommitteeSearchParams {
  type?: CommitteeType;
  status?: CommitteeStatus;
  keyword?: string;
  page?: number;
  size?: number;
}

// 위원회 유형 라벨
export const COMMITTEE_TYPE_LABELS: Record<CommitteeType, string> = {
  PERMANENT: '상설위원회',
  TEMPORARY: '임시위원회',
  PROJECT: '프로젝트위원회',
};

// 위원회 상태 라벨
export const COMMITTEE_STATUS_LABELS: Record<CommitteeStatus, string> = {
  ACTIVE: '활동중',
  INACTIVE: '휴면',
  DISSOLVED: '해산',
};

// 위원 역할 라벨
export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  CHAIR: '위원장',
  VICE_CHAIR: '부위원장',
  SECRETARY: '간사',
  MEMBER: '위원',
};
