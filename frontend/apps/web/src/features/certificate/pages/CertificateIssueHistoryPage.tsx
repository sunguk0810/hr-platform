import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('certificate');
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
    if (issue.revoked) {
      toast({
        title: t('issueHistoryToast.voidedCannotDownload'),
        description: t('issueHistoryToast.voidedCannotDownloadDesc'),
        variant: 'destructive',
      });
      return;
    }

    const isExpired = new Date(issue.expiresAt) < new Date();
    if (isExpired) {
      toast({
        title: t('issueHistoryToast.expiredCannotDownload'),
        description: t('issueHistoryToast.expiredCannotDownloadDesc'),
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
        title: t('issueHistoryToast.downloadSuccess'),
        description: t('issueHistoryToast.downloadSuccessDesc'),
      });
    } catch (error) {
      toast({
        title: t('issueHistoryToast.downloadFailed'),
        description: t('issueHistoryToast.downloadFailedDesc'),
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
    if (issue.revoked) {
      return {
        icon: XCircle,
        label: t('issueHistory.statusVoided'),
        className: 'text-red-600 dark:text-red-400',
        bgClassName: 'bg-red-100 dark:bg-red-900/30',
      };
    }
    const isExpired = new Date(issue.expiresAt) < new Date();
    if (isExpired) {
      return {
        icon: AlertTriangle,
        label: t('issueHistory.statusExpired'),
        className: 'text-yellow-600 dark:text-yellow-400',
        bgClassName: 'bg-yellow-100 dark:bg-yellow-900/30',
      };
    }
    return {
      icon: CheckCircle,
      label: t('issueHistory.statusValid'),
      className: 'text-green-600 dark:text-green-400',
      bgClassName: 'bg-green-100 dark:bg-green-900/30',
    };
  };

  return (
    <>
      <PageHeader
        title={t('issueHistory.pageTitle')}
        description={t('issueHistory.pageDescription')}
        actions={
          <Button variant="outline" onClick={() => navigate('/certificates')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('goToList')}
          </Button>
        }
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle>{t('issueHistory.cardTitle')}</CardTitle>
          <div className="flex items-center gap-4">
            <select
              value={searchState.typeCode}
              onChange={(e) => setTypeCode(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            >
              <option value="">{t('issueHistory.allTypes')}</option>
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
                {t('issueHistory.includeExpired')}
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
              title={t('issueHistory.emptyTitle')}
              description={t('issueHistory.emptyDescription')}
              action={{
                label: t('issueHistory.requestCertificate'),
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
                        {t('issueHistory.table.status')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('issueHistory.table.issueNumber')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('issueHistory.table.certificateType')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('issueHistory.table.issueDate')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('issueHistory.table.validityPeriod')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('issueHistory.table.verificationCode')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('issueHistory.table.downloadCol')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                        {t('issueHistory.table.action')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((issue) => {
                      const statusInfo = getStatusInfo(issue);
                      const StatusIcon = statusInfo.icon;
                      const canDownload = !issue.revoked && new Date(issue.expiresAt) >= new Date();

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
                              {t('issueHistory.download')}
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
