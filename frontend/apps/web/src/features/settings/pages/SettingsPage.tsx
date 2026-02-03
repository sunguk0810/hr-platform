import { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// Mock active sessions
const mockSessions = [
  {
    id: '1',
    device: 'Chrome on Windows',
    location: 'Seoul, South Korea',
    lastActive: new Date().toISOString(),
    current: true,
  },
  {
    id: '2',
    device: 'Safari on iPhone',
    location: 'Seoul, South Korea',
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    current: false,
  },
];

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement password change API call
    alert('비밀번호가 변경되었습니다.');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  const handleLogoutSession = (sessionId: string) => {
    if (confirm('이 세션을 로그아웃 하시겠습니까?')) {
      // TODO: Implement session logout API call
      console.log('Logging out session:', sessionId);
    }
  };

  const handleLogoutAllSessions = () => {
    if (confirm('현재 세션을 제외한 모든 세션을 로그아웃 하시겠습니까?')) {
      // TODO: Implement logout all sessions API call
      console.log('Logging out all sessions');
    }
  };

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
                    !passwordForm.currentPassword ||
                    !passwordForm.newPassword ||
                    passwordForm.newPassword !== passwordForm.confirmPassword
                  }
                >
                  비밀번호 변경
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
              {mockSessions.map((session) => (
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
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      로그아웃
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogoutAllSessions}
              >
                다른 모든 세션 로그아웃
              </Button>
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
