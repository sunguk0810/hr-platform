import { http, HttpResponse, delay } from 'msw';
import type {
  Employee,
  EmployeeListItem,
  EmploymentStatus,
  EmployeeDetail,
  EmployeeTransfer,
  TransferStatus,
  RecordCard,
  EmployeeHistory,
  HistoryType,
  FamilyMember,
  Education,
  Career,
  Certificate,
  Appointment,
  Award,
  Disciplinary,
  ConcurrentPosition,
  ConcurrentPositionStatus,
  PrivacyAccessRequest,
  PrivacyAccessLog,
  PrivacyAccessStatus,
  PrivacyField,
} from '@hr-platform/shared-types';

const mockEmployees: Employee[] = [
  {
    id: 'emp-001',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024001',
    name: '홍길동',
    nameEn: 'Gil-dong Hong',
    email: 'hong@example.com',
    mobile: '010-1234-5678',
    birthDate: '1985-03-15',
    gender: 'MALE',
    hireDate: '2020-01-02',
    employmentStatus: 'ACTIVE',
    employmentType: 'REGULAR',
    departmentId: 'dept-001',
    departmentName: '개발팀',
    positionId: 'pos-001',
    positionName: '팀장',
    gradeId: 'grade-001',
    gradeName: '부장',
    managerId: undefined,
    managerName: undefined,
    profileImageUrl: undefined,
    createdAt: '2020-01-02T09:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'emp-002',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024002',
    name: '김철수',
    email: 'kim.cs@example.com',
    mobile: '010-2345-6789',
    birthDate: '1990-07-22',
    gender: 'MALE',
    hireDate: '2021-03-15',
    employmentStatus: 'ACTIVE',
    employmentType: 'REGULAR',
    departmentId: 'dept-001',
    departmentName: '개발팀',
    positionId: 'pos-002',
    positionName: '선임',
    gradeId: 'grade-003',
    gradeName: '과장',
    managerId: 'emp-001',
    managerName: '홍길동',
    profileImageUrl: undefined,
    createdAt: '2021-03-15T09:00:00Z',
    updatedAt: '2024-02-10T14:20:00Z',
  },
  {
    id: 'emp-003',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024003',
    name: '이영희',
    email: 'lee.yh@example.com',
    mobile: '010-3456-7890',
    birthDate: '1988-11-30',
    gender: 'FEMALE',
    hireDate: '2019-06-01',
    employmentStatus: 'ACTIVE',
    employmentType: 'REGULAR',
    departmentId: 'dept-002',
    departmentName: '인사팀',
    positionId: 'pos-003',
    positionName: '매니저',
    gradeId: 'grade-002',
    gradeName: '차장',
    managerId: undefined,
    managerName: undefined,
    profileImageUrl: undefined,
    createdAt: '2019-06-01T09:00:00Z',
    updatedAt: '2024-01-20T11:00:00Z',
  },
  {
    id: 'emp-004',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024004',
    name: '박지민',
    email: 'park.jm@example.com',
    mobile: '010-4567-8901',
    birthDate: '1992-04-18',
    gender: 'FEMALE',
    hireDate: '2022-02-14',
    employmentStatus: 'ON_LEAVE',
    employmentType: 'REGULAR',
    departmentId: 'dept-003',
    departmentName: '재무팀',
    positionId: 'pos-004',
    positionName: '주임',
    gradeId: 'grade-004',
    gradeName: '대리',
    managerId: 'emp-003',
    managerName: '이영희',
    profileImageUrl: undefined,
    createdAt: '2022-02-14T09:00:00Z',
    updatedAt: '2024-03-01T09:00:00Z',
  },
  {
    id: 'emp-005',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024005',
    name: '최수진',
    email: 'choi.sj@example.com',
    mobile: '010-5678-9012',
    birthDate: '1983-09-05',
    gender: 'FEMALE',
    hireDate: '2018-04-02',
    employmentStatus: 'ACTIVE',
    employmentType: 'REGULAR',
    departmentId: 'dept-004',
    departmentName: '마케팅팀',
    positionId: 'pos-001',
    positionName: '팀장',
    gradeId: 'grade-001',
    gradeName: '부장',
    managerId: undefined,
    managerName: undefined,
    profileImageUrl: undefined,
    createdAt: '2018-04-02T09:00:00Z',
    updatedAt: '2024-02-28T16:45:00Z',
  },
  {
    id: 'emp-006',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024006',
    name: '정민호',
    email: 'jung.mh@example.com',
    mobile: '010-6789-0123',
    birthDate: '1987-12-25',
    gender: 'MALE',
    hireDate: '2020-08-17',
    employmentStatus: 'ACTIVE',
    employmentType: 'REGULAR',
    departmentId: 'dept-001',
    departmentName: '개발팀',
    positionId: 'pos-005',
    positionName: '책임',
    gradeId: 'grade-002',
    gradeName: '차장',
    managerId: 'emp-001',
    managerName: '홍길동',
    profileImageUrl: undefined,
    createdAt: '2020-08-17T09:00:00Z',
    updatedAt: '2024-01-10T13:15:00Z',
  },
  {
    id: 'emp-007',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024007',
    name: '강하늘',
    email: 'kang.hn@example.com',
    mobile: '010-7890-1234',
    birthDate: '1991-06-10',
    gender: 'FEMALE',
    hireDate: '2021-11-01',
    employmentStatus: 'ACTIVE',
    employmentType: 'REGULAR',
    departmentId: 'dept-005',
    departmentName: '디자인팀',
    positionId: 'pos-002',
    positionName: '선임',
    gradeId: 'grade-003',
    gradeName: '과장',
    managerId: 'emp-005',
    managerName: '최수진',
    profileImageUrl: undefined,
    createdAt: '2021-11-01T09:00:00Z',
    updatedAt: '2024-02-05T10:00:00Z',
  },
  {
    id: 'emp-008',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024008',
    name: '윤서연',
    email: 'yoon.sy@example.com',
    mobile: '010-8901-2345',
    birthDate: '1995-01-28',
    gender: 'FEMALE',
    hireDate: '2023-01-09',
    resignationDate: '2024-02-29',
    employmentStatus: 'RESIGNED',
    employmentType: 'REGULAR',
    resignationType: 'VOLUNTARY',
    resignationReason: '개인 사유',
    departmentId: 'dept-002',
    departmentName: '인사팀',
    positionId: 'pos-004',
    positionName: '주임',
    gradeId: 'grade-005',
    gradeName: '사원',
    managerId: 'emp-003',
    managerName: '이영희',
    profileImageUrl: undefined,
    createdAt: '2023-01-09T09:00:00Z',
    updatedAt: '2024-02-29T18:00:00Z',
  },
  {
    id: 'emp-009',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024009',
    name: '임준혁',
    email: 'lim.jh@example.com',
    mobile: '010-9012-3456',
    birthDate: '1980-08-14',
    gender: 'MALE',
    hireDate: '2015-03-02',
    employmentStatus: 'ACTIVE',
    employmentType: 'REGULAR',
    departmentId: 'dept-006',
    departmentName: '영업팀',
    positionId: 'pos-001',
    positionName: '팀장',
    gradeId: 'grade-001',
    gradeName: '부장',
    managerId: undefined,
    managerName: undefined,
    profileImageUrl: undefined,
    createdAt: '2015-03-02T09:00:00Z',
    updatedAt: '2024-03-10T11:30:00Z',
  },
  {
    id: 'emp-010',
    tenantId: 'tenant-001',
    employeeNumber: 'EMP2024010',
    name: '한예진',
    email: 'han.yj@example.com',
    mobile: '010-0123-4567',
    birthDate: '1998-05-20',
    gender: 'FEMALE',
    hireDate: '2024-01-02',
    employmentStatus: 'ACTIVE',
    employmentType: 'REGULAR',
    departmentId: 'dept-001',
    departmentName: '개발팀',
    positionId: 'pos-006',
    positionName: '사원',
    gradeId: 'grade-005',
    gradeName: '사원',
    managerId: 'emp-001',
    managerName: '홍길동',
    profileImageUrl: undefined,
    createdAt: '2024-01-02T09:00:00Z',
    updatedAt: '2024-01-02T09:00:00Z',
  },
];

