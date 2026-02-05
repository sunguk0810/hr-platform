import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { ArrowLeft, Clock, Plus, AlertCircle, CheckCircle, XCircle, Timer } from 'lucide-react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  useOvertimeList,
  useOvertimeSummary,
  useCreateOvertime,
  useCancelOvertime,
} from '../hooks/useAttendance';
import type { OvertimeStatus, CreateOvertimeRequest } from '@hr-platform/shared-types';

const STATUS_CONFIG: Record<OvertimeStatus, { label: string; variant: 'default' | 'warning' | 'success' | 'error' }> = {
  PENDING: { label: '승인대기', variant: 'warning' },
  APPROVED: { label: '승인', variant: 'success' },
  REJECTED: { label: '반려', variant: 'error' },
  CANCELLED: { label: '취소', variant: 'default' },
};

export default function OvertimePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<OvertimeStatus | 'all'>('all');
  const [page, setPage] = useState(0);

  const [formData, setFormData] = useState<CreateOvertimeRequest>({
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '18:00',
    endTime: '21:00',
    reason: '',
  });

  const { data: summaryData } = useOvertimeSummary(format(new Date(), 'yyyy-MM'));
  const { data: listData, isLoading } = useOvertimeList({
    page,
    size: 10,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const createMutation = useCreateOvertime();
  const cancelMutation = useCancelOvertime();

  const summary = summaryData?.data;
  const overtimeList = listData?.data?.content ?? [];
  const totalPages = listData?.data?.totalPages ?? 0;

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync(formData);
      setIsCreateDialogOpen(false);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '18:00',
        endTime: '21:00',
        reason: '',
      });
    } catch (error) {
      console.error('Failed to create overtime request:', error);
    }
  };

  const handleCancel = async (id: string) => {
    if (confirm('초과근무 신청을 취소하시겠습니까?')) {
      try {
        await cancelMutation.mutateAsync(id);
      } catch (error) {
        console.error('Failed to cancel overtime:', error);
      }
    }
  };

  const calculateHours = (start: string, end: string): number => {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return Math.max(0, (endMinutes - startMinutes) / 60);
  };

  const estimatedHours = calculateHours(formData.startTime, formData.endTime);

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['overtime'] });
  };

  // Shared Create Dialog
  const renderCreateDialog = () => (
    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>초과근무 신청</DialogTitle>
          <DialogDescription>초과근무 내역을 입력하고 승인을 요청합니다.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="date">날짜 *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="startTime">시작 시간 *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="endTime">종료 시간 *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData((prev) => ({ ...prev, endTime: e.target.value }))}
              />
            </div>
          </div>
          {estimatedHours > 0 && (
            <div className="text-sm text-muted-foreground">
              예상 초과근무 시간: <span className="font-medium text-primary">{estimatedHours.toFixed(1)}시간</span>
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="reason">사유 *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="초과근무 사유를 입력하세요"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
            취소
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              !formData.date ||
              !formData.startTime ||
              !formData.endTime ||
              !formData.reason ||
              estimatedHours <= 0 ||
              createMutation.isPending
            }
          >
            {createMutation.isPending ? '신청 중...' : '신청'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-24">
          {/* Mobile Header */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/attendance')}
              className="p-2 -ml-2 rounded-full hover:bg-muted"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold">초과근무</h1>
              <p className="text-sm text-muted-foreground">초과근무 신청 및 현황</p>
            </div>
          </div>

          {/* Summary Cards (2x2 Grid) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">이번 달 신청</span>
                <Clock className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold">{summary?.totalRequests ?? 0}건</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">승인됨</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{summary?.approvedRequests ?? 0}건</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">대기 중</span>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold text-yellow-600">{summary?.pendingRequests ?? 0}건</p>
            </div>
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">총 승인 시간</span>
                <Timer className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">{summary?.approvedHours ?? 0}h</p>
            </div>
          </div>

          {/* Mobile Tab Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {[
              { value: 'all', label: '전체' },
              { value: 'PENDING', label: '대기' },
              { value: 'APPROVED', label: '승인' },
              { value: 'REJECTED', label: '반려' },
              { value: 'CANCELLED', label: '취소' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => { setStatusFilter(item.value as OvertimeStatus | 'all'); setPage(0); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === item.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile Overtime List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : overtimeList.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="초과근무 신청 내역이 없습니다"
              description="아래 버튼을 눌러 초과근무를 신청하세요."
            />
          ) : (
            <div className="space-y-3">
              {overtimeList.map((item) => {
                const config = STATUS_CONFIG[item.status];
                return (
                  <div key={item.id} className="bg-card rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <StatusBadge status={config.variant} label={config.label} />
                        </div>
                        <p className="text-sm font-medium">
                          {format(new Date(item.date), 'M월 d일 (EEE)', { locale: ko })}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>{item.startTime} - {item.endTime}</span>
                          <span>·</span>
                          <span className="font-medium text-foreground">{item.hours}시간</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 truncate">{item.reason}</p>
                      </div>
                      {item.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive flex-shrink-0"
                          onClick={() => handleCancel(item.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              )}
            </div>
          )}

          {/* Floating Action Button */}
          <button
            onClick={() => setIsCreateDialogOpen(true)}
            className="fixed bottom-20 right-4 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-transform z-50"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>

        {renderCreateDialog()}
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="초과근무"
        description="초과근무를 신청하고 현황을 확인합니다."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/attendance')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              근태관리
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              초과근무 신청
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">이번 달 신청</p>
                <p className="text-2xl font-bold">{summary?.totalRequests ?? 0}건</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">승인됨</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary?.approvedRequests ?? 0}건
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">대기 중</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {summary?.pendingRequests ?? 0}건
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">총 승인 시간</p>
                <p className="text-2xl font-bold text-blue-600">
                  {summary?.approvedHours ?? 0}시간
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Timer className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label>상태</Label>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value as OvertimeStatus | 'all');
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="PENDING">승인대기</SelectItem>
                <SelectItem value="APPROVED">승인</SelectItem>
                <SelectItem value="REJECTED">반려</SelectItem>
                <SelectItem value="CANCELLED">취소</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader>
          <CardTitle>신청 내역</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : overtimeList.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="초과근무 신청 내역이 없습니다"
              description="초과근무를 신청하려면 상단의 버튼을 클릭하세요."
              action={{
                label: '초과근무 신청',
                onClick: () => setIsCreateDialogOpen(true),
              }}
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
                        시간
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        근무시간
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        사유
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        상태
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {overtimeList.map((item) => {
                      const config = STATUS_CONFIG[item.status];
                      return (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="px-4 py-3 text-sm">
                            {format(new Date(item.date), 'yyyy.MM.dd (EEE)', { locale: ko })}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {item.startTime} - {item.endTime}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {item.hours}시간
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">
                            {item.reason}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={config.variant} label={config.label} />
                          </td>
                          <td className="px-4 py-3 text-right">
                            {item.status === 'PENDING' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => handleCancel(item.id)}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                취소
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {totalPages > 1 && (
                <div className="p-4 border-t">
                  <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {renderCreateDialog()}
    </>
  );
}
