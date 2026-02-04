import { TenantAwareEntity, PageRequest } from './common';

// ===== 기본 타입 정의 =====

export type EmploymentStatus = 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED' | 'RETIRED';
export type Gender = 'MALE' | 'FEMALE';

// SDD 3.2.1 기준 추가 타입
export type EmploymentType = 'REGULAR' | 'CONTRACT' | 'PARTTIME' | 'INTERN' | 'DISPATCH';
export type ResignationType = 'VOLUNTARY' | 'DISMISSAL' | 'RETIREMENT' | 'CONTRACT_END' | 'TRANSFER';
export type MilitaryStatus = 'NOT_APPLICABLE' | 'COMPLETED' | 'EXEMPT' | 'SERVING' | 'NOT_SERVED';

// ===== Employee 엔티티 =====

export interface Employee extends TenantAwareEntity {
  employeeNumber: string;
  name: string;
  nameEn?: string;
  nameChinese?: string;
  email: string;
  mobile?: string;
  phone?: string;
  birthDate?: string;
  gender?: Gender;
  hireDate: string;
  resignationDate?: string;
  employmentStatus: EmploymentStatus;
  employmentType?: EmploymentType;
  contractEndDate?: string;
  resignationType?: ResignationType;
  resignationReason?: string;
  departmentId: string;
  departmentName: string;
  positionId?: string;
  positionName?: string;
  gradeId?: string;
  gradeName?: string;
  jobFamilyId?: string;
  jobFamilyName?: string;
  managerId?: string;
  managerName?: string;
  profileImageUrl?: string;
  workLocation?: string;
  userId?: string;
  previousEmployeeId?: string; // 전입 시 이전 사번
}

export interface EmployeeListItem {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  departmentName: string;
  positionName?: string;
  gradeName?: string;
  employmentStatus: EmploymentStatus;
  employmentType?: EmploymentType;
  hireDate: string;
  profileImageUrl?: string;
}

// ===== SDD 3.2.2 기준: EmployeeDetail =====

export interface EmployeeDetail {
  employeeId: string;
  birthDate?: string;
  gender?: Gender;
  nationality?: string;
  // 주소
  address?: string;
  addressDetail?: string;
  postalCode?: string;
  // 비상연락처
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  // 은행정보 (마스킹)
  bankCode?: string;
  bankName?: string;
  bankAccount?: string;
  // 병역
  militaryStatus?: MilitaryStatus;
  militaryBranch?: string;
  militaryRank?: string;
  militaryStartDate?: string;
  militaryEndDate?: string;
  // 장애
  disabilityGrade?: string;
  disabilityType?: string;
  // 혈액형
  bloodType?: string;
  // 주민등록번호 (마스킹)
  residentNumber?: string;
}

// ===== 검색 및 CRUD 요청 =====

export interface EmployeeSearchParams extends PageRequest {
  keyword?: string;
  departmentId?: string;
  employmentStatus?: EmploymentStatus;
  employmentType?: EmploymentType;
  hireStartDate?: string;
  hireEndDate?: string;
}

export interface CreateEmployeeRequest {
  employeeNumber: string;
  name: string;
  nameEn?: string;
  nameChinese?: string;
  email: string;
  mobile?: string;
  phone?: string;
  birthDate?: string;
  gender?: Gender;
  hireDate: string;
  employmentType?: EmploymentType;
  contractEndDate?: string;
  departmentId: string;
  positionId?: string;
  gradeId?: string;
  jobFamilyId?: string;
  managerId?: string;
  workLocation?: string;
}

export interface UpdateEmployeeRequest {
  name?: string;
  nameEn?: string;
  nameChinese?: string;
  email?: string;
  mobile?: string;
  phone?: string;
  birthDate?: string;
  gender?: Gender;
  employmentType?: EmploymentType;
  contractEndDate?: string;
  departmentId?: string;
  positionId?: string;
  gradeId?: string;
  jobFamilyId?: string;
  managerId?: string;
  workLocation?: string;
}

// ===== SDD 4.3 기준: 퇴직 처리 =====

export interface ResignationRequest {
  resignationDate: string;
  resignationType: ResignationType;
  resignationReason?: string;
  lastWorkingDate: string;
  handoverEmployeeId?: string;
  approvalId?: string;
}

