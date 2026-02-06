import { http, HttpResponse, delay } from 'msw';
import { format, subDays } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'NOTICE' | 'EVENT' | 'UPDATE' | 'URGENT';
  isPinned: boolean;
  viewCount: number;
  authorId: string;
  authorName: string;
  authorDepartment: string;
  createdAt: string;
  updatedAt: string;
  attachments?: {
    id: string;
    fileName: string;
    fileSize: number;
    fileUrl: string;
  }[];
}

const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-001',
    title: '2024년 설 연휴 휴무 안내',
    content: `안녕하세요, 인사팀입니다.

2024년 설 연휴 휴무 일정을 안내드립니다.

■ 휴무 기간: 2024년 2월 9일(금) ~ 2월 12일(월)
■ 정상 근무: 2024년 2월 13일(화)부터

연휴 기간 중 긴급 연락이 필요한 경우:
- 인사팀 비상연락망 참조
- 긴급 상황 시 팀장급 이상 연락

즐거운 명절 보내시기 바랍니다.`,
    category: 'NOTICE',
    isPinned: true,
    viewCount: 342,
    authorId: 'emp-003',
    authorName: '이영희',
    authorDepartment: '인사팀',
    createdAt: format(subDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 3), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    attachments: [
      {
        id: 'att-001',
        fileName: '2024년_설연휴_휴무안내.pdf',
        fileSize: 245760,
        fileUrl: '/files/2024년_설연휴_휴무안내.pdf',
      },
    ],
  },
  {
    id: 'ann-002',
    title: '[긴급] 사내 시스템 점검 안내 (2/15 22:00~24:00)',
    content: `안녕하세요, IT팀입니다.

사내 시스템 정기 점검이 예정되어 있어 안내드립니다.

■ 점검 일시: 2024년 2월 15일(목) 22:00 ~ 24:00 (2시간)
■ 점검 대상: 그룹웨어, 인사시스템, 결재시스템

점검 시간 동안 해당 시스템 이용이 불가하오니 양해 부탁드립니다.
업무에 차질 없으시도록 미리 필요한 작업을 완료해 주시기 바랍니다.

문의사항: IT팀 내선 1234`,
    category: 'URGENT',
    isPinned: true,
    viewCount: 521,
    authorId: 'emp-010',
    authorName: '한예진',
    authorDepartment: 'IT팀',
    createdAt: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'ann-003',
    title: '2024년 상반기 사내 교육 일정 안내',
    content: `안녕하세요, 인재개발팀입니다.

2024년 상반기 사내 교육 일정을 안내드립니다.

1. 신입사원 온보딩 교육
   - 일시: 매월 첫째 주 월요일
   - 대상: 신규 입사자

2. 리더십 역량 강화 교육
   - 일시: 3월 15일(금), 4월 19일(금)
   - 대상: 팀장급 이상

3. 직무 역량 교육
   - 일시: 별도 공지
   - 대상: 전 직원

교육 신청은 그룹웨어 > 교육신청 메뉴에서 가능합니다.`,
    category: 'NOTICE',
    isPinned: false,
    viewCount: 187,
    authorId: 'emp-003',
    authorName: '이영희',
    authorDepartment: '인사팀',
    createdAt: format(subDays(new Date(), 5), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 5), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    attachments: [
      {
        id: 'att-002',
        fileName: '2024_상반기_교육일정표.xlsx',
        fileSize: 35840,
        fileUrl: '/files/2024_상반기_교육일정표.xlsx',
      },
    ],
  },
  {
    id: 'ann-004',
    title: '창립 10주년 기념 사내 이벤트 안내',
    content: `안녕하세요, 총무팀입니다.

우리 회사 창립 10주년을 맞아 다양한 사내 이벤트를 준비했습니다!

■ 이벤트 기간: 2024년 3월 1일 ~ 3월 31일

■ 이벤트 내용
1. 포토 콘테스트 - 우리 회사의 추억
2. 슬로건 공모전
3. 10주년 기념 퀴즈 이벤트
4. 창립기념일 특별 오찬

■ 경품
- 대상: 해외여행 상품권 100만원
- 최우수상: 백화점 상품권 50만원
- 우수상: 문화상품권 30만원
- 참가상: 커피 쿠폰

많은 참여 부탁드립니다!`,
    category: 'EVENT',
    isPinned: false,
    viewCount: 456,
    authorId: 'emp-005',
    authorName: '최수진',
    authorDepartment: '총무팀',
    createdAt: format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 7), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
  {
    id: 'ann-005',
    title: '인사시스템 업데이트 안내 (v2.5)',
    content: `안녕하세요, IT팀입니다.

인사시스템이 v2.5로 업데이트되었습니다.

■ 주요 변경사항
1. 휴가 신청 UI 개선
2. 모바일 앱 출퇴근 기능 추가
3. 결재선 자동 완성 기능
4. 성능 개선 및 버그 수정

■ 적용일: 2024년 2월 1일

새로운 기능에 대한 자세한 사용법은 첨부된 매뉴얼을 참고해주세요.

문의사항: IT팀 내선 1234`,
    category: 'UPDATE',
    isPinned: false,
    viewCount: 234,
    authorId: 'emp-010',
    authorName: '한예진',
    authorDepartment: 'IT팀',
    createdAt: format(subDays(new Date(), 10), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 10), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    attachments: [
      {
        id: 'att-003',
        fileName: '인사시스템_v2.5_사용매뉴얼.pdf',
        fileSize: 1048576,
        fileUrl: '/files/인사시스템_v2.5_사용매뉴얼.pdf',
      },
    ],
  },
  {
    id: 'ann-006',
    title: '건강검진 일정 안내',
    content: `안녕하세요, 인사팀입니다.

2024년 정기 건강검진 일정을 안내드립니다.

■ 검진 기간: 2024년 3월 4일 ~ 3월 29일
■ 검진 기관: 서울아산병원 건강증진센터
■ 대상: 전 직원

■ 예약 방법
1. 그룹웨어 > 건강검진 > 예약하기
2. 원하는 날짜 및 시간 선택
3. 예약 확인 메일 수신

검진 당일 신분증 지참 필수입니다.`,
    category: 'NOTICE',
    isPinned: false,
    viewCount: 298,
    authorId: 'emp-003',
    authorName: '이영희',
    authorDepartment: '인사팀',
    createdAt: format(subDays(new Date(), 14), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    updatedAt: format(subDays(new Date(), 14), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  },
];

interface AnnouncementListItem {
  id: string;
  title: string;
  category: string;
  isPinned: boolean;
  viewCount: number;
  authorName: string;
  createdAt: string;
  hasAttachment: boolean;
}

function toListItem(announcement: Announcement): AnnouncementListItem {
  return {
    id: announcement.id,
    title: announcement.title,
    category: announcement.category,
    isPinned: announcement.isPinned,
    viewCount: announcement.viewCount,
    authorName: announcement.authorName,
    createdAt: announcement.createdAt,
    hasAttachment: (announcement.attachments?.length ?? 0) > 0,
  };
}

export const announcementHandlers = [
  // Get announcements list
  http.get('/api/v1/announcements', async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const keyword = url.searchParams.get('keyword') || '';
    const category = url.searchParams.get('category') || '';

    let filtered = [...mockAnnouncements];

    if (keyword) {
      const lower = keyword.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(lower) ||
          a.content.toLowerCase().includes(lower)
      );
    }

    if (category) {
      filtered = filtered.filter((a) => a.category === category);
    }

    // Sort: pinned first, then by date
    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size).map(toListItem);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page: {
          number: page,
          size,
          totalElements,
          totalPages,
          first: page === 0,
          last: page >= totalPages - 1,
          hasNext: page < totalPages - 1,
          hasPrevious: page > 0,
        },
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Get announcement detail
  http.get('/api/v1/announcements/:id', async ({ params }) => {
    await delay(200);

    const { id } = params;
    const announcement = mockAnnouncements.find((a) => a.id === id);

    if (!announcement) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'ANN_001', message: '공지사항을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Increment view count
    announcement.viewCount += 1;

    return HttpResponse.json({
      success: true,
      data: announcement,
      timestamp: new Date().toISOString(),
    });
  }),
];
