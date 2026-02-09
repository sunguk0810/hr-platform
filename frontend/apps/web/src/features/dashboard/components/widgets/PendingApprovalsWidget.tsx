import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { FileCheck, ChevronRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { WidgetContainer } from './WidgetContainer';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface ApprovalItem {
  id: string;
  type: string;
  title: string;
  requester: string;
  requestDate: string;
  urgency: 'LOW' | 'NORMAL' | 'HIGH';
}

interface PendingApprovalsData {
  total: number;
  items: ApprovalItem[];
}

export function PendingApprovalsWidget() {
  const { t } = useTranslation('dashboard');

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.dashboard.pendingApprovals(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: PendingApprovalsData }>('/dashboard/pending-approvals');
      return response.data.data;
    },
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('approvals.dateFormat.today');
    if (diffDays === 1) return t('approvals.dateFormat.yesterday');
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const getTypeLabel = (type: string) => {
    const key = `approvals.types.${type}`;
    const translated = t(key);
    return translated === key ? type : translated;
  };

  const getUrgencyColor = (urgency: ApprovalItem['urgency']) => {
    switch (urgency) {
      case 'HIGH':
        return 'text-destructive';
      case 'NORMAL':
        return 'text-orange-500';
      case 'LOW':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <WidgetContainer
      data-tour="pending-approvals-widget"
      title={t('approvals.title')}
      description={t('approvals.description', { count: data?.total || 0 })}
      isLoading={isLoading}
      action={
        <Button variant="ghost" size="sm" asChild>
          <Link to="/approvals">
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      }
    >
      <div className="space-y-3">
        {data?.items && data.items.length > 0 ? (
          data.items.slice(0, 3).map((item) => (
            <Link
              key={item.id}
              to={`/approvals/${item.id}`}
              className="block rounded-lg p-3 transition-colors hover:bg-muted"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                      {getTypeLabel(item.type)}
                    </span>
                    {item.urgency === 'HIGH' && (
                      <AlertCircle className={cn('h-4 w-4', getUrgencyColor(item.urgency))} />
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.requester} &middot; {formatDate(item.requestDate)}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <FileCheck className="h-10 w-10 text-muted-foreground/50" />
            <p className="mt-2 text-sm text-muted-foreground">
              {t('approvals.noItems')}
            </p>
          </div>
        )}

        {data?.total && data.total > 3 && (
          <Button variant="outline" className="w-full" asChild>
            <Link to="/approvals">
              {t('approvals.viewAll', { count: data.total })}
            </Link>
          </Button>
        )}
      </div>
    </WidgetContainer>
  );
}
