import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
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
import { FileCheck, Plus, Search, Clock, CheckCircle, FileEdit } from 'lucide-react';
import { format } from 'date-fns';
import { useApprovalList } from '../hooks/useApprovals';
import type { ApprovalStatus, ApprovalType } from '@hr-platform/shared-types';

const STATUS_CONFIG: Record<ApprovalStatus, { label: string; variant: 'default' | 'warning' | 'success' | 'error' }> = {
  DRAFT: { label: '임시저장', variant: 'default' },
  PENDING: { label: '진행중', variant: 'warning' },
  APPROVED: { label: '승인', variant: 'success' },
  REJECTED: { label: '반려', variant: 'error' },
  CANCELLED: { label: '취소', variant: 'default' },
};

const TYPE_LABELS: Record<ApprovalType, string> = {
  LEAVE_REQUEST: '휴가신청',
  EXPENSE: '경비청구',
  OVERTIME: '초과근무',
  PERSONNEL: '인사발령',
  GENERAL: '일반',
};

export default function MyApprovalsPage() {
  const navigate = useNavigate();
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
  const totalPages = data?.data?.totalPages ?? 0;
  const totalElements = data?.data?.totalElements ?? 0;

  const handleRowClick = (id: string) => {
    navigate(`/approvals/${id}`);
  };

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
                              {TYPE_LABELS[approval.type]}
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
