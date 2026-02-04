import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useMemo, useCallback } from 'react';
import { queryKeys } from '@/lib/queryKeys';
import { recruitmentService } from '../services/recruitmentService';
import type {
  JobPostingSearchParams,
  JobStatus,
  RecruitmentEmploymentType,
  CreateJobPostingRequest,
  UpdateJobPostingRequest,
  ApplicationSearchParams,
  ApplicationStatus,
  ApplicationStage,
  ScreenApplicationRequest,
  RejectApplicationRequest,
  MoveToNextStageRequest,
  HireApplicationRequest,
  WithdrawApplicationRequest,
  InterviewSearchParams,
  InterviewStatus,
  InterviewType,
  CreateInterviewRequest,
  UpdateInterviewRequest,
  UpdateInterviewStatusRequest,
  SubmitInterviewScoreRequest,
  OfferSearchParams,
  OfferStatus,
  CreateOfferRequest,
  UpdateOfferRequest,
  RespondOfferRequest,
  WithdrawOfferRequest,
} from '@hr-platform/shared-types';

// ===== 채용공고 Queries =====

export function useJobPostings(params?: JobPostingSearchParams) {
  return useQuery({
    queryKey: queryKeys.recruitment.jobs.list(params as Record<string, unknown> | undefined),
    queryFn: () => recruitmentService.getJobPostings(params),
  });
}

export function useJobPosting(id: string) {
  return useQuery({
    queryKey: queryKeys.recruitment.jobs.detail(id),
    queryFn: () => recruitmentService.getJobPosting(id),
    enabled: !!id,
  });
}

export function useJobPostingSummary() {
  return useQuery({
    queryKey: queryKeys.recruitment.jobs.summary(),
    queryFn: () => recruitmentService.getJobPostingSummary(),
  });
}

// ===== 채용공고 Mutations =====

export function useCreateJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobPostingRequest) => recruitmentService.createJobPosting(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.jobs.all() });
    },
    onError: (error) => {
      console.error('[useCreateJobPosting] Error:', error);
    },
  });
}

export function useUpdateJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateJobPostingRequest }) =>
      recruitmentService.updateJobPosting(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.jobs.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.jobs.detail(variables.id) });
    },
    onError: (error) => {
      console.error('[useUpdateJobPosting] Error:', error);
    },
  });
}

export function useDeleteJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recruitmentService.deleteJobPosting(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.jobs.all() });
    },
    onError: (error) => {
      console.error('[useDeleteJobPosting] Error:', error);
    },
  });
}

export function usePublishJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recruitmentService.publishJobPosting(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.jobs.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.jobs.detail(id) });
    },
    onError: (error) => {
      console.error('[usePublishJobPosting] Error:', error);
    },
  });
}

export function useCloseJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recruitmentService.closeJobPosting(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.jobs.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.jobs.detail(id) });
    },
    onError: (error) => {
      console.error('[useCloseJobPosting] Error:', error);
    },
  });
}

export function useCompleteJobPosting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recruitmentService.completeJobPosting(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.jobs.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.jobs.detail(id) });
    },
    onError: (error) => {
      console.error('[useCompleteJobPosting] Error:', error);
    },
  });
}

// ===== 지원서 Queries =====

export function useApplications(params?: ApplicationSearchParams) {
  return useQuery({
    queryKey: queryKeys.recruitment.applications.list(params as Record<string, unknown> | undefined),
    queryFn: () => recruitmentService.getApplications(params),
  });
}

export function useApplicationsByJob(jobId: string, params?: ApplicationSearchParams) {
  return useQuery({
    queryKey: queryKeys.recruitment.applications.byJob(jobId, params as Record<string, unknown> | undefined),
    queryFn: () => recruitmentService.getApplicationsByJob(jobId, params),
    enabled: !!jobId,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: queryKeys.recruitment.applications.detail(id),
    queryFn: () => recruitmentService.getApplication(id),
    enabled: !!id,
  });
}

export function useApplicationSummary(jobId?: string) {
  return useQuery({
    queryKey: queryKeys.recruitment.applications.summary(jobId),
    queryFn: () => recruitmentService.getApplicationSummary(jobId),
  });
}

export function useApplicationStageCounts(jobId: string) {
  return useQuery({
    queryKey: queryKeys.recruitment.applications.stages(jobId),
    queryFn: () => recruitmentService.getApplicationStageCounts(jobId),
    enabled: !!jobId,
  });
}

