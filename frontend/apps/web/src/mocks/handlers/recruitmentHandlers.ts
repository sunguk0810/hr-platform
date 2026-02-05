import { http, HttpResponse, delay } from 'msw';
import type {
  JobPosting,
  JobPostingListItem,
  JobStatus,
  RecruitmentEmploymentType,
  Application,
  ApplicationListItem,
  ApplicationStatus,
  ApplicationStage,
  Interview,
  InterviewListItem,
  InterviewStatus,
  InterviewType,
  InterviewScore,
  InterviewRecommendation,
} from '@hr-platform/shared-types';

// Mock Data
const mockJobPostings: JobPosting[] = [
  {
    id: 'job-001',
    tenantId: 'tenant-001',
    jobCode: 'JOB-2024-001',
    title: '백엔드 개발자 (Java/Spring)',
    departmentId: 'dept-001',
    departmentName: '개발팀',
    positionId: 'pos-002',
    positionName: '선임',
    employmentType: 'FULL_TIME',
    jobDescription: `담당 업무:
- Spring Boot 기반 API 개발 및 유지보수
- 마이크로서비스 아키텍처 설계 및 구현
- 데이터베이스 설계 및 최적화
- 코드 리뷰 및 기술 멘토링`,
    requirements: `필수 자격:
- Java 개발 경력 3년 이상
- Spring Framework 실무 경험
- RDBMS (MySQL, PostgreSQL) 경험
- RESTful API 설계 경험`,
    preferredQualifications: `우대 사항:
- Kotlin 경험
- Kubernetes, Docker 경험
- MSA 설계 및 구축 경험
- 오픈소스 기여 경험`,
    salaryMin: 5000,
    salaryMax: 8000,
    isSalaryNegotiable: false,
    headcount: 3,
    workLocation: '서울 강남구',
    postingStartDate: '2024-01-01',
    postingEndDate: '2024-03-31',
    status: 'OPEN',
    viewCount: 1523,
    applicationCount: 45,
    recruiterId: 'emp-003',
    recruiterName: '이영희',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z',
  },
  {
    id: 'job-002',
    tenantId: 'tenant-001',
    jobCode: 'JOB-2024-002',
    title: '프론트엔드 개발자 (React)',
    departmentId: 'dept-001',
    departmentName: '개발팀',
    employmentType: 'FULL_TIME',
    jobDescription: `담당 업무:
- React/TypeScript 기반 웹 애플리케이션 개발
- UI/UX 개선 및 사용자 경험 최적화
- 프론트엔드 아키텍처 설계`,
    requirements: `필수 자격:
- React 개발 경력 2년 이상
- TypeScript 실무 경험
- 상태관리 라이브러리 경험`,
    salaryMin: 4500,
    salaryMax: 7000,
    isSalaryNegotiable: true,
    headcount: 2,
    workLocation: '서울 강남구',
    postingStartDate: '2024-01-15',
    postingEndDate: '2024-04-15',
    status: 'OPEN',
    viewCount: 980,
    applicationCount: 32,
    recruiterId: 'emp-003',
    recruiterName: '이영희',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-10T14:30:00Z',
  },
  {
    id: 'job-003',
    tenantId: 'tenant-001',
    jobCode: 'JOB-2024-003',
    title: '인사담당자',
    departmentId: 'dept-002',
    departmentName: '인사팀',
    employmentType: 'FULL_TIME',
    jobDescription: `담당 업무:
- 채용 프로세스 운영 및 개선
- 인사 정책 수립 및 시행
- 직원 성과 관리`,
    requirements: `필수 자격:
- 인사 업무 경력 3년 이상
- HR 시스템 사용 경험`,
    headcount: 1,
    workLocation: '서울 강남구',
    postingStartDate: '2024-02-01',
    postingEndDate: '2024-02-28',
    status: 'CLOSED',
    viewCount: 456,
    applicationCount: 15,
    recruiterId: 'emp-003',
    recruiterName: '이영희',
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-28T18:00:00Z',
  },
  {
    id: 'job-004',
    tenantId: 'tenant-001',
    jobCode: 'JOB-2024-004',
    title: '인턴 개발자',
    departmentId: 'dept-001',
    departmentName: '개발팀',
    employmentType: 'INTERN',
    jobDescription: '개발팀 인턴십 프로그램',
    requirements: '컴퓨터공학 전공 졸업예정자',
    headcount: 5,
    workLocation: '서울 강남구',
    postingStartDate: '2024-03-01',
    postingEndDate: '2024-05-31',
    status: 'DRAFT',
    viewCount: 0,
    applicationCount: 0,
    recruiterId: 'emp-003',
    recruiterName: '이영희',
    createdAt: '2024-02-20T00:00:00Z',
    updatedAt: '2024-02-20T00:00:00Z',
  },
];

