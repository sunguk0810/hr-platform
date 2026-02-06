import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/common/Pagination';
import { useAuditLogs } from '../hooks/useAudit';
import { auditService } from '../services/auditService';
import { useToast } from '@/hooks/useToast';
import { downloadBlob, generateTimestampedFilename } from '@/lib/downloadUtils';
import {
  Search,
  Download,
  Eye,
  Filter,
  Clock,
  User,
  Globe,
  FileText,
  CheckCircle2,
  XCircle,
  ChevronDown,
  FileSpreadsheet,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { AuditLog, AuditAction, AuditResult } from '@hr-platform/shared-types';

const actionLabels: Record<AuditAction, string> = {
  LOGIN: '로그인',
  LOGOUT: '로그아웃',
  CREATE: '생성',
  UPDATE: '수정',
  DELETE: '삭제',
  READ: '조회',
  EXPORT: '내보내기',
  IMPORT: '가져오기',
  APPROVE: '승인',
  REJECT: '반려',
  PASSWORD_CHANGE: '비밀번호 변경',
  PERMISSION_CHANGE: '권한 변경',
};

const actionColors: Record<AuditAction, string> = {
  LOGIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  UPDATE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  READ: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  EXPORT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  IMPORT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  APPROVE: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  REJECT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  PASSWORD_CHANGE: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  PERMISSION_CHANGE: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
};

export default function AuditLogPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [page, setPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    keyword: '',
    action: 'ALL' as AuditAction | 'ALL',
    result: 'ALL' as AuditResult | 'ALL',
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const { data, isLoading } = useAuditLogs({
    page,
    size: 10,
    ...(filters.keyword && { keyword: filters.keyword }),
    ...(filters.action && filters.action !== 'ALL' && { action: filters.action }),
    ...(filters.result && filters.result !== 'ALL' && { result: filters.result }),
  });

  const handleSearch = () => {
    setPage(0);
  };

  const handleViewDetail = (log: AuditLog) => {
    setSelectedLog(log);
    setIsDetailOpen(true);
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    setIsExporting(true);
    try {
      const params = {
        ...(filters.keyword && { keyword: filters.keyword }),
        ...(filters.action && filters.action !== 'ALL' && { action: filters.action }),
        ...(filters.result && filters.result !== 'ALL' && { result: filters.result }),
        format,
      };

      const blob = await auditService.exportAuditLogs(params);
      const extension = format === 'excel' ? 'xlsx' : 'csv';
      const filename = generateTimestampedFilename('audit-logs', extension);
      downloadBlob(blob, filename);

      toast({
        title: '내보내기 완료',
        description: `감사 로그가 ${format.toUpperCase()} 파일로 저장되었습니다.`,
      });
    } catch {
      toast({
        title: '내보내기 실패',
        description: '감사 로그 내보내기 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
  };

  // Shared detail dialog render function
  const renderDetailDialog = () => (
    <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>감사 로그 상세</DialogTitle>
        </DialogHeader>
        {selectedLog && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">일시</Label>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-mono text-sm">
                    {format(new Date(selectedLog.createdAt), 'yyyy.MM.dd HH:mm:ss')}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">결과</Label>
                {selectedLog.result === 'SUCCESS' ? (
                  <div className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>성공</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-600">
                    <XCircle className="h-4 w-4" />
                    <span>실패</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">사용자</Label>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{selectedLog.userName}</span>
                <span className="text-muted-foreground">({selectedLog.userEmail})</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">IP 주소</Label>
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{selectedLog.ipAddress}</span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">액션</Label>
              <Badge className={actionColors[selectedLog.action]} variant="secondary">
                {actionLabels[selectedLog.action]}
              </Badge>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">대상</Label>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{selectedLog.targetName || '-'}</span>
                <span className="text-xs text-muted-foreground">({selectedLog.targetType})</span>
              </div>
            </div>

            {selectedLog.errorMessage && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">오류 메시지</Label>
                <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {selectedLog.errorMessage}
                </p>
              </div>
            )}

            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">상세 정보</Label>
                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          {/* Mobile Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">감사 로그</h1>
              <p className="text-sm text-muted-foreground">시스템 활동 내역</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={showFilters ? 'secondary' : 'outline'}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={isExporting}>
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    CSV로 내보내기
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('excel')}>
                    Excel로 내보내기
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-card rounded-xl border p-4 space-y-4">
              <div className="space-y-2">
                <Label>키워드</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="사용자, 대상, IP 검색"
                    value={filters.keyword}
                    onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>액션 유형</Label>
                  <Select
                    value={filters.action}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, action: value as AuditAction | 'ALL' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">전체</SelectItem>
                      {Object.entries(actionLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>결과</Label>
                  <Select
                    value={filters.result}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, result: value as AuditResult | 'ALL' }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">전체</SelectItem>
                      <SelectItem value="SUCCESS">성공</SelectItem>
                      <SelectItem value="FAILURE">실패</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleSearch} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                검색
              </Button>
            </div>
          )}

          {/* Action Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              onClick={() => setFilters((prev) => ({ ...prev, action: 'ALL' }))}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filters.action === 'ALL'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              전체
            </button>
            {Object.entries(actionLabels).slice(0, 6).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setFilters((prev) => ({ ...prev, action: value as AuditAction }))}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filters.action === value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Audit Log List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : data?.content.length === 0 ? (
            <div className="bg-card rounded-xl border p-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">감사 로그가 없습니다</p>
              <p className="text-sm text-muted-foreground mt-1">
                검색 조건에 맞는 로그가 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data?.content.map((log) => (
                <div
                  key={log.id}
                  className="bg-card rounded-xl border p-4"
                  onClick={() => handleViewDetail(log)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={actionColors[log.action]} variant="secondary">
                          {actionLabels[log.action]}
                        </Badge>
                        {log.result === 'SUCCESS' ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                      <p className="font-medium">{log.userName}</p>
                      <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-3.5 w-3.5" />
                      <span>{log.targetName || '-'}</span>
                      <span className="text-xs">({log.targetType})</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-mono">{log.ipAddress}</span>
                      <span>{format(new Date(log.createdAt), 'MM.dd HH:mm', { locale: ko })}</span>
                    </div>
                  </div>
                </div>
              ))}

              {data && data.page.totalPages > 1 && (
                <Pagination
                  page={page}
                  totalPages={data.page.totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          )}

          {renderDetailDialog()}
        </div>
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="감사 로그"
        description="시스템 활동 내역을 조회합니다."
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExporting}>
                {isExporting ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    내보내기 중...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    내보내기
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV로 내보내기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <Download className="h-4 w-4 mr-2" />
                Excel로 내보내기
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              검색 필터
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>키워드</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="사용자, 대상, IP 검색"
                    value={filters.keyword}
                    onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>액션 유형</Label>
                <Select
                  value={filters.action}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, action: value as AuditAction | 'ALL' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    {Object.entries(actionLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>결과</Label>
                <Select
                  value={filters.result}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, result: value as AuditResult | 'ALL' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">전체</SelectItem>
                    <SelectItem value="SUCCESS">성공</SelectItem>
                    <SelectItem value="FAILURE">실패</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={handleSearch} className="w-full">
                  <Search className="h-4 w-4 mr-2" />
                  검색
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">일시</TableHead>
                  <TableHead>사용자</TableHead>
                  <TableHead>IP 주소</TableHead>
                  <TableHead>액션</TableHead>
                  <TableHead>대상</TableHead>
                  <TableHead>결과</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data?.content.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      감사 로그가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.content.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {format(new Date(log.createdAt), 'yyyy.MM.dd HH:mm:ss', { locale: ko })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.userName}</p>
                          <p className="text-xs text-muted-foreground">{log.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                      <TableCell>
                        <Badge className={actionColors[log.action]} variant="secondary">
                          {actionLabels[log.action]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.targetName || '-'}</p>
                          <p className="text-xs text-muted-foreground">{log.targetType}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.result === 'SUCCESS' ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span className="text-sm">성공</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">실패</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        {data && data.page.totalPages > 1 && (
          <Pagination
            page={page}
            totalPages={data.page.totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      {renderDetailDialog()}
    </>
  );
}