// ===== 지원서 Mutations =====

export function useScreenApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScreenApplicationRequest }) =>
      recruitmentService.screenApplication(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.applications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.applications.detail(variables.id) });
    },
    onError: (error) => {
      console.error('[useScreenApplication] Error:', error);
    },
  });
}

export function useRejectApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RejectApplicationRequest }) =>
      recruitmentService.rejectApplication(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.applications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.applications.detail(variables.id) });
    },
    onError: (error) => {
      console.error('[useRejectApplication] Error:', error);
    },
  });
}

export function useMoveToNextStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MoveToNextStageRequest }) =>
      recruitmentService.moveToNextStage(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.applications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.applications.detail(variables.id) });
    },
    onError: (error) => {
      console.error('[useMoveToNextStage] Error:', error);
    },
  });
}

export function useHireApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HireApplicationRequest }) =>
      recruitmentService.hireApplication(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.applications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.applications.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.jobs.all() });
    },
    onError: (error) => {
      console.error('[useHireApplication] Error:', error);
    },
  });
}

export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WithdrawApplicationRequest }) =>
      recruitmentService.withdrawApplication(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.applications.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.applications.detail(variables.id) });
    },
    onError: (error) => {
      console.error('[useWithdrawApplication] Error:', error);
    },
  });
}

// ===== 면접 Queries =====

export function useInterviews(params?: InterviewSearchParams) {
  return useQuery({
    queryKey: queryKeys.recruitment.interviews.list(params as Record<string, unknown> | undefined),
    queryFn: () => recruitmentService.getInterviews(params),
  });
}

export function useMyInterviews(params?: InterviewSearchParams) {
  return useQuery({
    queryKey: queryKeys.recruitment.interviews.my(params as Record<string, unknown> | undefined),
    queryFn: () => recruitmentService.getMyInterviews(params),
  });
}

export function useTodayInterviews() {
  return useQuery({
    queryKey: queryKeys.recruitment.interviews.today(),
    queryFn: () => recruitmentService.getTodayInterviews(),
  });
}

export function useInterviewsByApplication(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.recruitment.interviews.byApplication(applicationId),
    queryFn: () => recruitmentService.getInterviewsByApplication(applicationId),
    enabled: !!applicationId,
  });
}

export function useInterview(id: string) {
  return useQuery({
    queryKey: queryKeys.recruitment.interviews.detail(id),
    queryFn: () => recruitmentService.getInterview(id),
    enabled: !!id,
  });
}

export function useInterviewSummary() {
  return useQuery({
    queryKey: queryKeys.recruitment.interviews.summary(),
    queryFn: () => recruitmentService.getInterviewSummary(),
  });
}

export function useInterviewScores(interviewId: string) {
  return useQuery({
    queryKey: queryKeys.recruitment.interviews.scores(interviewId),
    queryFn: () => recruitmentService.getInterviewScores(interviewId),
    enabled: !!interviewId,
  });
}

export function useMyInterviewScore(interviewId: string) {
  return useQuery({
    queryKey: queryKeys.recruitment.interviews.myScore(interviewId),
    queryFn: () => recruitmentService.getMyInterviewScore(interviewId),
    enabled: !!interviewId,
  });
}

// ===== 면접 Mutations =====

export function useCreateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInterviewRequest) => recruitmentService.createInterview(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.byApplication(data.applicationId) });
    },
    onError: (error) => {
      console.error('[useCreateInterview] Error:', error);
    },
  });
}

export function useUpdateInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInterviewRequest }) =>
      recruitmentService.updateInterview(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.detail(variables.id) });
    },
    onError: (error) => {
      console.error('[useUpdateInterview] Error:', error);
    },
  });
}

export function useUpdateInterviewStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateInterviewStatusRequest }) =>
      recruitmentService.updateInterviewStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.detail(variables.id) });
    },
    onError: (error) => {
      console.error('[useUpdateInterviewStatus] Error:', error);
    },
  });
}

export function useCancelInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      recruitmentService.cancelInterview(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.detail(variables.id) });
    },
    onError: (error) => {
      console.error('[useCancelInterview] Error:', error);
    },
  });
}

export function useConfirmInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recruitmentService.confirmInterview(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.detail(id) });
    },
    onError: (error) => {
      console.error('[useConfirmInterview] Error:', error);
    },
  });
}

export function useCompleteInterview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recruitmentService.completeInterview(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.detail(id) });
    },
    onError: (error) => {
      console.error('[useCompleteInterview] Error:', error);
    },
  });
}

