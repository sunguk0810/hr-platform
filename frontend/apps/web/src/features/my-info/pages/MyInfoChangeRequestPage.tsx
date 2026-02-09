import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/useToast';
import { useIsMobile } from '@/hooks/useMediaQuery';
import {
  ArrowLeft,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  MessageSquare,
  CalendarDays,
  User,
  Tag,
} from 'lucide-react';
import {
  changeRequestService,
  STATUS_CONFIG,
  type MyInfoChangeRequest,
  type ChangeRequestStatus,
} from '../services/changeRequestService';

function getStatusIcon(status: ChangeRequestStatus) {
  switch (status) {
    case 'PENDING':
      return <Clock className="h-4 w-4" />;
    case 'APPROVED':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'REJECTED':
      return <XCircle className="h-4 w-4" />;
  }
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function MyInfoChangeRequestPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { t } = useTranslation('settings');

  const [requests, setRequests] = useState<MyInfoChangeRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const STATUS_FILTERS = [
    { value: 'ALL', label: t('myInfo.changeRequests.statusFilter.ALL') },
    { value: 'PENDING', label: t('myInfo.changeRequests.statusFilter.PENDING') },
    { value: 'APPROVED', label: t('myInfo.changeRequests.statusFilter.APPROVED') },
    { value: 'REJECTED', label: t('myInfo.changeRequests.statusFilter.REJECTED') },
  ];

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const response = await changeRequestService.getChangeRequests(statusFilter);
      if (response.success && response.data) {
        setRequests(response.data);
      }
    } catch {
      toast({
        title: t('myInfo.changeRequests.loadFailed'),
        description: t('myInfo.changeRequests.loadFailedDesc'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length;

  if (isMobile) {
    return (
      <div className="space-y-4 pb-20">
        {/* Mobile Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/my-info')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">{t('myInfo.changeRequests.title')}</h1>
            <p className="text-xs text-muted-foreground">
              {t('myInfo.changeRequests.description')}
            </p>
          </div>
        </div>

        {/* Mobile Summary */}
        <div className="grid grid-cols-3 gap-2">
          <SummaryCard label={t('myInfo.changeRequests.pending')} count={pendingCount} variant="pending" />
          <SummaryCard label={t('myInfo.changeRequests.approved')} count={approvedCount} variant="approved" />
          <SummaryCard label={t('myInfo.changeRequests.rejected')} count={rejectedCount} variant="rejected" />
        </div>

        {/* Mobile Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((filter) => (
            <Button
              key={filter.value}
              variant={statusFilter === filter.value ? 'default' : 'outline'}
              size="sm"
              className="flex-shrink-0"
              onClick={() => setStatusFilter(filter.value)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Mobile Request List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-3 text-sm text-muted-foreground">
              {t('myInfo.changeRequests.empty')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <MobileRequestCard key={req.id} request={req} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title={t('myInfo.changeRequests.title')}
        description={t('myInfo.changeRequests.description')}
        actions={
          <Button variant="outline" onClick={() => navigate('/my-info')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('myInfo.changeRequests.backToMyInfo')}
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <SummaryCard label={t('myInfo.changeRequests.pending')} count={pendingCount} variant="pending" />
        <SummaryCard label={t('myInfo.changeRequests.approved')} count={approvedCount} variant="approved" />
        <SummaryCard label={t('myInfo.changeRequests.rejected')} count={rejectedCount} variant="rejected" />
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex gap-2">
        {STATUS_FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={statusFilter === filter.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(filter.value)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Request List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <p className="mt-3 text-muted-foreground">
              {t('myInfo.changeRequests.empty')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <DesktopRequestCard key={req.id} request={req} />
          ))}
        </div>
      )}
    </>
  );
}

// ========= Sub Components =========

interface SummaryCardProps {
  label: string;
  count: number;
  variant: 'pending' | 'approved' | 'rejected';
}

function SummaryCard({ label, count, variant }: SummaryCardProps) {
  const variantStyles = {
    pending: 'border-yellow-200 bg-yellow-50',
    approved: 'border-green-200 bg-green-50',
    rejected: 'border-red-200 bg-red-50',
  };

  const countStyles = {
    pending: 'text-yellow-700',
    approved: 'text-green-700',
    rejected: 'text-red-700',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardContent className="p-4 text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${countStyles[variant]}`}>{count}</p>
      </CardContent>
    </Card>
  );
}

interface RequestCardProps {
  request: MyInfoChangeRequest;
}

function DesktopRequestCard({ request }: RequestCardProps) {
  const { t } = useTranslation('settings');
  const statusConfig = STATUS_CONFIG[request.status];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">{request.fieldName}</CardTitle>
            <Badge variant="outline" className="text-xs">
              {request.categoryLabel}
            </Badge>
          </div>
          <Badge className={statusConfig.className}>
            <span className="mr-1">{getStatusIcon(request.status)}</span>
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Value Changes */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-md border bg-muted/50 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {t('myInfo.changeRequests.beforeValue')}
            </p>
            <p className="text-sm">{request.oldValue}</p>
          </div>
          <div className="rounded-md border bg-primary/5 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {t('myInfo.changeRequests.afterValue')}
            </p>
            <p className="text-sm font-medium">{request.newValue}</p>
          </div>
        </div>

        {/* Reason */}
        <div className="flex items-start gap-2 text-sm">
          <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div>
            <span className="font-medium text-muted-foreground">{t('myInfo.changeRequests.reason')}: </span>
            <span>{request.reason}</span>
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>{t('myInfo.changeRequests.requestDate')}: {formatDateTime(request.requestDate)}</span>
          </div>
          {request.reviewDate && (
            <div className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>{t('myInfo.changeRequests.processDate')}: {formatDateTime(request.reviewDate)}</span>
            </div>
          )}
          {request.reviewerName && (
            <div className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              <span>{t('myInfo.changeRequests.reviewer')}: {request.reviewerName}</span>
            </div>
          )}
        </div>

        {/* Reviewer Comment */}
        {request.reviewerComment && (
          <div className="rounded-md border-l-4 border-l-muted-foreground/30 bg-muted/30 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              {t('myInfo.changeRequests.reviewerComment')}
            </p>
            <p className="text-sm">{request.reviewerComment}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MobileRequestCard({ request }: RequestCardProps) {
  const { t } = useTranslation('settings');
  const statusConfig = STATUS_CONFIG[request.status];

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{request.fieldName}</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {request.categoryLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDateTime(request.requestDate)}
          </p>
        </div>
        <Badge className={`text-[10px] ${statusConfig.className}`}>
          <span className="mr-0.5">{getStatusIcon(request.status)}</span>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Values */}
      <div className="space-y-2">
        <div className="rounded-md bg-muted/50 p-2">
          <p className="text-[10px] text-muted-foreground">{t('myInfo.changeRequests.beforeValue')}</p>
          <p className="text-xs">{request.oldValue}</p>
        </div>
        <div className="rounded-md bg-primary/5 p-2">
          <p className="text-[10px] text-muted-foreground">{t('myInfo.changeRequests.afterValue')}</p>
          <p className="text-xs font-medium">{request.newValue}</p>
        </div>
      </div>

      {/* Reason */}
      <div className="flex items-start gap-1.5 text-xs">
        <Tag className="mt-0.5 h-3 w-3 flex-shrink-0 text-muted-foreground" />
        <span className="text-muted-foreground">{request.reason}</span>
      </div>

      {/* Reviewer Comment */}
      {request.reviewerComment && (
        <div className="rounded-md border-l-2 border-l-muted-foreground/30 bg-muted/30 p-2">
          <p className="text-[10px] text-muted-foreground mb-0.5">
            {t('myInfo.changeRequests.reviewerCommentWithName', { name: request.reviewerName })}
          </p>
          <p className="text-xs">{request.reviewerComment}</p>
        </div>
      )}
    </div>
  );
}
