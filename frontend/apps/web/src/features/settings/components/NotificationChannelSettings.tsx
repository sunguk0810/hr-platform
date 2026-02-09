import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  eventLabelKey: string;
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
  { eventKey: 'approval_request', eventLabelKey: 'notificationChannelSettings.eventChannels.events.approvalRequest', email: true, sms: false, inApp: true },
  { eventKey: 'approval_complete', eventLabelKey: 'notificationChannelSettings.eventChannels.events.approvalComplete', email: true, sms: false, inApp: true },
  { eventKey: 'approval_reject', eventLabelKey: 'notificationChannelSettings.eventChannels.events.approvalReject', email: true, sms: true, inApp: true },
  { eventKey: 'leave_approve', eventLabelKey: 'notificationChannelSettings.eventChannels.events.leaveApprove', email: true, sms: false, inApp: true },
  { eventKey: 'leave_reject', eventLabelKey: 'notificationChannelSettings.eventChannels.events.leaveReject', email: true, sms: true, inApp: true },
  { eventKey: 'appointment_notice', eventLabelKey: 'notificationChannelSettings.eventChannels.events.appointmentNotice', email: true, sms: true, inApp: true },
  { eventKey: 'system_notice', eventLabelKey: 'notificationChannelSettings.eventChannels.events.systemNotice', email: true, sms: false, inApp: true },
];

// --- Component ---