export function useSubmitInterviewScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ interviewId, data }: { interviewId: string; data: SubmitInterviewScoreRequest }) =>
      recruitmentService.submitInterviewScore(interviewId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.scores(variables.interviewId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.myScore(variables.interviewId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.detail(variables.interviewId) });
    },
    onError: (error) => {
      console.error('[useSubmitInterviewScore] Error:', error);
    },
  });
}

export function useUpdateInterviewScore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      interviewId,
      scoreId,
      data,
    }: {
      interviewId: string;
      scoreId: string;
      data: SubmitInterviewScoreRequest;
    }) => recruitmentService.updateInterviewScore(interviewId, scoreId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.scores(variables.interviewId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.myScore(variables.interviewId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.interviews.detail(variables.interviewId) });
    },
    onError: (error) => {
      console.error('[useUpdateInterviewScore] Error:', error);
    },
  });
}

// ===== Search Params Hooks =====

interface JobPostingSearchState {
  keyword: string;
  status: JobStatus | '';
  employmentType: RecruitmentEmploymentType | '';
  page: number;
  size: number;
}

export function useJobPostingSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<JobPostingSearchState>({
    keyword: '',
    status: '',
    employmentType: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<JobPostingSearchParams>(
    () => ({
      page: searchState.page,
      size: searchState.size,
      ...(searchState.keyword && { keyword: searchState.keyword }),
      ...(searchState.status && { status: searchState.status }),
      ...(searchState.employmentType && { employmentType: searchState.employmentType }),
    }),
    [searchState]
  );

  const setKeyword = useCallback((keyword: string) => {
    setSearchState((prev) => ({ ...prev, keyword, page: 0 }));
  }, []);

  const setStatus = useCallback((status: JobStatus | '') => {
    setSearchState((prev) => ({ ...prev, status, page: 0 }));
  }, []);

  const setEmploymentType = useCallback((employmentType: RecruitmentEmploymentType | '') => {
    setSearchState((prev) => ({ ...prev, employmentType, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState((prev) => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ keyword: '', status: '', employmentType: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setKeyword,
    setStatus,
    setEmploymentType,
    setPage,
    resetFilters,
  };
}

interface ApplicationSearchState {
  keyword: string;
  jobPostingId: string;
  status: ApplicationStatus | '';
  stage: ApplicationStage | '';
  page: number;
  size: number;
}

export function useApplicationSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<ApplicationSearchState>({
    keyword: '',
    jobPostingId: '',
    status: '',
    stage: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<ApplicationSearchParams>(
    () => ({
      page: searchState.page,
      size: searchState.size,
      ...(searchState.keyword && { keyword: searchState.keyword }),
      ...(searchState.jobPostingId && { jobPostingId: searchState.jobPostingId }),
      ...(searchState.status && { status: searchState.status }),
      ...(searchState.stage && { stage: searchState.stage }),
    }),
    [searchState]
  );

  const setKeyword = useCallback((keyword: string) => {
    setSearchState((prev) => ({ ...prev, keyword, page: 0 }));
  }, []);

  const setJobPostingId = useCallback((jobPostingId: string) => {
    setSearchState((prev) => ({ ...prev, jobPostingId, page: 0 }));
  }, []);

  const setStatus = useCallback((status: ApplicationStatus | '') => {
    setSearchState((prev) => ({ ...prev, status, page: 0 }));
  }, []);

  const setStage = useCallback((stage: ApplicationStage | '') => {
    setSearchState((prev) => ({ ...prev, stage, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState((prev) => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ keyword: '', jobPostingId: '', status: '', stage: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setKeyword,
    setJobPostingId,
    setStatus,
    setStage,
    setPage,
    resetFilters,
  };
}

interface InterviewSearchState {
  interviewType: InterviewType | '';
  status: InterviewStatus | '';
  page: number;
  size: number;
}

export function useInterviewSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<InterviewSearchState>({
    interviewType: '',
    status: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<InterviewSearchParams>(
    () => ({
      page: searchState.page,
      size: searchState.size,
      ...(searchState.interviewType && { interviewType: searchState.interviewType }),
      ...(searchState.status && { status: searchState.status }),
    }),
    [searchState]
  );

  const setInterviewType = useCallback((interviewType: InterviewType | '') => {
    setSearchState((prev) => ({ ...prev, interviewType, page: 0 }));
  }, []);

  const setStatus = useCallback((status: InterviewStatus | '') => {
    setSearchState((prev) => ({ ...prev, status, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState((prev) => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ interviewType: '', status: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setInterviewType,
    setStatus,
    setPage,
    resetFilters,
  };
}

// ===== 채용 제안 (Offer) Queries =====

export function useOffers(params?: OfferSearchParams) {
  return useQuery({
    queryKey: queryKeys.recruitment.offers.list(params as Record<string, unknown> | undefined),
    queryFn: () => recruitmentService.getOffers(params),
  });
}

export function useOffer(id: string) {
  return useQuery({
    queryKey: queryKeys.recruitment.offers.detail(id),
    queryFn: () => recruitmentService.getOffer(id),
    enabled: !!id,
  });
}

export function useOfferByApplication(applicationId: string) {
  return useQuery({
    queryKey: queryKeys.recruitment.offers.byApplication(applicationId),
    queryFn: () => recruitmentService.getOfferByApplication(applicationId),
    enabled: !!applicationId,
  });
}

export function useOfferSummary() {
  return useQuery({
    queryKey: queryKeys.recruitment.offers.summary(),
    queryFn: () => recruitmentService.getOfferSummary(),
  });
}

// ===== 채용 제안 (Offer) Mutations =====

export function useCreateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOfferRequest) => recruitmentService.createOffer(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.offers.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.offers.byApplication(data.applicationId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.applications.detail(data.applicationId) });
    },
    onError: (error) => {
      console.error('[useCreateOffer] Error:', error);
    },
  });
}

export function useUpdateOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOfferRequest }) =>
      recruitmentService.updateOffer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.offers.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.offers.detail(variables.id) });
    },
    onError: (error) => {
      console.error('[useUpdateOffer] Error:', error);
    },
  });
}

export function useSendOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recruitmentService.sendOffer(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.offers.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.offers.detail(id) });
    },
    onError: (error) => {
      console.error('[useSendOffer] Error:', error);
    },
  });
}

