import { TenantAwareEntity, PageRequest } from './common';

// ===== 기본 타입 정의 =====

export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ISSUED' | 'CANCELLED' | 'EXPIRED';
export type CertificateLanguage = 'KO' | 'EN' | 'BOTH';
export type CertificateTypeStatus = 'ACTIVE' | 'INACTIVE';

// Request Status Labels
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING: '승인대기',
  APPROVED: '승인',
  REJECTED: '반려',
  ISSUED: '발급완료',
  CANCELLED: '취소',
  EXPIRED: '만료',
};

// Certificate Language Labels
export const CERTIFICATE_LANGUAGE_LABELS: Record<CertificateLanguage, string> = {
  KO: '한국어',
  EN: '영어',
  BOTH: '국/영문',
};

// ===== 증명서 유형 =====

export interface CertificateType extends TenantAwareEntity {
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  requiresApproval: boolean;
  autoIssue: boolean;
  validDays: number;
  fee: number;
  maxCopiesPerRequest: number;
  status: CertificateTypeStatus;
  templateId?: string;
  sortOrder?: number;
}

// ===== 증명서 신청 =====

export interface CertificateRequest extends TenantAwareEntity {
  requestNumber: string;
  certificateTypeId: string;
  certificateTypeName: string;
  certificateType?: CertificateType;
  employeeId: string;
  employeeName?: string;
  employeeNumber?: string;
  purpose?: string;
  submissionTarget?: string;
  copies: number;
  language: CertificateLanguage;
  includeSalary: boolean;
  status: RequestStatus;
  approvedAt?: string;
  approvedBy?: string;
  approverName?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  issuedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  issues?: CertificateIssue[];
  periodFrom?: string;
  periodTo?: string;
  customFields?: Record<string, unknown>;
  remarks?: string;
  approvalId?: string;
  issuedBy?: string;
}

// ===== 발급 이력 =====

export interface CertificateIssue extends TenantAwareEntity {
  requestId: string;
  issueNumber: string;
  verificationCode: string;
  fileId: string;
  fileName?: string;
  fileSize?: number;
  downloadUrl?: string;
  issuedAt: string;
  expiresAt: string;
  revoked: boolean;
  revokedAt?: string;
  revokedBy?: string;
  revokeReason?: string;
  downloadCount: number;
  downloadedAt?: string;
  certificateTypeName?: string;
  employeeName?: string;
  employeeNumber?: string;
  contentSnapshot?: string;
  issuedBy?: string;
  verifiedCount?: number;
  lastVerifiedAt?: string;
  valid?: boolean;
  expired?: boolean;
}

// ===== 진위확인 결과 =====

export interface VerificationResult {
  isValid: boolean;
  certificateType?: string;
  certificateTypeName?: string;
  employeeName?: string;
  companyName?: string;
  issuedAt?: string;
  expiresAt?: string;
  issueNumber?: string;
  reason?: string;
  message?: string;
  isRevoked?: boolean;
  isExpired?: boolean;
}

// ===== Request DTOs =====

export interface CreateCertificateRequestRequest {
  certificateTypeId: string;
  purpose?: string;
  submissionTarget?: string;
  copies: number;
  language: CertificateLanguage;
  includeSalary: boolean;
}

export interface CertificateRequestSearchParams extends PageRequest {
  status?: RequestStatus;
  typeCode?: string;
  startDate?: string;
  endDate?: string;
}

export interface CertificateIssueSearchParams extends PageRequest {
  typeCode?: string;
  startDate?: string;
  endDate?: string;
  includeExpired?: boolean;
}

// ===== 관리자용 DTOs =====

export interface ApproveCertificateRequestRequest {
  requestId: string;
  approved: boolean;
  rejectionReason?: string;
}

export interface RevokeCertificateRequest {
  issueId: string;
  reason: string;
}

export interface CreateCertificateTypeRequest {
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  requiresApproval: boolean;
  autoIssue: boolean;
  validDays: number;
  fee: number;
  maxCopiesPerRequest: number;
  templateId?: string;
  sortOrder?: number;
}

export interface UpdateCertificateTypeRequest {
  name?: string;
  nameEn?: string;
  description?: string;
  requiresApproval?: boolean;
  autoIssue?: boolean;
  validDays?: number;
  fee?: number;
  maxCopiesPerRequest?: number;
  status?: CertificateTypeStatus;
  templateId?: string;
  sortOrder?: number;
}

// ===== 통계 =====

export interface CertificateStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  issuedCount: number;
  totalDownloads: number;
  byType: Array<{
    typeCode: string;
    typeName: string;
    count: number;
  }>;
}
