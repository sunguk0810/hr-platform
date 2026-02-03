import { TenantAwareEntity, PageRequest } from './common';

export type ApprovalStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type ApprovalType = 'LEAVE_REQUEST' | 'EXPENSE' | 'OVERTIME' | 'PERSONNEL' | 'GENERAL';
export type ApprovalStepStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
export type ApprovalUrgency = 'LOW' | 'NORMAL' | 'HIGH';

export interface Approval extends TenantAwareEntity {
  documentNumber: string;
  type: ApprovalType;
  title: string;
  content: string;
  requesterId: string;
  requesterName: string;
  requesterDepartment: string;
  status: ApprovalStatus;
  urgency: ApprovalUrgency;
  dueDate?: string;
  completedAt?: string;
  attachments?: ApprovalAttachment[];
  steps: ApprovalStep[];
}

export interface ApprovalListItem {
  id: string;
  documentNumber: string;
  type: ApprovalType;
  title: string;
  requesterName: string;
  requesterDepartment: string;
  status: ApprovalStatus;
  urgency: ApprovalUrgency;
  createdAt: string;
  dueDate?: string;
  currentStepName?: string;
}

export interface ApprovalStep {
  id: string;
  stepOrder: number;
  approverType: 'SPECIFIC' | 'ROLE' | 'DEPARTMENT_HEAD';
  approverId?: string;
  approverName?: string;
  status: ApprovalStepStatus;
  comment?: string;
  processedAt?: string;
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
  type?: ApprovalType;
  status?: ApprovalStatus;
  requesterId?: string;
  startDate?: string;
  endDate?: string;
}

export interface CreateApprovalRequest {
  type: ApprovalType;
  title: string;
  content: string;
  urgency?: ApprovalUrgency;
  dueDate?: string;
  approverIds: string[];
  attachmentIds?: string[];
}

export interface ApproveRequest {
  comment?: string;
}

export interface RejectRequest {
  comment: string;
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