const mockApplications: Application[] = [
  {
    id: 'app-001',
    tenantId: 'tenant-001',
    applicationNumber: 'APP-2024-0001',
    jobPostingId: 'job-001',
    jobTitle: '백엔드 개발자 (Java/Spring)',
    jobCode: 'JOB-2024-001',
    applicantId: 'applicant-001',
    applicantName: '김지원',
    applicantEmail: 'kim.jiwon@email.com',
    applicantPhone: '010-1111-2222',
    resumeFileId: 'file-001',
    resumeFileName: '김지원_이력서.pdf',
    coverLetter: '안녕하세요. 백엔드 개발자 포지션에 지원합니다...',
    currentStage: 'SECOND_INTERVIEW',
    status: 'IN_PROGRESS',
    appliedAt: '2024-01-15T10:30:00Z',
    statusChangedAt: '2024-02-10T14:00:00Z',
    screenedAt: '2024-01-20T09:00:00Z',
    screenedBy: 'emp-003',
    screenedByName: '이영희',
    screeningComment: '우수한 경력과 기술 스택. 1차 면접 진행 권장.',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-02-10T14:00:00Z',
  },
  {
    id: 'app-002',
    tenantId: 'tenant-001',
    applicationNumber: 'APP-2024-0002',
    jobPostingId: 'job-001',
    jobTitle: '백엔드 개발자 (Java/Spring)',
    jobCode: 'JOB-2024-001',
    applicantId: 'applicant-002',
    applicantName: '박서준',
    applicantEmail: 'park.sj@email.com',
    applicantPhone: '010-2222-3333',
    currentStage: 'DOCUMENT',
    status: 'SCREENING',
    appliedAt: '2024-02-01T14:20:00Z',
    createdAt: '2024-02-01T14:20:00Z',
    updatedAt: '2024-02-01T14:20:00Z',
  },
  {
    id: 'app-003',
    tenantId: 'tenant-001',
    applicationNumber: 'APP-2024-0003',
    jobPostingId: 'job-001',
    jobTitle: '백엔드 개발자 (Java/Spring)',
    jobCode: 'JOB-2024-001',
    applicantId: 'applicant-003',
    applicantName: '이민정',
    applicantEmail: 'lee.mj@email.com',
    currentStage: 'FIRST_INTERVIEW',
    status: 'IN_PROGRESS',
    appliedAt: '2024-01-20T09:00:00Z',
    screenedAt: '2024-01-25T11:00:00Z',
    screenedBy: 'emp-003',
    screenedByName: '이영희',
    screeningComment: '풍부한 프로젝트 경험',
    createdAt: '2024-01-20T09:00:00Z',
    updatedAt: '2024-02-05T10:00:00Z',
  },
  {
    id: 'app-004',
    tenantId: 'tenant-001',
    applicationNumber: 'APP-2024-0004',
    jobPostingId: 'job-002',
    jobTitle: '프론트엔드 개발자 (React)',
    jobCode: 'JOB-2024-002',
    applicantId: 'applicant-004',
    applicantName: '최현우',
    applicantEmail: 'choi.hw@email.com',
    currentStage: 'OFFER',
    status: 'PASSED',
    appliedAt: '2024-01-25T16:00:00Z',
    createdAt: '2024-01-25T16:00:00Z',
    updatedAt: '2024-02-20T15:00:00Z',
  },
  {
    id: 'app-005',
    tenantId: 'tenant-001',
    applicationNumber: 'APP-2024-0005',
    jobPostingId: 'job-001',
    jobTitle: '백엔드 개발자 (Java/Spring)',
    jobCode: 'JOB-2024-001',
    applicantId: 'applicant-005',
    applicantName: '정다은',
    applicantEmail: 'jung.de@email.com',
    currentStage: 'DOCUMENT',
    status: 'FAILED',
    appliedAt: '2024-02-05T11:00:00Z',
    rejectionReason: '경력 요건 미충족',
    createdAt: '2024-02-05T11:00:00Z',
    updatedAt: '2024-02-08T09:00:00Z',
  },
];

