import { apiClient, ApiResponse, PageResponse } from '@/lib/apiClient';
import type {
  JobPosting,
  JobPostingListItem,
  JobPostingSearchParams,
  JobPostingSummary,
  CreateJobPostingRequest,
  UpdateJobPostingRequest,
  Application,
  ApplicationListItem,
  ApplicationSearchParams,
  ApplicationSummary,
  ApplicationStageCount,
  ScreenApplicationRequest,
  RejectApplicationRequest,
  MoveToNextStageRequest,
  HireApplicationRequest,
  WithdrawApplicationRequest,
  Interview,
  InterviewListItem,
  InterviewSearchParams,
  InterviewSummary,
  CreateInterviewRequest,
  UpdateInterviewRequest,
  UpdateInterviewStatusRequest,
  InterviewScore,
  SubmitInterviewScoreRequest,
  Offer,
  OfferListItem,
  OfferSearchParams,
  OfferSummary,
  CreateOfferRequest,
  UpdateOfferRequest,
  RespondOfferRequest,
  WithdrawOfferRequest,
} from '@hr-platform/shared-types';

export const recruitmentService = {
  // ===== 채용공고 =====

  async getJobPostings(params?: JobPostingSearchParams): Promise<ApiResponse<PageResponse<JobPostingListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<JobPostingListItem>>>('/jobs', { params });
    return response.data;
  },

  async getJobPosting(id: string): Promise<ApiResponse<JobPosting>> {
    const response = await apiClient.get<ApiResponse<JobPosting>>(`/jobs/${id}`);
    return response.data;
  },

  async getJobPostingSummary(): Promise<ApiResponse<JobPostingSummary>> {
    const response = await apiClient.get<ApiResponse<JobPostingSummary>>('/jobs/summary');
    return response.data;
  },

  async createJobPosting(data: CreateJobPostingRequest): Promise<ApiResponse<JobPosting>> {
    const response = await apiClient.post<ApiResponse<JobPosting>>('/jobs', data);
    return response.data;
  },

  async updateJobPosting(id: string, data: UpdateJobPostingRequest): Promise<ApiResponse<JobPosting>> {
    const response = await apiClient.put<ApiResponse<JobPosting>>(`/jobs/${id}`, data);
    return response.data;
  },

  async deleteJobPosting(id: string): Promise<ApiResponse<null>> {
    const response = await apiClient.delete<ApiResponse<null>>(`/jobs/${id}`);
    return response.data;
  },

  async publishJobPosting(id: string): Promise<ApiResponse<JobPosting>> {
    const response = await apiClient.post<ApiResponse<JobPosting>>(`/jobs/${id}/publish`);
    return response.data;
  },

  async closeJobPosting(id: string): Promise<ApiResponse<JobPosting>> {
    const response = await apiClient.post<ApiResponse<JobPosting>>(`/jobs/${id}/close`);
    return response.data;
  },

  async completeJobPosting(id: string): Promise<ApiResponse<JobPosting>> {
    const response = await apiClient.post<ApiResponse<JobPosting>>(`/jobs/${id}/complete`);
    return response.data;
  },

  // ===== 지원서 =====

  async getApplications(params?: ApplicationSearchParams): Promise<ApiResponse<PageResponse<ApplicationListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<ApplicationListItem>>>('/applications', { params });
    return response.data;
  },

  async getApplicationsByJob(
    jobId: string,
    params?: ApplicationSearchParams
  ): Promise<ApiResponse<PageResponse<ApplicationListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<ApplicationListItem>>>(
      `/jobs/${jobId}/applications`,
      { params }
    );
    return response.data;
  },

  async getApplication(id: string): Promise<ApiResponse<Application>> {
    const response = await apiClient.get<ApiResponse<Application>>(`/applications/${id}`);
    return response.data;
  },

  async getApplicationSummary(jobId?: string): Promise<ApiResponse<ApplicationSummary>> {
    const params = jobId ? { jobId } : undefined;
    const response = await apiClient.get<ApiResponse<ApplicationSummary>>('/applications/summary', { params });
    return response.data;
  },

  async getApplicationStageCounts(jobId: string): Promise<ApiResponse<ApplicationStageCount[]>> {
    const response = await apiClient.get<ApiResponse<ApplicationStageCount[]>>(`/jobs/${jobId}/applications/stages`);
    return response.data;
  },

  async screenApplication(id: string, data: ScreenApplicationRequest): Promise<ApiResponse<Application>> {
    const response = await apiClient.post<ApiResponse<Application>>(`/applications/${id}/screen`, data);
    return response.data;
  },

  async rejectApplication(id: string, data: RejectApplicationRequest): Promise<ApiResponse<Application>> {
    const response = await apiClient.post<ApiResponse<Application>>(`/applications/${id}/reject`, data);
    return response.data;
  },

  async moveToNextStage(id: string, data: MoveToNextStageRequest): Promise<ApiResponse<Application>> {
    const response = await apiClient.post<ApiResponse<Application>>(`/applications/${id}/next-stage`, data);
    return response.data;
  },

  async hireApplication(id: string, data: HireApplicationRequest): Promise<ApiResponse<Application>> {
    const response = await apiClient.post<ApiResponse<Application>>(`/applications/${id}/hire`, data);
    return response.data;
  },

  async withdrawApplication(id: string, data: WithdrawApplicationRequest): Promise<ApiResponse<Application>> {
    const response = await apiClient.post<ApiResponse<Application>>(`/applications/${id}/withdraw`, data);
    return response.data;
  },

  // ===== 면접 =====

  async getInterviews(params?: InterviewSearchParams): Promise<ApiResponse<PageResponse<InterviewListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<InterviewListItem>>>('/interviews', { params });
    return response.data;
  },

  async getMyInterviews(params?: InterviewSearchParams): Promise<ApiResponse<PageResponse<InterviewListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<InterviewListItem>>>('/interviews/my', { params });
    return response.data;
  },

  async getTodayInterviews(): Promise<ApiResponse<InterviewListItem[]>> {
    const response = await apiClient.get<ApiResponse<InterviewListItem[]>>('/interviews/today');
    return response.data;
  },

  async getInterviewsByApplication(applicationId: string): Promise<ApiResponse<Interview[]>> {
    const response = await apiClient.get<ApiResponse<Interview[]>>(`/applications/${applicationId}/interviews`);
    return response.data;
  },

  async getInterview(id: string): Promise<ApiResponse<Interview>> {
    const response = await apiClient.get<ApiResponse<Interview>>(`/interviews/${id}`);
    return response.data;
  },

  async getInterviewSummary(): Promise<ApiResponse<InterviewSummary>> {
    const response = await apiClient.get<ApiResponse<InterviewSummary>>('/interviews/summary');
    return response.data;
  },

  async createInterview(data: CreateInterviewRequest): Promise<ApiResponse<Interview>> {
    const response = await apiClient.post<ApiResponse<Interview>>('/interviews', data);
    return response.data;
  },

  async updateInterview(id: string, data: UpdateInterviewRequest): Promise<ApiResponse<Interview>> {
    const response = await apiClient.put<ApiResponse<Interview>>(`/interviews/${id}`, data);
    return response.data;
  },

  async updateInterviewStatus(id: string, data: UpdateInterviewStatusRequest): Promise<ApiResponse<Interview>> {
    const response = await apiClient.patch<ApiResponse<Interview>>(`/interviews/${id}/status`, data);
    return response.data;
  },

  async cancelInterview(id: string, reason?: string): Promise<ApiResponse<Interview>> {
    const response = await apiClient.post<ApiResponse<Interview>>(`/interviews/${id}/cancel`, { reason });
    return response.data;
  },

  async confirmInterview(id: string): Promise<ApiResponse<Interview>> {
    const response = await apiClient.post<ApiResponse<Interview>>(`/interviews/${id}/confirm`);
    return response.data;
  },

  async completeInterview(id: string): Promise<ApiResponse<Interview>> {
    const response = await apiClient.post<ApiResponse<Interview>>(`/interviews/${id}/complete`);
    return response.data;
  },

  // ===== 면접 평가 =====

  async getInterviewScores(interviewId: string): Promise<ApiResponse<InterviewScore[]>> {
    const response = await apiClient.get<ApiResponse<InterviewScore[]>>(`/interviews/${interviewId}/scores`);
    return response.data;
  },

  async submitInterviewScore(interviewId: string, data: SubmitInterviewScoreRequest): Promise<ApiResponse<InterviewScore>> {
    const response = await apiClient.post<ApiResponse<InterviewScore>>(`/interviews/${interviewId}/scores`, data);
    return response.data;
  },

  async updateInterviewScore(
    interviewId: string,
    scoreId: string,
    data: SubmitInterviewScoreRequest
  ): Promise<ApiResponse<InterviewScore>> {
    const response = await apiClient.put<ApiResponse<InterviewScore>>(
      `/interviews/${interviewId}/scores/${scoreId}`,
      data
    );
    return response.data;
  },

  async getMyInterviewScore(interviewId: string): Promise<ApiResponse<InterviewScore | null>> {
    const response = await apiClient.get<ApiResponse<InterviewScore | null>>(`/interviews/${interviewId}/scores/my`);
    return response.data;
  },

  // ===== 채용 제안 (Offer) =====

  async getOffers(params?: OfferSearchParams): Promise<ApiResponse<PageResponse<OfferListItem>>> {
    const response = await apiClient.get<ApiResponse<PageResponse<OfferListItem>>>('/offers', { params });
    return response.data;
  },

  async getOffer(id: string): Promise<ApiResponse<Offer>> {
    const response = await apiClient.get<ApiResponse<Offer>>(`/offers/${id}`);
    return response.data;
  },

  async getOfferSummary(): Promise<ApiResponse<OfferSummary>> {
    const response = await apiClient.get<ApiResponse<OfferSummary>>('/offers/summary');
    return response.data;
  },

  async getOfferByApplication(applicationId: string): Promise<ApiResponse<Offer | null>> {
    const response = await apiClient.get<ApiResponse<Offer | null>>(`/applications/${applicationId}/offer`);
    return response.data;
  },

  async createOffer(data: CreateOfferRequest): Promise<ApiResponse<Offer>> {
    const response = await apiClient.post<ApiResponse<Offer>>('/offers', data);
    return response.data;
  },

  async updateOffer(id: string, data: UpdateOfferRequest): Promise<ApiResponse<Offer>> {
    const response = await apiClient.put<ApiResponse<Offer>>(`/offers/${id}`, data);
    return response.data;
  },

  async sendOffer(id: string): Promise<ApiResponse<Offer>> {
    const response = await apiClient.post<ApiResponse<Offer>>(`/offers/${id}/send`);
    return response.data;
  },

  async respondOffer(id: string, data: RespondOfferRequest): Promise<ApiResponse<Offer>> {
    const response = await apiClient.post<ApiResponse<Offer>>(`/offers/${id}/respond`, data);
    return response.data;
  },

  async withdrawOffer(id: string, data: WithdrawOfferRequest): Promise<ApiResponse<Offer>> {
    const response = await apiClient.post<ApiResponse<Offer>>(`/offers/${id}/withdraw`, data);
    return response.data;
  },
};
