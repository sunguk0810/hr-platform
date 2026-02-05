import { http, HttpResponse, delay } from 'msw';
import { subDays, subHours, subMinutes } from 'date-fns';

// Types
export type NotificationType = 'APPROVAL' | 'ATTENDANCE' | 'SYSTEM' | 'ANNOUNCEMENT' | 'LEAVE';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  approval: boolean;
  attendance: boolean;
  system: boolean;
  announcement: boolean;
  leave: boolean;
}

// Mock data
const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    type: 'APPROVAL',
    title: '새로운 결재 요청',
    message: '김철수님이 연차 휴가 신청을 요청했습니다.',
    isRead: false,
    link: '/approval/appr-001',
    createdAt: subMinutes(new Date(), 5).toISOString(),
  },
  {
    id: 'notif-002',
    type: 'APPROVAL',
    title: '결재가 승인되었습니다',
    message: '출장 경비 청구가 승인되었습니다.',
    isRead: false,
    link: '/approval/appr-002',
    createdAt: subHours(new Date(), 1).toISOString(),
  },
  {
    id: 'notif-003',
    type: 'ATTENDANCE',
    title: '출근 확인',
    message: '오늘 09:05에 출근 처리되었습니다.',
    isRead: true,
    createdAt: subHours(new Date(), 3).toISOString(),
  },
  {
    id: 'notif-004',
    type: 'SYSTEM',
    title: '시스템 점검 안내',
    message: '2024년 2월 20일 02:00 ~ 04:00 정기 점검이 예정되어 있습니다.',
    isRead: false,
    createdAt: subHours(new Date(), 5).toISOString(),
  },
  {
    id: 'notif-005',
    type: 'LEAVE',
    title: '휴가 신청 승인',
    message: '2024.02.15-16 연차 휴가가 승인되었습니다.',
    isRead: true,
    link: '/attendance/leaves',
    createdAt: subDays(new Date(), 1).toISOString(),
  },
  {
    id: 'notif-006',
    type: 'ANNOUNCEMENT',
    title: '전사 공지',
    message: '2024년 1분기 전사 회의가 2월 28일에 진행됩니다.',
    isRead: true,
    createdAt: subDays(new Date(), 2).toISOString(),
  },
  {
    id: 'notif-007',
    type: 'APPROVAL',
    title: '결재 반려',
    message: '초과 근무 신청이 반려되었습니다. 사유: 대체 일정으로 조정 바랍니다.',
    isRead: true,
    link: '/approval/appr-003',
    createdAt: subDays(new Date(), 3).toISOString(),
  },
  {
    id: 'notif-008',
    type: 'SYSTEM',
    title: '비밀번호 변경 권장',
    message: '90일이 경과했습니다. 보안을 위해 비밀번호를 변경해주세요.',
    isRead: false,
    link: '/settings/security',
    createdAt: subDays(new Date(), 3).toISOString(),
  },
  {
    id: 'notif-009',
    type: 'ATTENDANCE',
    title: '초과근무 알림',
    message: '이번 주 초과근무 시간이 10시간을 초과했습니다.',
    isRead: true,
    createdAt: subDays(new Date(), 4).toISOString(),
  },
  {
    id: 'notif-010',
    type: 'LEAVE',
    title: '연차 잔여일 알림',
    message: '연차 잔여일이 8일 남았습니다.',
    isRead: true,
    createdAt: subDays(new Date(), 5).toISOString(),
  },
  {
    id: 'notif-011',
    type: 'APPROVAL',
    title: '결재 대기 알림',
    message: '3건의 결재 요청이 대기 중입니다.',
    isRead: false,
    link: '/approval?tab=pending',
    createdAt: subDays(new Date(), 5).toISOString(),
  },
  {
    id: 'notif-012',
    type: 'ANNOUNCEMENT',
    title: '인사 발령 공지',
    message: '2024년 3월 인사 발령이 공지되었습니다.',
    isRead: true,
    createdAt: subDays(new Date(), 7).toISOString(),
  },
  {
    id: 'notif-013',
    type: 'SYSTEM',
    title: '새로운 기능 안내',
    message: '모바일 앱에서 근태 관리 기능이 추가되었습니다.',
    isRead: true,
    createdAt: subDays(new Date(), 10).toISOString(),
  },
  {
    id: 'notif-014',
    type: 'ATTENDANCE',
    title: '지각 알림',
    message: '오늘 09:15에 출근 처리되었습니다. (지각)',
    isRead: true,
    createdAt: subDays(new Date(), 12).toISOString(),
  },
  {
    id: 'notif-015',
    type: 'LEAVE',
    title: '팀원 휴가 알림',
    message: '개발팀 한예진님이 내일 연차입니다.',
    isRead: true,
    createdAt: subDays(new Date(), 14).toISOString(),
  },
];

let mockSettings: NotificationSettings = {
  email: true,
  push: true,
  approval: true,
  attendance: true,
  system: true,
  announcement: true,
  leave: true,
};

