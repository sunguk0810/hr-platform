import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Search,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { approvalService } from '../services/approvalService';
import { useToast } from '@/hooks/useToast';
import type { ApprovalTemplate } from '@hr-platform/shared-types';

const CATEGORY_LABELS: Record<string, string> = {
  LEAVE_REQUEST: '휴가',
  EXPENSE: '경비',
  OVERTIME: '초과근무',
  PERSONNEL: '인사',
  GENERAL: '일반',
};

export default function ApprovalTemplatesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<ApprovalTemplate | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['approval-templates', categoryFilter, statusFilter],
    queryFn: () => approvalService.getTemplates({
      category: categoryFilter || undefined,
      isActive: statusFilter === '' ? undefined : statusFilter === 'active',
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => approvalService.deleteTemplate(id),
    onSuccess: () => {
      toast({ title: '삭제 완료', description: '양식이 삭제되었습니다.' });
      queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
      setDeleteTarget(null);
    },
    onError: () => {
      toast({ title: '삭제 실패', description: '양식 삭제 중 오류가 발생했습니다.', variant: 'destructive' });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      approvalService.updateTemplate(id, { isActive }),
    onSuccess: (_, variables) => {
      toast({
        title: variables.isActive ? '활성화 완료' : '비활성화 완료',
        description: `양식이 ${variables.isActive ? '활성화' : '비활성화'}되었습니다.`,
      });
      queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
    },
    onError: () => {
      toast({ title: '변경 실패', description: '상태 변경 중 오류가 발생했습니다.', variant: 'destructive' });
    },
  });

  const templates = data?.data ?? [];

  const filteredTemplates = templates.filter(template => {
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      return (
        template.name.toLowerCase().includes(keyword) ||
        template.code.toLowerCase().includes(keyword) ||
        (template.description?.toLowerCase().includes(keyword) ?? false)
      );
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const handleDuplicate = (template: ApprovalTemplate) => {
    navigate(`/settings/approval-templates/new?duplicate=${template.id}`);
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['approval-templates'] });
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">결재 양식</h1>
              <p className="text-sm text-muted-foreground">양식 등록 및 관리</p>
            </div>
            <Button size="sm" onClick={() => navigate('/settings/approval-templates/new')}>
              <Plus className="mr-1 h-4 w-4" />
              등록
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="양식명, 코드로 검색..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              onClick={() => setCategoryFilter('')}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !categoryFilter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              전체
            </button>
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setCategoryFilter(value)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  categoryFilter === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                !statusFilter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'active'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              활성
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === 'inactive'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              비활성
            </button>
          </div>

          {/* Templates List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">등록된 양식이 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">새로운 결재 양식을 등록해주세요.</p>
              <Button className="mt-4" onClick={() => navigate('/settings/approval-templates/new')}>
                <Plus className="mr-2 h-4 w-4" />
                양식 등록
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="bg-card rounded-xl border p-4"
                  onClick={() => navigate(`/settings/approval-templates/${template.id}`)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-muted-foreground">{template.code}</span>
                        {template.isActive ? (
                          <Badge variant="default" className="bg-green-500 text-xs">활성</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">비활성</Badge>
                        )}
                      </div>
                      <p className="font-medium">{template.name}</p>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/settings/approval-templates/${template.id}`);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          수정
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(template);
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          복제
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleActiveMutation.mutate({
                              id: template.id,
                              isActive: !template.isActive,
                            });
                          }}
                        >
                          {template.isActive ? (
                            <>
                              <ToggleLeft className="mr-2 h-4 w-4" />
                              비활성화
                            </>
                          ) : (
                            <>
                              <ToggleRight className="mr-2 h-4 w-4" />
                              활성화
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(template);
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <Badge variant="outline" className="text-xs">
                      {CATEGORY_LABELS[template.category] || template.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      수정: {formatDate(template.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <ConfirmDialog
            open={!!deleteTarget}
            onOpenChange={(open) => !open && setDeleteTarget(null)}
            title="양식 삭제"
            description={`"${deleteTarget?.name}" 양식을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
            confirmLabel="삭제"
            variant="destructive"
            onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            isLoading={deleteMutation.isPending}
          />
        </div>
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="결재 양식 관리"
        description="결재 문서 양식을 등록하고 관리합니다."
        actions={
          <Button onClick={() => navigate('/settings/approval-templates/new')}>
            <Plus className="mr-2 h-4 w-4" />
            양식 등록
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="양식명, 코드로 검색..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={categoryFilter || 'all'} onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="문서유형" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="상태" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  <SelectItem value="active">활성</SelectItem>
                  <SelectItem value="inactive">비활성</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">로딩 중...</p>
          </CardContent>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={FileText}
              title="등록된 양식이 없습니다"
              description="새로운 결재 양식을 등록해주세요."
              action={{
                label: '양식 등록',
                onClick: () => navigate('/settings/approval-templates/new'),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      양식코드
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      양식명
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      문서유형
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      상태
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      수정일
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTemplates.map((template) => (
                    <tr
                      key={template.id}
                      className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                      onClick={() => navigate(`/settings/approval-templates/${template.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-mono">
                        {template.code}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                            {template.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline">
                          {CATEGORY_LABELS[template.category] || template.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {template.isActive ? (
                          <Badge variant="default" className="bg-green-500">활성</Badge>
                        ) : (
                          <Badge variant="secondary">비활성</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(template.updatedAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/settings/approval-templates/${template.id}`);
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplicate(template);
                              }}
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              복제
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleActiveMutation.mutate({
                                  id: template.id,
                                  isActive: !template.isActive,
                                });
                              }}
                            >
                              {template.isActive ? (
                                <>
                                  <ToggleLeft className="mr-2 h-4 w-4" />
                                  비활성화
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="mr-2 h-4 w-4" />
                                  활성화
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(template);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="양식 삭제"
        description={`"${deleteTarget?.name}" 양식을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`}
        confirmLabel="삭제"
        variant="destructive"
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
}