export function useRespondOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RespondOfferRequest }) =>
      recruitmentService.respondOffer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.offers.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.offers.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.applications.all() });
    },
    onError: (error) => {
      console.error('[useRespondOffer] Error:', error);
    },
  });
}

export function useWithdrawOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: WithdrawOfferRequest }) =>
      recruitmentService.withdrawOffer(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.offers.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.recruitment.offers.detail(variables.id) });
    },
    onError: (error) => {
      console.error('[useWithdrawOffer] Error:', error);
    },
  });
}

// ===== Offer Search Params =====

interface OfferSearchState {
  keyword: string;
  applicationId: string;
  jobPostingId: string;
  status: OfferStatus | '';
  page: number;
  size: number;
}

export function useOfferSearchParams(initialSize = 10) {
  const [searchState, setSearchState] = useState<OfferSearchState>({
    keyword: '',
    applicationId: '',
    jobPostingId: '',
    status: '',
    page: 0,
    size: initialSize,
  });

  const params = useMemo<OfferSearchParams>(
    () => ({
      page: searchState.page,
      size: searchState.size,
      ...(searchState.keyword && { keyword: searchState.keyword }),
      ...(searchState.applicationId && { applicationId: searchState.applicationId }),
      ...(searchState.jobPostingId && { jobPostingId: searchState.jobPostingId }),
      ...(searchState.status && { status: searchState.status }),
    }),
    [searchState]
  );

  const setKeyword = useCallback((keyword: string) => {
    setSearchState((prev) => ({ ...prev, keyword, page: 0 }));
  }, []);

  const setApplicationId = useCallback((applicationId: string) => {
    setSearchState((prev) => ({ ...prev, applicationId, page: 0 }));
  }, []);

  const setJobPostingId = useCallback((jobPostingId: string) => {
    setSearchState((prev) => ({ ...prev, jobPostingId, page: 0 }));
  }, []);

  const setStatus = useCallback((status: OfferStatus | '') => {
    setSearchState((prev) => ({ ...prev, status, page: 0 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setSearchState((prev) => ({ ...prev, page }));
  }, []);

  const resetFilters = useCallback(() => {
    setSearchState({ keyword: '', applicationId: '', jobPostingId: '', status: '', page: 0, size: initialSize });
  }, [initialSize]);

  return {
    params,
    searchState,
    setKeyword,
    setApplicationId,
    setJobPostingId,
    setStatus,
    setPage,
    resetFilters,
  };
}
