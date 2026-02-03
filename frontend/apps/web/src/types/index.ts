// Re-export types from shared-types package
export type {
  ApiResponse,
  ApiError,
  PageResponse,
  PageRequest,
  BaseEntity,
  TenantAwareEntity,
  User,
  Tenant,
  TenantBranding,
} from '@hr-platform/shared-types';

export type {
  Employee,
  EmployeeListItem,
  EmployeeSearchParams,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmploymentStatus,
  Gender,
} from '@hr-platform/shared-types';

export type {
  Department,
  DepartmentTreeNode,
  Position,
  Grade,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  DepartmentStatus,
} from '@hr-platform/shared-types';

export type {
  Approval,
  ApprovalListItem,
  ApprovalStep,
  ApprovalAttachment,
  ApprovalSearchParams,
  CreateApprovalRequest,
  ApproveRequest,
  RejectRequest,
  ApprovalStatus,
  ApprovalType,
  ApprovalStepStatus,
  ApprovalUrgency,
} from '@hr-platform/shared-types';
