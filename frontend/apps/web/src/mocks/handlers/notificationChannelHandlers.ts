import { http, HttpResponse, delay } from 'msw';

// Mock data for notification channel settings
const mockSmtpConfig = {
  host: 'smtp.example.com',
  port: 587,
  security: 'TLS',
  username: 'noreply@company.com',
  password: '',
  senderName: 'HR Platform',
};

const mockSmsConfig = {
  gateway: 'NHN Cloud',
  apiKey: '',
  senderNumber: '02-1234-5678',
};

const mockChannelMappings = [
  { eventKey: 'approval_request', eventLabel: '결재 요청', email: true, sms: false, inApp: true },
  { eventKey: 'approval_complete', eventLabel: '결재 완료', email: true, sms: false, inApp: true },
  { eventKey: 'approval_reject', eventLabel: '결재 반려', email: true, sms: true, inApp: true },
  { eventKey: 'leave_approve', eventLabel: '휴가 승인', email: true, sms: false, inApp: true },
  { eventKey: 'leave_reject', eventLabel: '휴가 반려', email: true, sms: true, inApp: true },
  { eventKey: 'appointment_notice', eventLabel: '발령 통보', email: true, sms: true, inApp: true },
  { eventKey: 'system_notice', eventLabel: '시스템 공지', email: true, sms: false, inApp: true },
];

let settings = {
  smtp: { ...mockSmtpConfig },
  sms: { ...mockSmsConfig },
  channelMappings: [...mockChannelMappings],
};

export const notificationChannelHandlers = [
  // GET notification channel settings
  http.get('/api/v1/settings/notification-channels', async () => {
    await delay(200);

    return HttpResponse.json({
      success: true,
      data: settings,
      timestamp: new Date().toISOString(),
    });
  }),

  // PUT (save) notification channel settings
  http.put('/api/v1/settings/notification-channels', async ({ request }) => {
    await delay(300);

    const body = (await request.json()) as typeof settings;
    settings = {
      smtp: body.smtp ?? settings.smtp,
      sms: body.sms ?? settings.sms,
      channelMappings: body.channelMappings ?? settings.channelMappings,
    };

    return HttpResponse.json({
      success: true,
      data: settings,
      message: '알림 채널 설정이 저장되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // POST test email (connection test or send test)
  http.post('/api/v1/settings/notification-channels/test-email', async ({ request }) => {
    await delay(500);

    const body = (await request.json()) as { type: string; recipientEmail?: string };

    if (body.type === 'connection') {
      return HttpResponse.json({
        success: true,
        data: { connected: true },
        message: 'SMTP 연결 테스트 성공',
        timestamp: new Date().toISOString(),
      });
    }

    // type === 'send'
    return HttpResponse.json({
      success: true,
      data: { sent: true, recipientEmail: body.recipientEmail },
      message: '테스트 메일이 발송되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),

  // POST test SMS (connection test or send test)
  http.post('/api/v1/settings/notification-channels/test-sms', async ({ request }) => {
    await delay(500);

    const body = (await request.json()) as { type: string; recipientPhone?: string };

    if (body.type === 'connection') {
      return HttpResponse.json({
        success: true,
        data: { connected: true },
        message: 'SMS 게이트웨이 연결 테스트 성공',
        timestamp: new Date().toISOString(),
      });
    }

    // type === 'send'
    return HttpResponse.json({
      success: true,
      data: { sent: true, recipientPhone: body.recipientPhone },
      message: '테스트 SMS가 발송되었습니다.',
      timestamp: new Date().toISOString(),
    });
  }),
];