const mockInterviews: Interview[] = [
  {
    id: 'int-001',
    tenantId: 'tenant-001',
    applicationId: 'app-001',
    applicantName: '김지원',
    applicantEmail: 'kim.jiwon@email.com',
    jobPostingId: 'job-001',
    jobTitle: '백엔드 개발자 (Java/Spring)',
    jobCode: 'JOB-2024-001',
    interviewType: 'TECHNICAL',
    scheduledAt: '2024-02-15T14:00:00Z',
    durationMinutes: 60,
    location: '본사 3층 회의실 A',
    interviewerIds: ['emp-001', 'emp-006'],
    interviewerNames: ['홍길동', '정민호'],
    status: 'COMPLETED',
    averageScore: 8.5,
    completedAt: '2024-02-15T15:10:00Z',
    createdAt: '2024-02-01T10:00:00Z',
    updatedAt: '2024-02-15T15:10:00Z',
  },
  {
    id: 'int-002',
    tenantId: 'tenant-001',
    applicationId: 'app-001',
    applicantName: '김지원',
    applicantEmail: 'kim.jiwon@email.com',
    jobPostingId: 'job-001',
    jobTitle: '백엔드 개발자 (Java/Spring)',
    jobCode: 'JOB-2024-001',
    interviewType: 'FINAL',
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 후
    durationMinutes: 45,
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
    interviewerIds: ['emp-009'],
    interviewerNames: ['임준혁'],
    status: 'SCHEDULED',
    createdAt: '2024-02-16T09:00:00Z',
    updatedAt: '2024-02-16T09:00:00Z',
  },
  {
    id: 'int-003',
    tenantId: 'tenant-001',
    applicationId: 'app-003',
    applicantName: '이민정',
    applicantEmail: 'lee.mj@email.com',
    jobPostingId: 'job-001',
    jobTitle: '백엔드 개발자 (Java/Spring)',
    jobCode: 'JOB-2024-001',
    interviewType: 'VIDEO',
    scheduledAt: new Date().toISOString(), // 오늘
    durationMinutes: 60,
    meetingUrl: 'https://meet.google.com/xyz-uvwx-yzz',
    interviewerIds: ['emp-001'],
    interviewerNames: ['홍길동'],
    status: 'SCHEDULED',
    createdAt: '2024-02-10T14:00:00Z',
    updatedAt: '2024-02-10T14:00:00Z',
  },
  {
    id: 'int-004',
    tenantId: 'tenant-001',
    applicationId: 'app-004',
    applicantName: '최현우',
    applicantEmail: 'choi.hw@email.com',
    jobPostingId: 'job-002',
    jobTitle: '프론트엔드 개발자 (React)',
    jobCode: 'JOB-2024-002',
    interviewType: 'ONSITE',
    scheduledAt: '2024-02-10T10:00:00Z',
    durationMinutes: 90,
    location: '본사 2층 회의실 B',
    interviewerIds: ['emp-001', 'emp-005'],
    interviewerNames: ['홍길동', '최수진'],
    status: 'COMPLETED',
    averageScore: 9.0,
    completedAt: '2024-02-10T11:35:00Z',
    createdAt: '2024-02-05T09:00:00Z',
    updatedAt: '2024-02-10T11:35:00Z',
  },
];

const mockInterviewScores: Record<string, InterviewScore[]> = {
  'int-001': [
    {
      id: 'score-001',
      tenantId: 'tenant-001',
      interviewId: 'int-001',
      interviewerId: 'emp-001',
      interviewerName: '홍길동',
      technicalScore: 9,
      communicationScore: 8,
      cultureFitScore: 8,
      problemSolvingScore: 9,
      overallScore: 9,
      strengths: '알고리즘 이해도가 높고 시스템 설계 경험이 풍부함',
      weaknesses: '대규모 트래픽 처리 경험이 부족해 보임',
      recommendation: 'HIRE',
      comments: '팀에 좋은 기여를 할 것으로 기대됨',
      evaluatedAt: '2024-02-15T15:30:00Z',
      createdAt: '2024-02-15T15:30:00Z',
      updatedAt: '2024-02-15T15:30:00Z',
    },
    {
      id: 'score-002',
      tenantId: 'tenant-001',
      interviewId: 'int-001',
      interviewerId: 'emp-006',
      interviewerName: '정민호',
      technicalScore: 8,
      communicationScore: 8,
      cultureFitScore: 9,
      problemSolvingScore: 8,
      overallScore: 8,
      strengths: '코드 품질에 대한 높은 기준, 협업 자세 우수',
      recommendation: 'HIRE',
      evaluatedAt: '2024-02-15T16:00:00Z',
      createdAt: '2024-02-15T16:00:00Z',
      updatedAt: '2024-02-15T16:00:00Z',
    },
  ],
  'int-004': [
    {
      id: 'score-003',
      tenantId: 'tenant-001',
      interviewId: 'int-004',
      interviewerId: 'emp-001',
      interviewerName: '홍길동',
      technicalScore: 9,
      communicationScore: 9,
      cultureFitScore: 9,
      overallScore: 9,
      strengths: 'React 생태계에 대한 깊은 이해, 최신 트렌드 파악',
      recommendation: 'STRONG_HIRE',
      evaluatedAt: '2024-02-10T12:00:00Z',
      createdAt: '2024-02-10T12:00:00Z',
      updatedAt: '2024-02-10T12:00:00Z',
    },
  ],
};

function toJobListItem(job: JobPosting): JobPostingListItem {
  return {
    id: job.id,
    jobCode: job.jobCode,
    title: job.title,
    departmentName: job.departmentName,
    employmentType: job.employmentType,
    headcount: job.headcount,
    applicationCount: job.applicationCount,
    postingStartDate: job.postingStartDate,
    postingEndDate: job.postingEndDate,
    status: job.status,
    recruiterName: job.recruiterName,
  };
}

function toApplicationListItem(app: Application): ApplicationListItem {
  return {
    id: app.id,
    applicationNumber: app.applicationNumber,
    jobPostingId: app.jobPostingId,
    jobTitle: app.jobTitle,
    jobCode: app.jobCode,
    applicantName: app.applicantName,
    applicantEmail: app.applicantEmail,
    currentStage: app.currentStage,
    status: app.status,
    appliedAt: app.appliedAt,
  };
}

