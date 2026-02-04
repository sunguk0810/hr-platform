import { PageRequest, TenantAwareEntity } from './common';

export type FileCategory = 'PROFILE' | 'DOCUMENT' | 'ATTACHMENT' | 'IMPORT' | 'EXPORT';

export type FileStatus = 'UPLOADING' | 'COMPLETED' | 'FAILED' | 'DELETED';

export interface FileInfo extends TenantAwareEntity {
  filename: string;
  originalFilename: string;
  contentType: string;
  size: number;
  category: FileCategory;
  status: FileStatus;
  url: string;
  thumbnailUrl?: string;
  uploaderId: string;
  uploaderName?: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

export interface UploadResponse {
  id: string;
  filename: string;
  originalFilename: string;
  contentType: string;
  size: number;
  url: string;
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