// Mock Employee Details
const mockEmployeeDetails: Record<string, EmployeeDetail> = {
  'emp-001': {
    employeeId: 'emp-001',
    birthDate: '1985-03-15',
    gender: 'MALE',
    nationality: '대한민국',
    address: '서울특별시 강남구 테헤란로 123',
    addressDetail: '456동 789호',
    postalCode: '06234',
    emergencyContact: '홍부모',
    emergencyPhone: '010-9999-8888',
    emergencyRelation: '부',
    bankCode: '004',
    bankName: '국민은행',
    bankAccount: '123-456-789012',
    militaryStatus: 'COMPLETED',
    militaryBranch: '육군',
    militaryRank: '병장',
    militaryStartDate: '2005-03-01',
    militaryEndDate: '2007-02-28',
    bloodType: 'A+',
  },
};

// Mock Transfers
const mockTransfers: EmployeeTransfer[] = [
  {
    id: 'transfer-001',
    employeeId: 'emp-002',
    employeeName: '김철수',
    employeeNumber: 'EMP2024002',
    sourceTenantId: 'tenant-001',
    sourceTenantName: '본사',
    sourceDepartmentId: 'dept-001',
    sourceDepartmentName: '개발팀',
    targetTenantId: 'tenant-002',
    targetTenantName: '삼성전자',
    targetDepartmentId: 'dept-101',
    targetDepartmentName: '플랫폼팀',
    effectiveDate: '2024-04-01',
    transferType: 'PERMANENT',
    status: 'PENDING_SOURCE_APPROVAL',
    reason: '그룹사 인력 재배치',
    requestedBy: 'emp-003',
    requestedByName: '이영희',
    requestedAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 'transfer-002',
    employeeId: 'emp-006',
    employeeName: '정민호',
    employeeNumber: 'EMP2024006',
    sourceTenantId: 'tenant-001',
    sourceTenantName: '본사',
    sourceDepartmentId: 'dept-001',
    sourceDepartmentName: '개발팀',
    targetTenantId: 'tenant-003',
    targetTenantName: '삼성디스플레이',
    targetDepartmentId: 'dept-201',
    targetDepartmentName: 'IT인프라팀',
    effectiveDate: '2024-05-01',
    transferType: 'DISPATCH',
    status: 'PENDING_TARGET_APPROVAL',
    reason: '파견 근무',
    requestedBy: 'emp-001',
    requestedByName: '홍길동',
    requestedAt: '2024-03-10T14:00:00Z',
    sourceApprovedBy: 'emp-009',
    sourceApprovedByName: '임준혁',
    sourceApprovedAt: '2024-03-12T09:00:00Z',
  },
];

// Mock History
const mockHistories: Record<string, EmployeeHistory[]> = {
  'emp-001': [
    {
      id: 'hist-001',
      employeeId: 'emp-001',
      historyType: 'PROMOTION',
      historyTypeName: '승진',
      changedField: 'gradeId',
      changedFieldName: '직급',
      oldValue: '차장',
      newValue: '부장',
      effectiveDate: '2023-01-01',
      reason: '정기 승진',
      changedBy: 'system',
      changedByName: '시스템',
      changedAt: '2023-01-01T00:00:00Z',
      ipAddress: '192.168.1.1',
    },
    {
      id: 'hist-002',
      employeeId: 'emp-001',
      historyType: 'DEPARTMENT_CHANGE',
      historyTypeName: '부서이동',
      changedField: 'departmentId',
      changedFieldName: '부서',
      oldValue: '기획팀',
      newValue: '개발팀',
      effectiveDate: '2022-03-01',
      reason: '조직개편',
      changedBy: 'emp-003',
      changedByName: '이영희',
      changedAt: '2022-03-01T09:00:00Z',
      ipAddress: '192.168.1.100',
    },
    {
      id: 'hist-003',
      employeeId: 'emp-001',
      historyType: 'CREATE',
      historyTypeName: '입사',
      effectiveDate: '2020-01-02',
      reason: '신규 입사',
      changedBy: 'system',
      changedByName: '시스템',
      changedAt: '2020-01-02T09:00:00Z',
    },
  ],
};

