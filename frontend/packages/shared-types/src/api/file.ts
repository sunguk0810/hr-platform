import { PageRequest, TenantAwareEntity } from './common';

export type FileCategory = 'PROFILE' | 'DOCUMENT' | 'ATTACHMENT' | 'IMPORT' | 'EXPORT';

export type FileStatus = 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'DELETED';

export interface FileInfo extends TenantAwareEntity {
  originalName: string;
  contentType: string;
  fileSize: number;
  category?: FileCategory;
  status?: FileStatus;
  downloadUrl: string;
  thumbnailUrl?: string;
  uploaderId: string;
  uploaderName?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  storageType?: string;
  referenceType?: string;
  referenceId?: string;
  isPublic?: boolean;
  downloadCount?: number;
}

export interface UploadResponse {
  id: string;
  originalName: string;
  contentType: string;
  fileSize: number;
  downloadUrl: string;
  thumbnailUrl?: string;
}

export interface DownloadUrlResponse {
  url: string;
  expiresAt: string;
}

export interface FileListParams extends PageRequest {
  category?: FileCategory;
  status?: FileStatus;
  uploaderId?: string;
  startDate?: string;
  endDate?: string;
}

export interface BulkDeleteFilesRequest {
  ids: string[];
}

export interface BulkDeleteFilesResponse {
  deleted: number;
  failed: number;
  errors?: Array<{
    id: string;
    reason: string;
  }>;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ImageResizeOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
}
