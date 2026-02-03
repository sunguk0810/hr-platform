import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { AttendanceStatusBadge } from '@/components/common/StatusBadge';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, LogIn, LogOut, Calendar, CheckCircle2 } from 'lucide-react';
import {
  useTodayAttendance,
  useCheckIn,
  useCheckOut,
  useAttendanceRecords,
  useMonthlySummary,
  useAttendanceSearchParams,
} from '../hooks/useAttendance';
import type { AttendanceStatus } from '@hr-platform/shared-types';

export default function AttendancePage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const currentYearMonth = format(new Date(), 'yyyy-MM');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { params, searchState, setStatus, setPage } = useAttendanceSearchParams();
  const { data: todayData, isLoading: isTodayLoading } = useTodayAttendance();
  const { data: summaryData } = useMonthlySummary(currentYearMonth);
  const { data: recordsData, isLoading: isRecordsLoading } = useAttendanceRecords(params);

  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const today = todayData?.data;
  const summary = summaryData?.data;
  const records = recordsData?.data?.content ?? [];
  const totalPages = recordsData?.data?.totalPages ?? 0;

  const timeString = format(currentTime, 'HH:mm:ss');
  const dateString = format(currentTime, 'yyyy년 M월 d일 EEEE', { locale: ko });

  const handleCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync();
    } catch (error) {
      console.error('Check-in failed:', error);
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOutMutation.mutateAsync();
    } catch (error) {
      console.error('Check-out failed:', error);
    }
  };

  const isCheckedIn = !!today?.checkInTime;
  const isCheckedOut = !!today?.checkOutTime;

  return (
    <>
      <PageHeader
        title="근태 관리"
        description="출퇴근 기록 및 근태 현황을 관리합니다."
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Clock In/Out Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              출퇴근
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{dateString}</p>
              <p className="mt-2 text-4xl font-bold tabular-nums">{timeString}</p>
            </div>
            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={handleCheckIn}
                disabled={isCheckedIn || checkInMutation.isPending}
              >
                {isCheckedIn ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    출근 완료
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    {checkInMutation.isPending ? '처리 중...' : '출근'}
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCheckOut}
                disabled={!isCheckedIn || isCheckedOut || checkOutMutation.isPending}
              >
                {isCheckedOut ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    퇴근 완료
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    {checkOutMutation.isPending ? '처리 중...' : '퇴근'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Today's Record */}
        <Card>
          <CardHeader>
            <CardTitle>오늘의 근태</CardTitle>
          </CardHeader>
          <CardContent>
            {isTodayLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-5 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">출근 시간</span>
                  <span className="font-medium">{today?.checkInTime || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">퇴근 시간</span>
                  <span className="font-medium">{today?.checkOutTime || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">근무 시간</span>
                  <span className="font-medium">
                    {today?.workingHours ? `${today.workingHours}시간` : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">상태</span>
                  <span>
                    {today?.status ? (
                      <AttendanceStatusBadge status={today.status} />
                    ) : (
                      '-'
                    )}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card>
          <CardHeader>
            <CardTitle>이번 달 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">총 근무일</span>
                <span className="font-medium">{summary?.attendedDays ?? 0}일</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">총 근무시간</span>
                <span className="font-medium">
                  {summary?.totalWorkingHours ? `${Math.round(summary.totalWorkingHours)}시간` : '0시간'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">지각</span>
                <span className="font-medium text-warning">{summary?.lateDays ?? 0}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">조퇴</span>
                <span className="font-medium text-warning">{summary?.earlyLeaveDays ?? 0}회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">초과근무</span>
                <span className="font-medium">
                  {summary?.totalOvertimeHours ? `${Math.round(summary.totalOvertimeHours)}시간` : '0시간'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>근태 기록</CardTitle>
          <select
            value={searchState.status}
            onChange={(e) => setStatus(e.target.value as AttendanceStatus | '')}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <option value="">전체</option>
            <option value="NORMAL">정상</option>
            <option value="LATE">지각</option>
            <option value="EARLY_LEAVE">조퇴</option>
            <option value="ABSENT">결근</option>
          </select>
        </CardHeader>
        <CardContent className="p-0">
          {isRecordsLoading ? (
            <div className="p-4">
              <SkeletonTable rows={5} />
            </div>
          ) : records.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="근태 기록이 없습니다"
              description="출퇴근 기록이 여기에 표시됩니다."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        날짜
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        출근
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        퇴근
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        근무시간
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        상태
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(record.date), 'M월 d일 (E)', { locale: ko })}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">
                          {record.checkInTime?.slice(0, 5) || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono">
                          {record.checkOutTime?.slice(0, 5) || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {record.workingHours ? `${record.workingHours}h` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <AttendanceStatusBadge status={record.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={searchState.page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
