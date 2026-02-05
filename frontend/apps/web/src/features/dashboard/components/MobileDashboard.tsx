import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Clock,
  LogIn,
  LogOut,
  Calendar,
  FileCheck,
  ChevronRight,
  Bell,
  Users,
  Cake,
  AlertCircle,
  Settings2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/utils';
import { useDashboardStore, type WidgetType } from '@/stores/dashboardStore';
import { WidgetCustomizer } from './WidgetCustomizer';

interface MobileDashboardProps {
  userName?: string;
}

interface AttendanceData {
  status: 'NOT_CHECKED_IN' | 'WORKING' | 'CHECKED_OUT';
  checkInTime: string | null;
  checkOutTime: string | null;
  workDuration: string;
}

interface LeaveBalanceData {
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}

interface ApprovalItem {
  id: string;
  type: string;
  title: string;
  requester: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH';
}

interface PendingApprovalsData {
  total: number;
  items: ApprovalItem[];
}

interface AnnouncementItem {
  id: string;
  title: string;
  category: string;
  createdAt: string;
  isImportant: boolean;
}

interface BirthdayItem {
  id: string;
  name: string;
  departmentName: string;
  birthDate: string;
}

export function MobileDashboard({ userName }: MobileDashboardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const widgets = useDashboardStore((state) => state.widgets);

  // 활성화된 위젯 타입 확인 헬퍼
  const isWidgetEnabled = (type: WidgetType) => {
    const widget = widgets.find((w) => w.type === type);
    return widget?.enabled ?? false;
  };

  // Queries
  const { data: attendanceData } = useQuery({
    queryKey: queryKeys.dashboard.attendance(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: AttendanceData }>('/dashboard/attendance');
      return response.data.data;
    },
  });

  const { data: leaveData } = useQuery({
    queryKey: queryKeys.dashboard.leaveBalance(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: LeaveBalanceData }>('/dashboard/leave-balance');
      return response.data.data;
    },
  });

  const { data: approvalsData } = useQuery({
    queryKey: queryKeys.dashboard.pendingApprovals(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: PendingApprovalsData }>('/dashboard/pending-approvals');
      return response.data.data;
    },
  });

  const { data: announcementsData } = useQuery({
    queryKey: queryKeys.dashboard.announcements(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: AnnouncementItem[] }>('/dashboard/announcements');
      return response.data.data;
    },
  });

  const { data: birthdaysData } = useQuery({
    queryKey: queryKeys.dashboard.birthdays(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: BirthdayItem[] }>('/dashboard/birthdays');
      return response.data.data;
    },
  });

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/attendances/check-in');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.attendance() });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/attendances/check-out');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.attendance() });
    },
  });

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--:--';
    const date = new Date(timeString);
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusConfig = (status?: AttendanceData['status']) => {
    switch (status) {
      case 'NOT_CHECKED_IN':
        return { text: '미출근', color: 'text-muted-foreground', bg: 'bg-muted' };
      case 'WORKING':
        return { text: '근무중', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950' };
      case 'CHECKED_OUT':
        return { text: '퇴근완료', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950' };
      default:
        return { text: '--', color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  const statusConfig = getStatusConfig(attendanceData?.status);

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold">안녕하세요, {userName || '사용자'}님</h1>
          <p className="text-sm text-muted-foreground">오늘의 업무 현황을 확인하세요</p>
        </div>
        <WidgetCustomizer
          trigger={
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Settings2 className="h-5 w-5" />
              <span className="sr-only">위젯 설정</span>
            </Button>
          }
        />
      </div>

      {/* Attendance Card - Primary Widget */}
      {isWidgetEnabled('attendance') && (
      <div className="bg-card rounded-2xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">출퇴근</h2>
          </div>
          <span className={cn('text-sm font-medium px-2 py-0.5 rounded-full', statusConfig.bg, statusConfig.color)}>
            {statusConfig.text}
          </span>
        </div>

        {/* Time Display */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">출근</p>
            <p className="text-xl font-bold tabular-nums mt-1">
              {formatTime(attendanceData?.checkInTime || null)}
            </p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">퇴근</p>
            <p className="text-xl font-bold tabular-nums mt-1">
              {formatTime(attendanceData?.checkOutTime || null)}
            </p>
          </div>
        </div>

        {/* Work Duration */}
        {attendanceData?.status === 'WORKING' && attendanceData.workDuration && (
          <p className="text-sm text-center text-muted-foreground mb-4">
            근무시간: {attendanceData.workDuration}
          </p>
        )}

        {/* Check In/Out Buttons */}
        <div className="flex gap-2">
          {attendanceData?.status === 'NOT_CHECKED_IN' && (
            <Button
              className="flex-1 h-12 text-base"
              onClick={() => checkInMutation.mutate()}
              disabled={checkInMutation.isPending}
            >
              <LogIn className="mr-2 h-5 w-5" />
              출근하기
            </Button>
          )}
          {attendanceData?.status === 'WORKING' && (
            <Button
              variant="secondary"
              className="flex-1 h-12 text-base"
              onClick={() => checkOutMutation.mutate()}
              disabled={checkOutMutation.isPending}
            >
              <LogOut className="mr-2 h-5 w-5" />
              퇴근하기
            </Button>
          )}
          {attendanceData?.status === 'CHECKED_OUT' && (
            <div className="flex-1 rounded-xl bg-green-50 dark:bg-green-950 p-3 text-center text-sm text-green-700 dark:text-green-300">
              오늘 하루도 수고하셨습니다!
            </div>
          )}
        </div>
      </div>
      )}

      {/* Quick Stats Row */}
      {(isWidgetEnabled('leaveBalance') || isWidgetEnabled('pendingApprovals')) && (
      <div className="grid grid-cols-2 gap-3">
        {/* Leave Balance */}
        {isWidgetEnabled('leaveBalance') && (
        <button
          onClick={() => navigate('/attendance/leave')}
          className="bg-card rounded-2xl border p-4 text-left transition-colors active:bg-muted"
        >
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">잔여 연차</span>
          </div>
          <p className="text-2xl font-bold">{leaveData?.remainingDays ?? 0}</p>
          <p className="text-xs text-muted-foreground">/ {leaveData?.totalDays ?? 0}일</p>
        </button>
        )}

        {/* Pending Approvals */}
        {isWidgetEnabled('pendingApprovals') && (
        <button
          onClick={() => navigate('/approvals')}
          className="bg-card rounded-2xl border p-4 text-left transition-colors active:bg-muted"
        >
          <div className="flex items-center gap-2 mb-2">
            <FileCheck className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">결재 대기</span>
          </div>
          <p className="text-2xl font-bold">{approvalsData?.total ?? 0}</p>
          <p className="text-xs text-muted-foreground">건</p>
        </button>
        )}
      </div>
      )}

      {/* Pending Approvals List */}
      {isWidgetEnabled('pendingApprovals') && approvalsData?.items && approvalsData.items.length > 0 && (
        <div className="bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">결재 대기 문서</h3>
            <button
              onClick={() => navigate('/approvals')}
              className="text-xs text-primary flex items-center"
            >
              전체보기 <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {approvalsData.items.slice(0, 3).map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/approvals/${item.id}`)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/50 transition-colors active:bg-muted"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{item.type}</span>
                    {item.urgency === 'HIGH' && (
                      <AlertCircle className="h-3 w-3 text-destructive" />
                    )}
                  </div>
                  <p className="text-sm font-medium truncate">{item.title}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Announcements */}
      {isWidgetEnabled('announcements') && announcementsData && announcementsData.length > 0 && (
        <div className="bg-card rounded-2xl border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-yellow-500" />
              <h3 className="font-semibold text-sm">공지사항</h3>
            </div>
            <button
              onClick={() => navigate('/announcements')}
              className="text-xs text-primary flex items-center"
            >
              전체보기 <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {announcementsData.slice(0, 3).map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/announcements/${item.id}`)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-muted/50 transition-colors active:bg-muted"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    {item.isImportant && (
                      <span className="text-xs text-destructive font-medium">[중요]</span>
                    )}
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                  </div>
                  <p className="text-sm font-medium truncate">{item.title}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Birthdays */}
      {isWidgetEnabled('birthdays') && birthdaysData && birthdaysData.length > 0 && (
        <div className="bg-card rounded-2xl border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="h-4 w-4 text-pink-500" />
            <h3 className="font-semibold text-sm">오늘의 생일</h3>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {birthdaysData.map((person) => (
              <div
                key={person.id}
                className="flex-shrink-0 w-20 text-center"
              >
                <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-pink-200 to-pink-300 dark:from-pink-800 dark:to-pink-900 flex items-center justify-center text-lg font-semibold">
                  {person.name.charAt(0)}
                </div>
                <p className="text-sm font-medium mt-1 truncate">{person.name}</p>
                <p className="text-xs text-muted-foreground truncate">{person.departmentName}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      {isWidgetEnabled('quickLinks') && (
      <div className="grid grid-cols-4 gap-2">
        <QuickLinkButton
          icon={<Users className="h-5 w-5" />}
          label="조직도"
          onClick={() => navigate('/organization')}
        />
        <QuickLinkButton
          icon={<Calendar className="h-5 w-5" />}
          label="휴가"
          onClick={() => navigate('/attendance/leave')}
        />
        <QuickLinkButton
          icon={<FileCheck className="h-5 w-5" />}
          label="결재"
          onClick={() => navigate('/approvals')}
        />
        <QuickLinkButton
          icon={<Bell className="h-5 w-5" />}
          label="알림"
          onClick={() => navigate('/notifications')}
        />
      </div>
      )}
    </div>
  );
}

interface QuickLinkButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function QuickLinkButton({ icon, label, onClick }: QuickLinkButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-card border transition-colors active:bg-muted"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}

export default MobileDashboard;
