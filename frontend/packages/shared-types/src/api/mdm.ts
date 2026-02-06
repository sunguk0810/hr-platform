import { TenantAwareEntity, PageRequest } from './common';

// Code Group Types — matches backend CodeGroupResponse
export interface CodeGroup extends TenantAwareEntity {
  groupCode: string;
  groupName: string;
  groupNameEn?: string;
  description?: string;
  system: boolean;
  hierarchical: boolean;
  maxLevel?: number;
  status: CodeStatus;
  active: boolean;
  sortOrder: number;
}

// Flattened view for code group list — derived from CodeGroup
export interface CodeGroupListItem {
  id: string;
  groupCode: string;
  groupName: string;
  description?: string;
  system: boolean;
  active: boolean;
  status: CodeStatus;
  codeCount: number;
}

export interface CodeGroupSearchParams extends PageRequest {
  keyword?: string;
  active?: boolean;
}

export interface CreateCodeGroupRequest {
  groupCode: string;
  groupName: string;
  groupNameEn?: string;
  description?: string;
  hierarchical?: boolean;
  maxLevel?: number;
  sortOrder?: number;
}

export interface UpdateCodeGroupRequest {
  groupName?: string;
  groupNameEn?: string;
  description?: string;
  sortOrder?: number;
  active?: boolean;
}

// Common Code Types — matches backend CommonCodeResponse
export type ClassificationLevel = 1 | 2 | 3 | 4;

export interface CommonCode extends TenantAwareEntity {
  groupCode: string;
  parentCodeId?: string;
  level?: number;
  code: string;
  codeName: string;
  codeNameEn?: string;
  description?: string;
  extraValue1?: string;
  extraValue2?: string;
  extraValue3?: string;
  extraJson?: string;
  defaultCode: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  status: CodeStatus;
  active: boolean;
  effective: boolean;
  sortOrder: number;
  children?: CommonCode[];
}

// Flattened view for common code list
export interface CommonCodeListItem {
  id: string;
  groupCode: string;
  code: string;
  codeName: string;
  codeNameEn?: string;
  level?: number;
  sortOrder: number;
  active: boolean;
  status: CodeStatus;
  parentCodeId?: string;
  defaultCode?: boolean;
}

export interface CommonCodeSearchParams extends PageRequest {
  groupCode?: string;
  keyword?: string;
  status?: CodeStatus;
}

export interface CreateCommonCodeRequest {
  codeGroupId: string;
  code: string;
  codeName: string;
  codeNameEn?: string;
  description?: string;
  extraValue1?: string;
  extraValue2?: string;
  extraValue3?: string;
  extraJson?: string;
  defaultCode?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  sortOrder?: number;
  parentCodeId?: string;
}

export interface UpdateCommonCodeRequest {
  codeName?: string;
  codeNameEn?: string;
  description?: string;
  extraValue1?: string;
  extraValue2?: string;
  extraValue3?: string;
  extraJson?: string;
  defaultCode?: boolean;
  effectiveFrom?: string;
  effectiveTo?: string;
  sortOrder?: number;
  status?: CodeStatus;
  parentCodeId?: string;
}

// Tenant Code Mapping (for tenant-specific code values)
export interface TenantCodeMapping extends TenantAwareEntity {
  commonCodeId: string;
  groupCode: string;
  code: string;
  displayName?: string;
  sortOrder?: number;
  active: boolean;
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

// Code History Types — matches backend CodeHistoryResponse
export type CodeHistoryAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'ACTIVATE' | 'DEACTIVATE' | 'DEPRECATE';

export interface CodeHistory {
  id: string;
  codeId: string;
  groupCode: string;
  code: string;
  action: CodeHistoryAction;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changeReason?: string;
  changedBy: string;
  changedById?: string;
  changedAt: string;
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
  codeName: string;
  codeNameEn?: string;
  active: boolean;
  similarity: number;
  matchType: 'EXACT' | 'PARTIAL' | 'FUZZY';
}

// Hierarchical Code Types
export interface CodeTreeNode {
  id: string;
  code: string;
  codeName: string;
  codeNameEn?: string;
  level: number;
  sortOrder: number;
  active: boolean;
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
  enabled: boolean;
  sortOrder?: number;
  tenantId: string;
  updatedAt: string;
}

export interface UpdateTenantCodeRequest {
  customName?: string;
  customNameEn?: string;
  enabled?: boolean;
  sortOrder?: number;
}

export interface TenantCodeSearchParams extends PageRequest {
  groupCode?: string;
  keyword?: string;
  enabled?: boolean;
}
