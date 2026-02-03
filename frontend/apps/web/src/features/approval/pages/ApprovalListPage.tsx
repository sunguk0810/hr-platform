import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ApprovalStatusBadge } from '@/components/common/StatusBadge';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileCheck, Plus, Search, AlertCircle } from 'lucide-react';
import {
  useApprovalList,
  useApprovalSummary,
  useApprovalSearchParams,
} from '../hooks/useApprovals';
import type { ApprovalType } from '@hr-platform/shared-types';

const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = {
  LEAVE_REQUEST: '휴가신청',
  EXPENSE: '경비청구',
  OVERTIME: '초과근무',
  PERSONNEL: '인사관련',
  GENERAL: '일반기안',
};

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export default function ApprovalListPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const debouncedKeyword = useDebounce(searchInput, 300);

  const {
    params,
    searchState,
    setKeyword,
    setType,
    setTab,
    setPage,
  } = useApprovalSearchParams();

  useEffect(() => {
    setKeyword(debouncedKeyword);
  }, [debouncedKeyword, setKeyword]);

  const { data: summaryData } = useApprovalSummary();
  const { data, isLoading, isError } = useApprovalList(params);

  const summary = summaryData?.data ?? { pending: 0, approved: 0, rejected: 0, draft: 0 };
  const approvals = data?.data?.content ?? [];
  const totalPages = data?.data?.totalPages ?? 0;

  const handleRowClick = (id: string) => {
    navigate(`/approvals/${id}`);
  };

  const handleTabChange = (value: string) => {
    setTab(value as 'pending' | 'requested' | 'completed' | 'draft' | '');
  };

  return (
    <>
      <PageHeader
        title="전자결재"
        description="결재 문서를 조회하고 관리합니다."
        actions={
          <Button onClick={() => navigate('/approvals/new')}>
            <Plus className="mr-2 h-4 w-4" />
            새 문서 작성
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">결재 대기</p>
              <p className="mt-1 text-3xl font-bold text-orange-500">{summary.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">임시저장</p>
              <p className="mt-1 text-3xl font-bold text-blue-500">{summary.draft}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">승인</p>
              <p className="mt-1 text-3xl font-bold text-green-500">{summary.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">반려</p>
              <p className="mt-1 text-3xl font-bold text-red-500">{summary.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>결재 문서</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="문서번호, 제목, 기안자..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9 w-[200px]"
                />
              </div>
              <select
                value={searchState.type}
                onChange={(e) => setType(e.target.value as ApprovalType | '')}
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">전체 유형</option>
                {Object.entries(APPROVAL_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={searchState.tab || 'pending'}
            onValueChange={handleTabChange}
            className="px-4 pt-2"
          >
            <TabsList>
              <TabsTrigger value="pending">
                결재 대기 {summary.pending > 0 && `(${summary.pending})`}
              </TabsTrigger>
              <TabsTrigger value="requested">내가 요청한</TabsTrigger>
              <TabsTrigger value="completed">완료</TabsTrigger>
              <TabsTrigger value="draft">
                임시저장 {summary.draft > 0 && `(${summary.draft})`}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {isLoading ? (
              <div className="p-4">
                <SkeletonTable rows={5} />
              </div>
            ) : isError ? (
              <EmptyState
                icon={FileCheck}
                title="데이터를 불러올 수 없습니다"
                description="잠시 후 다시 시도해주세요."
              />
            ) : approvals.length === 0 ? (
              <EmptyState
                icon={FileCheck}
                title={
                  searchState.tab === 'pending' ? '결재 대기 문서가 없습니다' :
                  searchState.tab === 'requested' ? '요청한 문서가 없습니다' :
                  searchState.tab === 'completed' ? '완료된 문서가 없습니다' :
                  searchState.tab === 'draft' ? '임시저장 문서가 없습니다' :
                  '결재 문서가 없습니다'
                }
                description={
                  searchState.tab === 'requested'
                    ? '새 문서를 작성하여 결재를 요청하세요.'
                    : '결재할 문서가 있으면 여기에 표시됩니다.'
                }
                action={
                  searchState.tab === 'requested'
                    ? {
                        label: '새 문서 작성',
                        onClick: () => navigate('/approvals/new'),
                      }
                    : undefined
                }
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
                          기안자
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          현재 결재자
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          상태
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          기안일
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {approvals.map((approval) => (
                        <tr
                          key={approval.id}
                          onClick={() => handleRowClick(approval.id)}
                          className="border-b cursor-pointer transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-3 font-mono text-sm">
                            {approval.documentNumber}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              {APPROVAL_TYPE_LABELS[approval.type]}
                              {approval.urgency === 'HIGH' && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium max-w-[300px] truncate">
                            {approval.title}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <div>{approval.requesterName}</div>
                              <div className="text-xs text-muted-foreground">
                                {approval.requesterDepartment}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {approval.currentStepName || '-'}
                          </td>
                          <td className="px-4 py-3">
                            <ApprovalStatusBadge status={approval.status} />
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {format(new Date(approval.createdAt), 'M/d', { locale: ko })}
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
          </div>
        </CardContent>
      </Card>
    </>
  );
}
