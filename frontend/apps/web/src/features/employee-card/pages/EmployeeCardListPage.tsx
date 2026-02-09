import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmployeeCards } from '../hooks/useEmployeeCard';
import type { EmployeeCardStatus } from '@hr-platform/shared-types';
import { EMPLOYEE_CARD_STATUS_LABELS } from '@hr-platform/shared-types';

const STATUS_COLORS: Record<EmployeeCardStatus, string> = {
  ACTIVE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  EXPIRED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  LOST: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  REVOKED: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  PENDING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function EmployeeCardListPage() {
  const { t } = useTranslation('employeeCard');
  const navigate = useNavigate();
  const [status, setStatus] = useState<EmployeeCardStatus | ''>('');
  const [page, setPage] = useState(0);

  const { data, isLoading } = useEmployeeCards({
    status: status || undefined,
    page,
    size: 10,
  });

  const cards = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;

  return (
    <>
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          <Button onClick={() => navigate('/employee-card/issue')}>
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('issueRequest.create')}
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
            {t('list')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs
            value={status || 'all'}
            onValueChange={(v) => { setStatus(v === 'all' ? '' : v as EmployeeCardStatus); setPage(0); }}
            className="px-4 pt-2"
          >
            <TabsList>
              <TabsTrigger value="all">{t('tabs.all')}</TabsTrigger>
              <TabsTrigger value="ACTIVE">{t('tabs.active')}</TabsTrigger>
              <TabsTrigger value="PENDING">{t('tabs.pendingIssue')}</TabsTrigger>
              <TabsTrigger value="EXPIRED">{t('tabs.expired')}</TabsTrigger>
              <TabsTrigger value="LOST">{t('tabs.lost')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-4">
            {isLoading ? (
              <div className="p-4"><SkeletonTable rows={5} /></div>
            ) : cards.length === 0 ? (
              <EmptyState
                icon={CreditCard}
                title={t('empty.title')}
                description={t('empty.description')}
                action={{ label: t('issueRequest.create'), onClick: () => navigate('/employee-card/issue') }}
              />
            ) : (
              <>
                <div className="overflow-x-auto" role="region" aria-label={t('list')}>
                  <table className="w-full" role="grid" aria-label={t('list')}>
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('table.cardNumber')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('table.employee')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('table.department')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('table.issueDate')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('table.expiryDate')}</th>
                        <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">{t('table.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cards.map((card) => (
                        <tr
                          key={card.id}
                          className="border-b cursor-pointer transition-colors hover:bg-muted/50"
                          onClick={() => navigate(`/employee-card/${card.id}`)}
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/employee-card/${card.id}`)}
                        >
                          <td className="px-4 py-3 font-mono text-sm">{card.cardNumber}</td>
                          <td className="px-4 py-3 text-sm">
                            <div>
                              <p className="font-medium">{card.employeeName}</p>
                              <p className="text-xs text-muted-foreground">{card.employeeNumber}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{card.departmentName}</td>
                          <td className="px-4 py-3 text-sm">{card.issueDate}</td>
                          <td className="px-4 py-3 text-sm">{card.expiryDate}</td>
                          <td className="px-4 py-3">
                            <Badge className={cn(STATUS_COLORS[card.status])} role="status">
                              {EMPLOYEE_CARD_STATUS_LABELS[card.status]}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
