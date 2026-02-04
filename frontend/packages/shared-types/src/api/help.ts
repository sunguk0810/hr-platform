import { BaseEntity, TenantAwareEntity, PageRequest } from './common';

export type ContactCategory =
  | 'account'
  | 'attendance'
  | 'approval'
  | 'organization'
  | 'system'
  | 'suggestion'
  | 'other';

export type InquiryStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type InquiryPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface ContactInquiry extends TenantAwareEntity {
  category: ContactCategory;
  subject: string;
  message: string;
  attachments?: string[];
  status: InquiryStatus;
  priority: InquiryPriority;
  response?: string;
  respondedAt?: string;
  respondedBy?: string;
  respondedByName?: string;
  resolvedAt?: string;
}

export interface CreateContactInquiryRequest {
  category: ContactCategory;
  subject: string;
  message: string;
  attachments?: string[];
  priority?: InquiryPriority;
}

export interface UpdateInquiryRequest {
  status?: InquiryStatus;
  priority?: InquiryPriority;
  response?: string;
}

export interface InquirySearchParams extends PageRequest {
  category?: ContactCategory;
  status?: InquiryStatus;
  priority?: InquiryPriority;
  startDate?: string;
  endDate?: string;
  keyword?: string;
}

export interface UploadAttachmentResponse {
  id: string;
  filename: string;
  originalFilename: string;
  url: string;
  size: number;
  contentType: string;
}

export interface FAQCategory {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  order: number;
}

export interface FAQItem extends BaseEntity {
  categoryId: string;
  categoryName: string;
  question: string;
  answer: string;
  tags?: string[];
  viewCount: number;
  helpfulCount: number;
  order: number;
}

export interface FAQSearchParams extends PageRequest {
  categoryId?: string;
  keyword?: string;
}

export interface HelpGuide extends BaseEntity {
  title: string;
  content: string;
  category: string;
  tags?: string[];
  order: number;
  isPublished: boolean;
}
