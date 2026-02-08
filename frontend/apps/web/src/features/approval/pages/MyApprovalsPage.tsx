import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/common/EmptyState';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Pagination } from '@/components/common/Pagination';
import { FileCheck, Plus, Search, Clock, CheckCircle, FileEdit, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { queryKeys } from '@/lib/queryClient';
import { useApprovalList } from '../hooks/useApprovals';
import type { ApprovalStatus, ApprovalType } from '@hr-platform/shared-types';

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; variant: 'default' | 'warning' | 'success' | 'error' }> = {
  DRAFT: { label: '임시저장', variant: 'default' },
  PENDING: { label: '진행중', variant: 'warning' },
  IN_REVIEW: { label: '검토중', variant: 'warning' },
  APPROVED: { label: '승인', variant: 'success' },
  REJECTED: { label: '반려', variant: 'error' },
  RECALLED: { label: '회수됨', variant: 'warning' },
  CANCELLED: { label: '취소', variant: 'default' },
};

const TYPE_LABELS: Record<string, string> = {
  LEAVE_REQUEST: '휴가신청',
  EXPENSE: '경비청구',
  OVERTIME: '초과근무',
  PERSONNEL: '인사발령',
  GENERAL: '일반',
};

export default function MyApprovalsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [tab, setTab] = useState<'pending' | 'requested' | 'completed' | 'draft' | 'all'>('all');
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState<ApprovalType | 'all'>('all');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useApprovalList({
    page,
    size: 10,
    keyword: keyword || undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    tab: tab === 'all' ? 'requested' : tab,
  });

  const approvals = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;
  const totalElements = data?.data?.page?.totalElements ?? 0;

  const handleRowClick = (id: string) => {
    navigate(`/approvals/${id}`);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.approvals.all });
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">내 결재</h1>
              <p className="text-sm text-muted-foreground">내가 요청한 결재 문서</p>
            </div>
            <Button size="sm" onClick={() => navigate('/approvals/new')}>
              <Plus className="mr-1 h-4 w-4" />
              작성
            </Button>
          </div>

          {/* Mobile Summary Cards */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setTab('pending'); setPage(0); }}
              className={`p-3 rounded-xl border text-left transition-colors ${tab === 'pending' ? 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800' : 'bg-card'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">진행중</span>
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
              <p className="text-xl font-bold text-yellow-600 mt-1">
                {approvals.filter((a) => a.status === 'PENDING').length}
              </p>
            </button>
            <button
              onClick={() => { setTab('completed'); setPage(0); }}
              className={`p-3 rounded-xl border text-left transition-colors ${tab === 'completed' ? 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800' : 'bg-card'}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">완료</span>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xl font-bold text-green-600 mt-1">
                {approvals.filter((a) => a.status === 'APPROVED').length}
              </p>
            </button>
          </div>

          {/* Mobile Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="제목, 문서번호 검색..."
              value={keyword}
              onChange={(e) => { setKeyword(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>

          {/* Mobile Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            {[
              { value: 'all', label: '전체' },
              { value: 'pending', label: '진행중' },
              { value: 'completed', label: '완료' },
              { value: 'draft', label: '임시저장' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => { setTab(item.value as typeof tab); setPage(0); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  tab === item.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Mobile List */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : approvals.length === 0 ? (
            <EmptyState
              icon={FileCheck}
              title="결재 문서가 없습니다"
              description="새 결재를 작성하세요."
              action={{
                label: '결재 작성',
                onClick: () => navigate('/approvals/new'),
              }}
            />
          ) : (
            <div className="space-y-3">
              {approvals.map((approval) => {
                const statusConfig = STATUS_CONFIG[approval.status];
                return (
                  <button
                    key={approval.id}
                    onClick={() => handleRowClick(approval.id)}
                    className="w-full bg-card rounded-xl border p-4 text-left transition-colors active:bg-muted"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">{TYPE_LABELS[approval.documentType]}</span>
                          <StatusBadge status={statusConfig.variant} label={statusConfig.label} />
                        </div>
                        <p className="font-medium text-sm truncate">{approval.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span className="font-mono">{approval.documentNumber}</span>
                          <span>•</span>
                          <span>{format(new Date(approval.createdAt), 'M/d')}</span>
                        </div>
                        {approval.currentStepName && (
                          <p className="text-xs text-primary mt-1">현재: {approval.currentStepName}</p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </button>
                );
              })}
              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              )}
            </div>
          )}
        </div>
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="내 결재"
        description="내가 요청한 결재 문서를 확인합니다."
        actions={
          <Button onClick={() => navigate('/approvals/new')}>
            <Plus className="mr-2 h-4 w-4" />
            결재 작성
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setTab('all')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">전체</p>
                <p className="text-2xl font-bold">{totalElements}</p>
              </div>
              <FileCheck className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setTab('pending')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">진행중</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {approvals.filter((a) => a.status === 'PENDING').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setTab('completed')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">완료</p>
                <p className="text-2xl font-bold text-green-600">
                  {approvals.filter((a) => a.status === 'APPROVED').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50" onClick={() => setTab('draft')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">임시저장</p>
                <p className="text-2xl font-bold text-gray-600">
                  {approvals.filter((a) => a.status === 'DRAFT').length}
                </p>
              </div>
              <FileEdit className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="제목, 문서번호로 검색..."
                value={keyword}
                onChange={(e) => {
                  setKeyword(e.target.value);
                  setPage(0);
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value as ApprovalType | 'all');
                setPage(0);
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="유형" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 유형</SelectItem>
                <SelectItem value="LEAVE_REQUEST">휴가신청</SelectItem>
                <SelectItem value="EXPENSE">경비청구</SelectItem>
                <SelectItem value="OVERTIME">초과근무</SelectItem>
                <SelectItem value="PERSONNEL">인사발령</SelectItem>
                <SelectItem value="GENERAL">일반</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setPage(0); }}>
        <TabsList className="mb-4">
          <TabsTrigger value="all">전체</TabsTrigger>
          <TabsTrigger value="pending">진행중</TabsTrigger>
          <TabsTrigger value="completed">완료</TabsTrigger>
          <TabsTrigger value="draft">임시저장</TabsTrigger>
        </TabsList>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : approvals.length === 0 ? (
              <EmptyState
                icon={FileCheck}
                title="결재 문서가 없습니다"
                description="새 결재를 작성하려면 상단의 버튼을 클릭하세요."
                action={{
                  label: '결재 작성',
                  onClick: () => navigate('/approvals/new'),
                }}
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          문서번호
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          유형
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          제목
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          상태
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          현재결재자
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          신청일
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvals.map((approval) => {
                        const statusConfig = STATUS_CONFIG[approval.status];
                        return (
                          <tr
                            key={approval.id}
                            onClick={() => handleRowClick(approval.id)}
                            className="border-b cursor-pointer transition-colors hover:bg-muted/50"
                          >
                            <td className="px-4 py-3 font-mono text-sm">
                              {approval.documentNumber}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {TYPE_LABELS[approval.documentType]}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium">{approval.title}</div>
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge
                                status={statusConfig.variant}
                                label={statusConfig.label}
                              />
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {approval.currentStepName || '-'}
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {format(new Date(approval.createdAt), 'yyyy.MM.dd')}
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
      </Tabs>
    </>
  );
}
