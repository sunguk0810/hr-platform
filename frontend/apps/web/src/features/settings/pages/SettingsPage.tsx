import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { authService, type Session } from '@/features/auth/services/authService';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Moon,
  Sun,
  Monitor,
  Bell,
  Shield,
  User,
  Upload,
  Smartphone,
  Mail,
  LogOut,
  Laptop,
  Globe,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation('common');
  const { t: tAuth } = useTranslation('auth');
  const [activeTab, setActiveTab] = useState('profile');
  const [mobileSection, setMobileSection] = useState<string | null>(null);

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState<string | null>(null);

  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    approvalRequest: true,
    approvalComplete: true,
    leaveApproval: true,
    announcement: false,
  });

  const themeOptions = [
    { value: 'light', label: t('themeLight'), icon: Sun },
    { value: 'dark', label: t('themeDark'), icon: Moon },
    { value: 'system', label: t('themeSystem'), icon: Monitor },
  ] as const;

  // Fetch sessions when security tab is active
  useEffect(() => {
    if (activeTab === 'security') {
      fetchSessions();
    }
  }, [activeTab]);

  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await authService.getSessions();
      setSessions(response.data || []);
    } catch {
      toast({
        title: t('toast.sessionListFailed'),
        description: t('toast.sessionListFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: t('toast.passwordMismatch'),
        description: t('toast.passwordMismatchDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      toast({
        title: t('toast.passwordChanged'),
        description: t('toast.passwordChangedDesc'),
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({
        title: t('toast.passwordChangeFailed'),
        description: error instanceof Error ? error.message : t('toast.passwordChangeFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    if (!confirm(t('security.confirmLogoutSession'))) return;

    setIsLoggingOut(sessionId);
    try {
      await authService.logoutSession(sessionId);
      toast({
        title: t('toast.sessionLogout'),
        description: t('toast.sessionLogoutDesc'),
      });
      // Refresh session list
      fetchSessions();
    } catch {
      toast({
        title: t('toast.logoutFailed'),
        description: t('toast.logoutFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(null);
    }
  };

  const handleLogoutAllSessions = async () => {
    if (!confirm(t('security.confirmLogoutAll'))) return;

    setIsLoggingOut('all');
    try {
      await authService.logoutAllSessions();
      toast({
        title: t('toast.allSessionsLogout'),
        description: t('toast.allSessionsLogoutDesc'),
      });
      // Refresh session list
      fetchSessions();
    } catch {
      toast({
        title: t('toast.logoutFailed'),
        description: t('toast.logoutFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(null);
    }
  };

  const settingsSections = [
    { id: 'profile', label: t('sections.profile.label'), description: t('sections.profile.description'), icon: User },
    { id: 'security', label: t('sections.security.label'), description: t('sections.security.description'), icon: Shield },
    { id: 'notifications', label: t('sections.notifications.label'), description: t('sections.notifications.description'), icon: Bell },
    { id: 'appearance', label: t('sections.appearance.label'), description: t('sections.appearance.description'), icon: Sun },
  ];

  // Mobile Layout
  if (isMobile) {
    // Mobile section detail view
    if (mobileSection) {
      return (
        <div className="space-y-4 pb-20">
          <button
            onClick={() => setMobileSection(null)}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <ChevronRight className="h-4 w-4 rotate-180" />
            {t('backToSettings')}
          </button>

          {mobileSection === 'profile' && (
            <div className="space-y-4">
              <h1 className="text-xl font-bold">{t('sections.profile.label')}</h1>
              <div className="bg-card rounded-2xl border p-4">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback className="text-lg">{user?.name?.slice(0, 2) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      {t('profile.changePhoto')}
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('profile.name')}</Label>
                    <p className="text-sm font-medium">{user?.name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('profile.email')}</Label>
                    <p className="text-sm font-medium">{user?.email || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('profile.department')}</Label>
                    <p className="text-sm font-medium">{user?.departmentName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{t('profile.grade')}</Label>
                    <p className="text-sm font-medium">{user?.gradeName || '-'}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  {t('profile.contactHR')}
                </p>
              </div>
            </div>
          )}

          {mobileSection === 'security' && (
            <div className="space-y-4">
              <h1 className="text-xl font-bold">{t('sections.security.label')}</h1>
              <div className="bg-card rounded-2xl border p-4 space-y-4">
                <h3 className="font-medium text-sm">{t('security.changePassword')}</h3>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="m-currentPassword" className="text-sm">{t('security.currentPassword')}</Label>
                    <Input
                      id="m-currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="m-newPassword" className="text-sm">{t('security.newPassword')}</Label>
                    <Input
                      id="m-newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="m-confirmPassword" className="text-sm">{t('security.confirmPassword')}</Label>
                    <Input
                      id="m-confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isChangingPassword}>
                    {isChangingPassword ? t('security.changingPassword') : t('security.changePasswordButton')}
                  </Button>
                </form>
              </div>

              <div className="bg-card rounded-2xl border p-4 space-y-3">
                <h3 className="font-medium text-sm">{t('security.activeSessions')}</h3>
                {isLoadingSessions ? (
                  <div className="py-4 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('security.noActiveSessions')}</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div key={session.sessionId} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
                            {session.deviceInfo.includes('iPhone') ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{session.deviceInfo}</p>
                            {session.currentSession && <span className="text-xs text-green-600">{t('security.currentSession')}</span>}
                          </div>
                        </div>
                        {!session.currentSession && (
                          <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={() => handleLogoutSession(session.sessionId)}>
                            <LogOut className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {mobileSection === 'notifications' && (
            <div className="space-y-4">
              <h1 className="text-xl font-bold">{t('sections.notifications.label')}</h1>
              <div className="bg-card rounded-2xl border overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-sm">{t('notificationSettings.channels')}</h3>
                </div>
                <div className="divide-y">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{t('notificationSettings.emailNotification')}</p>
                        <p className="text-xs text-muted-foreground">{t('notificationSettings.emailDescription')}</p>
                      </div>
                    </div>
                    <Switch checked={notifications.email} onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))} />
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{t('notificationSettings.pushNotification')}</p>
                        <p className="text-xs text-muted-foreground">{t('notificationSettings.pushDescription')}</p>
                      </div>
                    </div>
                    <Switch checked={notifications.push} onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, push: checked }))} />
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-sm">{t('notificationSettings.types')}</h3>
                </div>
                <div className="divide-y">
                  {[
                    { key: 'approvalRequest', label: t('notificationSettings.approvalRequest'), desc: t('notificationSettings.approvalRequestDesc') },
                    { key: 'approvalComplete', label: t('notificationSettings.approvalComplete'), desc: t('notificationSettings.approvalCompleteDesc') },
                    { key: 'leaveApproval', label: t('notificationSettings.leaveApproval'), desc: t('notificationSettings.leaveApprovalDesc') },
                    { key: 'announcement', label: t('notificationSettings.announcement'), desc: t('notificationSettings.announcementDesc') },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={notifications[item.key as keyof typeof notifications]}
                        onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [item.key]: checked }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {mobileSection === 'appearance' && (
            <div className="space-y-4">
              <h1 className="text-xl font-bold">{t('sections.appearance.label')}</h1>
              <div className="bg-card rounded-2xl border p-4">
                <h3 className="font-medium text-sm mb-3">{t('appearance.title')}</h3>
                <div className="grid grid-cols-3 gap-2">
                  {themeOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors',
                          theme === option.value ? 'border-primary bg-primary/5' : 'border-transparent bg-muted/50'
                        )}
                      >
                        <Icon className="h-6 w-6" />
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

        </div>
      );
    }

    // Mobile main settings list
    return (
      <div className="space-y-4 pb-20">
        <div>
          <h1 className="text-xl font-bold">{t('title')}</h1>
          <p className="text-sm text-muted-foreground">{t('description')}</p>
        </div>

        <div className="bg-card rounded-2xl border overflow-hidden">
          {settingsSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setMobileSection(section.id)}
                className={cn(
                  'w-full flex items-center justify-between p-4 text-left transition-colors active:bg-muted',
                  index < settingsSections.length - 1 && 'border-b'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{section.label}</p>
                    <p className="text-xs text-muted-foreground">{section.description}</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[480px]">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            {t('sections.profile.label')}
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            {t('sections.security.label')}
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            {t('sections.notifications.label')}
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Sun className="h-4 w-4 mr-2" />
            {t('sections.appearance.label')}
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('profile.title')}</CardTitle>
              <CardDescription>{t('profile.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user?.profileImageUrl} />
                  <AvatarFallback className="text-lg">
                    {user?.name?.slice(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    {t('profile.changePhoto')}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('profile.photoFormat')}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t('profile.name')}</Label>
                  <Input value={user?.name || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>{t('profile.email')}</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>{t('profile.department')}</Label>
                  <Input value={user?.departmentName || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>{t('profile.grade')}</Label>
                  <Input value={user?.gradeName || ''} disabled />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                {t('profile.contactHR')}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('security.changePassword')}</CardTitle>
              <CardDescription>{t('security.changePasswordDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('security.currentPassword')}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('security.newPassword')}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('security.passwordRequirements')}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('security.confirmPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
                    }
                  />
                </div>
                <Button
                  type="submit"
                  disabled={
                    isChangingPassword ||
                    !passwordForm.currentPassword ||
                    !passwordForm.newPassword ||
                    passwordForm.newPassword !== passwordForm.confirmPassword
                  }
                >
                  {isChangingPassword ? t('security.changingPassword') : t('security.changePasswordButton')}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('security.activeSessions')}</CardTitle>
              <CardDescription>{t('security.activeSessionsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {t('security.noActiveSessions')}
                </p>
              ) : sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {session.deviceInfo.includes('iPhone') ? (
                        <Smartphone className="h-5 w-5" />
                      ) : (
                        <Laptop className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.deviceInfo}</p>
                        {session.currentSession && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            {t('security.currentSession')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        {session.location}
                        <span>•</span>
                        {format(new Date(session.lastAccessedAt), 'yyyy.MM.dd HH:mm')}
                      </div>
                    </div>
                  </div>
                  {!session.currentSession && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleLogoutSession(session.sessionId)}
                      disabled={isLoggingOut === session.sessionId}
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      {isLoggingOut === session.sessionId ? tCommon('processing') : tAuth('logout')}
                    </Button>
                  )}
                </div>
              ))}
              {sessions.length > 1 && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogoutAllSessions}
                  disabled={isLoggingOut === 'all'}
                >
                  {isLoggingOut === 'all' ? tCommon('processing') : t('security.logoutAllSessions')}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('notificationSettings.channels')}</CardTitle>
              <CardDescription>{t('notificationSettings.channelsDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('notificationSettings.emailNotification')}</p>
                    <p className="text-sm text-muted-foreground">{t('notificationSettings.emailDescription')}</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, email: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('notificationSettings.pushNotification')}</p>
                    <p className="text-sm text-muted-foreground">{t('notificationSettings.pushDescription')}</p>
                  </div>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, push: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('notificationSettings.types')}</CardTitle>
              <CardDescription>{t('notificationSettings.typesDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('notificationSettings.approvalRequest')}</p>
                  <p className="text-sm text-muted-foreground">{t('notificationSettings.approvalRequestDesc')}</p>
                </div>
                <Switch
                  checked={notifications.approvalRequest}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, approvalRequest: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('notificationSettings.approvalComplete')}</p>
                  <p className="text-sm text-muted-foreground">{t('notificationSettings.approvalCompleteDesc')}</p>
                </div>
                <Switch
                  checked={notifications.approvalComplete}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, approvalComplete: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('notificationSettings.leaveApproval')}</p>
                  <p className="text-sm text-muted-foreground">{t('notificationSettings.leaveApprovalDesc')}</p>
                </div>
                <Switch
                  checked={notifications.leaveApproval}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, leaveApproval: checked }))
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{t('notificationSettings.announcement')}</p>
                  <p className="text-sm text-muted-foreground">{t('notificationSettings.announcementDesc')}</p>
                </div>
                <Switch
                  checked={notifications.announcement}
                  onCheckedChange={(checked) =>
                    setNotifications((prev) => ({ ...prev, announcement: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('appearance.title')}</CardTitle>
              <CardDescription>{t('appearance.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {themeOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      variant={theme === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setTheme(option.value)}
                      className={cn(
                        'flex items-center gap-2',
                        theme === option.value && 'ring-2 ring-ring ring-offset-2'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {option.label}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </>
  );
}