export interface ResignationCancelRequest {
  reason: string;
  approvalId?: string;
}

// ===== SDD 4.4 기준: 계열사 전출/전입 =====

export type TransferType = 'PERMANENT' | 'TEMPORARY' | 'DISPATCH';
export type TransferStatus =
  | 'PENDING_SOURCE_APPROVAL'
  | 'PENDING_TARGET_APPROVAL'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface TransferRequest {
  targetTenantId: string;
  targetDepartmentId: string;
  effectiveDate: string;
  transferType: TransferType;
  reason?: string;
}

export interface TransferApprovalRequest {
  approved: boolean;
  targetGradeId?: string;
  targetPositionId?: string;
  remarks?: string;
}

export interface EmployeeTransfer {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  sourceTenantId: string;
  sourceTenantName: string;
  sourceDepartmentId: string;
  sourceDepartmentName: string;
  targetTenantId: string;
  targetTenantName: string;
  targetDepartmentId: string;
  targetDepartmentName: string;
  targetGradeId?: string;
  targetGradeName?: string;
  targetPositionId?: string;
  targetPositionName?: string;
  effectiveDate: string;
  transferType: TransferType;
  status: TransferStatus;
  reason?: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: string;
  sourceApprovedBy?: string;
  sourceApprovedByName?: string;
  sourceApprovedAt?: string;
  sourceRemarks?: string;
  targetApprovedBy?: string;
  targetApprovedByName?: string;
  targetApprovedAt?: string;
  targetRemarks?: string;
}

export interface TransferSearchParams extends PageRequest {
  status?: TransferStatus;
  transferType?: TransferType;
  sourceTenantId?: string;
  targetTenantId?: string;
}

// ===== SDD 4.5 기준: 개인정보 마스킹 해제 =====

export type PrivacyField =
  | 'residentNumber'
  | 'bankAccount'
  | 'address'
  | 'mobile'
  | 'email'
  | 'birthDate'
  | 'phone';

export interface UnmaskRequest {
  fields: PrivacyField[];
  purpose: string;
  approvalId?: string;
}

export interface UnmaskResponse {
  data: Record<PrivacyField, string>;
  validUntil: string;
  accessLogId: string;
}

// ===== SDD 4.6 기준: 인사기록카드 =====

export interface FamilyMember {
  id: string;
  relation: string;
  name: string;
  birthDate?: string;
  occupation?: string;
  isCohabitant?: boolean;
  isDependent?: boolean;
  phone?: string;
  remark?: string;
}

export interface Education {
  id: string;
  schoolType: string; // 고등학교, 대학교, 대학원 등
  schoolName: string;
  major?: string;
  degree?: string;
  admissionDate?: string;
  graduationDate?: string;
  graduationStatus: 'GRADUATED' | 'ENROLLED' | 'DROPPED_OUT' | 'ON_LEAVE';
  location?: string;
}

export interface Career {
  id: string;
  companyName: string;
  department?: string;
  position?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  duties?: string;
  resignationReason?: string;
}

export interface Certificate {
  id: string;
  certificateName: string;
  issuingOrg: string;
  acquisitionDate: string;
  expirationDate?: string;
  certificateNumber?: string;
  grade?: string;
  isExpired?: boolean;
}

export interface Appointment {
  id: string;
  effectiveDate: string;
  appointmentType: string; // 승진, 보직변경, 부서이동 등
  appointmentTypeName: string;
  fromDepartmentId?: string;
  fromDepartmentName?: string;
  toDepartmentId?: string;
  toDepartmentName?: string;
  fromGradeId?: string;
  fromGradeName?: string;
  toGradeId?: string;
  toGradeName?: string;
  fromPositionId?: string;
  fromPositionName?: string;
  toPositionId?: string;
  toPositionName?: string;
  reason?: string;
  approvalId?: string;
  approvalStatus?: string;
}

export interface Award {
  id: string;
  awardDate: string;
  awardType: string;
  awardTypeName: string;
  awardName: string;
  reason?: string;
  issuingOrg?: string;
  amount?: number;
}

export interface Disciplinary {
  id: string;
  effectiveDate: string;
  disciplinaryType: string;
  disciplinaryTypeName: string;
  reason: string;
  duration?: number; // 일 수
  endDate?: string;
  isCurrent?: boolean;
}