function toInterviewListItem(interview: Interview): InterviewListItem {
  return {
    id: interview.id,
    applicationId: interview.applicationId,
    applicantName: interview.applicantName,
    jobTitle: interview.jobTitle,
    interviewType: interview.interviewType,
    scheduledAt: interview.scheduledAt,
    durationMinutes: interview.durationMinutes,
    location: interview.location,
    meetingUrl: interview.meetingUrl,
    interviewerNames: interview.interviewerNames,
    status: interview.status,
    averageScore: interview.averageScore,
  };
}

export const recruitmentHandlers = [
  // ===== Job Postings =====

  // Get job postings list
  http.get('/api/v1/jobs', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const keyword = url.searchParams.get('keyword') || '';
    const status = url.searchParams.get('status') as JobStatus | null;

    let filtered = [...mockJobPostings];

    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(
        (j) =>
          j.title.toLowerCase().includes(lowerKeyword) ||
          j.jobCode.toLowerCase().includes(lowerKeyword) ||
          j.departmentName?.toLowerCase().includes(lowerKeyword)
      );
    }

    if (status) {
      filtered = filtered.filter((j) => j.status === status);
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size).map(toJobListItem);

    return HttpResponse.json({
      success: true,
      data: { content, page, size, totalElements, totalPages, first: page === 0, last: page >= totalPages - 1 },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get job posting summary
  http.get('/api/v1/jobs/summary', async () => {
    await delay(200);

    const summary = {
      total: mockJobPostings.length,
      open: mockJobPostings.filter((j) => j.status === 'OPEN').length,
      closed: mockJobPostings.filter((j) => j.status === 'CLOSED').length,
      completed: mockJobPostings.filter((j) => j.status === 'COMPLETED').length,
      draft: mockJobPostings.filter((j) => j.status === 'DRAFT').length,
    };

    return HttpResponse.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString(),
    });
  }),

  // Get job posting detail
  http.get('/api/v1/jobs/:id', async ({ params }) => {
    await delay(200);

    const job = mockJobPostings.find((j) => j.id === params.id);

    if (!job) {
      return HttpResponse.json(
        { success: false, error: { code: 'JOB_001', message: '채용공고를 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, data: job, timestamp: new Date().toISOString() });
  }),

  // Create job posting
  http.post('/api/v1/jobs', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as Record<string, unknown>;
    const newJob: JobPosting = {
      id: `job-${Date.now()}`,
      tenantId: 'tenant-001',
      jobCode: `JOB-2024-${String(mockJobPostings.length + 1).padStart(3, '0')}`,
      title: body.title as string,
      departmentId: body.departmentId as string,
      departmentName: '부서',
      employmentType: body.employmentType as RecruitmentEmploymentType,
      jobDescription: body.jobDescription as string,
      requirements: body.requirements as string,
      preferredQualifications: body.preferredQualifications as string,
      headcount: body.headcount as number,
      workLocation: body.workLocation as string,
      postingStartDate: body.postingStartDate as string,
      postingEndDate: body.postingEndDate as string,
      status: 'DRAFT',
      viewCount: 0,
      applicationCount: 0,
      recruiterId: 'emp-003',
      recruiterName: '이영희',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockJobPostings.unshift(newJob);

    return HttpResponse.json({ success: true, data: newJob, message: '채용공고가 등록되었습니다.', timestamp: new Date().toISOString() }, { status: 201 });
  }),

  // Update job posting
  http.put('/api/v1/jobs/:id', async ({ params, request }) => {
    await delay(300);

    const index = mockJobPostings.findIndex((j) => j.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'JOB_001', message: '채용공고를 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    mockJobPostings[index] = { ...mockJobPostings[index], ...body, updatedAt: new Date().toISOString() };

    return HttpResponse.json({ success: true, data: mockJobPostings[index], timestamp: new Date().toISOString() });
  }),

  // Delete job posting
  http.delete('/api/v1/jobs/:id', async ({ params }) => {
    await delay(200);

    const index = mockJobPostings.findIndex((j) => j.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'JOB_001', message: '채용공고를 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    mockJobPostings.splice(index, 1);
    return HttpResponse.json({ success: true, data: null, timestamp: new Date().toISOString() });
  }),

  // Publish job posting
  http.post('/api/v1/jobs/:id/publish', async ({ params }) => {
    await delay(200);

    const index = mockJobPostings.findIndex((j) => j.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'JOB_001', message: '채용공고를 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    mockJobPostings[index] = { ...mockJobPostings[index], status: 'OPEN', updatedAt: new Date().toISOString() };
    return HttpResponse.json({ success: true, data: mockJobPostings[index], message: '채용공고가 게시되었습니다.', timestamp: new Date().toISOString() });
  }),

  // Close job posting
  http.post('/api/v1/jobs/:id/close', async ({ params }) => {
    await delay(200);

    const index = mockJobPostings.findIndex((j) => j.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'JOB_001', message: '채용공고를 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    mockJobPostings[index] = { ...mockJobPostings[index], status: 'CLOSED', updatedAt: new Date().toISOString() };
    return HttpResponse.json({ success: true, data: mockJobPostings[index], message: '채용공고가 마감되었습니다.', timestamp: new Date().toISOString() });
  }),

  // Complete job posting
  http.post('/api/v1/jobs/:id/complete', async ({ params }) => {
    await delay(200);

    const index = mockJobPostings.findIndex((j) => j.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'JOB_001', message: '채용공고를 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    mockJobPostings[index] = { ...mockJobPostings[index], status: 'COMPLETED', updatedAt: new Date().toISOString() };
    return HttpResponse.json({ success: true, data: mockJobPostings[index], message: '채용이 완료되었습니다.', timestamp: new Date().toISOString() });
  }),

  // Get applications by job
  http.get('/api/v1/jobs/:jobId/applications', async ({ params, request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);

    const filtered = mockApplications.filter((a) => a.jobPostingId === params.jobId);
    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size).map(toApplicationListItem);

    return HttpResponse.json({
      success: true,
      data: { content, page, size, totalElements, totalPages, first: page === 0, last: page >= totalPages - 1 },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get application stage counts
  http.get('/api/v1/jobs/:jobId/applications/stages', async ({ params }) => {
    await delay(200);

    const apps = mockApplications.filter((a) => a.jobPostingId === params.jobId);
    const stages: ApplicationStage[] = ['DOCUMENT', 'FIRST_INTERVIEW', 'SECOND_INTERVIEW', 'FINAL_INTERVIEW', 'OFFER'];

    const stageCounts = stages.map((stage) => ({
      stage,
      count: apps.filter((a) => a.currentStage === stage).length,
    }));

    return HttpResponse.json({ success: true, data: stageCounts, timestamp: new Date().toISOString() });
  }),

  // ===== Applications =====

  // Get applications list
  http.get('/api/v1/applications', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const keyword = url.searchParams.get('keyword') || '';
    const status = url.searchParams.get('status') as ApplicationStatus | null;
    const jobPostingId = url.searchParams.get('jobPostingId');

    let filtered = [...mockApplications];

    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.applicantName.toLowerCase().includes(lowerKeyword) ||
          a.applicantEmail.toLowerCase().includes(lowerKeyword) ||
          a.applicationNumber.toLowerCase().includes(lowerKeyword)
      );
    }

    if (status) {
      filtered = filtered.filter((a) => a.status === status);
    }

    if (jobPostingId) {
      filtered = filtered.filter((a) => a.jobPostingId === jobPostingId);
    }

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size).map(toApplicationListItem);

    return HttpResponse.json({
      success: true,
      data: { content, page, size, totalElements, totalPages, first: page === 0, last: page >= totalPages - 1 },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get application summary
  http.get('/api/v1/applications/summary', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');

    let apps = [...mockApplications];
    if (jobId) {
      apps = apps.filter((a) => a.jobPostingId === jobId);
    }

    const summary = {
      total: apps.length,
      received: apps.filter((a) => a.status === 'RECEIVED').length,
      screening: apps.filter((a) => a.status === 'SCREENING').length,
      inProgress: apps.filter((a) => a.status === 'IN_PROGRESS').length,
      passed: apps.filter((a) => a.status === 'PASSED').length,
      failed: apps.filter((a) => a.status === 'FAILED').length,
      hired: apps.filter((a) => a.status === 'HIRED').length,
    };

    return HttpResponse.json({ success: true, data: summary, timestamp: new Date().toISOString() });
  }),

  // Get application detail
  http.get('/api/v1/applications/:id', async ({ params }) => {
    await delay(200);

    const app = mockApplications.find((a) => a.id === params.id);

    if (!app) {
      return HttpResponse.json(
        { success: false, error: { code: 'APP_001', message: '지원서를 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, data: app, timestamp: new Date().toISOString() });
  }),

  // Screen application
  http.post('/api/v1/applications/:id/screen', async ({ params, request }) => {
    await delay(300);

    const index = mockApplications.findIndex((a) => a.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'APP_001', message: '지원서를 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const body = (await request.json()) as { passed: boolean; comment?: string };

    mockApplications[index] = {
      ...mockApplications[index],
      status: body.passed ? 'IN_PROGRESS' : 'FAILED',
      currentStage: body.passed ? 'FIRST_INTERVIEW' : mockApplications[index].currentStage,
      screeningComment: body.comment,
      screenedAt: new Date().toISOString(),
      screenedBy: 'emp-001',
      screenedByName: '홍길동',
      statusChangedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({ success: true, data: mockApplications[index], timestamp: new Date().toISOString() });
  }),

  // Reject application
  http.post('/api/v1/applications/:id/reject', async ({ params, request }) => {
    await delay(300);

    const index = mockApplications.findIndex((a) => a.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'APP_001', message: '지원서를 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const body = (await request.json()) as { reason: string };

    mockApplications[index] = {
      ...mockApplications[index],
      status: 'FAILED',
      rejectionReason: body.reason,
      statusChangedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({ success: true, data: mockApplications[index], timestamp: new Date().toISOString() });
  }),

  // Move to next stage
  http.post('/api/v1/applications/:id/next-stage', async ({ params, request }) => {
    await delay(300);

    const index = mockApplications.findIndex((a) => a.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'APP_001', message: '지원서를 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const body = (await request.json()) as { stage: ApplicationStage };

    mockApplications[index] = {
      ...mockApplications[index],
      currentStage: body.stage,
      status: body.stage === 'OFFER' ? 'PASSED' : 'IN_PROGRESS',
      statusChangedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({ success: true, data: mockApplications[index], timestamp: new Date().toISOString() });
  }),

  // Hire application
  http.post('/api/v1/applications/:id/hire', async ({ params }) => {
    await delay(300);

    const index = mockApplications.findIndex((a) => a.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'APP_001', message: '지원서를 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    mockApplications[index] = {
      ...mockApplications[index],
      status: 'HIRED',
      hiredAt: new Date().toISOString(),
      hiredBy: 'emp-001',
      hiredByName: '홍길동',
      statusChangedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({ success: true, data: mockApplications[index], message: '채용이 확정되었습니다.', timestamp: new Date().toISOString() });
  }),

  // Get interviews by application
  http.get('/api/v1/applications/:applicationId/interviews', async ({ params }) => {
    await delay(200);

    const interviews = mockInterviews.filter((i) => i.applicationId === params.applicationId);
    return HttpResponse.json({ success: true, data: interviews, timestamp: new Date().toISOString() });
  }),

  // ===== Interviews =====

  // Get interviews list
  http.get('/api/v1/interviews', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const status = url.searchParams.get('status') as InterviewStatus | null;

    let filtered = [...mockInterviews];

    if (status) {
      filtered = filtered.filter((i) => i.status === status);
    }

    // Sort by scheduledAt descending
    filtered.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size).map(toInterviewListItem);

    return HttpResponse.json({
      success: true,
      data: { content, page, size, totalElements, totalPages, first: page === 0, last: page >= totalPages - 1 },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get my interviews
  http.get('/api/v1/interviews/my', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const status = url.searchParams.get('status') as InterviewStatus | null;

    // 현재 사용자(emp-001)가 면접관인 면접만 필터링
    let filtered = mockInterviews.filter((i) => i.interviewerIds.includes('emp-001'));

    if (status) {
      filtered = filtered.filter((i) => i.status === status);
    }

    filtered.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size).map(toInterviewListItem);

    return HttpResponse.json({
      success: true,
      data: { content, page, size, totalElements, totalPages, first: page === 0, last: page >= totalPages - 1 },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get today's interviews
  http.get('/api/v1/interviews/today', async () => {
    await delay(200);

    const today = new Date();
    const todayInterviews = mockInterviews.filter((i) => {
      const interviewDate = new Date(i.scheduledAt);
      return (
        i.interviewerIds.includes('emp-001') &&
        interviewDate.toDateString() === today.toDateString()
      );
    });

    return HttpResponse.json({
      success: true,
      data: todayInterviews.map(toInterviewListItem),
      timestamp: new Date().toISOString(),
    });
  }),

  // Get interview summary
  http.get('/api/v1/interviews/summary', async () => {
    await delay(200);

    const today = new Date();
    const myInterviews = mockInterviews.filter((i) => i.interviewerIds.includes('emp-001'));

    const summary = {
      total: myInterviews.length,
      scheduled: myInterviews.filter((i) => i.status === 'SCHEDULED').length,
      completed: myInterviews.filter((i) => i.status === 'COMPLETED').length,
      cancelled: myInterviews.filter((i) => i.status === 'CANCELLED').length,
      today: myInterviews.filter((i) => new Date(i.scheduledAt).toDateString() === today.toDateString()).length,
    };

    return HttpResponse.json({ success: true, data: summary, timestamp: new Date().toISOString() });
  }),

  // Get interview detail
  http.get('/api/v1/interviews/:id', async ({ params }) => {
    await delay(200);

    const interview = mockInterviews.find((i) => i.id === params.id);

    if (!interview) {
      return HttpResponse.json(
        { success: false, error: { code: 'INT_001', message: '면접을 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true, data: interview, timestamp: new Date().toISOString() });
  }),

  // Create interview
  http.post('/api/v1/interviews', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as Record<string, unknown>;

    const newInterview: Interview = {
      id: `int-${Date.now()}`,
      tenantId: 'tenant-001',
      applicationId: body.applicationId as string,
      interviewType: body.interviewType as InterviewType,
      scheduledAt: body.scheduledAt as string,
      durationMinutes: body.durationMinutes as number,
      location: body.location as string,
      meetingUrl: body.meetingUrl as string,
      interviewerIds: body.interviewerIds as string[],
      interviewerNames: ['홍길동'],
      status: 'SCHEDULED',
      notes: body.notes as string,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Get applicant info
    const app = mockApplications.find((a) => a.id === body.applicationId);
    if (app) {
      newInterview.applicantName = app.applicantName;
      newInterview.applicantEmail = app.applicantEmail;
      newInterview.jobPostingId = app.jobPostingId;
      newInterview.jobTitle = app.jobTitle;
      newInterview.jobCode = app.jobCode;
    }

    mockInterviews.push(newInterview);

    return HttpResponse.json({ success: true, data: newInterview, message: '면접 일정이 등록되었습니다.', timestamp: new Date().toISOString() }, { status: 201 });
  }),

  // Get interview scores
  http.get('/api/v1/interviews/:interviewId/scores', async ({ params }) => {
    await delay(200);

    const scores = mockInterviewScores[params.interviewId as string] || [];
    return HttpResponse.json({ success: true, data: scores, timestamp: new Date().toISOString() });
  }),

  // Submit interview score
  http.post('/api/v1/interviews/:interviewId/scores', async ({ params, request }) => {
    await delay(300);

    const body = (await request.json()) as Record<string, unknown>;

    const newScore: InterviewScore = {
      id: `score-${Date.now()}`,
      tenantId: 'tenant-001',
      interviewId: params.interviewId as string,
      interviewerId: 'emp-001',
      interviewerName: '홍길동',
      technicalScore: body.technicalScore as number,
      communicationScore: body.communicationScore as number,
      cultureFitScore: body.cultureFitScore as number,
      problemSolvingScore: body.problemSolvingScore as number,
      overallScore: body.overallScore as number,
      strengths: body.strengths as string,
      weaknesses: body.weaknesses as string,
      recommendation: body.recommendation as InterviewRecommendation,
      comments: body.comments as string,
      evaluatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!mockInterviewScores[params.interviewId as string]) {
      mockInterviewScores[params.interviewId as string] = [];
    }
    mockInterviewScores[params.interviewId as string].push(newScore);

    // Update interview average score
    const interviewIndex = mockInterviews.findIndex((i) => i.id === params.interviewId);
    if (interviewIndex !== -1) {
      const scores = mockInterviewScores[params.interviewId as string];
      const avgScore = scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length;
      mockInterviews[interviewIndex].averageScore = avgScore;
    }

    return HttpResponse.json({ success: true, data: newScore, message: '평가가 제출되었습니다.', timestamp: new Date().toISOString() }, { status: 201 });
  }),

  // Get my interview score
  http.get('/api/v1/interviews/:interviewId/scores/my', async ({ params }) => {
    await delay(200);

    const scores = mockInterviewScores[params.interviewId as string] || [];
    const myScore = scores.find((s) => s.interviewerId === 'emp-001');

    return HttpResponse.json({ success: true, data: myScore || null, timestamp: new Date().toISOString() });
  }),

  // Withdraw application
  http.post('/api/v1/applications/:id/withdraw', async ({ params, request }) => {
    await delay(300);

    const index = mockApplications.findIndex((a) => a.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'APP_001', message: '지원서를 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const body = (await request.json()) as { reason?: string };
    mockApplications[index] = {
      ...mockApplications[index],
      status: 'WITHDRAWN',
      withdrawnAt: new Date().toISOString(),
      withdrawnReason: body.reason,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({ success: true, data: mockApplications[index], timestamp: new Date().toISOString() });
  }),

  // Update interview
  http.put('/api/v1/interviews/:id', async ({ params, request }) => {
    await delay(300);

    const index = mockInterviews.findIndex((i) => i.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'INT_001', message: '면접을 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    mockInterviews[index] = { ...mockInterviews[index], ...body, updatedAt: new Date().toISOString() };

    return HttpResponse.json({ success: true, data: mockInterviews[index], timestamp: new Date().toISOString() });
  }),

  // Update interview status
  http.patch('/api/v1/interviews/:id/status', async ({ params, request }) => {
    await delay(200);

    const index = mockInterviews.findIndex((i) => i.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'INT_001', message: '면접을 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const body = (await request.json()) as { status: InterviewStatus };
    mockInterviews[index] = { ...mockInterviews[index], status: body.status, updatedAt: new Date().toISOString() };

    return HttpResponse.json({ success: true, data: mockInterviews[index], timestamp: new Date().toISOString() });
  }),

  // Cancel interview
  http.post('/api/v1/interviews/:id/cancel', async ({ params, request }) => {
    await delay(200);

    const index = mockInterviews.findIndex((i) => i.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'INT_001', message: '면접을 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const body = (await request.json()) as { reason?: string };
    mockInterviews[index] = {
      ...mockInterviews[index],
      status: 'CANCELLED',
      cancelledAt: new Date().toISOString(),
      cancelReason: body.reason,
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({ success: true, data: mockInterviews[index], message: '면접이 취소되었습니다.', timestamp: new Date().toISOString() });
  }),

  // Confirm interview
  http.post('/api/v1/interviews/:id/confirm', async ({ params }) => {
    await delay(200);

    const index = mockInterviews.findIndex((i) => i.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'INT_001', message: '면접을 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    mockInterviews[index] = { ...mockInterviews[index], status: 'CONFIRMED', updatedAt: new Date().toISOString() };

    return HttpResponse.json({ success: true, data: mockInterviews[index], message: '면접이 확정되었습니다.', timestamp: new Date().toISOString() });
  }),

  // Complete interview
  http.post('/api/v1/interviews/:id/complete', async ({ params }) => {
    await delay(200);

    const index = mockInterviews.findIndex((i) => i.id === params.id);
    if (index === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'INT_001', message: '면접을 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    mockInterviews[index] = { ...mockInterviews[index], status: 'COMPLETED', completedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };

    return HttpResponse.json({ success: true, data: mockInterviews[index], message: '면접이 완료되었습니다.', timestamp: new Date().toISOString() });
  }),

  // Update interview score
  http.put('/api/v1/interviews/:interviewId/scores/:scoreId', async ({ params, request }) => {
    await delay(300);

    const scores = mockInterviewScores[params.interviewId as string] || [];
    const scoreIndex = scores.findIndex((s) => s.id === params.scoreId);

    if (scoreIndex === -1) {
      return HttpResponse.json(
        { success: false, error: { code: 'SCORE_001', message: '평가를 찾을 수 없습니다.' }, timestamp: new Date().toISOString() },
        { status: 404 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;
    scores[scoreIndex] = { ...scores[scoreIndex], ...body, updatedAt: new Date().toISOString() };

    return HttpResponse.json({ success: true, data: scores[scoreIndex], timestamp: new Date().toISOString() });
  }),

  // ===== Offers =====

  // Get offers list
  http.get('/api/v1/offers', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);

    // Mock offers data
    const mockOffers = [
      {
        id: 'offer-001',
        applicationId: 'app-004',
        applicantName: '최현우',
        applicantEmail: 'choi.hw@email.com',
        jobTitle: '프론트엔드 개발자 (React)',
        salary: 55000000,
        startDate: '2024-04-01',
        status: 'SENT',
        sentAt: '2024-02-25T10:00:00Z',
        createdAt: '2024-02-20T10:00:00Z',
      },
    ];

    return HttpResponse.json({
      success: true,
      data: { content: mockOffers, page, size, totalElements: 1, totalPages: 1, first: true, last: true },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get offer detail
  http.get('/api/v1/offers/:id', async ({ params }) => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: {
        id: params.id,
        applicationId: 'app-004',
        applicantName: '최현우',
        applicantEmail: 'choi.hw@email.com',
        jobTitle: '프론트엔드 개발자 (React)',
        salary: 55000000,
        bonus: 5000000,
        benefits: '4대보험, 연차, 교육비 지원',
        startDate: '2024-04-01',
        expiresAt: '2024-03-15T23:59:59Z',
        status: 'SENT',
        sentAt: '2024-02-25T10:00:00Z',
        createdAt: '2024-02-20T10:00:00Z',
        updatedAt: '2024-02-25T10:00:00Z',
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get offer summary
  http.get('/api/v1/offers/summary', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: { total: 5, draft: 1, sent: 2, accepted: 1, declined: 1, withdrawn: 0 },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get offer by application
  http.get('/api/v1/applications/:applicationId/offer', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: null, // or offer object if exists
      timestamp: new Date().toISOString(),
    });
  }),

  // Create offer
  http.post('/api/v1/offers', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as Record<string, unknown>;
    const newOffer = {
      id: `offer-${Date.now()}`,
      ...body,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return HttpResponse.json({ success: true, data: newOffer, message: '채용 제안이 생성되었습니다.', timestamp: new Date().toISOString() }, { status: 201 });
  }),

  // Update offer
  http.put('/api/v1/offers/:id', async ({ params, request }) => {
    await delay(300);

    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      success: true,
      data: { id: params.id, ...body, updatedAt: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
  }),

  // Send offer
  http.post('/api/v1/offers/:id/send', async ({ params }) => {
    await delay(300);

    return HttpResponse.json({
      success: true,
      data: { id: params.id, status: 'SENT', sentAt: new Date().toISOString() },
      message: '채용 제안이 발송되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Respond to offer
  http.post('/api/v1/offers/:id/respond', async ({ params, request }) => {
    await delay(300);

    const body = (await request.json()) as { accepted: boolean; reason?: string };
    const status = body.accepted ? 'ACCEPTED' : 'DECLINED';

    return HttpResponse.json({
      success: true,
      data: { id: params.id, status, respondedAt: new Date().toISOString() },
      message: body.accepted ? '채용 제안을 수락하셨습니다.' : '채용 제안을 거절하셨습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Withdraw offer
  http.post('/api/v1/offers/:id/withdraw', async ({ params, request }) => {
    await delay(300);

    const body = (await request.json()) as { reason?: string };

    return HttpResponse.json({
      success: true,
      data: { id: params.id, status: 'WITHDRAWN', withdrawnAt: new Date().toISOString(), withdrawnReason: body.reason },
      message: '채용 제안이 철회되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),
];
