import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/useToast';
import { Mail, MessageSquare, Send, FlaskConical, Save } from 'lucide-react';

// --- Types ---

interface SmtpConfig {
  host: string;
  port: number;
  security: 'TLS' | 'SSL' | 'NONE';
  username: string;
  password: string;
  senderName: string;
}

interface SmsConfig {
  gateway: string;
  apiKey: string;
  senderNumber: string;
}

interface EventChannelMapping {
  eventKey: string;
  eventLabel: string;
  email: boolean;
  sms: boolean;
  inApp: boolean;
}

// --- Default values ---

const DEFAULT_SMTP: SmtpConfig = {
  host: 'smtp.example.com',
  port: 587,
  security: 'TLS',
  username: 'noreply@company.com',
  password: '',
  senderName: 'HR Platform',
};

const DEFAULT_SMS: SmsConfig = {
  gateway: 'NHN Cloud',
  apiKey: '',
  senderNumber: '02-1234-5678',
};

const DEFAULT_CHANNEL_MAPPINGS: EventChannelMapping[] = [
  { eventKey: 'approval_request', eventLabel: '결재 요청', email: true, sms: false, inApp: true },
  { eventKey: 'approval_complete', eventLabel: '결재 완료', email: true, sms: false, inApp: true },
  { eventKey: 'approval_reject', eventLabel: '결재 반려', email: true, sms: true, inApp: true },
  { eventKey: 'leave_approve', eventLabel: '휴가 승인', email: true, sms: false, inApp: true },
  { eventKey: 'leave_reject', eventLabel: '휴가 반려', email: true, sms: true, inApp: true },
  { eventKey: 'appointment_notice', eventLabel: '발령 통보', email: true, sms: true, inApp: true },
  { eventKey: 'system_notice', eventLabel: '시스템 공지', email: true, sms: false, inApp: true },
];

// --- Component ---