// Mock Family Members
const mockFamilies: Record<string, FamilyMember[]> = {
  'emp-001': [
    {
      id: 'fam-001',
      relation: '배우자',
      name: '김영희',
      birthDate: '1987-05-20',
      occupation: '회사원',
      isCohabitant: true,
      isDependent: true,
      phone: '010-1111-2222',
    },
    {
      id: 'fam-002',
      relation: '자녀',
      name: '홍민수',
      birthDate: '2015-08-10',
      isCohabitant: true,
      isDependent: true,
    },
  ],
};

// Mock Education
const mockEducations: Record<string, Education[]> = {
  'emp-001': [
    {
      id: 'edu-001',
      schoolType: '대학교',
      schoolName: '서울대학교',
      major: '컴퓨터공학',
      degree: '학사',
      admissionDate: '2004-03-01',
      graduationDate: '2011-02-28',
      graduationStatus: 'GRADUATED',
      location: '서울',
    },
    {
      id: 'edu-002',
      schoolType: '고등학교',
      schoolName: '서울고등학교',
      admissionDate: '2001-03-01',
      graduationDate: '2004-02-28',
      graduationStatus: 'GRADUATED',
      location: '서울',
    },
  ],
};

// Mock Career
const mockCareers: Record<string, Career[]> = {
  'emp-001': [
    {
      id: 'car-001',
      companyName: 'ABC소프트',
      department: '개발팀',
      position: '선임',
      startDate: '2011-03-01',
      endDate: '2015-02-28',
      isCurrent: false,
      duties: '웹 개발, 시스템 설계',
      resignationReason: '이직',
    },
    {
      id: 'car-002',
      companyName: 'XYZ테크',
      department: 'R&D',
      position: '책임',
      startDate: '2015-03-01',
      endDate: '2019-12-31',
      isCurrent: false,
      duties: '프로젝트 관리, 아키텍처 설계',
      resignationReason: '이직',
    },
  ],
};

// Mock Certificates
const mockCertificates: Record<string, Certificate[]> = {
  'emp-001': [
    {
      id: 'cert-001',
      certificateName: '정보처리기사',
      issuingOrg: '한국산업인력공단',
      acquisitionDate: '2012-05-15',
      certificateNumber: '12345678',
    },
    {
      id: 'cert-002',
      certificateName: 'AWS Solutions Architect',
      issuingOrg: 'Amazon',
      acquisitionDate: '2022-06-01',
      expirationDate: '2025-06-01',
      certificateNumber: 'AWS-SA-001234',
      grade: 'Professional',
    },
  ],
};

// Mock Appointments
const mockAppointments: Record<string, Appointment[]> = {
  'emp-001': [
    {
      id: 'apt-001',
      effectiveDate: '2023-01-01',
      appointmentType: 'PROMOTION',
      appointmentTypeName: '승진',
      fromGradeId: 'grade-002',
      fromGradeName: '차장',
      toGradeId: 'grade-001',
      toGradeName: '부장',
      reason: '정기 승진',
    },
    {
      id: 'apt-002',
      effectiveDate: '2022-03-01',
      appointmentType: 'TRANSFER',
      appointmentTypeName: '전보',
      fromDepartmentId: 'dept-000',
      fromDepartmentName: '기획팀',
      toDepartmentId: 'dept-001',
      toDepartmentName: '개발팀',
      reason: '조직개편',
    },
    {
      id: 'apt-003',
      effectiveDate: '2020-01-02',
      appointmentType: 'POSITION_CHANGE',
      appointmentTypeName: '보직임명',
      toDepartmentId: 'dept-000',
      toDepartmentName: '기획팀',
      toGradeId: 'grade-003',
      toGradeName: '과장',
      toPositionId: 'pos-002',
      toPositionName: '선임',
      reason: '신규 입사',
    },
  ],
};

// Mock Awards
const mockAwards: Record<string, Award[]> = {
  'emp-001': [
    {
      id: 'award-001',
      awardDate: '2023-12-20',
      awardType: 'EXCELLENCE',
      awardTypeName: '우수사원',
      awardName: '2023년 하반기 우수사원상',
      reason: '프로젝트 성공적 완료',
      issuingOrg: '본사',
      amount: 500000,
    },
  ],
};

// Mock Disciplinary (empty for most employees)
const mockDisciplinary: Record<string, Disciplinary[]> = {
  'emp-001': [],
};

// Mock Privacy Access Requests
const mockPrivacyAccessRequests: PrivacyAccessRequest[] = [
  {
    id: 'par-001',
    requesterId: 'emp-002',
    requesterName: '김철수',
    requesterDepartment: '개발팀',
    targetEmployeeId: 'emp-001',
    targetEmployeeName: '홍길동',
    targetEmployeeNumber: 'EMP2024001',
    fields: ['mobile', 'email'] as PrivacyField[],
    purpose: '긴급 연락처 확인을 위한 개인정보 열람 요청',
    status: 'PENDING',
    createdAt: '2024-03-15T10:00:00Z',
  },
  {
    id: 'par-002',
    requesterId: 'emp-003',
    requesterName: '이영희',
    requesterDepartment: '인사팀',
    targetEmployeeId: 'emp-002',
    targetEmployeeName: '김철수',
    targetEmployeeNumber: 'EMP2024002',
    fields: ['bankAccount'] as PrivacyField[],
    purpose: '급여 이체를 위한 계좌번호 확인',
    status: 'APPROVED',
    approverId: 'emp-009',
    approverName: '임준혁',
    approvedAt: '2024-03-14T14:30:00Z',
    expiresAt: '2024-03-14T15:30:00Z',
    accessedAt: '2024-03-14T14:35:00Z',
    createdAt: '2024-03-14T10:00:00Z',
  },
  {
    id: 'par-003',
    requesterId: 'emp-005',
    requesterName: '최수진',
    requesterDepartment: '마케팅팀',
    targetEmployeeId: 'emp-007',
    targetEmployeeName: '강하늘',
    targetEmployeeNumber: 'EMP2024007',
    fields: ['residentNumber', 'address'] as PrivacyField[],
    purpose: '연말정산 서류 작성을 위한 개인정보 확인',
    status: 'REJECTED',
    approverId: 'emp-003',
    approverName: '이영희',
    approvedAt: '2024-03-10T11:00:00Z',
    rejectionReason: '연말정산 담당자가 아니므로 열람 권한 없음',
    createdAt: '2024-03-10T09:00:00Z',
  },
  {
    id: 'par-004',
    requesterId: 'emp-003',
    requesterName: '이영희',
    requesterDepartment: '인사팀',
    targetEmployeeId: 'emp-010',
    targetEmployeeName: '한예진',
    targetEmployeeNumber: 'EMP2024010',
    fields: ['mobile', 'address', 'residentNumber'] as PrivacyField[],
    purpose: '신규 입사자 인사 서류 작성',
    status: 'PENDING',
    createdAt: '2024-03-18T09:00:00Z',
  },
];

