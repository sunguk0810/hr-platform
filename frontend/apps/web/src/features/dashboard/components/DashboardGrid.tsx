import { useAuthStore } from '@/stores/authStore';
import { PermissionGate } from '@/components/common/PermissionGate';
import { AttendanceWidget } from './widgets/AttendanceWidget';
import { LeaveBalanceWidget } from './widgets/LeaveBalanceWidget';
import { PendingApprovalsWidget } from './widgets/PendingApprovalsWidget';
import { TeamLeaveWidget } from './widgets/TeamLeaveWidget';
import { OrgSummaryWidget } from './widgets/OrgSummaryWidget';
import { StatisticsWidget } from './widgets/StatisticsWidget';
import { AnnouncementsWidget } from './widgets/AnnouncementsWidget';
import { BirthdaysWidget } from './widgets/BirthdaysWidget';

export function DashboardGrid() {
  const user = useAuthStore((state) => state.user);
  const isAdminOrHR =
    user?.roles?.some((role) =>
      ['SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(role)
    ) ?? false;

  return (
    <div className="space-y-6">
      {/* Primary widgets row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <AttendanceWidget />
        <LeaveBalanceWidget />
        <PendingApprovalsWidget />
      </div>

      {/* Admin/HR widgets row */}
      {isAdminOrHR && (
        <div className="grid gap-6 md:grid-cols-2">
          <OrgSummaryWidget />
          <StatisticsWidget />
        </div>
      )}

      {/* Secondary widgets row */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AnnouncementsWidget />
        </div>
        <BirthdaysWidget />
      </div>

      {/* Team view widget */}
      <PermissionGate
        roles={['SUPER_ADMIN', 'TENANT_ADMIN', 'HR_MANAGER', 'HR_STAFF', 'MANAGER']}
      >
        <TeamLeaveWidget />
      </PermissionGate>
    </div>
  );
}
