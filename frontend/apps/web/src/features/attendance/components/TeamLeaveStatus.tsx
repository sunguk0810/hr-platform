import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, User, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { LeaveEvent } from './LeaveCalendar/MonthView';

export interface TeamMember {
  id: string;
  name: string;
  position: string;
  profileImage?: string;
  annualLeaveTotal: number;
  annualLeaveUsed: number;
  annualLeaveRemaining: number;
}

interface TeamLeaveStatusProps {
  teamName: string;
  members: TeamMember[];
  leaves: LeaveEvent[];
  currentDate?: Date;
  className?: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function TeamLeaveStatus({
  teamName,
  members,
  leaves,
  currentDate = new Date(),
  className,
}: TeamLeaveStatusProps) {
  const todayLeaves = leaves.filter(
    (leave) =>
      isWithinInterval(currentDate, {
        start: startOfDay(leave.startDate),
        end: endOfDay(leave.endDate),
      }) && leave.status === 'APPROVED'
  );

  const pendingLeaves = leaves.filter((leave) => leave.status === 'PENDING');

  const getMemberStatus = (memberId: string) => {
    const memberTodayLeave = todayLeaves.find(
      (leave) => leave.employeeId === memberId
    );
    return memberTodayLeave;
  };

  const getLeaveUsagePercent = (member: TeamMember) => {
    if (member.annualLeaveTotal === 0) return 0;
    return Math.round((member.annualLeaveUsed / member.annualLeaveTotal) * 100);
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{teamName} 휴가 현황</CardTitle>
          <span className="text-sm text-muted-foreground">
            {format(currentDate, 'M월 d일 (EEE)', { locale: ko })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-primary">
              <User className="h-5 w-5" />
              {members.length}
            </div>
            <p className="text-xs text-muted-foreground">전체 인원</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-amber-500">
              <Calendar className="h-5 w-5" />
              {todayLeaves.length}
            </div>
            <p className="text-xs text-muted-foreground">오늘 휴가</p>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="flex items-center justify-center gap-1.5 text-2xl font-bold text-orange-500">
              <Clock className="h-5 w-5" />
              {pendingLeaves.length}
            </div>
            <p className="text-xs text-muted-foreground">승인 대기</p>
          </div>
        </div>

        {/* Pending leaves alert */}
        {pendingLeaves.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  승인 대기 중인 휴가 {pendingLeaves.length}건
                </p>
                <div className="mt-1 space-y-1">
                  {pendingLeaves.slice(0, 3).map((leave) => (
                    <p
                      key={leave.id}
                      className="text-xs text-amber-700 dark:text-amber-300"
                    >
                      {leave.employeeName} - {leave.leaveTypeName} (
                      {format(leave.startDate, 'M/d')} ~{' '}
                      {format(leave.endDate, 'M/d')})
                    </p>
                  ))}
                  {pendingLeaves.length > 3 && (
                    <p className="text-xs text-amber-600">
                      외 {pendingLeaves.length - 3}건
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Member list */}
        <div className="space-y-3">
          {members.map((member) => {
            const leaveStatus = getMemberStatus(member.id);
            const usagePercent = getLeaveUsagePercent(member);

            return (
              <div
                key={member.id}
                className={cn(
                  'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                  leaveStatus && 'bg-muted/50'
                )}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={member.profileImage} alt={member.name} />
                  <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{member.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {member.position}
                    </span>
                    {leaveStatus && (
                      <Badge variant="secondary" className="shrink-0">
                        {leaveStatus.leaveTypeName}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Progress value={usagePercent} className="h-1.5 flex-1" />
                    <span className="text-xs text-muted-foreground shrink-0">
                      {member.annualLeaveUsed}/{member.annualLeaveTotal}일 사용
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-bold text-primary">
                    {member.annualLeaveRemaining}
                  </p>
                  <p className="text-xs text-muted-foreground">잔여</p>
                </div>
              </div>
            );
          })}
        </div>

        {members.length === 0 && (
          <p className="py-8 text-center text-muted-foreground">
            팀원 정보가 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default TeamLeaveStatus;
