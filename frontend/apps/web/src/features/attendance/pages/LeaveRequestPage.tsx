import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { format, differenceInCalendarDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { LeaveStatusBadge, LeaveTypeBadge } from '@/components/common/StatusBadge';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { DatePicker } from '@/components/common/DatePicker';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Calendar, Clock, Loader2, Plus, XCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { queryKeys } from '@/lib/queryClient';
import { approvalService } from '@/features/approval/services/approvalService';
import { ApprovalLinePreview } from '@/features/approval/components/ApprovalLinePreview';
import {
  useLeaveBalance,
  useLeaveBalanceByType,
  useLeaveRequests,
  useLeaveSearchParams,
  useCreateLeaveRequest,
  useCancelLeaveRequest,
} from '../hooks/useAttendance';
import type { LeaveType, LeaveStatus, CreateLeaveRequest, LeaveRequest as LeaveRequestType, HourlyLeavePolicy } from '@hr-platform/shared-types';
import { LEAVE_TYPE_LABELS } from '@hr-platform/shared-types';

/**
 * Generate time slot options between 09:00 and 18:00 based on the minimum unit.
 * @param minUnit - Minimum time unit in minutes (30 or 60)
 * @returns Array of time strings like ["09:00", "09:30", "10:00", ...]
 */
function generateTimeSlots(minUnit: 30 | 60): string[] {
  const slots: string[] = [];
  const startMinutes = 9 * 60; // 09:00
  const endMinutes = 18 * 60;  // 18:00
  for (let m = startMinutes; m <= endMinutes; m += minUnit) {
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
  }
  return slots;
}

/**
 * Calculate the number of hours between two time strings.
 * @param startTime - e.g., "09:00"
 * @param endTime - e.g., "11:30"
 * @returns number of hours (e.g., 2.5)
 */
function calculateHoursBetween(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  return (endH * 60 + endM - startH * 60 - startM) / 60;
}

// Default hourly leave policy (would come from tenant settings in production)
const DEFAULT_HOURLY_LEAVE_POLICY: HourlyLeavePolicy = {
  enabled: true,
  minUnit: 30,
  dailyMaxCount: 2,
};

export default function LeaveRequestPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestType | null>(null);

  // In production, this would be fetched from tenant settings API
  const [hourlyLeavePolicy] = useState<HourlyLeavePolicy>(DEFAULT_HOURLY_LEAVE_POLICY);

  // Mock hourly leave balance (in production, fetched from API)
  const hourlyLeaveBalance = {
    totalHours: 16,
    usedHours: 4,
    remainingHours: 12,
    pendingHours: 2,
  };

  const [formData, setFormData] = useState<{
    leaveType: LeaveType | '';
    startDate: Date | undefined;
    endDate: Date | undefined;
    reason: string;
    startTime: string;
    endTime: string;
  }>({
    leaveType: '',
    startDate: undefined,
    endDate: undefined,
    reason: '',
    startTime: '',
    endTime: '',
  });

  const { params, searchState, setLeaveType, setStatus, setPage } = useLeaveSearchParams();
  const { data: balanceData } = useLeaveBalance();
  const { data: balanceByTypeData } = useLeaveBalanceByType();
  const { data: requestsData, isLoading } = useLeaveRequests(params);
  const createMutation = useCreateLeaveRequest();
  const cancelMutation = useCancelLeaveRequest();

  // FR-ATT-002-03: Auto-recommended approval line based on leave type
  const shouldFetchApprovalLine = !!formData.leaveType && isCreateDialogOpen;
  const { data: approvalLineData, isLoading: isLoadingApprovalLine } = useQuery({
    queryKey: ['approval-recommend-line', formData.leaveType],
    queryFn: () => approvalService.getRecommendedApprovalLine({
      type: 'LEAVE_REQUEST',
      departmentId: 'dept-001', // Mock: current user's department
    }),
    enabled: shouldFetchApprovalLine,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const recommendedApprovers = approvalLineData?.data?.approvers ?? [];

  const balance = balanceData?.data;
  const balanceByType = balanceByTypeData?.data ?? [];
  const requests = requestsData?.data?.content ?? [];
  const totalPages = requestsData?.data?.totalPages ?? 0;

  const isHourlyType = formData.leaveType === 'HOURLY';
  const isHalfDayType = formData.leaveType?.startsWith('HALF_DAY') ?? false;

  const timeSlots = useMemo(
    () => generateTimeSlots(hourlyLeavePolicy.minUnit),
    [hourlyLeavePolicy.minUnit]
  );

  // Filter end time options to only show times after the selected start time
  const endTimeSlots = useMemo(() => {
    if (!formData.startTime) return timeSlots;
    return timeSlots.filter((t) => t > formData.startTime);
  }, [timeSlots, formData.startTime]);

  const calculatedHours = useMemo(() => {
    if (!formData.startTime || !formData.endTime) return 0;
    return calculateHoursBetween(formData.startTime, formData.endTime);
  }, [formData.startTime, formData.endTime]);

  const handleCreateOpen = () => {
    setFormData({
      leaveType: '',
      startDate: undefined,
      endDate: undefined,
      reason: '',
      startTime: '',
      endTime: '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleCancelOpen = (request: LeaveRequestType) => {
    setSelectedRequest(request);
    setIsCancelDialogOpen(true);
  };

  const handleCreate = async () => {
    if (!formData.leaveType || !formData.startDate) return;

    // For hourly leave, validate time selection
    if (isHourlyType) {
      if (!formData.startTime || !formData.endTime) return;
    } else if (!formData.endDate) {
      return;
    }

    try {
      const data: CreateLeaveRequest = {
        leaveType: formData.leaveType,
        startDate: format(formData.startDate, 'yyyy-MM-dd'),
        endDate: format(isHourlyType ? formData.startDate : (formData.endDate ?? formData.startDate), 'yyyy-MM-dd'),
        reason: formData.reason,
        ...(isHourlyType && {
          startTime: formData.startTime,
          endTime: formData.endTime,
          hours: calculatedHours,
        }),
      };
      await createMutation.mutateAsync(data);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create leave request:', error);
    }
  };

  const handleCancel = async () => {
    if (!selectedRequest) return;
    try {
      await cancelMutation.mutateAsync(selectedRequest.id);
      setIsCancelDialogOpen(false);
    } catch (error) {
      console.error('Failed to cancel leave request:', error);
    }
  };

  const calculateDays = () => {
    if (isHourlyType) return 0;
    if (!formData.startDate || !formData.endDate) return 0;
    if (isHalfDayType) return 0.5;
    return differenceInCalendarDays(formData.endDate, formData.startDate) + 1;
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.leaves.all });
  };

  const isCreateDisabled = useMemo(() => {
    if (!formData.leaveType || !formData.startDate || !formData.reason || createMutation.isPending) return true;
    if (isHourlyType) {
      return !formData.startTime || !formData.endTime || calculatedHours <= 0;
    }
    return !formData.endDate;
  }, [formData, isHourlyType, calculatedHours, createMutation.isPending]);

  // Render the period/time column for a leave request
  const renderRequestPeriod = (request: LeaveRequestType) => {
    if (request.leaveType === 'HOURLY' && request.startTime && request.endTime) {
      return (
        <>
          {format(new Date(request.startDate), 'M/d', { locale: ko })}
          {' '}
          <span className="text-muted-foreground">
            {request.startTime} ~ {request.endTime}
          </span>
        </>
      );
    }
    return (
      <>
        {format(new Date(request.startDate), 'M/d', { locale: ko })}
        {request.startDate !== request.endDate && (
          <> ~ {format(new Date(request.endDate), 'M/d', { locale: ko })}</>
        )}
      </>
    );
  };

  // Render the days/hours column for a leave request
  const renderRequestDuration = (request: LeaveRequestType) => {
    if (request.leaveType === 'HOURLY' && request.hours) {
      return <>{request.hours}시간</>;
    }
    return <>{request.days}일</>;
  };

  // Create/Cancel Dialogs (shared between mobile and desktop)
  const renderDialogs = () => (
    <>
      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className={isMobile ? "max-w-[calc(100%-2rem)] rounded-2xl" : "sm:max-w-[500px]"}>
          <DialogHeader>
            <DialogTitle>휴가 신청</DialogTitle>
            <DialogDescription>
              휴가를 신청합니다. 승인 후 휴가가 확정됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>휴가 유형 *</Label>
              <Select
                value={formData.leaveType}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  leaveType: value as LeaveType,
                  endDate: (value.startsWith('HALF_DAY') || value === 'HOURLY') && prev.startDate ? prev.startDate : prev.endDate,
                  startTime: value === 'HOURLY' ? prev.startTime : '',
                  endTime: value === 'HOURLY' ? prev.endTime : '',
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="휴가 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>연차</SelectLabel>
                    <SelectItem value="ANNUAL">연차</SelectItem>
                    <SelectItem value="HALF_DAY_AM">반차 (오전) - 09:00~13:00</SelectItem>
                    <SelectItem value="HALF_DAY_PM">반차 (오후) - 14:00~18:00</SelectItem>
                    {hourlyLeavePolicy.enabled && (
                      <SelectItem value="HOURLY">시간차 휴가</SelectItem>
                    )}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>특별휴가</SelectLabel>
                    <SelectItem value="SICK">병가</SelectItem>
                    <SelectItem value="MARRIAGE">결혼휴가</SelectItem>
                    <SelectItem value="BEREAVEMENT">경조휴가</SelectItem>
                    <SelectItem value="MATERNITY">출산휴가</SelectItem>
                    <SelectItem value="PATERNITY">배우자출산휴가</SelectItem>
                    <SelectItem value="CHILDCARE">육아휴직</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>기타</SelectLabel>
                    <SelectItem value="OFFICIAL">공가</SelectItem>
                    <SelectItem value="COMPENSATION">대체휴가</SelectItem>
                    <SelectItem value="SPECIAL">특별휴가</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Half-day info banner */}
            {isHalfDayType && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 text-sm">
                <span className="font-medium text-blue-700 dark:text-blue-400">
                  {formData.leaveType === 'HALF_DAY_AM' ? '오전 반차' : '오후 반차'}
                </span>
                <span className="text-blue-600 dark:text-blue-500 ml-2">
                  {formData.leaveType === 'HALF_DAY_AM'
                    ? '09:00 ~ 13:00 (4시간)'
                    : '14:00 ~ 18:00 (4시간)'}
                </span>
              </div>
            )}

            {/* Hourly leave info banner and remaining balance */}
            {isHourlyType && (
              <div className="rounded-md bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 p-3 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="font-medium text-violet-700 dark:text-violet-400">
                    시간차 휴가
                  </span>
                  <span className="text-violet-600 dark:text-violet-500">
                    (최소 단위: {hourlyLeavePolicy.minUnit}분 / 일 최대 {hourlyLeavePolicy.dailyMaxCount}회)
                  </span>
                </div>
                <div className="flex items-center gap-4 text-violet-600 dark:text-violet-500">
                  <span>잔여: <strong className="text-violet-700 dark:text-violet-400">{hourlyLeaveBalance.remainingHours}시간</strong></span>
                  <span className="text-violet-400 dark:text-violet-700">|</span>
                  <span>사용: {hourlyLeaveBalance.usedHours}시간</span>
                  <span className="text-violet-400 dark:text-violet-700">|</span>
                  <span>총: {hourlyLeaveBalance.totalHours}시간</span>
                </div>
              </div>
            )}

            {/* Date picker - single date for half-day and hourly, range for others */}
            <div className="grid gap-2">
              <Label>{isHourlyType ? '날짜 *' : '시작일 *'}</Label>
              <DatePicker
                value={formData.startDate}
                onChange={(date) => setFormData(prev => ({
                  ...prev,
                  startDate: date,
                  endDate: (isHalfDayType || isHourlyType) ? date : prev.endDate,
                }))}
                disabledDates={(date) => date < new Date()}
              />
            </div>

            {/* End date - only for non-half-day and non-hourly types */}
            {!isHalfDayType && !isHourlyType && (
              <div className="grid gap-2">
                <Label>종료일 *</Label>
                <DatePicker
                  value={formData.endDate}
                  onChange={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                  disabledDates={(date) => formData.startDate ? date < formData.startDate : date < new Date()}
                />
              </div>
            )}

            {/* Time pickers - only for hourly leave */}
            {isHourlyType && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>시작 시간 *</Label>
                  <Select
                    value={formData.startTime}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      startTime: value,
                      // Reset end time if it's no longer valid
                      endTime: prev.endTime && prev.endTime <= value ? '' : prev.endTime,
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="시작 시간" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.slice(0, -1).map((time) => (
                        <SelectItem key={`start-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>종료 시간 *</Label>
                  <Select
                    value={formData.endTime}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      endTime: value,
                    }))}
                    disabled={!formData.startTime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="종료 시간" />
                    </SelectTrigger>
                    <SelectContent>
                      {endTimeSlots.map((time) => (
                        <SelectItem key={`end-${time}`} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Calculated hours for hourly leave */}
            {isHourlyType && formData.startTime && formData.endTime && calculatedHours > 0 && (
              <div className="rounded-md bg-muted p-3 text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formData.startTime} ~ {formData.endTime}
                  {' / '}
                  총 <strong>{calculatedHours}시간</strong> 사용
                </span>
              </div>
            )}

            {/* Calculated days for non-hourly types */}
            {!isHourlyType && formData.startDate && formData.endDate && (
              <div className="rounded-md bg-muted p-3 text-sm">
                총 <strong>{calculateDays()}</strong>일
              </div>
            )}

            <div className="grid gap-2">
              <Label>사유 *</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="휴가 사유를 입력하세요."
                rows={3}
              />
            </div>

            {/* FR-ATT-002-03: 결재선 미리보기 */}
            {formData.leaveType && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">결재선 미리보기</Label>
                <div className="rounded-lg border bg-muted/30 p-3">
                  {isLoadingApprovalLine ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>결재선을 불러오는 중...</span>
                    </div>
                  ) : recommendedApprovers.length > 0 ? (
                    <ApprovalLinePreview
                      requesterName="홍길동"
                      approvers={recommendedApprovers}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      추천 결재선 정보가 없습니다.
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  소속 부서 및 직급 기준으로 자동 추천된 결재선입니다.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className={isMobile ? "flex-row gap-2" : ""}>
            <Button variant="outline" className={isMobile ? "flex-1" : ""} onClick={() => setIsCreateDialogOpen(false)}>
              취소
            </Button>
            <Button
              className={isMobile ? "flex-1" : ""}
              onClick={handleCreate}
              disabled={isCreateDisabled}
            >
              {createMutation.isPending ? '신청 중...' : '신청하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className={isMobile ? "max-w-[calc(100%-2rem)] rounded-2xl" : ""}>
          <DialogHeader>
            <DialogTitle>휴가 신청 취소</DialogTitle>
            <DialogDescription>
              정말로 이 휴가 신청을 취소하시겠습니까?
              <br />
              <span className="text-foreground font-medium">
                {selectedRequest && LEAVE_TYPE_LABELS[selectedRequest.leaveType]}
                {selectedRequest && selectedRequest.leaveType === 'HOURLY' && selectedRequest.startTime && selectedRequest.endTime
                  ? ` (${selectedRequest.startDate} ${selectedRequest.startTime} ~ ${selectedRequest.endTime})`
                  : selectedRequest && ` (${selectedRequest.startDate} ~ ${selectedRequest.endDate})`
                }
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={isMobile ? "flex-row gap-2" : ""}>
            <Button variant="outline" className={isMobile ? "flex-1" : ""} onClick={() => setIsCancelDialogOpen(false)}>
              닫기
            </Button>
            <Button
              variant="destructive"
              className={isMobile ? "flex-1" : ""}
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? '취소 중...' : '취소하기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">휴가 신청</h1>
              <p className="text-sm text-muted-foreground">승인 현황을 확인하세요</p>
            </div>
            <Button size="sm" onClick={handleCreateOpen}>
              <Plus className="mr-1 h-4 w-4" />
              신청
            </Button>
          </div>

          {/* Leave Balance Card */}
          <div className="bg-card rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">잔여 휴가</h3>
              <span className="text-2xl font-bold text-primary">{balance?.remainingDays ?? 0}일</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-muted-foreground">총 연차</p>
                <p className="font-semibold">{balance?.totalDays ?? 0}일</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-muted-foreground">사용</p>
                <p className="font-semibold">{balance?.usedDays ?? 0}일</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-muted-foreground">예정</p>
                <p className="font-semibold">{balance?.pendingDays ?? 0}일</p>
              </div>
            </div>
          </div>

          {/* Hourly Leave Balance Card (mobile) */}
          {hourlyLeavePolicy.enabled && (
            <div className="bg-card rounded-2xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-600" />
                  <h3 className="font-semibold text-sm">시간차 휴가</h3>
                </div>
                <span className="text-lg font-bold text-violet-600">{hourlyLeaveBalance.remainingHours}시간</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-muted-foreground">총</p>
                  <p className="font-semibold">{hourlyLeaveBalance.totalHours}시간</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-muted-foreground">사용</p>
                  <p className="font-semibold">{hourlyLeaveBalance.usedHours}시간</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-muted-foreground">예정</p>
                  <p className="font-semibold">{hourlyLeaveBalance.pendingHours}시간</p>
                </div>
              </div>
            </div>
          )}

          {/* Leave Balance by Type */}
          {balanceByType.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {balanceByType.map((item) => (
                <div key={item.leaveType} className="flex-shrink-0 w-28 bg-card rounded-xl border p-3">
                  <p className="text-xs text-muted-foreground truncate">{item.leaveTypeName}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-lg font-bold">{item.remainingDays}</span>
                    <span className="text-xs text-muted-foreground">/ {item.totalDays}</span>
                  </div>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(item.remainingDays / item.totalDays) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filter */}
          <div className="flex gap-2">
            <select
              value={searchState.leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType | '')}
              className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">전체 유형</option>
              {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={searchState.status}
              onChange={(e) => setStatus(e.target.value as LeaveStatus | '')}
              className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm"
            >
              <option value="">전체 상태</option>
              <option value="PENDING">승인대기</option>
              <option value="APPROVED">승인</option>
              <option value="REJECTED">반려</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>

          {/* Leave Request List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">신청 내역</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="휴가 신청 내역이 없습니다"
                description="휴가를 신청하면 내역이 여기에 표시됩니다."
                action={{
                  label: '휴가 신청',
                  onClick: handleCreateOpen,
                }}
              />
            ) : (
              <>
                {requests.map((request) => (
                  <MobileLeaveCard
                    key={request.id}
                    request={request}
                    onCancel={request.status === 'PENDING' ? () => handleCancelOpen(request) : undefined}
                  />
                ))}
                <Pagination
                  page={searchState.page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            )}
          </div>
        </div>
        {renderDialogs()}
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="휴가 신청"
        description="휴가를 신청하고 승인 현황을 확인합니다."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/attendance')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              근태관리
            </Button>
            <Button onClick={handleCreateOpen}>
              <Plus className="mr-2 h-4 w-4" />
              휴가 신청
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leave Balance */}
        <Card>
          <CardHeader>
            <CardTitle>잔여 휴가</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">총 연차</span>
                <span className="text-2xl font-bold">{balance?.totalDays ?? 0}일</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">사용</span>
                  <span className="font-medium">{balance?.usedDays ?? 0}일</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">예정</span>
                  <span className="font-medium">{balance?.pendingDays ?? 0}일</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">잔여</span>
                  <span className="font-medium text-primary">{balance?.remainingDays ?? 0}일</span>
                </div>
              </div>
              {/* Hourly leave balance section */}
              {hourlyLeavePolicy.enabled && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-violet-600" />
                    <span className="font-medium text-sm">시간차 휴가</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">총</span>
                    <span className="font-medium">{hourlyLeaveBalance.totalHours}시간</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">사용</span>
                    <span className="font-medium">{hourlyLeaveBalance.usedHours}시간</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">잔여</span>
                    <span className="font-medium text-violet-600">{hourlyLeaveBalance.remainingHours}시간</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leave Balance by Type */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>휴가 유형별 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {balanceByType.map((item) => (
                <div key={item.leaveType} className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">{item.leaveTypeName}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{item.remainingDays}</span>
                    <span className="text-sm text-muted-foreground">/ {item.totalDays}일</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(item.remainingDays / item.totalDays) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle>휴가 신청 내역</CardTitle>
          <div className="flex gap-2">
            <select
              value={searchState.leaveType}
              onChange={(e) => setLeaveType(e.target.value as LeaveType | '')}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">전체 유형</option>
              {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <select
              value={searchState.status}
              onChange={(e) => setStatus(e.target.value as LeaveStatus | '')}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">전체 상태</option>
              <option value="PENDING">승인대기</option>
              <option value="APPROVED">승인</option>
              <option value="REJECTED">반려</option>
              <option value="CANCELLED">취소</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={5} />
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="휴가 신청 내역이 없습니다"
              description="휴가를 신청하면 내역이 여기에 표시됩니다."
              action={{
                label: '휴가 신청',
                onClick: handleCreateOpen,
              }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        유형
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        기간
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        일수/시간
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        사유
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        상태
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr
                        key={request.id}
                        className="border-b transition-colors hover:bg-muted/50"
                      >
                        <td className="px-4 py-3">
                          <LeaveTypeBadge type={request.leaveType} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {renderRequestPeriod(request)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {renderRequestDuration(request)}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-[200px] truncate">
                          {request.reason}
                        </td>
                        <td className="px-4 py-3">
                          <LeaveStatusBadge status={request.status} />
                        </td>
                        <td className="px-4 py-3">
                          {request.status === 'PENDING' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelOpen(request)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              취소
                            </Button>
                          )}
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

      {renderDialogs()}
    </>
  );
}

// Mobile Leave Request Card Component
interface MobileLeaveCardProps {
  request: LeaveRequestType;
  onCancel?: () => void;
}

function MobileLeaveCard({ request, onCancel }: MobileLeaveCardProps) {
  const isHourly = request.leaveType === 'HOURLY' && request.startTime && request.endTime;

  return (
    <div className="bg-card rounded-xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <LeaveTypeBadge type={request.leaveType} />
            <LeaveStatusBadge status={request.status} />
          </div>
          <p className="text-sm font-medium">
            {format(new Date(request.startDate), 'M월 d일', { locale: ko })}
            {isHourly ? (
              <span className="text-muted-foreground ml-1">
                {request.startTime} ~ {request.endTime} ({request.hours}시간)
              </span>
            ) : (
              <>
                {request.startDate !== request.endDate && (
                  <> ~ {format(new Date(request.endDate), 'M월 d일', { locale: ko })}</>
                )}
                <span className="text-muted-foreground ml-1">({request.days}일)</span>
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-1 truncate">{request.reason}</p>
        </div>
        {onCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground"
            onClick={onCancel}
          >
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
