import { Step } from 'react-joyride';

export interface TourConfig {
  id: string;
  name: string;
  description: string;
  steps: Step[];
}

export const dashboardTour: TourConfig = {
  id: 'dashboard',
  name: '대시보드 투어',
  description: '대시보드의 주요 기능을 안내합니다',
  steps: [
    {
      target: '[data-tour="sidebar"]',
      content: '사이드바에서 HR Platform의 다양한 메뉴에 접근할 수 있습니다.',
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '[data-tour="header-search"]',
      content: 'Ctrl+K (Mac: Cmd+K)를 눌러 빠르게 검색할 수 있습니다.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="header-notifications"]',
      content: '새로운 알림을 확인하고 관리할 수 있습니다.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="header-user-menu"]',
      content: '프로필, 설정, 로그아웃 등 개인 메뉴에 접근합니다.',
      placement: 'bottom-end',
    },
    {
      target: '[data-tour="attendance-widget"]',
      content: '오늘의 출퇴근 현황을 확인하고 바로 출근/퇴근 처리를 할 수 있습니다.',
      placement: 'top',
    },
    {
      target: '[data-tour="leave-balance-widget"]',
      content: '잔여 휴가 현황을 한눈에 확인할 수 있습니다.',
      placement: 'top',
    },
    {
      target: '[data-tour="pending-approvals-widget"]',
      content: '처리가 필요한 결재 문서를 확인할 수 있습니다.',
      placement: 'top',
    },
  ],
};

export const approvalTour: TourConfig = {
  id: 'approval',
  name: '결재 기능 투어',
  description: '결재 기능의 사용법을 안내합니다',
  steps: [
    {
      target: '[data-tour="approval-create"]',
      content: '새로운 결재 문서를 작성합니다.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="approval-list"]',
      content: '결재 대기 중인 문서 목록입니다. 클릭하여 상세 내용을 확인하세요.',
      placement: 'top',
    },
    {
      target: '[data-tour="approval-filter"]',
      content: '상태, 기간 등으로 결재 문서를 필터링할 수 있습니다.',
      placement: 'bottom',
    },
  ],
};

export const attendanceTour: TourConfig = {
  id: 'attendance',
  name: '근태 관리 투어',
  description: '근태 관리 기능을 안내합니다',
  steps: [
    {
      target: '[data-tour="clock-in-out"]',
      content: '출근/퇴근 버튼으로 간편하게 근태를 기록합니다.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '[data-tour="attendance-calendar"]',
      content: '월별 근태 현황을 캘린더에서 확인할 수 있습니다.',
      placement: 'top',
    },
    {
      target: '[data-tour="leave-request"]',
      content: '휴가를 신청하고 승인 현황을 확인합니다.',
      placement: 'right',
    },
  ],
};

export const organizationTour: TourConfig = {
  id: 'organization',
  name: '조직도 투어',
  description: '조직도 기능을 안내합니다',
  steps: [
    {
      target: '[data-tour="org-tree"]',
      content: '트리 형태로 조직 구조를 확인합니다.',
      placement: 'right',
      disableBeacon: true,
    },
    {
      target: '[data-tour="org-chart"]',
      content: '시각적인 조직도를 확인할 수 있습니다.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="department-search"]',
      content: '부서명 또는 직원명으로 검색할 수 있습니다.',
      placement: 'bottom',
    },
  ],
};

export const allTours: TourConfig[] = [
  dashboardTour,
  approvalTour,
  attendanceTour,
  organizationTour,
];

export function getTourById(id: string): TourConfig | undefined {
  return allTours.find((tour) => tour.id === id);
}

export default allTours;
