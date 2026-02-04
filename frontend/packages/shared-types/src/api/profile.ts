import { BaseEntity } from './common';

export interface UserProfile extends BaseEntity {
  employeeNumber: string;
  name: string;
  nameEn?: string;
  email: string;
  mobile?: string;
  birthDate?: string;
  hireDate: string;
  departmentId: string;
  departmentName: string;
  positionId?: string;
  positionName?: string;
  gradeId?: string;
  gradeName?: string;
  profileImageUrl?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
}

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface UpdateProfileRequest {
  email?: string;
  mobile?: string;
  nameEn?: string;
  address?: string;
  emergencyContact?: EmergencyContact;
}

export interface ProfilePhotoUploadResponse {
  url: string;
  filename: string;
  thumbnailUrl?: string;
}

export interface ProfileCompleteness {
  percentage: number;
  missingFields: string[];
  recommendations: string[];
}

export interface ProfileChangeHistory {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string;
  changedBy: string;
  changedByName: string;
}
