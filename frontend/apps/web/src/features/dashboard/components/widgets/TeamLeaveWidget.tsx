import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Users } from 'lucide-react';
import { format, isToday, isTomorrow, addDays, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryClient';

interface TeamLeave {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  profileImageUrl?: string;
}

// Mock data fallback for team leave
const mockTeamLeaves: TeamLeave[] = [
  {
    id: '1',
    employeeId: 'emp-002',
    employeeName: '김철수',
    departmentName: '개발팀',
    leaveType: '연차',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  },
  {
    id: '2',
    employeeId: 'emp-003',
    employeeName: '이영희',
    departmentName: '인사팀',
    leaveType: '반차(오후)',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
  },
  {
    id: '3',
    employeeId: 'emp-005',
    employeeName: '최수진',
    departmentName: '마케팅팀',
    leaveType: '연차',
    startDate: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(addDays(new Date(), 2), 'yyyy-MM-dd'),
  },
];

function getDateLabel(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isToday(start)) {
    if (startDate === endDate) {
      return '오늘';
    }
    return `오늘 ~ ${format(end, 'M.d(EEE)', { locale: ko })}`;
  }

  if (isTomorrow(start)) {
    if (startDate === endDate) {
      return '내일';
    }
    return `내일 ~ ${format(end, 'M.d(EEE)', { locale: ko })}`;
  }

  if (startDate === endDate) {
    return format(start, 'M.d(EEE)', { locale: ko });
  }

  return `${format(start, 'M.d')} ~ ${format(end, 'M.d(EEE)', { locale: ko })}`;
}

export function TeamLeaveWidget() {
  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.teamLeave(),
    queryFn: async () => {
      try {
        const response = await apiClient.get<{ data: { leaves: TeamLeave[] } }>('/dashboard/team-leave');
        return response.data.data.leaves;
      } catch {
        return mockTeamLeaves;
      }
    },
  });
  const leaves = data ?? [];

  const todayLeaves = leaves.filter((leave) => {
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);
    const today = new Date();
    return isWithinInterval(today, { start, end });
  });

  const upcomingLeaves = leaves.filter((leave) => {
    const start = new Date(leave.startDate);
    return start > new Date();
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          팀원 휴가 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : leaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              예정된 팀원 휴가가 없습니다
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Today */}
            {todayLeaves.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  오늘 휴가 ({todayLeaves.length}명)
                </h4>
                <div className="space-y-2">
                  {todayLeaves.map((leave) => (
                    <Link
                      key={leave.id}
                      to={`/employees/${leave.employeeId}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-red-50 dark:bg-red-900/20 transition-colors hover:bg-red-100 dark:hover:bg-red-900/30">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={leave.profileImageUrl} />
                          <AvatarFallback className="text-xs">
                            {leave.employeeName.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {leave.employeeName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {leave.leaveType}
                          </p>
                        </div>
                        <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                          {getDateLabel(leave.startDate, leave.endDate)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming */}
            {upcomingLeaves.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2">
                  예정된 휴가
                </h4>
                <div className="space-y-2">
                  {upcomingLeaves.slice(0, 3).map((leave) => (
                    <Link
                      key={leave.id}
                      to={`/employees/${leave.employeeId}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 transition-colors hover:bg-muted">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={leave.profileImageUrl} />
                          <AvatarFallback className="text-xs">
                            {leave.employeeName.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {leave.employeeName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {leave.leaveType}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {getDateLabel(leave.startDate, leave.endDate)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
