import { useState, useEffect } from 'react';
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
    { value: 'light', label: '라이트', icon: Sun },
    { value: 'dark', label: '다크', icon: Moon },
    { value: 'system', label: '시스템', icon: Monitor },
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
        title: '세션 목록 조회 실패',
        description: '세션 목록을 불러올 수 없습니다.',
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
        title: '비밀번호 불일치',
        description: '새 비밀번호와 확인 비밀번호가 일치하지 않습니다.',
        variant: 'destructive',
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast({
        title: '비밀번호 변경 완료',
        description: '비밀번호가 성공적으로 변경되었습니다.',
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast({
        title: '비밀번호 변경 실패',
        description: error instanceof Error ? error.message : '비밀번호 변경에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    if (!confirm('이 세션을 로그아웃 하시겠습니까?')) return;

    setIsLoggingOut(sessionId);
    try {
      await authService.logoutSession(sessionId);
      toast({
        title: '세션 로그아웃',
        description: '해당 세션이 로그아웃되었습니다.',
      });
      // Refresh session list
      fetchSessions();
    } catch {
      toast({
        title: '로그아웃 실패',
        description: '세션 로그아웃에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(null);
    }
  };

  const handleLogoutAllSessions = async () => {
    if (!confirm('현재 세션을 제외한 모든 세션을 로그아웃 하시겠습니까?')) return;

    setIsLoggingOut('all');
    try {
      await authService.logoutAllSessions();
      toast({
        title: '모든 세션 로그아웃',
        description: '현재 세션을 제외한 모든 세션이 로그아웃되었습니다.',
      });
      // Refresh session list
      fetchSessions();
    } catch {
      toast({
        title: '로그아웃 실패',
        description: '세션 로그아웃에 실패했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsLoggingOut(null);
    }
  };

  const settingsSections = [
    { id: 'profile', label: '프로필', description: '기본 프로필 정보 관리', icon: User },
    { id: 'security', label: '보안', description: '비밀번호 및 세션 관리', icon: Shield },
    { id: 'notifications', label: '알림', description: '알림 설정', icon: Bell },
    { id: 'appearance', label: '외관', description: '테마 설정', icon: Sun },
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
            설정으로 돌아가기
          </button>

          {mobileSection === 'profile' && (
            <div className="space-y-4">
              <h1 className="text-xl font-bold">프로필</h1>
              <div className="bg-card rounded-2xl border p-4">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user?.profileImageUrl} />
                    <AvatarFallback className="text-lg">{user?.name?.slice(0, 2) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      <Upload className="h-4 w-4 mr-2" />
                      사진 변경
                    </Button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">이름</Label>
                    <p className="text-sm font-medium">{user?.name || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">이메일</Label>
                    <p className="text-sm font-medium">{user?.email || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">부서</Label>
                    <p className="text-sm font-medium">{user?.departmentName || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">직급</Label>
                    <p className="text-sm font-medium">{user?.gradeName || '-'}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  * 프로필 정보 변경은 인사팀에 문의해주세요.
                </p>
              </div>
            </div>
          )}

          {mobileSection === 'security' && (
            <div className="space-y-4">
              <h1 className="text-xl font-bold">보안</h1>
              <div className="bg-card rounded-2xl border p-4 space-y-4">
                <h3 className="font-medium text-sm">비밀번호 변경</h3>
                <form onSubmit={handlePasswordChange} className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="m-currentPassword" className="text-sm">현재 비밀번호</Label>
                    <Input
                      id="m-currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="m-newPassword" className="text-sm">새 비밀번호</Label>
                    <Input
                      id="m-newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="m-confirmPassword" className="text-sm">새 비밀번호 확인</Label>
                    <Input
                      id="m-confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isChangingPassword}>
                    {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
                  </Button>
                </form>
              </div>

              <div className="bg-card rounded-2xl border p-4 space-y-3">
                <h3 className="font-medium text-sm">활성 세션</h3>
                {isLoadingSessions ? (
                  <div className="py-4 flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                  </div>
                ) : sessions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">활성 세션이 없습니다</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center">
                            {session.device.includes('iPhone') ? <Smartphone className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{session.device}</p>
                            {session.current && <span className="text-xs text-green-600">현재 세션</span>}
                          </div>
                        </div>
                        {!session.current && (
                          <Button variant="ghost" size="sm" className="text-destructive h-8" onClick={() => handleLogoutSession(session.id)}>
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
              <h1 className="text-xl font-bold">알림</h1>
              <div className="bg-card rounded-2xl border overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-sm">알림 채널</h3>
                </div>
                <div className="divide-y">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">이메일 알림</p>
                        <p className="text-xs text-muted-foreground">중요 알림을 이메일로 받습니다</p>
                      </div>
                    </div>
                    <Switch checked={notifications.email} onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, email: checked }))} />
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">푸시 알림</p>
                        <p className="text-xs text-muted-foreground">브라우저 푸시 알림을 받습니다</p>
                      </div>
                    </div>
                    <Switch checked={notifications.push} onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, push: checked }))} />
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-2xl border overflow-hidden">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-sm">알림 유형</h3>
                </div>
                <div className="divide-y">
                  {[
                    { key: 'approvalRequest', label: '결재 요청', desc: '결재 요청이 들어왔을 때' },
                    { key: 'approvalComplete', label: '결재 완료', desc: '내 결재가 승인/반려되었을 때' },
                    { key: 'leaveApproval', label: '휴가 승인', desc: '휴가가 승인/반려되었을 때' },
                    { key: 'announcement', label: '공지사항', desc: '새 공지사항이 등록되었을 때' },
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
              <h1 className="text-xl font-bold">외관</h1>
              <div className="bg-card rounded-2xl border p-4">
                <h3 className="font-medium text-sm mb-3">테마</h3>
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
          <h1 className="text-xl font-bold">설정</h1>
          <p className="text-sm text-muted-foreground">앱 설정을 관리합니다</p>
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
      <PageHeader title="설정" description="앱 설정을 관리합니다." />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            프로필
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4 mr-2" />
            보안
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            알림
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Sun className="h-4 w-4 mr-2" />
            외관
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>프로필 정보</CardTitle>
              <CardDescription>기본 프로필 정보를 관리합니다.</CardDescription>
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
                    사진 변경
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG 형식 (최대 5MB)
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>이름</Label>
                  <Input value={user?.name || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>이메일</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>부서</Label>
                  <Input value={user?.departmentName || ''} disabled />
                </div>
                <div className="space-y-2">
                  <Label>직급</Label>
                  <Input value={user?.gradeName || ''} disabled />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                * 프로필 정보 변경은 인사팀에 문의해주세요.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>비밀번호 변경</CardTitle>
              <CardDescription>정기적으로 비밀번호를 변경하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">현재 비밀번호</Label>
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
                  <Label htmlFor="newPassword">새 비밀번호</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    8자 이상, 영문, 숫자, 특수문자 포함
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">새 비밀번호 확인</Label>
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
                  {isChangingPassword ? '변경 중...' : '비밀번호 변경'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>활성 세션</CardTitle>
              <CardDescription>현재 로그인된 기기를 관리합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  활성 세션이 없습니다.
                </p>
              ) : sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                      {session.device.includes('iPhone') ? (
                        <Smartphone className="h-5 w-5" />
                      ) : (
                        <Laptop className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{session.device}</p>
                        {session.current && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            현재 세션
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Globe className="h-3 w-3" />
                        {session.location}
                        <span>•</span>
                        {format(new Date(session.lastActive), 'yyyy.MM.dd HH:mm')}
                      </div>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleLogoutSession(session.id)}
                      disabled={isLoggingOut === session.id}
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      {isLoggingOut === session.id ? '처리 중...' : '로그아웃'}
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
                  {isLoggingOut === 'all' ? '처리 중...' : '다른 모든 세션 로그아웃'}
                </Button>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>알림 채널</CardTitle>
              <CardDescription>알림을 받을 방법을 선택합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">이메일 알림</p>
                    <p className="text-sm text-muted-foreground">중요 알림을 이메일로 받습니다</p>
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
                    <p className="font-medium">푸시 알림</p>
                    <p className="text-sm text-muted-foreground">브라우저 푸시 알림을 받습니다</p>
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
              <CardTitle>알림 유형</CardTitle>
              <CardDescription>받을 알림 유형을 선택합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">결재 요청</p>
                  <p className="text-sm text-muted-foreground">결재 요청이 들어왔을 때</p>
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
                  <p className="font-medium">결재 완료</p>
                  <p className="text-sm text-muted-foreground">내 결재가 승인/반려되었을 때</p>
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
                  <p className="font-medium">휴가 승인</p>
                  <p className="text-sm text-muted-foreground">휴가가 승인/반려되었을 때</p>
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
                  <p className="font-medium">공지사항</p>
                  <p className="text-sm text-muted-foreground">새 공지사항이 등록되었을 때</p>
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
              <CardTitle>테마</CardTitle>
              <CardDescription>화면 테마를 선택합니다.</CardDescription>
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
