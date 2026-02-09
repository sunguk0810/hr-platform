import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('attendance');
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
  const totalPages = requestsData?.data?.page?.totalPages ?? 0;

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
      return <>{t('leaveRequestPage.hoursUnit', { count: request.hours })}</>;
    }
    return <>{t('leaveRequestPage.daysUnit', { count: request.days })}</>;
  };

  // Create/Cancel Dialogs (shared between mobile and desktop)
  const renderDialogs = () => (
    <>
      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className={isMobile ? "max-w-[calc(100%-2rem)] rounded-2xl" : "sm:max-w-[500px]"}>
          <DialogHeader>
            <DialogTitle>{t('leaveRequestPage.createDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('leaveRequestPage.createDialog.description')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>{t('leaveRequestPage.createDialog.leaveType')}</Label>
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
                  <SelectValue placeholder={t('leaveRequestPage.createDialog.leaveTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{t('leaveRequestPage.createDialog.leaveTypeGroups.annual')}</SelectLabel>
                    <SelectItem value="ANNUAL">{t('leaveRequestPage.createDialog.leaveTypeGroups.annualLeave')}</SelectItem>
                    <SelectItem value="HALF_DAY_AM">{t('leaveRequestPage.createDialog.leaveTypeGroups.halfDayAm')}</SelectItem>
                    <SelectItem value="HALF_DAY_PM">{t('leaveRequestPage.createDialog.leaveTypeGroups.halfDayPm')}</SelectItem>
                    {hourlyLeavePolicy.enabled && (
                      <SelectItem value="HOURLY">{t('leaveRequestPage.createDialog.leaveTypeGroups.hourlyLeave')}</SelectItem>
                    )}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>{t('leaveRequestPage.createDialog.leaveTypeGroups.specialGroup')}</SelectLabel>
                    <SelectItem value="SICK">{t('leaveRequestPage.createDialog.leaveTypeGroups.sick')}</SelectItem>
                    <SelectItem value="MARRIAGE">{t('leaveRequestPage.createDialog.leaveTypeGroups.marriage')}</SelectItem>
                    <SelectItem value="BEREAVEMENT">{t('leaveRequestPage.createDialog.leaveTypeGroups.bereavement')}</SelectItem>
                    <SelectItem value="MATERNITY">{t('leaveRequestPage.createDialog.leaveTypeGroups.maternity')}</SelectItem>
                    <SelectItem value="PATERNITY">{t('leaveRequestPage.createDialog.leaveTypeGroups.paternity')}</SelectItem>
                    <SelectItem value="CHILDCARE">{t('leaveRequestPage.createDialog.leaveTypeGroups.childcare')}</SelectItem>
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel>{t('leaveRequestPage.createDialog.leaveTypeGroups.otherGroup')}</SelectLabel>
                    <SelectItem value="OFFICIAL">{t('leaveRequestPage.createDialog.leaveTypeGroups.official')}</SelectItem>
                    <SelectItem value="COMPENSATION">{t('leaveRequestPage.createDialog.leaveTypeGroups.compensation')}</SelectItem>
                    <SelectItem value="SPECIAL">{t('leaveRequestPage.createDialog.leaveTypeGroups.special')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            {/* Half-day info banner */}
            {isHalfDayType && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-3 text-sm">
                <span className="font-medium text-blue-700 dark:text-blue-400">
                  {formData.leaveType === 'HALF_DAY_AM' ? t('leaveRequestPage.createDialog.halfDayInfo.am') : t('leaveRequestPage.createDialog.halfDayInfo.pm')}
                </span>
                <span className="text-blue-600 dark:text-blue-500 ml-2">
                  {formData.leaveType === 'HALF_DAY_AM'
                    ? t('leaveRequestPage.createDialog.halfDayInfo.amTime')
                    : t('leaveRequestPage.createDialog.halfDayInfo.pmTime')}
                </span>
              </div>
            )}

            {/* Hourly leave info banner and remaining balance */}
            {isHourlyType && (
              <div className="rounded-md bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900 p-3 text-sm space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                  <span className="font-medium text-violet-700 dark:text-violet-400">
                    {t('leaveRequestPage.createDialog.hourlyInfo.title')}
                  </span>
                  <span className="text-violet-600 dark:text-violet-500">
                    {t('leaveRequestPage.createDialog.hourlyInfo.policy', { minUnit: hourlyLeavePolicy.minUnit, maxCount: hourlyLeavePolicy.dailyMaxCount })}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-violet-600 dark:text-violet-500">
                  <span>{t('leaveRequestPage.createDialog.hourlyInfo.remaining', { hours: hourlyLeaveBalance.remainingHours })}</span>
                  <span className="text-violet-400 dark:text-violet-700">|</span>
                  <span>{t('leaveRequestPage.createDialog.hourlyInfo.used', { hours: hourlyLeaveBalance.usedHours })}</span>
                  <span className="text-violet-400 dark:text-violet-700">|</span>
                  <span>{t('leaveRequestPage.createDialog.hourlyInfo.total', { hours: hourlyLeaveBalance.totalHours })}</span>
                </div>
              </div>
            )}

            {/* Date picker - single date for half-day and hourly, range for others */}
            <div className="grid gap-2">
              <Label>{isHourlyType ? t('leaveRequestPage.createDialog.dateLabel') : t('leaveRequestPage.createDialog.startDateLabel')}</Label>
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
                <Label>{t('leaveRequestPage.createDialog.endDateLabel')}</Label>
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
                  <Label>{t('leaveRequestPage.createDialog.startTimeLabel')}</Label>
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
                      <SelectValue placeholder={t('leaveRequestPage.createDialog.startTimePlaceholder')} />
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
                  <Label>{t('leaveRequestPage.createDialog.endTimeLabel')}</Label>
                  <Select
                    value={formData.endTime}
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      endTime: value,
                    }))}
                    disabled={!formData.startTime}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('leaveRequestPage.createDialog.endTimePlaceholder')} />
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
                  {t('leaveRequestPage.createDialog.calculatedHours', { hours: calculatedHours })}
                </span>
              </div>
            )}

            {/* Calculated days for non-hourly types */}
            {!isHourlyType && formData.startDate && formData.endDate && (
              <div className="rounded-md bg-muted p-3 text-sm">
                {t('leaveRequestPage.createDialog.calculatedDays', { days: calculateDays() })}
              </div>
            )}

            <div className="grid gap-2">
              <Label>{t('leaveRequestPage.createDialog.reasonLabel')}</Label>
              <Textarea
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder={t('leaveRequestPage.createDialog.reasonPlaceholder')}
                rows={3}
              />
            </div>

            {/* FR-ATT-002-03: 결재선 미리보기 */}
            {formData.leaveType && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('leaveRequestPage.createDialog.approvalLinePreview')}</Label>
                <div className="rounded-lg border bg-muted/30 p-3">
                  {isLoadingApprovalLine ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t('leaveRequestPage.createDialog.loadingApprovalLine')}</span>
                    </div>
                  ) : recommendedApprovers.length > 0 ? (
                    <ApprovalLinePreview
                      requesterName="홍길동"
                      approvers={recommendedApprovers}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">
                      {t('leaveRequestPage.createDialog.noApprovalLine')}
                    </p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('leaveRequestPage.createDialog.approvalLineNote')}
                </p>
              </div>
            )}
          </div>
          <DialogFooter className={isMobile ? "flex-row gap-2" : ""}>
            <Button variant="outline" className={isMobile ? "flex-1" : ""} onClick={() => setIsCreateDialogOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button
              className={isMobile ? "flex-1" : ""}
              onClick={handleCreate}
              disabled={isCreateDisabled}
            >
              {createMutation.isPending ? t('leaveRequestPage.createDialog.submitting') : t('leaveRequestPage.createDialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className={isMobile ? "max-w-[calc(100%-2rem)] rounded-2xl" : ""}>
          <DialogHeader>
            <DialogTitle>{t('leaveRequestPage.cancelDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('leaveRequestPage.cancelDialog.description')}
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
              {t('common:close')}
            </Button>
            <Button
              variant="destructive"
              className={isMobile ? "flex-1" : ""}
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? t('leaveRequestPage.cancelDialog.cancelling') : t('leaveRequestPage.cancelDialog.confirm')}
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
              <h1 className="text-xl font-bold">{t('leaveRequestPage.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('leaveRequestPage.mobileDescription')}</p>
            </div>
            <Button size="sm" onClick={handleCreateOpen}>
              <Plus className="mr-1 h-4 w-4" />
              {t('leaveRequestPage.applyButton')}
            </Button>
          </div>

          {/* Leave Balance Card */}
          <div className="bg-card rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">{t('leaveRequestPage.leaveBalance.title')}</h3>
              <span className="text-2xl font-bold text-primary">{t('leaveRequestPage.leaveBalance.daysUnit', { count: balance?.remainingDays ?? 0 })}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-muted-foreground">{t('leaveRequestPage.leaveBalance.totalAnnual')}</p>
                <p className="font-semibold">{t('leaveRequestPage.leaveBalance.daysUnit', { count: balance?.totalDays ?? 0 })}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-muted-foreground">{t('leaveRequestPage.leaveBalance.used')}</p>
                <p className="font-semibold">{t('leaveRequestPage.leaveBalance.daysUnit', { count: balance?.usedDays ?? 0 })}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-muted-foreground">{t('leaveRequestPage.leaveBalance.pending')}</p>
                <p className="font-semibold">{t('leaveRequestPage.leaveBalance.daysUnit', { count: balance?.pendingDays ?? 0 })}</p>
              </div>
            </div>
          </div>

          {/* Hourly Leave Balance Card (mobile) */}
          {hourlyLeavePolicy.enabled && (
            <div className="bg-card rounded-2xl border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-violet-600" />
                  <h3 className="font-semibold text-sm">{t('leaveRequestPage.hourlyLeaveBalance.title')}</h3>
                </div>
                <span className="text-lg font-bold text-violet-600">{t('leaveRequestPage.hourlyLeaveBalance.hoursUnit', { count: hourlyLeaveBalance.remainingHours })}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-muted-foreground">{t('leaveRequestPage.hourlyLeaveBalance.total')}</p>
                  <p className="font-semibold">{t('leaveRequestPage.hourlyLeaveBalance.hoursUnit', { count: hourlyLeaveBalance.totalHours })}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-muted-foreground">{t('leaveRequestPage.hourlyLeaveBalance.used')}</p>
                  <p className="font-semibold">{t('leaveRequestPage.hourlyLeaveBalance.hoursUnit', { count: hourlyLeaveBalance.usedHours })}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-2">
                  <p className="text-muted-foreground">{t('leaveRequestPage.hourlyLeaveBalance.pending')}</p>
                  <p className="font-semibold">{t('leaveRequestPage.hourlyLeaveBalance.hoursUnit', { count: hourlyLeaveBalance.pendingHours })}</p>
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
            <Select
              value={searchState.leaveType}
              onValueChange={(value) => setLeaveType(value as LeaveType | '')}
            >
              <SelectTrigger className="flex-1 h-9">
                <SelectValue placeholder={t('leaveRequestPage.filter.allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('leaveRequestPage.filter.allTypes')}</SelectItem>
                {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={searchState.status}
              onValueChange={(value) => setStatus(value as LeaveStatus | '')}
            >
              <SelectTrigger className="flex-1 h-9">
                <SelectValue placeholder={t('leaveRequestPage.filter.allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('leaveRequestPage.filter.allStatus')}</SelectItem>
                <SelectItem value="PENDING">{t('leaveRequestPage.filter.pending')}</SelectItem>
                <SelectItem value="APPROVED">{t('leaveRequestPage.filter.approved')}</SelectItem>
                <SelectItem value="REJECTED">{t('leaveRequestPage.filter.rejected')}</SelectItem>
                <SelectItem value="CANCELLED">{t('leaveRequestPage.filter.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Leave Request List */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground">{t('leaveRequestPage.requestList.mobileTitle')}</h3>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
                ))}
              </div>
            ) : requests.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={t('leaveRequestPage.emptyState.title')}
                description={t('leaveRequestPage.emptyState.description')}
                action={{
                  label: t('leaveRequestPage.emptyState.action'),
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
        title={t('leaveRequestPage.title')}
        description={t('leaveRequestPage.description')}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/attendance')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t('leaveRequestPage.backToAttendance')}
            </Button>
            <Button onClick={handleCreateOpen}>
              <Plus className="mr-2 h-4 w-4" />
              {t('leaveRequestPage.title')}
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Leave Balance */}
        <Card>
          <CardHeader>
            <CardTitle>{t('leaveRequestPage.leaveBalance.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">{t('leaveRequestPage.leaveBalance.totalAnnual')}</span>
                <span className="text-2xl font-bold">{t('leaveRequestPage.leaveBalance.daysUnit', { count: balance?.totalDays ?? 0 })}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('leaveRequestPage.leaveBalance.used')}</span>
                  <span className="font-medium">{t('leaveRequestPage.leaveBalance.daysUnit', { count: balance?.usedDays ?? 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('leaveRequestPage.leaveBalance.pending')}</span>
                  <span className="font-medium">{t('leaveRequestPage.leaveBalance.daysUnit', { count: balance?.pendingDays ?? 0 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('leaveRequestPage.leaveBalance.remaining')}</span>
                  <span className="font-medium text-primary">{t('leaveRequestPage.leaveBalance.daysUnit', { count: balance?.remainingDays ?? 0 })}</span>
                </div>
              </div>
              {/* Hourly leave balance section */}
              {hourlyLeavePolicy.enabled && (
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-violet-600" />
                    <span className="font-medium text-sm">{t('leaveRequestPage.hourlyLeaveBalance.title')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('leaveRequestPage.hourlyLeaveBalance.total')}</span>
                    <span className="font-medium">{t('leaveRequestPage.hourlyLeaveBalance.hoursUnit', { count: hourlyLeaveBalance.totalHours })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('leaveRequestPage.hourlyLeaveBalance.used')}</span>
                    <span className="font-medium">{t('leaveRequestPage.hourlyLeaveBalance.hoursUnit', { count: hourlyLeaveBalance.usedHours })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('leaveRequestPage.hourlyLeaveBalance.remaining')}</span>
                    <span className="font-medium text-violet-600">{t('leaveRequestPage.hourlyLeaveBalance.hoursUnit', { count: hourlyLeaveBalance.remainingHours })}</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Leave Balance by Type */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('leaveRequestPage.balanceByType.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {balanceByType.map((item) => (
                <div key={item.leaveType} className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">{item.leaveTypeName}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{item.remainingDays}</span>
                    <span className="text-sm text-muted-foreground">/ {t('leaveRequestPage.daysUnit', { count: item.totalDays })}</span>
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
          <CardTitle>{t('leaveRequestPage.requestList.title')}</CardTitle>
          <div className="flex gap-2">
            <Select
              value={searchState.leaveType}
              onValueChange={(value) => setLeaveType(value as LeaveType | '')}
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder={t('leaveRequestPage.filter.allTypes')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('leaveRequestPage.filter.allTypes')}</SelectItem>
                {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={searchState.status}
              onValueChange={(value) => setStatus(value as LeaveStatus | '')}
            >
              <SelectTrigger className="h-9 w-[180px]">
                <SelectValue placeholder={t('leaveRequestPage.filter.allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t('leaveRequestPage.filter.allStatus')}</SelectItem>
                <SelectItem value="PENDING">{t('leaveRequestPage.filter.pending')}</SelectItem>
                <SelectItem value="APPROVED">{t('leaveRequestPage.filter.approved')}</SelectItem>
                <SelectItem value="REJECTED">{t('leaveRequestPage.filter.rejected')}</SelectItem>
                <SelectItem value="CANCELLED">{t('leaveRequestPage.filter.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
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
              title={t('leaveRequestPage.emptyState.title')}
              description={t('leaveRequestPage.emptyState.description')}
              action={{
                label: t('leaveRequestPage.emptyState.action'),
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
                        {t('leaveRequestPage.table.type')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('leaveRequestPage.table.period')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('leaveRequestPage.table.daysOrHours')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('leaveRequestPage.table.reason')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('leaveRequestPage.table.status')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('leaveRequestPage.table.action')}
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
                              {t('common:cancel')}
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
  const { t } = useTranslation('attendance');
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
                {request.startTime} ~ {request.endTime} ({t('leaveRequestPage.hoursUnit', { count: request.hours })})
              </span>
            ) : (
              <>
                {request.startDate !== request.endDate && (
                  <> ~ {format(new Date(request.endDate), 'M월 d일', { locale: ko })}</>
                )}
                <span className="text-muted-foreground ml-1">({t('leaveRequestPage.daysUnit', { count: request.days })})</span>
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