// Mock Privacy Access Logs
const mockPrivacyAccessLogs: PrivacyAccessLog[] = [
  {
    id: 'pal-001',
    requestId: 'par-002',
    accessorId: 'emp-003',
    accessorName: '이영희',
    accessorDepartment: '인사팀',
    targetEmployeeId: 'emp-002',
    targetEmployeeName: '김철수',
    targetEmployeeNumber: 'EMP2024002',
    field: 'bankAccount' as PrivacyField,
    purpose: '급여 이체를 위한 계좌번호 확인',
    accessedAt: '2024-03-14T14:35:00Z',
    ipAddress: '192.168.1.100',
    approvalStatus: 'APPROVED',
    approvedBy: '임준혁',
  },
  {
    id: 'pal-002',
    accessorId: 'emp-001',
    accessorName: '홍길동',
    accessorDepartment: '개발팀',
    targetEmployeeId: 'emp-002',
    targetEmployeeName: '김철수',
    targetEmployeeNumber: 'EMP2024002',
    field: 'mobile' as PrivacyField,
    purpose: '긴급 프로젝트 연락',
    accessedAt: '2024-03-12T16:20:00Z',
    ipAddress: '192.168.1.50',
    approvalStatus: 'APPROVED',
    approvedBy: '시스템',
  },
  {
    id: 'pal-003',
    accessorId: 'emp-003',
    accessorName: '이영희',
    accessorDepartment: '인사팀',
    targetEmployeeId: 'emp-005',
    targetEmployeeName: '최수진',
    targetEmployeeNumber: 'EMP2024005',
    field: 'email' as PrivacyField,
    purpose: '인사 발령 통보',
    accessedAt: '2024-03-10T10:00:00Z',
    ipAddress: '192.168.1.100',
    approvalStatus: 'APPROVED',
    approvedBy: '시스템',
  },
  {
    id: 'pal-004',
    accessorId: 'emp-003',
    accessorName: '이영희',
    accessorDepartment: '인사팀',
    targetEmployeeId: 'emp-001',
    targetEmployeeName: '홍길동',
    targetEmployeeNumber: 'EMP2024001',
    field: 'residentNumber' as PrivacyField,
    purpose: '연말정산 서류 제출',
    accessedAt: '2024-03-05T11:30:00Z',
    ipAddress: '192.168.1.100',
    approvalStatus: 'APPROVED',
    approvedBy: '임준혁',
  },
];

// Mock Concurrent Positions (겸직/보직)
const mockConcurrentPositions: ConcurrentPosition[] = [
  {
    id: 'conc-001',
    employeeId: 'emp-001',
    employeeName: '홍길동',
    departmentId: 'dept-001',
    departmentName: '개발팀',
    positionId: 'pos-001',
    positionName: '팀장',
    gradeId: 'grade-001',
    gradeName: '부장',
    isPrimary: true,
    startDate: '2022-03-01',
    status: 'ACTIVE',
    createdAt: '2022-03-01T00:00:00Z',
    createdBy: 'system',
    createdByName: '시스템',
  },
  {
    id: 'conc-002',
    employeeId: 'emp-001',
    employeeName: '홍길동',
    departmentId: 'dept-007',
    departmentName: 'TF팀',
    positionId: 'pos-002',
    positionName: '팀원',
    isPrimary: false,
    startDate: '2024-01-15',
    status: 'ACTIVE',
    reason: '프로젝트 TF 참여',
    createdAt: '2024-01-15T00:00:00Z',
    createdBy: 'emp-003',
    createdByName: '이영희',
  },
  {
    id: 'conc-003',
    employeeId: 'emp-001',
    employeeName: '홍길동',
    departmentId: 'dept-002',
    departmentName: '인사팀',
    positionId: 'pos-003',
    positionName: '자문위원',
    isPrimary: false,
    startDate: '2023-06-01',
    endDate: '2023-12-31',
    status: 'ENDED',
    reason: '인사 시스템 구축 자문',
    createdAt: '2023-06-01T00:00:00Z',
    createdBy: 'emp-003',
    createdByName: '이영희',
  },
  {
    id: 'conc-004',
    employeeId: 'emp-003',
    employeeName: '이영희',
    departmentId: 'dept-002',
    departmentName: '인사팀',
    positionId: 'pos-003',
    positionName: '매니저',
    gradeId: 'grade-002',
    gradeName: '차장',
    isPrimary: true,
    startDate: '2019-06-01',
    status: 'ACTIVE',
    createdAt: '2019-06-01T00:00:00Z',
    createdBy: 'system',
    createdByName: '시스템',
  },
  {
    id: 'conc-005',
    employeeId: 'emp-005',
    employeeName: '최수진',
    departmentId: 'dept-004',
    departmentName: '마케팅팀',
    positionId: 'pos-001',
    positionName: '팀장',
    gradeId: 'grade-001',
    gradeName: '부장',
    isPrimary: true,
    startDate: '2018-04-02',
    status: 'ACTIVE',
    createdAt: '2018-04-02T00:00:00Z',
    createdBy: 'system',
    createdByName: '시스템',
  },
  {
    id: 'conc-006',
    employeeId: 'emp-005',
    employeeName: '최수진',
    departmentId: 'dept-005',
    departmentName: '디자인팀',
    positionId: 'pos-001',
    positionName: '팀장',
    isPrimary: false,
    startDate: '2023-01-01',
    status: 'ACTIVE',
    reason: '디자인팀 겸임',
    createdAt: '2023-01-01T00:00:00Z',
    createdBy: 'emp-003',
    createdByName: '이영희',
  },
];

