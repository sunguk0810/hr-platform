import { TenantAwareEntity, PageRequest } from './common';

// ===== 기본 타입 정의 =====

// 채용공고 상태
export type JobStatus = 'DRAFT' | 'OPEN' | 'CLOSED' | 'CANCELLED' | 'COMPLETED';

// 고용 유형
export type RecruitmentEmploymentType = 'FULL_TIME' | 'CONTRACT' | 'INTERN' | 'PART_TIME';

// 지원서 상태
export type ApplicationStatus =
  | 'RECEIVED'
  | 'SCREENING'
  | 'IN_PROGRESS'
  | 'PASSED'
  | 'FAILED'
  | 'ON_HOLD'
  | 'WITHDRAWN'
  | 'HIRED';

// 지원 단계
export type ApplicationStage =
  | 'DOCUMENT'
  | 'FIRST_INTERVIEW'
  | 'SECOND_INTERVIEW'
  | 'FINAL_INTERVIEW'
  | 'OFFER';

// 면접 상태
export type InterviewStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

// 면접 유형
export type InterviewType = 'PHONE' | 'VIDEO' | 'ONSITE' | 'TECHNICAL' | 'FINAL';

// 면접 추천
export type InterviewRecommendation = 'STRONG_HIRE' | 'HIRE' | 'NO_HIRE' | 'STRONG_NO_HIRE';

// ===== 채용공고 =====

export interface JobPosting extends TenantAwareEntity {
  jobCode: string;
  title: string;
  departmentId: string;
  departmentName?: string;
  positionId?: string;
  positionName?: string;
  employmentType: RecruitmentEmploymentType;
  jobDescription: string;
  requirements?: string;
  preferredQualifications?: string;
  salaryMin?: number;
  salaryMax?: number;
  isSalaryNegotiable?: boolean;
  headcount: number;
  workLocation?: string;
  postingStartDate: string;
  postingEndDate: string;
  status: JobStatus;
  viewCount: number;
  applicationCount: number;
  recruiterId?: string;
  recruiterName?: string;
}

export interface JobPostingListItem {
  id: string;
  jobCode: string;
  title: string;
  departmentName?: string;
  employmentType: RecruitmentEmploymentType;
  headcount: number;
  applicationCount: number;
  postingStartDate: string;
  postingEndDate: string;
  status: JobStatus;
  recruiterName?: string;
}

export interface JobPostingSummary {
  total: number;
  open: number;
  closed: number;
  completed: number;
  draft: number;
}

// ===== 지원서 =====

export interface Application extends TenantAwareEntity {
  applicationNumber: string;
  jobPostingId: string;
  jobTitle?: string;
  jobCode?: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string;
  resumeFileId?: string;
  resumeFileName?: string;
  coverLetter?: string;
  currentStage: ApplicationStage;
  status: ApplicationStatus;
  appliedAt: string;
  statusChangedAt?: string;
  screenedAt?: string;
  screenedBy?: string;
  screenedByName?: string;
  screeningComment?: string;
  rejectionReason?: string;
  hiredAt?: string;
  hiredBy?: string;
  hiredByName?: string;
  withdrawnAt?: string;
  withdrawnReason?: string;
}

export interface ApplicationListItem {
  id: string;
  applicationNumber: string;
  jobPostingId: string;
  jobTitle?: string;
  jobCode?: string;
  applicantName: string;
  applicantEmail: string;
  currentStage: ApplicationStage;
  status: ApplicationStatus;
  appliedAt: string;
}

export interface ApplicationSummary {
  total: number;
  received: number;
  screening: number;
  inProgress: number;
  passed: number;
  failed: number;
  hired: number;
}

export interface ApplicationStageCount {
  stage: ApplicationStage;
  count: number;
}

// ===== 면접 =====

