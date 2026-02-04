import { TenantAwareEntity, PageRequest } from './common';

// Code Group Types
export interface CodeGroup extends TenantAwareEntity {
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  isSystem: boolean;
  sortOrder: number;
  isActive: boolean;
}

export interface CodeGroupListItem {
  id: string;
  code: string;
  name: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  codeCount: number;
}

export interface CodeGroupSearchParams extends PageRequest {
  keyword?: string;
  isActive?: boolean;
}

export interface CreateCodeGroupRequest {
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCodeGroupRequest {
  name?: string;
  nameEn?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// Common Code Types
export interface CommonCode extends TenantAwareEntity {
  groupId: string;
  groupCode: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  parentCode?: string;
  parentName?: string;
  attributes?: Record<string, string>;
}

export interface CommonCodeListItem {
  id: string;
  groupCode: string;
  code: string;
  name: string;
  nameEn?: string;
  sortOrder: number;
  isActive: boolean;
  parentCode?: string;
}

export interface CommonCodeSearchParams extends PageRequest {
  groupCode?: string;
  keyword?: string;
  isActive?: boolean;
  parentCode?: string;
}

export interface CreateCommonCodeRequest {
  groupId: string;
  code: string;
  name: string;
  nameEn?: string;
  description?: string;
  sortOrder?: number;
  parentCode?: string;
  attributes?: Record<string, string>;
}

export interface UpdateCommonCodeRequest {
  name?: string;
  nameEn?: string;
  description?: string;
  sortOrder?: number;
  isActive?: boolean;
  parentCode?: string;
  attributes?: Record<string, string>;
}

// Tenant Code Mapping (for tenant-specific code values)
export interface TenantCodeMapping extends TenantAwareEntity {
  commonCodeId: string;
  groupCode: string;
  code: string;
  displayName?: string;
  sortOrder?: number;
  isActive: boolean;
}

// Helper types for dropdowns
export interface CodeOption {
  value: string;
  label: string;
  labelEn?: string;
}

// System Code Groups (predefined)
export const SYSTEM_CODE_GROUPS = {
  LEAVE_TYPE: 'LEAVE_TYPE',
  EMPLOYMENT_STATUS: 'EMPLOYMENT_STATUS',
  GENDER: 'GENDER',
  APPROVAL_TYPE: 'APPROVAL_TYPE',
  DEPARTMENT_STATUS: 'DEPARTMENT_STATUS',
  POSITION: 'POSITION',
  GRADE: 'GRADE',
} as const;

export type SystemCodeGroup = typeof SYSTEM_CODE_GROUPS[keyof typeof SYSTEM_CODE_GROUPS];

// Code Status Types
export type CodeStatus = 'ACTIVE' | 'INACTIVE' | 'DEPRECATED';

export interface UpdateCodeStatusRequest {
  status: CodeStatus;
  reason?: string;
}

export interface UpdateCodeStatusResponse {
  id: string;
  previousStatus: CodeStatus;
  newStatus: CodeStatus;
  changedAt: string;
  changedBy: {
    id: string;
    name: string;
  };
}

// Duplicate Check Types
export interface CheckDuplicateRequest {
  groupCode: string;
  code: string;
  name: string;
}

export interface SimilarCode {
  id: string;
  groupCode: string;
  code: string;
  name: string;
  similarity: number;
}

export interface CheckDuplicateResponse {
  hasDuplicate: boolean;
  duplicateType?: 'EXACT_CODE' | 'EXACT_NAME' | 'SIMILAR';
  duplicateMessage?: string;
  similarCodes: SimilarCode[];
}

// Impact Analysis Types
export interface AffectedEntity {
  entityType: string;
  entityName: string;
  tableName: string;
  recordCount: number;
  sampleRecords?: Array<{
    id: string;
    displayValue: string;
  }>;
}

export interface CodeImpactResult {
  codeId: string;
  code: string;
  codeName: string;
  affectedEntities: AffectedEntity[];
  totalAffectedRecords: number;
  canDelete: boolean;
  deleteBlockReason?: string;
}

// Code History Types
export type CodeHistoryAction = 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED';

export interface CodeHistory {
  id: string;
  codeId: string;
  action: CodeHistoryAction;
  changedField?: string;
  oldValue?: string;
  newValue?: string;
  changedBy: {
    id: string;
    name: string;
  };
  changedAt: string;
  reason?: string;
}

export interface CodeHistorySearchParams {
  page?: number;
  size?: number;
  action?: CodeHistoryAction;
  startDate?: string;
  endDate?: string;
}

// Code Search Types
export interface CodeSearchParams {
  keyword: string;
  groupCode?: string;
  threshold?: number;
  includeInactive?: boolean;
}

export interface CodeSearchResult {
  id: string;
  groupCode: string;
  groupName: string;
  code: string;
  name: string;
  nameEn?: string;
  isActive: boolean;
  similarity: number;
  matchType: 'EXACT' | 'PARTIAL' | 'FUZZY';
}

// Hierarchical Code Types
export interface CodeTreeNode {
  id: string;
  code: string;
  name: string;
  nameEn?: string;
  level: number;
  sortOrder: number;
  isActive: boolean;
  children: CodeTreeNode[];
}

// Code Migration Types
export interface MigrateCodeRequest {
  sourceCodeId: string;
  targetCodeId: string;
  reason: string;
  deprecateSource?: boolean;
}

export interface MigrationAffectedTable {
  tableName: string;
  columnName: string;
  recordCount: number;
}

export interface MigrationResult {
  migrationId: string;
  sourceCode: string;
  targetCode: string;
  totalMigrated: number;
  affectedTables: MigrationAffectedTable[];
  completedAt: string;
  status: 'COMPLETED' | 'FAILED' | 'PARTIAL';
  errorMessage?: string;
}

export interface MigrationPreview {
  sourceCode: {
    id: string;
    code: string;
    name: string;
    groupCode: string;
  };
  targetCode: {
    id: string;
    code: string;
    name: string;
    groupCode: string;
  };
  affectedTables: MigrationAffectedTable[];
  totalAffectedRecords: number;
  estimatedDuration: string;
  warnings: string[];
}

// Tenant Code Types
export interface TenantCodeSetting {
  id: string;
  codeId: string;
  groupCode: string;
  code: string;
  originalName: string;
  customName?: string;
  customNameEn?: string;
  isEnabled: boolean;
  sortOrder?: number;
  tenantId: string;
  updatedAt: string;
}

export interface UpdateTenantCodeRequest {
  customName?: string;
  customNameEn?: string;
  isEnabled?: boolean;
  sortOrder?: number;
}

export interface TenantCodeSearchParams extends PageRequest {
  groupCode?: string;
  keyword?: string;
  isEnabled?: boolean;
}