function toListItem(employee: Employee): EmployeeListItem {
  return {
    id: employee.id,
    employeeNumber: employee.employeeNumber,
    name: employee.name,
    email: employee.email,
    departmentName: employee.departmentName,
    positionName: employee.positionName,
    gradeName: employee.gradeName,
    employmentStatus: employee.employmentStatus,
    employmentType: employee.employmentType,
    hireDate: employee.hireDate,
    profileImageUrl: employee.profileImageUrl,
  };
}

const mockDepartments: Record<string, string> = {
  'dept-001': '개발팀',
  'dept-002': '인사팀',
  'dept-003': '재무팀',
  'dept-004': '마케팅팀',
  'dept-005': '디자인팀',
  'dept-006': '영업팀',
  'dept-007': 'TF팀',
};

const mockGrades: Record<string, string> = {
  'grade-001': '부장',
  'grade-002': '차장',
  'grade-003': '과장',
  'grade-004': '대리',
  'grade-005': '사원',
};

const mockPositions: Record<string, string> = {
  'pos-001': '팀장',
  'pos-002': '선임',
  'pos-003': '매니저',
  'pos-004': '주임',
  'pos-005': '책임',
  'pos-006': '사원',
};

// Mock data for homonym (동명이인) check
const homonymCheckData = [
  { id: 'emp-h1', name: '김민수', department: '개발팀', employeeNumber: 'EMP-2024-001', profileImageUrl: null },
  { id: 'emp-h2', name: '김민수', department: '영업팀', employeeNumber: 'EMP-2023-042', profileImageUrl: null },
  { id: 'emp-h3', name: '이영희', department: '인사팀', employeeNumber: 'EMP-2024-015', profileImageUrl: null },
  { id: 'emp-h4', name: '이영희', department: '기획팀', employeeNumber: 'EMP-2023-088', profileImageUrl: null },
  { id: 'emp-h5', name: '이영희', department: '마케팅팀', employeeNumber: 'EMP-2022-033', profileImageUrl: null },
  { id: 'emp-h6', name: '박지현', department: '재무팀', employeeNumber: 'EMP-2024-007', profileImageUrl: null },
];

