import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import {
  useMyIssues,
  useCertificateTypes,
  useCertificateIssueSearchParams,
  useDownloadCertificate,
} from '../hooks/useCertificates';
import { useToast } from '@/hooks/useToast';
import type { CertificateIssue } from '@hr-platform/shared-types';

export default function CertificateIssueHistoryPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { params, searchState, setTypeCode, setIncludeExpired, setPage } =
    useCertificateIssueSearchParams();
  const { data: typesData } = useCertificateTypes();
  const { data: issuesData, isLoading } = useMyIssues(params);
  const downloadMutation = useDownloadCertificate();

  const certificateTypes = typesData?.data ?? [];
  const issues = issuesData?.data?.content ?? [];
  const totalPages = issuesData?.data?.page?.totalPages ?? 0;

  const handleDownload = async (issue: CertificateIssue) => {
    if (issue.isRevoked) {
      toast({
        title: '다운로드 불가',
        description: '폐기된 증명서는 다운로드할 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    const isExpired = new Date(issue.expiresAt) < new Date();
    if (isExpired) {
      toast({
        title: '다운로드 불가',
        description: '만료된 증명서는 다운로드할 수 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const blob = await downloadMutation.mutateAsync(issue.issueNumber);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = issue.fileName || `certificate-${issue.issueNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast({
        title: '다운로드 완료',
        description: '증명서가 다운로드되었습니다.',
      });
    } catch (error) {
      toast({
        title: '다운로드 실패',
        description: '증명서 다운로드 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd', { locale: ko });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'yyyy-MM-dd HH:mm', { locale: ko });
  };

  const getStatusInfo = (issue: CertificateIssue) => {
    if (issue.isRevoked) {
      return {
        icon: XCircle,
        label: '폐기됨',
        className: 'text-red-600 dark:text-red-400',
        bgClassName: 'bg-red-100 dark:bg-red-900/30',
      };
    }
    const isExpired = new Date(issue.expiresAt) < new Date();
    if (isExpired) {
      return {
        icon: AlertTriangle,
        label: '만료',
        className: 'text-yellow-600 dark:text-yellow-400',
        bgClassName: 'bg-yellow-100 dark:bg-yellow-900/30',
      };
    }
    return {
      icon: CheckCircle,
      label: '유효',
      className: 'text-green-600 dark:text-green-400',
      bgClassName: 'bg-green-100 dark:bg-green-900/30',
    };
  };

  return (
    <>
      <PageHeader
        title="발급 이력"
        description="발급된 증명서를 확인하고 다운로드합니다."
        actions={
          <Button variant="outline" onClick={() => navigate('/certificates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            목록으로
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle>발급 이력</CardTitle>
          <div className="flex items-center gap-4">
            <select
              value={searchState.typeCode}
              onChange={(e) => setTypeCode(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">전체 유형</option>
              {certificateTypes.map((type) => (
                <option key={type.code} value={type.code}>
                  {type.name}
                </option>
              ))}
            </select>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="includeExpired"
                checked={searchState.includeExpired}
                onCheckedChange={(checked) => setIncludeExpired(checked as boolean)}
              />
              <Label htmlFor="includeExpired" className="text-sm font-normal">
                만료 포함
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4">
              <SkeletonTable rows={5} />
            </div>
          ) : issues.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="발급 이력이 없습니다"
              description="증명서를 신청하면 발급 후 이력이 여기에 표시됩니다."
              action={{
                label: '증명서 신청',
                onClick: () => navigate('/certificates'),
              }}
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        상태
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        발급번호
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        증명서 유형
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        발급일
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        유효기간
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        인증코드
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        다운로드
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue) => {
                      const statusInfo = getStatusInfo(issue);
                      const StatusIcon = statusInfo.icon;
                      const canDownload = !issue.isRevoked && new Date(issue.expiresAt) >= new Date();

                      return (
                        <tr
                          key={issue.id}
                          className="border-b transition-colors hover:bg-muted/50"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`p-1 rounded ${statusInfo.bgClassName}`}>
                                <StatusIcon className={`h-4 w-4 ${statusInfo.className}`} />
                              </div>
                              <span className={`text-sm ${statusInfo.className}`}>
                                {statusInfo.label}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-mono">
                            {issue.issueNumber}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {issue.certificateTypeName}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDateTime(issue.issuedAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {formatDate(issue.expiresAt)}
                          </td>
                          <td className="px-4 py-3 text-sm font-mono">
                            {issue.verificationCode}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {issue.downloadCount}회
                          </td>
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(issue)}
                              disabled={!canDownload || downloadMutation.isPending}
                            >
                              <Download className="h-4 w-4 mr-1" />
                              다운로드
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
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
