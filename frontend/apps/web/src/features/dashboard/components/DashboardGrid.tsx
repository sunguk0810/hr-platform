import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDashboardStore, type WidgetConfig, type WidgetType } from '@/stores/dashboardStore';
import { AttendanceWidget } from './widgets/AttendanceWidget';
import { LeaveBalanceWidget } from './widgets/LeaveBalanceWidget';
import { PendingApprovalsWidget } from './widgets/PendingApprovalsWidget';
import { TeamLeaveWidget } from './widgets/TeamLeaveWidget';
import { OrgSummaryWidget } from './widgets/OrgSummaryWidget';
import { StatisticsWidget } from './widgets/StatisticsWidget';
import { AnnouncementsWidget } from './widgets/AnnouncementsWidget';
import { BirthdaysWidget } from './widgets/BirthdaysWidget';
import { cn } from '@/lib/utils';

const ADMIN_HR_ROLES = ['SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'HR_STAFF'];
const MANAGER_ROLES = [...ADMIN_HR_ROLES, 'MANAGER'];

const widgetComponents: Record<WidgetType, React.ComponentType | null> = {
  attendance: AttendanceWidget,
  leaveBalance: LeaveBalanceWidget,
  pendingApprovals: PendingApprovalsWidget,
  orgSummary: OrgSummaryWidget,
  statistics: StatisticsWidget,
  announcements: AnnouncementsWidget,
  birthdays: BirthdaysWidget,
  teamLeave: TeamLeaveWidget,
  recentNotifications: null, // 아직 구현 안됨
  teamCalendar: null, // 아직 구현 안됨
  quickLinks: null, // 아직 구현 안됨
};

// 관리자/HR 전용 위젯
const adminOnlyWidgets: WidgetType[] = ['orgSummary', 'statistics'];

// 매니저 이상 전용 위젯
const managerOnlyWidgets: WidgetType[] = ['teamLeave'];

function getWidgetColSpan(widget: WidgetConfig): string {
  switch (widget.size) {
    case 'sm':
      return '';
    case 'lg':
      return 'lg:col-span-2';
    case 'md':
    default:
      return '';
  }
}

interface WidgetRendererProps {
  widget: WidgetConfig;
  userRoles: string[];
}

function WidgetRenderer({ widget, userRoles }: WidgetRendererProps) {
  const Component = widgetComponents[widget.type];

  if (!Component) {
    return null;
  }

  // 관리자 전용 위젯 체크
  if (adminOnlyWidgets.includes(widget.type)) {
    const hasAdminRole = userRoles.some(role => ADMIN_HR_ROLES.includes(role));
    if (!hasAdminRole) {
      return null;
    }
  }

  // 매니저 전용 위젯 체크
  if (managerOnlyWidgets.includes(widget.type)) {
    const hasManagerRole = userRoles.some(role => MANAGER_ROLES.includes(role));
    if (!hasManagerRole) {
      return null;
    }
  }

  const colSpan = getWidgetColSpan(widget);

  return (
    <div className={cn(colSpan)}>
      <Component />
    </div>
  );
}

export function DashboardGrid() {
  const user = useAuthStore((state) => state.user);
  const widgets = useDashboardStore((state) => state.widgets);
  const userRoles = user?.roles ?? [];

  // 활성화된 위젯만 필터링하고 순서대로 정렬
  const enabledWidgets = useMemo(() => {
    return widgets
      .filter((w) => w.enabled)
      .sort((a, b) => a.order - b.order);
  }, [widgets]);

  // 렌더링 가능한 위젯만 필터링 (컴포넌트가 있고 권한이 있는 것만)
  const renderableWidgets = useMemo(() => {
    return enabledWidgets.filter((widget) => {
      const Component = widgetComponents[widget.type];
      if (!Component) return false;

      // 관리자 전용 위젯 권한 체크
      if (adminOnlyWidgets.includes(widget.type)) {
        return userRoles.some(role => ADMIN_HR_ROLES.includes(role));
      }

      // 매니저 전용 위젯 권한 체크
      if (managerOnlyWidgets.includes(widget.type)) {
        return userRoles.some(role => MANAGER_ROLES.includes(role));
      }

      return true;
    });
  }, [enabledWidgets, userRoles]);

  if (renderableWidgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>표시할 위젯이 없습니다.</p>
        <p className="text-sm">위젯 설정에서 위젯을 활성화해주세요.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {renderableWidgets.map((widget) => (
        <WidgetRenderer
          key={widget.id}
          widget={widget}
          userRoles={userRoles}
        />
      ))}
    </div>
  );
}