export const employeeHandlers = [
  // Check homonym (동명이인 조회)
  http.get('/api/v1/employees/check-homonym', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const name = url.searchParams.get('name') || '';

    const matches = name
      ? homonymCheckData.filter(emp => emp.name === name)
      : [];

    return HttpResponse.json({
      success: true,
      data: { matches, count: matches.length },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get employees list
  http.get('/api/v1/employees', async ({ request }) => {
    await delay(400);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const keyword = url.searchParams.get('keyword') || '';
    const employmentStatus = url.searchParams.get('employmentStatus') as EmploymentStatus | null;

    let filteredEmployees = [...mockEmployees];

    // Filter by keyword (name or employee number)
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filteredEmployees = filteredEmployees.filter(
        emp =>
          emp.name.toLowerCase().includes(lowerKeyword) ||
          emp.employeeNumber.toLowerCase().includes(lowerKeyword) ||
          emp.email.toLowerCase().includes(lowerKeyword)
      );
    }

    // Filter by employment status
    if (employmentStatus) {
      filteredEmployees = filteredEmployees.filter(emp => emp.employmentStatus === employmentStatus);
    }

    const totalElements = filteredEmployees.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const end = start + size;
    const content = filteredEmployees.slice(start, end).map(toListItem);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get employee detail
  http.get('/api/v1/employees/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const employee = mockEmployees.find(emp => emp.id === id);

    if (!employee) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'EMP_001',
            message: '직원을 찾을 수 없습니다.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: employee,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create employee
  http.post('/api/v1/employees', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;

    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      tenantId: 'tenant-001',
      employeeNumber: body.employeeNumber as string,
      name: body.name as string,
      nameEn: body.nameEn as string | undefined,
      email: body.email as string,
      mobile: body.mobile as string | undefined,
      birthDate: body.birthDate as string | undefined,
      gender: body.gender as 'MALE' | 'FEMALE' | undefined,
      hireDate: body.hireDate as string,
      employmentStatus: 'ACTIVE',
      employmentType: (body.employmentType as Employee['employmentType']) || 'REGULAR',
      departmentId: body.departmentId as string,
      departmentName: mockDepartments[body.departmentId as string] || '부서',
      positionId: body.positionId as string | undefined,
      positionName: body.positionId ? mockPositions[body.positionId as string] : undefined,
      gradeId: body.gradeId as string | undefined,
      gradeName: body.gradeId ? mockGrades[body.gradeId as string] : undefined,
      managerId: body.managerId as string | undefined,
      managerName: undefined,
      profileImageUrl: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockEmployees.unshift(newEmployee);

    return HttpResponse.json({
      success: true,
      data: newEmployee,
      message: '직원이 등록되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Update employee
  http.put('/api/v1/employees/:id', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockEmployees.findIndex(emp => emp.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMP_001', message: '직원을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    mockEmployees[index] = {
      ...mockEmployees[index],
      ...body,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockEmployees[index],
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete employee
  http.delete('/api/v1/employees/:id', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockEmployees.findIndex(emp => emp.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMP_001', message: '직원을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockEmployees.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }),

  // Resignation (SDD 4.3)
  http.post('/api/v1/employees/:id/resign', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const index = mockEmployees.findIndex(emp => emp.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMP_001', message: '직원을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;

    mockEmployees[index] = {
      ...mockEmployees[index],
      employmentStatus: 'RESIGNED',
      resignationDate: body.resignationDate as string,
      resignationType: body.resignationType as Employee['resignationType'],
      resignationReason: body.resignationReason as string,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockEmployees[index],
      message: '퇴직 처리가 완료되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Resignation cancel
  http.post('/api/v1/employees/:id/resign/cancel', async ({ params }) => {
    await delay(300);

    const { id } = params;
    const index = mockEmployees.findIndex(emp => emp.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMP_001', message: '직원을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockEmployees[index] = {
      ...mockEmployees[index],
      employmentStatus: 'ACTIVE',
      resignationDate: undefined,
      resignationType: undefined,
      resignationReason: undefined,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: mockEmployees[index],
      message: '퇴직 취소가 완료되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Transfer request (SDD 4.4)
  http.post('/api/v1/employees/:id/transfer/request', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const employee = mockEmployees.find(emp => emp.id === id);

    if (!employee) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMP_001', message: '직원을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;

    const newTransfer: EmployeeTransfer = {
      id: `transfer-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeNumber: employee.employeeNumber,
      sourceTenantId: employee.tenantId,
      sourceTenantName: '본사',
      sourceDepartmentId: employee.departmentId,
      sourceDepartmentName: employee.departmentName,
      targetTenantId: body.targetTenantId as string,
      targetTenantName: '타사',
      targetDepartmentId: body.targetDepartmentId as string,
      targetDepartmentName: '타부서',
      effectiveDate: body.effectiveDate as string,
      transferType: body.transferType as EmployeeTransfer['transferType'],
      status: 'PENDING_SOURCE_APPROVAL',
      reason: body.reason as string,
      requestedBy: 'current-user',
      requestedByName: '현재 사용자',
      requestedAt: new Date().toISOString(),
    };

    mockTransfers.push(newTransfer);

    return HttpResponse.json({
      success: true,
      data: newTransfer,
      message: '전출 요청이 접수되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Get transfers
  http.get('/api/v1/employees/transfers', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const status = url.searchParams.get('status') as TransferStatus | null;

    let filtered = [...mockTransfers];

    if (status) {
      filtered = filtered.filter(t => t.status === status);
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const end = start + size;
    const content = filtered.slice(start, end);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Approve transfer
  http.post('/api/v1/employees/transfers/:transferId/approve', async ({ params, request }) => {
    await delay(300);

    const { transferId } = params;
    const index = mockTransfers.findIndex(t => t.id === transferId);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'TRANSFER_001', message: '전출 요청을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const transfer = mockTransfers[index];

    if (body.approved) {
      if (transfer.status === 'PENDING_SOURCE_APPROVAL') {
        mockTransfers[index] = {
          ...transfer,
          status: 'PENDING_TARGET_APPROVAL',
          sourceApprovedBy: 'current-user',
          sourceApprovedByName: '현재 사용자',
          sourceApprovedAt: new Date().toISOString(),
        };
      } else if (transfer.status === 'PENDING_TARGET_APPROVAL') {
        mockTransfers[index] = {
          ...transfer,
          status: 'COMPLETED',
          targetApprovedBy: 'current-user',
          targetApprovedByName: '현재 사용자',
          targetApprovedAt: new Date().toISOString(),
        };
      }
    } else {
      mockTransfers[index] = {
        ...transfer,
        status: 'REJECTED',
      };
    }

    return HttpResponse.json({
      success: true,
      data: mockTransfers[index],
      timestamp: new Date().toISOString(),
    });
  }),

  // Cancel transfer
  http.post('/api/v1/employees/transfers/:transferId/cancel', async ({ params }) => {
    await delay(300);

    const { transferId } = params;
    const index = mockTransfers.findIndex(t => t.id === transferId);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'TRANSFER_001', message: '전출 요청을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockTransfers[index] = {
      ...mockTransfers[index],
      status: 'CANCELLED',
    };

    return HttpResponse.json({
      success: true,
      data: mockTransfers[index],
      timestamp: new Date().toISOString(),
    });
  }),

  // Unmask (SDD 4.5)
  http.post('/api/v1/employees/:id/unmask', async ({ params, request }) => {
    await delay(500);

    const { id } = params;
    const employee = mockEmployees.find(emp => emp.id === id);

    if (!employee) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMP_001', message: '직원을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as { fields: string[]; purpose: string };
    const detail = mockEmployeeDetails[id as string] || {};

    const unmaskedData: Record<string, string> = {};
    for (const field of body.fields) {
      switch (field) {
        case 'residentNumber':
          unmaskedData[field] = '850315-1234567';
          break;
        case 'bankAccount':
          unmaskedData[field] = detail.bankAccount || '123-456-789012';
          break;
        case 'address':
          unmaskedData[field] = `${detail.address || ''} ${detail.addressDetail || ''}`.trim() || '서울시 강남구';
          break;
        case 'mobile':
          unmaskedData[field] = employee.mobile || '010-1234-5678';
          break;
        case 'phone':
          unmaskedData[field] = employee.phone || '02-1234-5678';
          break;
        case 'birthDate':
          unmaskedData[field] = employee.birthDate || '1985-03-15';
          break;
      }
    }

    const validUntil = new Date();
    validUntil.setMinutes(validUntil.getMinutes() + 10);

    return HttpResponse.json({
      success: true,
      data: {
        data: unmaskedData,
        validUntil: validUntil.toISOString(),
        accessLogId: `log-${Date.now()}`,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Record Card (SDD 4.6)
  http.get('/api/v1/employees/:id/record-card', async ({ params }) => {
    await delay(500);

    const { id } = params;
    const employee = mockEmployees.find(emp => emp.id === id);

    if (!employee) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMP_001', message: '직원을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const recordCard: RecordCard = {
      employee,
      detail: mockEmployeeDetails[id as string] || {
        employeeId: id as string,
        birthDate: employee.birthDate,
        gender: employee.gender,
      },
      family: mockFamilies[id as string] || [],
      education: mockEducations[id as string] || [],
      career: mockCareers[id as string] || [],
      certificates: mockCertificates[id as string] || [],
      appointments: mockAppointments[id as string] || [],
      awards: mockAwards[id as string] || [],
      disciplinary: mockDisciplinary[id as string] || [],
      generatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({
      success: true,
      data: recordCard,
      timestamp: new Date().toISOString(),
    });
  }),

  // Record Card PDF
  http.get('/api/v1/employees/:id/record-card/pdf', async ({ params }) => {
    await delay(1000);

    const { id } = params;
    const employee = mockEmployees.find(emp => emp.id === id);

    if (!employee) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMP_001', message: '직원을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Return a simple PDF-like blob (in real implementation, this would be actual PDF)
    const pdfContent = `%PDF-1.4 인사기록카드 - ${employee.name}`;
    return new HttpResponse(pdfContent, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="record-card-${employee.employeeNumber}.pdf"`,
      },
    });
  }),

  // Employee History (SDD 3.2.7)
  http.get('/api/v1/employees/:id/histories', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);
    const historyType = url.searchParams.get('historyType') as HistoryType | null;

    let histories = mockHistories[id as string] || [];

    // Generate some default history if none exists
    if (histories.length === 0) {
      const employee = mockEmployees.find(emp => emp.id === id);
      if (employee) {
        histories = [
          {
            id: `hist-${Date.now()}`,
            employeeId: id as string,
            historyType: 'CREATE',
            historyTypeName: '입사',
            effectiveDate: employee.hireDate,
            reason: '신규 입사',
            changedBy: 'system',
            changedByName: '시스템',
            changedAt: employee.createdAt,
          },
        ];
      }
    }

    if (historyType) {
      histories = histories.filter(h => h.historyType === historyType);
    }

    const totalElements = histories.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const end = start + size;
    const content = histories.slice(start, end);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // ===== 겸직/보직 관리 (PRD FR-ORG-002) =====

  // Get concurrent positions for an employee
  http.get('/api/v1/employees/:id/concurrent-positions', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const url = new URL(request.url);
    const status = url.searchParams.get('status') as ConcurrentPositionStatus | null;
    const isPrimaryStr = url.searchParams.get('isPrimary');
    const isPrimary = isPrimaryStr === 'true' ? true : isPrimaryStr === 'false' ? false : null;

    let positions = mockConcurrentPositions.filter(p => p.employeeId === id);

    if (status) {
      positions = positions.filter(p => p.status === status);
    }

    if (isPrimary !== null) {
      positions = positions.filter(p => p.isPrimary === isPrimary);
    }

    // Sort: primary first, then by startDate descending
    positions.sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    });

    return HttpResponse.json({
      success: true,
      data: positions,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get single concurrent position
  http.get('/api/v1/employees/:employeeId/concurrent-positions/:positionId', async ({ params }) => {
    await delay(200);

    const { employeeId, positionId } = params;
    const position = mockConcurrentPositions.find(
      p => p.employeeId === employeeId && p.id === positionId
    );

    if (!position) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'CONC_001', message: '소속 정보를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: position,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create concurrent position
  http.post('/api/v1/employees/:id/concurrent-positions', async ({ params, request }) => {
    await delay(300);

    const { id } = params;
    const body = await request.json() as Record<string, unknown>;
    const employee = mockEmployees.find(emp => emp.id === id);

    if (!employee) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMP_001', message: '직원을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // If setting as primary, unset other primary positions
    if (body.isPrimary) {
      mockConcurrentPositions.forEach(p => {
        if (p.employeeId === id && p.isPrimary) {
          p.isPrimary = false;
        }
      });
    }

    const newPosition: ConcurrentPosition = {
      id: `conc-${Date.now()}`,
      employeeId: id as string,
      employeeName: employee.name,
      departmentId: body.departmentId as string,
      departmentName: mockDepartments[body.departmentId as string] || '부서',
      positionId: body.positionId as string | undefined,
      positionName: body.positionId ? mockPositions[body.positionId as string] : undefined,
      gradeId: body.gradeId as string | undefined,
      gradeName: body.gradeId ? mockGrades[body.gradeId as string] : undefined,
      isPrimary: body.isPrimary as boolean || false,
      startDate: body.startDate as string,
      endDate: body.endDate as string | undefined,
      status: 'ACTIVE',
      reason: body.reason as string | undefined,
      createdAt: new Date().toISOString(),
      createdBy: 'current-user',
      createdByName: '현재 사용자',
    };

    mockConcurrentPositions.push(newPosition);

    return HttpResponse.json({
      success: true,
      data: newPosition,
      message: body.isPrimary ? '주소속이 추가되었습니다.' : '겸직이 추가되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Update concurrent position
  http.put('/api/v1/employees/:employeeId/concurrent-positions/:positionId', async ({ params, request }) => {
    await delay(300);

    const { employeeId, positionId } = params;
    const index = mockConcurrentPositions.findIndex(
      p => p.employeeId === employeeId && p.id === positionId
    );

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'CONC_001', message: '소속 정보를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const current = mockConcurrentPositions[index];

    mockConcurrentPositions[index] = {
      ...current,
      positionId: body.positionId !== undefined ? body.positionId as string : current.positionId,
      positionName: body.positionId ? mockPositions[body.positionId as string] : current.positionName,
      gradeId: body.gradeId !== undefined ? body.gradeId as string : current.gradeId,
      gradeName: body.gradeId ? mockGrades[body.gradeId as string] : current.gradeName,
      endDate: body.endDate !== undefined ? body.endDate as string : current.endDate,
      reason: body.reason !== undefined ? body.reason as string : current.reason,
    };

    return HttpResponse.json({
      success: true,
      data: mockConcurrentPositions[index],
      timestamp: new Date().toISOString(),
    });
  }),

  // End concurrent position
  http.post('/api/v1/employees/:employeeId/concurrent-positions/:positionId/end', async ({ params, request }) => {
    await delay(300);

    const { employeeId, positionId } = params;
    const index = mockConcurrentPositions.findIndex(
      p => p.employeeId === employeeId && p.id === positionId
    );

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'CONC_001', message: '소속 정보를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;

    mockConcurrentPositions[index] = {
      ...mockConcurrentPositions[index],
      status: 'ENDED',
      endDate: body.endDate as string,
      reason: body.reason as string || mockConcurrentPositions[index].reason,
    };

    return HttpResponse.json({
      success: true,
      data: mockConcurrentPositions[index],
      message: '겸직이 종료되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete concurrent position
  http.delete('/api/v1/employees/:employeeId/concurrent-positions/:positionId', async ({ params }) => {
    await delay(300);

    const { employeeId, positionId } = params;
    const index = mockConcurrentPositions.findIndex(
      p => p.employeeId === employeeId && p.id === positionId
    );

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'CONC_001', message: '소속 정보를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const position = mockConcurrentPositions[index];
    if (position.isPrimary) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'CONC_002', message: '주소속은 삭제할 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    mockConcurrentPositions.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
      message: '소속 정보가 삭제되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Set as primary position
  http.post('/api/v1/employees/:employeeId/concurrent-positions/:positionId/set-primary', async ({ params }) => {
    await delay(300);

    const { employeeId, positionId } = params;
    const index = mockConcurrentPositions.findIndex(
      p => p.employeeId === employeeId && p.id === positionId
    );

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'CONC_001', message: '소속 정보를 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const position = mockConcurrentPositions[index];
    if (position.status !== 'ACTIVE') {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'CONC_003', message: '종료된 소속은 주소속으로 설정할 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Unset current primary
    mockConcurrentPositions.forEach(p => {
      if (p.employeeId === employeeId && p.isPrimary) {
        p.isPrimary = false;
      }
    });

    // Set new primary
    mockConcurrentPositions[index] = {
      ...mockConcurrentPositions[index],
      isPrimary: true,
    };

    return HttpResponse.json({
      success: true,
      data: mockConcurrentPositions[index],
      message: '주소속이 변경되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // ===== 개인정보 조회 승인/이력 (PRD FR-EMP-002) =====

  // Get privacy access requests
  http.get('/api/v1/employees/privacy/requests', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);
    const status = url.searchParams.get('status') as PrivacyAccessStatus | null;
    const targetEmployeeId = url.searchParams.get('targetEmployeeId');

    let filtered = [...mockPrivacyAccessRequests];

    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    if (targetEmployeeId) {
      filtered = filtered.filter(r => r.targetEmployeeId === targetEmployeeId);
    }

    // Sort by createdAt descending
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const end = start + size;
    const content = filtered.slice(start, end);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get single privacy access request
  http.get('/api/v1/employees/privacy/requests/:requestId', async ({ params }) => {
    await delay(200);

    const { requestId } = params;
    const request = mockPrivacyAccessRequests.find(r => r.id === requestId);

    if (!request) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'PRIV_001', message: '열람 요청을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: request,
      timestamp: new Date().toISOString(),
    });
  }),

  // Create privacy access request
  http.post('/api/v1/employees/privacy/requests', async ({ request }) => {
    await delay(300);

    const body = await request.json() as Record<string, unknown>;
    const targetEmployee = mockEmployees.find(e => e.id === body.targetEmployeeId);

    if (!targetEmployee) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'EMP_001', message: '대상 직원을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const newRequest: PrivacyAccessRequest = {
      id: `par-${Date.now()}`,
      requesterId: 'current-user',
      requesterName: '현재 사용자',
      requesterDepartment: '개발팀',
      targetEmployeeId: body.targetEmployeeId as string,
      targetEmployeeName: targetEmployee.name,
      targetEmployeeNumber: targetEmployee.employeeNumber,
      fields: body.fields as PrivacyField[],
      purpose: body.purpose as string,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };

    mockPrivacyAccessRequests.unshift(newRequest);

    return HttpResponse.json({
      success: true,
      data: newRequest,
      message: '개인정보 열람 요청이 접수되었습니다.',
      timestamp: new Date().toISOString(),
    }, { status: 201 });
  }),

  // Approve/Reject privacy access request
  http.post('/api/v1/employees/privacy/requests/:requestId/approve', async ({ params, request }) => {
    await delay(300);

    const { requestId } = params;
    const index = mockPrivacyAccessRequests.findIndex(r => r.id === requestId);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'PRIV_001', message: '열람 요청을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const body = await request.json() as Record<string, unknown>;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    if (body.approved) {
      mockPrivacyAccessRequests[index] = {
        ...mockPrivacyAccessRequests[index],
        status: 'APPROVED',
        approverId: 'current-user',
        approverName: '현재 사용자',
        approvedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };
    } else {
      mockPrivacyAccessRequests[index] = {
        ...mockPrivacyAccessRequests[index],
        status: 'REJECTED',
        approverId: 'current-user',
        approverName: '현재 사용자',
        approvedAt: now.toISOString(),
        rejectionReason: body.rejectionReason as string || '요청 사유가 부적절합니다.',
      };
    }

    return HttpResponse.json({
      success: true,
      data: mockPrivacyAccessRequests[index],
      message: body.approved ? '요청이 승인되었습니다.' : '요청이 반려되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Get privacy access logs
  http.get('/api/v1/employees/privacy/logs', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);
    const field = url.searchParams.get('field') as PrivacyField | null;
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    let filtered = [...mockPrivacyAccessLogs];

    if (field) {
      filtered = filtered.filter(l => l.field === field);
    }
    if (startDate) {
      filtered = filtered.filter(l => new Date(l.accessedAt) >= new Date(startDate));
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      filtered = filtered.filter(l => new Date(l.accessedAt) <= endDateTime);
    }

    // Sort by accessedAt descending
    filtered.sort((a, b) => new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime());

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const end = start + size;
    const content = filtered.slice(start, end);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get employee-specific privacy access logs
  http.get('/api/v1/employees/:employeeId/privacy/logs', async ({ params, request }) => {
    await delay(300);

    const { employeeId } = params;
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '20', 10);

    let filtered = mockPrivacyAccessLogs.filter(l => l.targetEmployeeId === employeeId);

    // Sort by accessedAt descending
    filtered.sort((a, b) => new Date(b.accessedAt).getTime() - new Date(a.accessedAt).getTime());

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const end = start + size;
    const content = filtered.slice(start, end);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),
];
