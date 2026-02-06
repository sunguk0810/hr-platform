import { http, HttpResponse, delay } from 'msw';

export type ChangeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type ChangeRequestCategory =
  | 'ADDRESS'
  | 'EDUCATION'
  | 'CERTIFICATION'
  | 'FAMILY'
  | 'CAREER_HISTORY';

export interface MyInfoChangeRequest {
  id: string;
  category: ChangeRequestCategory;
  categoryLabel: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  reason: string;
  status: ChangeRequestStatus;
  requestDate: string;
  reviewDate?: string;
  reviewerName?: string;
  reviewerComment?: string;
}

const CATEGORY_LABELS: Record<ChangeRequestCategory, string> = {
  ADDRESS: '주소',
  EDUCATION: '학력',
  CERTIFICATION: '자격증',
  FAMILY: '가족사항',
  CAREER_HISTORY: '경력사항',
};

// Mock data with various statuses
let mockChangeRequests: MyInfoChangeRequest[] = [
  {
    id: 'cr-001',
    category: 'ADDRESS',
    categoryLabel: CATEGORY_LABELS.ADDRESS,
    fieldName: '자택주소',
    oldValue: '서울특별시 강남구 역삼동 123-45',
    newValue: '서울특별시 서초구 반포동 678-90',
    reason: '이사로 인한 주소 변경',
    status: 'PENDING',
    requestDate: '2026-02-05T09:30:00',
  },
  {
    id: 'cr-002',
    category: 'EDUCATION',
    categoryLabel: CATEGORY_LABELS.EDUCATION,
    fieldName: '최종학력',
    oldValue: '서울대학교 컴퓨터공학과 학사',
    newValue: '서울대학교 컴퓨터공학과 석사',
    reason: '대학원 졸업으로 학력 변경',
    status: 'APPROVED',
    requestDate: '2026-01-20T14:00:00',
    reviewDate: '2026-01-21T10:30:00',
    reviewerName: '김인사',
    reviewerComment: '졸업증명서 확인 완료. 승인합니다.',
  },
  {
    id: 'cr-003',
    category: 'CERTIFICATION',
    categoryLabel: CATEGORY_LABELS.CERTIFICATION,
    fieldName: '자격증',
    oldValue: '-',
    newValue: '정보처리기사 (2026-01-15 취득)',
    reason: '신규 자격증 취득',
    status: 'APPROVED',
    requestDate: '2026-01-18T11:00:00',
    reviewDate: '2026-01-19T09:00:00',
    reviewerName: '김인사',
    reviewerComment: '자격증 사본 확인 완료.',
  },
  {
    id: 'cr-004',
    category: 'FAMILY',
    categoryLabel: CATEGORY_LABELS.FAMILY,
    fieldName: '가족사항',
    oldValue: '배우자: 김영희',
    newValue: '배우자: 김영희, 자녀1: 홍아들 (2026-01-10생)',
    reason: '자녀 출생으로 인한 가족사항 변경',
    status: 'REJECTED',
    requestDate: '2026-01-25T16:00:00',
    reviewDate: '2026-01-26T11:00:00',
    reviewerName: '김인사',
    reviewerComment: '출생증명서를 첨부해주세요. 서류 확인 후 재신청 바랍니다.',
  },
  {
    id: 'cr-005',
    category: 'CAREER_HISTORY',
    categoryLabel: CATEGORY_LABELS.CAREER_HISTORY,
    fieldName: '경력사항',
    oldValue: '-',
    newValue: '(주)이전회사 개발팀 (2018.03 ~ 2020.02)',
    reason: '입사 시 누락된 경력 추가 요청',
    status: 'PENDING',
    requestDate: '2026-02-03T10:15:00',
  },
];

let nextId = 6;

export const myInfoChangeHandlers = [
  // GET: List user's change requests
  http.get('/api/v1/my-info/change-requests', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const status = url.searchParams.get('status');

    let filtered = [...mockChangeRequests];
    if (status && status !== 'ALL') {
      filtered = filtered.filter((r) => r.status === status);
    }

    // Sort by requestDate descending (newest first)
    filtered.sort(
      (a, b) =>
        new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()
    );

    return HttpResponse.json({
      success: true,
      data: filtered,
      timestamp: new Date().toISOString(),
    });
  }),

  // POST: Create a new change request
  http.post('/api/v1/my-info/change-requests', async ({ request }) => {
    await delay(500);

    const body = (await request.json()) as {
      category: ChangeRequestCategory;
      fieldName: string;
      oldValue: string;
      newValue: string;
      reason: string;
    };

    if (!body.category || !body.fieldName || !body.newValue || !body.reason) {
      return HttpResponse.json(
        {
          success: false,
          error: {
            code: 'MYINFO_001',
            message: '필수 항목을 모두 입력해주세요.',
          },
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const newRequest: MyInfoChangeRequest = {
      id: `cr-${String(nextId++).padStart(3, '0')}`,
      category: body.category,
      categoryLabel: CATEGORY_LABELS[body.category],
      fieldName: body.fieldName,
      oldValue: body.oldValue || '-',
      newValue: body.newValue,
      reason: body.reason,
      status: 'PENDING',
      requestDate: new Date().toISOString(),
    };

    mockChangeRequests.unshift(newRequest);

    return HttpResponse.json({
      success: true,
      data: newRequest,
      message: '변경 요청이 등록되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),
];
