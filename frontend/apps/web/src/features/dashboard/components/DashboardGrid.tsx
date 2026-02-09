import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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

const ADMIN_HR_ROLES = ['SUPER_ADMIN', 'GROUP_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER'];
const MANAGER_ROLES = [...ADMIN_HR_ROLES, 'DEPT_MANAGER', 'TEAM_LEADER'];

const widgetComponents: Record<WidgetType, React.ComponentType | null> = {
  attendance: AttendanceWidget,
  leaveBalance: LeaveBalanceWidget,
  pendingApprovals: PendingApprovalsWidget,
  orgSummary: OrgSummaryWidget,
  statistics: StatisticsWidget,
  announcements: AnnouncementsWidget,
  birthdays: BirthdaysWidget,
  teamLeave: TeamLeaveWidget,
  recentNotifications: null,
  teamCalendar: null,
  quickLinks: null,
};

const adminOnlyWidgets: WidgetType[] = ['orgSummary', 'statistics'];
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

  if (adminOnlyWidgets.includes(widget.type)) {
    const hasAdminRole = userRoles.some(role => ADMIN_HR_ROLES.includes(role));
    if (!hasAdminRole) {
      return null;
    }
  }

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
  const { t } = useTranslation('dashboard');
  const user = useAuthStore((state) => state.user);
  const widgets = useDashboardStore((state) => state.widgets);
  const userRoles = user?.roles ?? [];

  const enabledWidgets = useMemo(() => {
    return widgets
      .filter((w) => w.enabled)
      .sort((a, b) => a.order - b.order);
  }, [widgets]);

  const renderableWidgets = useMemo(() => {
    return enabledWidgets.filter((widget) => {
      const Component = widgetComponents[widget.type];
      if (!Component) return false;

      if (adminOnlyWidgets.includes(widget.type)) {
        return userRoles.some(role => ADMIN_HR_ROLES.includes(role));
      }

      if (managerOnlyWidgets.includes(widget.type)) {
        return userRoles.some(role => MANAGER_ROLES.includes(role));
      }

      return true;
    });
  }, [enabledWidgets, userRoles]);

  if (renderableWidgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p>{t('grid.empty')}</p>
        <p className="text-sm">{t('grid.emptyHint')}</p>
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