export interface RecordCard {
  employee: Employee;
  detail: EmployeeDetail;
  family: FamilyMember[];
  education: Education[];
  career: Career[];
  certificates: Certificate[];
  appointments: Appointment[];
  awards: Award[];
  disciplinary: Disciplinary[];
  generatedAt: string;
}

// ===== SDD 3.2.7 기준: 인사정보 변경 이력 =====

export type HistoryType =
  | 'CREATE'
  | 'UPDATE'
  | 'STATUS_CHANGE'
  | 'TRANSFER'
  | 'PROMOTION'
  | 'RESIGNATION'
  | 'REINSTATEMENT'
  | 'DEPARTMENT_CHANGE'
  | 'GRADE_CHANGE'
  | 'POSITION_CHANGE';

export interface EmployeeHistory {
  id: string;
  employeeId: string;
  historyType: HistoryType;
  historyTypeName: string;
  changedField?: string;
  changedFieldName?: string;
  oldValue?: string;
  newValue?: string;
  effectiveDate: string;
  reason?: string;
  approvalId?: string;
  changedBy: string;
  changedByName: string;
  changedAt: string;
  ipAddress?: string;
}

export interface EmployeeHistorySearchParams extends PageRequest {
  historyType?: HistoryType;
  startDate?: string;
  endDate?: string;
}

// ===== PRD FR-ORG-002: 겸직/보직 관리 =====

export type ConcurrentPositionStatus = 'ACTIVE' | 'ENDED';

export interface ConcurrentPosition {
  id: string;
  employeeId: string;
  employeeName?: string;
  departmentId: string;
  departmentName: string;
  positionId?: string;
  positionName?: string;
  gradeId?: string;
  gradeName?: string;
  isPrimary: boolean; // true: 주소속, false: 부소속(겸직)
  startDate: string;
  endDate?: string;
  status: ConcurrentPositionStatus;
  reason?: string; // 겸직 사유
  approvalId?: string; // 결재 연계
  createdAt: string;
  createdBy: string;
  createdByName?: string;
}

export interface CreateConcurrentPositionRequest {
  employeeId: string;
  departmentId: string;
  positionId?: string;
  gradeId?: string;
  isPrimary: boolean;
  startDate: string;
  endDate?: string;
  reason?: string;
}

export interface UpdateConcurrentPositionRequest {
  positionId?: string;
  gradeId?: string;
  endDate?: string;
  reason?: string;
}

export interface EndConcurrentPositionRequest {
  endDate: string;
  reason?: string;
}

export interface ConcurrentPositionSearchParams extends PageRequest {
  employeeId?: string;
  departmentId?: string;
  status?: ConcurrentPositionStatus;
  isPrimary?: boolean;
}

// ===== PRD FR-EMP-002: 개인정보 조회 승인/이력 =====

export type PrivacyAccessStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

export interface PrivacyAccessRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterDepartment?: string;
  targetEmployeeId: string;
  targetEmployeeName: string;
  targetEmployeeNumber: string;
  fields: PrivacyField[];
  purpose: string;
  status: PrivacyAccessStatus;
  approverId?: string;
  approverName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  expiresAt?: string;
  accessedAt?: string;
  createdAt: string;
}

export interface CreatePrivacyAccessRequest {
  targetEmployeeId: string;
  fields: PrivacyField[];
  purpose: string;
}

export interface ApprovePrivacyAccessRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface PrivacyAccessLog {
  id: string;
  requestId?: string;
  accessorId: string;
  accessorName: string;
  accessorDepartment?: string;
  targetEmployeeId: string;
  targetEmployeeName: string;
  targetEmployeeNumber: string;
  field: PrivacyField;
  purpose: string;
  accessedAt: string;
  ipAddress?: string;
  userAgent?: string;
  approvalStatus?: PrivacyAccessStatus;
  approvedBy?: string;
}

export interface PrivacyAccessLogSearchParams extends PageRequest {
  targetEmployeeId?: string;
  accessorId?: string;
  field?: PrivacyField;
  startDate?: string;
  endDate?: string;
}

export interface PrivacyAccessRequestSearchParams extends PageRequest {
  status?: PrivacyAccessStatus;
  targetEmployeeId?: string;
  requesterId?: string;
}
