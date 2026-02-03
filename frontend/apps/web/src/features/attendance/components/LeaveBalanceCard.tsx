import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Clock, AlertCircle } from 'lucide-react';
import { useLeaveBalance, useLeaveBalanceByType } from '../hooks/useAttendance';
import { Skeleton } from '@/components/common/Skeleton';
import { LEAVE_TYPE_LABELS, type LeaveType } from '@hr-platform/shared-types';

export interface LeaveBalanceCardProps {
  variant?: 'simple' | 'detailed';
  className?: string;
}

export function LeaveBalanceCard({
  variant = 'simple',
  className,
}: LeaveBalanceCardProps) {
  const { data: balanceData, isLoading } = useLeaveBalance();
  const { data: balanceByTypeData, isLoading: isLoadingByType } = useLeaveBalanceByType();

  const balance = balanceData?.data;
  const balanceByType = balanceByTypeData?.data ?? [];

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-16 w-full" />
          {variant === 'detailed' && (
            <>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!balance) {
    return null;
  }

  const usagePercent = Math.round((balance.usedDays / balance.totalDays) * 100);

  if (variant === 'simple') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5" />
            연차 잔여
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">{balance.remainingDays}</span>
            <span className="text-muted-foreground">/ {balance.totalDays}일</span>
          </div>
          <Progress value={100 - usagePercent} className="mt-4" />
          <div className="mt-2 flex justify-between text-sm text-muted-foreground">
            <span>사용: {balance.usedDays}일</span>
            {balance.pendingDays > 0 && (
              <span className="text-warning">대기: {balance.pendingDays}일</span>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          휴가 현황
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{balance.totalDays}</p>
            <p className="text-sm text-muted-foreground">총 연차</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{balance.remainingDays}</p>
            <p className="text-sm text-muted-foreground">잔여</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-muted-foreground">{balance.usedDays}</p>
            <p className="text-sm text-muted-foreground">사용</p>
          </div>
        </div>

        <Progress value={100 - usagePercent} className="h-2" />

        {/* Pending & Expired */}
        {(balance.pendingDays > 0 || balance.expiredDays > 0) && (
          <div className="flex gap-4 text-sm">
            {balance.pendingDays > 0 && (
              <div className="flex items-center gap-1 text-warning">
                <Clock className="h-4 w-4" />
                승인대기 {balance.pendingDays}일
              </div>
            )}
            {balance.expiredDays > 0 && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-4 w-4" />
                소멸예정 {balance.expiredDays}일
              </div>
            )}
          </div>
        )}

        {/* By Type */}
        {!isLoadingByType && balanceByType.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">휴가별 현황</p>
            <div className="space-y-2">
              {balanceByType.map((item) => (
                <div
                  key={item.leaveType}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {LEAVE_TYPE_LABELS[item.leaveType as LeaveType] || item.leaveTypeName}
                  </span>
                  <span>
                    <span className="font-medium">{item.remainingDays}</span>
                    <span className="text-muted-foreground"> / {item.totalDays}일</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