export const notificationHandlers = [
  // Get notifications list - Backend uses /notifications/my
  http.get('/api/v1/notifications/my', async ({ request }) => {
    await delay(200);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '0', 10);
    const size = parseInt(url.searchParams.get('size') || '10', 10);
    const type = url.searchParams.get('type') as NotificationType | null;
    const unreadOnly = url.searchParams.get('unreadOnly') === 'true';

    let filtered = [...mockNotifications];

    if (type) {
      filtered = filtered.filter(n => n.type === type);
    }

    if (unreadOnly) {
      filtered = filtered.filter(n => !n.isRead);
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalElements = filtered.length;
    const totalPages = Math.ceil(totalElements / size);
    const start = page * size;
    const content = filtered.slice(start, start + size);

    return HttpResponse.json({
      success: true,
      data: {
        content,
        page,
        size,
        totalElements,
        totalPages,
        first: page === 0,
        last: page >= totalPages - 1,
      },
      timestamp: new Date().toISOString(),
    });
  }),

  // Mark notification as read - Backend uses POST
  http.post('/api/v1/notifications/:id/read', async ({ params }) => {
    await delay(100);

    const { id } = params;
    const notification = mockNotifications.find(n => n.id === id);

    if (!notification) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'NOTIF_001', message: '알림을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    notification.isRead = true;

    return HttpResponse.json({
      success: true,
      data: notification,
      timestamp: new Date().toISOString(),
    });
  }),

  // Mark all notifications as read - Backend uses POST /notifications/my/read-all
  http.post('/api/v1/notifications/my/read-all', async () => {
    await delay(200);

    mockNotifications.forEach(n => {
      n.isRead = true;
    });

    return HttpResponse.json({
      success: true,
      data: null,
      message: '모든 알림이 읽음 처리되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Delete notification
  http.delete('/api/v1/notifications/:id', async ({ params }) => {
    await delay(100);

    const { id } = params;
    const index = mockNotifications.findIndex(n => n.id === id);

    if (index === -1) {
      return HttpResponse.json(
        {
          success: false,
          error: { code: 'NOTIF_001', message: '알림을 찾을 수 없습니다.' },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    mockNotifications.splice(index, 1);

    return HttpResponse.json({
      success: true,
      data: null,
      message: '알림이 삭제되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Get notification settings
  http.get('/api/v1/notifications/settings', async () => {
    await delay(150);

    return HttpResponse.json({
      success: true,
      data: mockSettings,
      timestamp: new Date().toISOString(),
    });
  }),

  // Update notification settings
  http.put('/api/v1/notifications/settings', async ({ request }) => {
    await delay(200);

    const body = await request.json() as Partial<NotificationSettings>;
    mockSettings = { ...mockSettings, ...body };

    return HttpResponse.json({
      success: true,
      data: mockSettings,
      message: '알림 설정이 저장되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Get unread count - Backend returns Long directly, not wrapped in object
  http.get('/api/v1/notifications/my/unread/count', async () => {
    await delay(100);

    const unreadCount = mockNotifications.filter(n => !n.isRead).length;

    return HttpResponse.json({
      success: true,
      data: unreadCount,
      timestamp: new Date().toISOString(),
    });
  }),

  // Push subscription - subscribe
  http.post('/api/v1/notifications/push/subscribe', async ({ request }) => {
    await delay(200);

    const body = await request.json() as {
      subscription: PushSubscriptionJSON;
      userAgent?: string;
    };

    console.log('[Mock] Push subscription received:', body.subscription?.endpoint);

    return HttpResponse.json({
      success: true,
      data: {
        subscriptionId: `push-sub-${Date.now()}`,
        endpoint: body.subscription?.endpoint,
      },
      message: '푸시 알림 구독이 완료되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Push subscription - unsubscribe
  http.post('/api/v1/notifications/push/unsubscribe', async ({ request }) => {
    await delay(200);

    const body = await request.json() as { endpoint: string };

    console.log('[Mock] Push unsubscription received:', body.endpoint);

    return HttpResponse.json({
      success: true,
      data: null,
      message: '푸시 알림 구독이 해제되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Push subscription - resubscribe (subscription change)
  http.post('/api/v1/notifications/push/resubscribe', async ({ request }) => {
    await delay(200);

    const body = await request.json() as {
      oldEndpoint?: string;
      newSubscription: PushSubscriptionJSON;
    };

    console.log('[Mock] Push resubscription:', body.oldEndpoint, '->', body.newSubscription?.endpoint);

    return HttpResponse.json({
      success: true,
      data: {
        subscriptionId: `push-sub-${Date.now()}`,
        endpoint: body.newSubscription?.endpoint,
      },
      message: '푸시 알림 구독이 갱신되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // Push analytics - dismissed
  http.post('/api/v1/notifications/analytics/dismissed', async ({ request }) => {
    await delay(100);

    const body = await request.json() as { notificationId: string };

    console.log('[Mock] Notification dismissed:', body.notificationId);

    return HttpResponse.json({
      success: true,
      data: null,
      timestamp: new Date().toISOString(),
    });
  }),
];