export function NotificationChannelSettings() {
  const { t } = useTranslation('settings');
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
          title: t('notificationChannelSettings.toast.smtpTestSuccess'),
          description: t('notificationChannelSettings.toast.smtpTestSuccessDesc'),
        });
      } else {
        toast({
          title: t('notificationChannelSettings.toast.smtpTestFailed'),
          description: result.error?.message || t('notificationChannelSettings.toast.smtpTestFailedDesc'),
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: t('notificationChannelSettings.toast.smtpTestFailed'),
        description: t('notificationChannelSettings.toast.smtpTestError'),
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
          title: t('notificationChannelSettings.toast.testSendSuccess'),
          description: t('notificationChannelSettings.toast.testEmailSentDesc'),
        });
        setTestEmailDialogOpen(false);
        setTestEmailAddress('');
      } else {
        toast({
          title: t('notificationChannelSettings.toast.testSendFailed'),
          description: result.error?.message || t('notificationChannelSettings.toast.testEmailFailedDesc'),
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: t('notificationChannelSettings.toast.testSendFailed'),
        description: t('notificationChannelSettings.toast.serverError'),
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
          title: t('notificationChannelSettings.toast.smsTestSuccess'),
          description: t('notificationChannelSettings.toast.smsTestSuccessDesc'),
        });
      } else {
        toast({
          title: t('notificationChannelSettings.toast.smsTestFailed'),
          description: result.error?.message || t('notificationChannelSettings.toast.smsTestFailedDesc'),
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: t('notificationChannelSettings.toast.smsTestFailed'),
        description: t('notificationChannelSettings.toast.serverError'),
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
          title: t('notificationChannelSettings.toast.testSendSuccess'),
          description: t('notificationChannelSettings.toast.testSmsSentDesc'),
        });
        setTestSmsDialogOpen(false);
        setTestPhoneNumber('');
      } else {
        toast({
          title: t('notificationChannelSettings.toast.testSendFailed'),
          description: result.error?.message || t('notificationChannelSettings.toast.testSmsFailedDesc'),
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: t('notificationChannelSettings.toast.testSendFailed'),
        description: t('notificationChannelSettings.toast.serverError'),
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
          title: t('notificationChannelSettings.toast.saveSuccess'),
          description: t('notificationChannelSettings.toast.saveSuccessDesc'),
        });
      } else {
        toast({
          title: t('notificationChannelSettings.toast.saveFailed'),
          description: result.error?.message || t('notificationChannelSettings.toast.saveFailedDesc'),
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: t('notificationChannelSettings.toast.saveFailed'),
        description: t('notificationChannelSettings.toast.serverError'),
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
              <CardTitle>{t('notificationChannelSettings.smtp.title')}</CardTitle>
              <CardDescription>{t('notificationChannelSettings.smtp.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtp-host">{t('notificationChannelSettings.smtp.host')}</Label>
              <Input
                id="smtp-host"
                value={smtp.host}
                onChange={(e) => setSmtp((prev) => ({ ...prev, host: e.target.value }))}
                placeholder="smtp.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-port">{t('notificationChannelSettings.smtp.port')}</Label>
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
              <Label htmlFor="smtp-security">{t('notificationChannelSettings.smtp.security')}</Label>
              <Select
                value={smtp.security}
                onValueChange={(value: 'TLS' | 'SSL' | 'NONE') =>
                  setSmtp((prev) => ({ ...prev, security: value }))
                }
              >
                <SelectTrigger id="smtp-security">
                  <SelectValue placeholder={t('notificationChannelSettings.smtp.securityPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TLS">TLS</SelectItem>
                  <SelectItem value="SSL">SSL</SelectItem>
                  <SelectItem value="NONE">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-username">{t('notificationChannelSettings.smtp.username')}</Label>
              <Input
                id="smtp-username"
                value={smtp.username}
                onChange={(e) => setSmtp((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="noreply@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-password">{t('notificationChannelSettings.smtp.password')}</Label>
              <Input
                id="smtp-password"
                type="password"
                value={smtp.password}
                onChange={(e) => setSmtp((prev) => ({ ...prev, password: e.target.value }))}
                placeholder={t('notificationChannelSettings.smtp.passwordPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtp-sender-name">{t('notificationChannelSettings.smtp.senderName')}</Label>
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
              {isTestingSmtp ? t('notificationChannelSettings.smtp.testing') : t('notificationChannelSettings.smtp.connectionTest')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setTestEmailDialogOpen(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              {t('notificationChannelSettings.smtp.testSend')}
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
              <CardTitle>{t('notificationChannelSettings.sms.title')}</CardTitle>
              <CardDescription>{t('notificationChannelSettings.sms.description')}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sms-gateway">{t('notificationChannelSettings.sms.gateway')}</Label>
              <Select
                value={sms.gateway}
                onValueChange={(value) => setSms((prev) => ({ ...prev, gateway: value }))}
              >
                <SelectTrigger id="sms-gateway">
                  <SelectValue placeholder={t('notificationChannelSettings.sms.gatewayPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KT">KT</SelectItem>
                  <SelectItem value="SKT">SKT</SelectItem>
                  <SelectItem value="LGU+">LGU+</SelectItem>
                  <SelectItem value="NHN Cloud">NHN Cloud</SelectItem>
                  <SelectItem value="custom">{t('notificationChannelSettings.sms.gatewayCustom')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-api-key">{t('notificationChannelSettings.sms.apiKey')}</Label>
              <Input
                id="sms-api-key"
                value={sms.apiKey}
                onChange={(e) => setSms((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder={t('notificationChannelSettings.sms.apiKeyPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sms-sender-number">{t('notificationChannelSettings.sms.senderNumber')}</Label>
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
              {isTestingSms ? t('notificationChannelSettings.sms.testing') : t('notificationChannelSettings.sms.connectionTest')}
            </Button>
            <Button
              variant="outline"
              onClick={() => setTestSmsDialogOpen(true)}
            >
              <Send className="h-4 w-4 mr-2" />
              {t('notificationChannelSettings.sms.testSend')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Section C: Event Channel Mapping */}
      <Card>
        <CardHeader>
          <CardTitle>{t('notificationChannelSettings.eventChannels.title')}</CardTitle>
          <CardDescription>{t('notificationChannelSettings.eventChannels.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">{t('notificationChannelSettings.eventChannels.eventHeader')}</TableHead>
                  <TableHead className="text-center w-[100px]">{t('notificationChannelSettings.eventChannels.emailHeader')}</TableHead>
                  <TableHead className="text-center w-[100px]">{t('notificationChannelSettings.eventChannels.smsHeader')}</TableHead>
                  <TableHead className="text-center w-[100px]">{t('notificationChannelSettings.eventChannels.inAppHeader')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channelMappings.map((mapping) => {
                  const eventLabel = t(mapping.eventLabelKey);
                  return (
                    <TableRow key={mapping.eventKey}>
                      <TableCell className="font-medium">{eventLabel}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={mapping.email}
                            onCheckedChange={() => handleChannelToggle(mapping.eventKey, 'email')}
                            aria-label={`${eventLabel} ${t('notificationChannelSettings.eventChannels.emailHeader')}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={mapping.sms}
                            onCheckedChange={() => handleChannelToggle(mapping.eventKey, 'sms')}
                            aria-label={`${eventLabel} ${t('notificationChannelSettings.eventChannels.smsHeader')}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={mapping.inApp}
                            onCheckedChange={() => handleChannelToggle(mapping.eventKey, 'inApp')}
                            aria-label={`${eventLabel} ${t('notificationChannelSettings.eventChannels.inAppHeader')}`}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Save All Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveAll} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? t('notificationChannelSettings.saving') : t('notificationChannelSettings.saveButton')}
        </Button>
      </div>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialogOpen} onOpenChange={setTestEmailDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('notificationChannelSettings.testEmailDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email-address">{t('notificationChannelSettings.testEmailDialog.recipientLabel')}</Label>
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
              {t('notificationChannelSettings.testEmailDialog.cancel')}
            </Button>
            <Button
              onClick={handleSendTestEmail}
              disabled={!testEmailAddress.trim() || isSending}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? t('notificationChannelSettings.testEmailDialog.sending') : t('notificationChannelSettings.testEmailDialog.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test SMS Dialog */}
      <Dialog open={testSmsDialogOpen} onOpenChange={setTestSmsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('notificationChannelSettings.testSmsDialog.title')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-phone-number">{t('notificationChannelSettings.testSmsDialog.recipientLabel')}</Label>
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
              {t('notificationChannelSettings.testSmsDialog.cancel')}
            </Button>
            <Button
              onClick={handleSendTestSms}
              disabled={!testPhoneNumber.trim() || isSending}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? t('notificationChannelSettings.testSmsDialog.sending') : t('notificationChannelSettings.testSmsDialog.send')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