export function NotificationChannelSettings() {
  const { toast } = useToast();

  // SMTP settings state
  const [smtp, setSmtp] = useState<SmtpConfig>(DEFAULT_SMTP);

  // SMS settings state
  const [sms, setSms] = useState<SmsConfig>(DEFAULT_SMS);

  // Channel mapping state
  const [channelMappings, setChannelMappings] = useState<EventChannelMapping[]>(
    DEFAULT_CHANNEL_MAPPINGS
  );

  // Test dialog state
  const [testEmailDialogOpen, setTestEmailDialogOpen] = useState(false);
  const [testSmsDialogOpen, setTestSmsDialogOpen] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testPhoneNumber, setTestPhoneNumber] = useState('');

  // Loading state
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [isTestingSms, setIsTestingSms] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Handlers ---

  const handleSmtpConnectionTest = async () => {
    setIsTestingSmtp(true);
    try {
      const response = await fetch('/api/v1/settings/notification-channels/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'connection', smtp }),
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: 'SMTP 연결 테스트 성공',
          description: 'SMTP 서버에 정상적으로 연결되었습니다.',
        });
      } else {
        toast({
          title: 'SMTP 연결 테스트 실패',
          description: result.error?.message || '연결에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'SMTP 연결 테스트 실패',
        description: '서버와 통신 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim()) return;
    setIsSending(true);
    try {
      const response = await fetch('/api/v1/settings/notification-channels/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'send', smtp, recipientEmail: testEmailAddress }),
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: '테스트 발송 완료',
          description: '테스트 메일이 발송되었습니다.',
        });
        setTestEmailDialogOpen(false);
        setTestEmailAddress('');
      } else {
        toast({
          title: '테스트 발송 실패',
          description: result.error?.message || '메일 발송에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: '테스트 발송 실패',
        description: '서버와 통신 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleSmsConnectionTest = async () => {
    setIsTestingSms(true);
    try {
      const response = await fetch('/api/v1/settings/notification-channels/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'connection', sms }),
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: 'SMS 연결 테스트 성공',
          description: 'SMS 게이트웨이에 정상적으로 연결되었습니다.',
        });
      } else {
        toast({
          title: 'SMS 연결 테스트 실패',
          description: result.error?.message || '연결에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'SMS 연결 테스트 실패',
        description: '서버와 통신 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsTestingSms(false);
    }
  };

  const handleSendTestSms = async () => {
    if (!testPhoneNumber.trim()) return;
    setIsSending(true);
    try {
      const response = await fetch('/api/v1/settings/notification-channels/test-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'send', sms, recipientPhone: testPhoneNumber }),
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: '테스트 발송 완료',
          description: '테스트 SMS가 발송되었습니다.',
        });
        setTestSmsDialogOpen(false);
        setTestPhoneNumber('');
      } else {
        toast({
          title: '테스트 발송 실패',
          description: result.error?.message || 'SMS 발송에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: '테스트 발송 실패',
        description: '서버와 통신 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleChannelToggle = (eventKey: string, channel: 'email' | 'sms' | 'inApp') => {
    setChannelMappings((prev) =>
      prev.map((mapping) =>
        mapping.eventKey === eventKey
          ? { ...mapping, [channel]: !mapping[channel] }
          : mapping
      )
    );
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/v1/settings/notification-channels', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtp, sms, channelMappings }),
      });
      const result = await response.json();
      if (result.success) {
        toast({
          title: '설정 저장 완료',
          description: '알림 채널 설정이 저장되었습니다.',
        });
      } else {
        toast({
          title: '설정 저장 실패',
          description: result.error?.message || '설정 저장에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: '설정 저장 실패',
        description: '서버와 통신 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render ---

  return (
    <div className="space-y-6">
      {/* Section A: SMTP Email Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>이메일 설정 (SMTP)</CardTitle>
              <CardDescription>이메일 알림 발송을 위한 SMTP 서버를 설정합니다.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">SMTP 서버 주소</Label>
              <Input
                id="smtp-host"
                value={smtp.host}
                onChange={(e) => setSmtp((prev) => ({ ...prev, host: e.target.value }))}
                placeholder="smtp.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">포트</Label>
              <Input
                id="smtp-port"
                type="number"
                value={smtp.port}
                onChange={(e) =>
                  setSmtp((prev) => ({ ...prev, port: parseInt(e.target.value, 10) || 0 }))
                }
                placeholder="587"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-security">보안 연결</Label>
              <Select
                value={smtp.security}
                onValueChange={(value: 'TLS' | 'SSL' | 'NONE') =>
                  setSmtp((prev) => ({ ...prev, security: value }))
                }
              >
                <SelectTrigger id="smtp-security">
                  <SelectValue placeholder="보안 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TLS">TLS</SelectItem>
                  <SelectItem value="SSL">SSL</SelectItem>
                  <SelectItem value="NONE">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-username">사용자 계정</Label>
              <Input
                id="smtp-username"
                value={smtp.username}
                onChange={(e) => setSmtp((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="noreply@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">비밀번호</Label>
              <Input
                id="smtp-password"
                type="password"
                value={smtp.password}
                onChange={(e) => setSmtp((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="SMTP 비밀번호"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-sender-name">발신자 이름</Label>
              <Input
                id="smtp-sender-name"
                value={smtp.senderName}
                onChange={(e) => setSmtp((prev) => ({ ...prev, senderName: e.target.value }))}
                placeholder="HR Platform"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleSmtpConnectionTest}
              disabled={isTestingSmtp}
            >
              <FlaskConical className="h-4 w-4 mr-2" />
              {isTestingSmtp ? '테스트 중...' : '연결 테스트'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setTestEmailDialogOpen(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              테스트 발송
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section B: SMS Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <div>
              <CardTitle>SMS 설정</CardTitle>
              <CardDescription>SMS 알림 발송을 위한 게이트웨이를 설정합니다.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sms-gateway">SMS 게이트웨이</Label>
              <Select
                value={sms.gateway}
                onValueChange={(value) => setSms((prev) => ({ ...prev, gateway: value }))}
              >
                <SelectTrigger id="sms-gateway">
                  <SelectValue placeholder="게이트웨이 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KT">KT</SelectItem>
                  <SelectItem value="SKT">SKT</SelectItem>
                  <SelectItem value="LGU+">LGU+</SelectItem>
                  <SelectItem value="NHN Cloud">NHN Cloud</SelectItem>
                  <SelectItem value="custom">직접 입력</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-api-key">API Key</Label>
              <Input
                id="sms-api-key"
                value={sms.apiKey}
                onChange={(e) => setSms((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder="API Key를 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-sender-number">발신번호</Label>
              <Input
                id="sms-sender-number"
                value={sms.senderNumber}
                onChange={(e) => setSms((prev) => ({ ...prev, senderNumber: e.target.value }))}
                placeholder="02-1234-5678"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleSmsConnectionTest}
              disabled={isTestingSms}
            >
              <FlaskConical className="h-4 w-4 mr-2" />
              {isTestingSms ? '테스트 중...' : '연결 테스트'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setTestSmsDialogOpen(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              테스트 발송
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section C: Event Channel Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>이벤트별 알림 채널 설정</CardTitle>
          <CardDescription>각 이벤트에 대해 사용할 알림 채널을 설정합니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">이벤트</TableHead>
                  <TableHead className="text-center w-[100px]">이메일</TableHead>
                  <TableHead className="text-center w-[100px]">SMS</TableHead>
                  <TableHead className="text-center w-[100px]">인앱</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelMappings.map((mapping) => (
                  <TableRow key={mapping.eventKey}>
                    <TableCell className="font-medium">{mapping.eventLabel}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={mapping.email}
                          onCheckedChange={() => handleChannelToggle(mapping.eventKey, 'email')}
                          aria-label={`${mapping.eventLabel} 이메일 알림`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={mapping.sms}
                          onCheckedChange={() => handleChannelToggle(mapping.eventKey, 'sms')}
                          aria-label={`${mapping.eventLabel} SMS 알림`}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <Checkbox
                          checked={mapping.inApp}
                          onCheckedChange={() => handleChannelToggle(mapping.eventKey, 'inApp')}
                          aria-label={`${mapping.eventLabel} 인앱 알림`}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Save All Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? '저장 중...' : '설정 저장'}
        </Button>
      </div>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>테스트 이메일 발송</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email-address">수신 이메일 주소</Label>
              <Input
                id="test-email-address"
                type="email"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTestEmailDialogOpen(false);
                setTestEmailAddress('');
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleSendTestEmail}
              disabled={!testEmailAddress.trim() || isSending}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? '발송 중...' : '발송'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test SMS Dialog */}
      <Dialog open={testSmsDialogOpen} onOpenChange={setTestSmsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>테스트 SMS 발송</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-phone-number">수신 전화번호</Label>
              <Input
                id="test-phone-number"
                type="tel"
                value={testPhoneNumber}
                onChange={(e) => setTestPhoneNumber(e.target.value)}
                placeholder="010-1234-5678"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTestSmsDialogOpen(false);
                setTestPhoneNumber('');
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleSendTestSms}
              disabled={!testPhoneNumber.trim() || isSending}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? '발송 중...' : '발송'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