export interface Interview extends TenantAwareEntity {
  applicationId: string;
  applicantName?: string;
  applicantEmail?: string;
  jobPostingId?: string;
  jobTitle?: string;
  jobCode?: string;
  interviewType: InterviewType;
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  meetingUrl?: string;
  interviewerIds: string[];
  interviewerNames?: string[];
  status: InterviewStatus;
  averageScore?: number;
  notes?: string;
  cancelReason?: string;
  confirmedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface InterviewListItem {
  id: string;
  applicationId: string;
  applicantName?: string;
  jobTitle?: string;
  interviewType: InterviewType;
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  meetingUrl?: string;
  interviewerNames?: string[];
  status: InterviewStatus;
  averageScore?: number;
}

export interface InterviewSummary {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  today: number;
}

// ===== 면접 평가 =====

export interface InterviewScore extends TenantAwareEntity {
  interviewId: string;
  interviewerId: string;
  interviewerName?: string;
  technicalScore?: number;
  communicationScore?: number;
  cultureFitScore?: number;
  problemSolvingScore?: number;
  overallScore: number;
  strengths?: string;
  weaknesses?: string;
  recommendation: InterviewRecommendation;
  comments?: string;
  evaluatedAt: string;
}

// ===== 검색 파라미터 =====

export interface JobPostingSearchParams extends PageRequest {
  keyword?: string;
  status?: JobStatus;
  departmentId?: string;
  employmentType?: RecruitmentEmploymentType;
  recruiterId?: string;
}

export interface ApplicationSearchParams extends PageRequest {
  keyword?: string;
  jobPostingId?: string;
  status?: ApplicationStatus;
  stage?: ApplicationStage;
  appliedStartDate?: string;
  appliedEndDate?: string;
}

export interface InterviewSearchParams extends PageRequest {
  applicationId?: string;
  interviewerId?: string;
  interviewType?: InterviewType;
  status?: InterviewStatus;
  scheduledStartDate?: string;
  scheduledEndDate?: string;
}

// ===== 요청 타입 =====

export interface CreateJobPostingRequest {
  title: string;
  departmentId: string;
  positionId?: string;
  employmentType: RecruitmentEmploymentType;
  jobDescription: string;
  requirements?: string;
  preferredQualifications?: string;
  salaryMin?: number;
  salaryMax?: number;
  isSalaryNegotiable?: boolean;
  headcount: number;
  workLocation?: string;
  postingStartDate: string;
  postingEndDate: string;
}

export interface UpdateJobPostingRequest {
  title?: string;
  departmentId?: string;
  positionId?: string;
  employmentType?: RecruitmentEmploymentType;
  jobDescription?: string;
  requirements?: string;
  preferredQualifications?: string;
  salaryMin?: number;
  salaryMax?: number;
  isSalaryNegotiable?: boolean;
  headcount?: number;
  workLocation?: string;
  postingStartDate?: string;
  postingEndDate?: string;
}

export interface ScreenApplicationRequest {
  passed: boolean;
  comment?: string;
}

export interface RejectApplicationRequest {
  reason: string;
}

export interface MoveToNextStageRequest {
  stage: ApplicationStage;
  comment?: string;
}

export interface HireApplicationRequest {
  employeeNumber?: string;
  departmentId: string;
  positionId?: string;
  gradeId?: string;
  hireDate: string;
  salary?: number;
  comment?: string;
}

export interface CreateInterviewRequest {
  applicationId: string;
  interviewType: InterviewType;
  scheduledAt: string;
  durationMinutes: number;
  location?: string;
  meetingUrl?: string;
  interviewerIds: string[];
  notes?: string;
}

export interface UpdateInterviewRequest {
  scheduledAt?: string;
  durationMinutes?: number;
  location?: string;
  meetingUrl?: string;
  interviewerIds?: string[];
  notes?: string;
}

export interface UpdateInterviewStatusRequest {
  status: InterviewStatus;
  cancelReason?: string;
}

export interface SubmitInterviewScoreRequest {
  technicalScore?: number;
  communicationScore?: number;
  cultureFitScore?: number;
  problemSolvingScore?: number;
  overallScore: number;
  strengths?: string;
  weaknesses?: string;
  recommendation: InterviewRecommendation;
  comments?: string;
}

// ===== 채용 제안 (Offer) =====

// 오퍼 상태
export type OfferStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'EXPIRED';

export interface Offer extends TenantAwareEntity {
  offerNumber: string;
  applicationId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  jobPostingId: string;
  jobTitle?: string;
  departmentId: string;
  departmentName?: string;
  positionId?: string;
  positionName?: string;
  gradeId?: string;
  gradeName?: string;
  proposedSalary: number;
  startDate: string;
  expiryDate: string;
  benefits?: string;
  terms?: string;
  status: OfferStatus;
  sentAt?: string;
  respondedAt?: string;
  responseComment?: string;
  withdrawnAt?: string;
  withdrawReason?: string;
  createdById: string;
  createdByName?: string;
}

export interface OfferListItem {
  id: string;
  offerNumber: string;
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  jobTitle?: string;
  departmentName?: string;
  positionName?: string;
  proposedSalary: number;
  startDate: string;
  expiryDate: string;
  status: OfferStatus;
  sentAt?: string;
}

export interface OfferSummary {
  total: number;
  draft: number;
  sent: number;
  accepted: number;
  rejected: number;
  withdrawn: number;
  expired: number;
}

export interface OfferSearchParams extends PageRequest {
  keyword?: string;
  applicationId?: string;
  jobPostingId?: string;
  status?: OfferStatus;
  departmentId?: string;
}

export interface CreateOfferRequest {
  applicationId: string;
  departmentId: string;
  positionId?: string;
  gradeId?: string;
  proposedSalary: number;
  startDate: string;
  expiryDate: string;
  benefits?: string;
  terms?: string;
}

export interface UpdateOfferRequest {
  departmentId?: string;
  positionId?: string;
  gradeId?: string;
  proposedSalary?: number;
  startDate?: string;
  expiryDate?: string;
  benefits?: string;
  terms?: string;
}

export interface RespondOfferRequest {
  accepted: boolean;
  comment?: string;
}

export interface WithdrawOfferRequest {
  reason: string;
}

// ===== 지원 취소 =====

export interface WithdrawApplicationRequest {
  reason: string;
}
