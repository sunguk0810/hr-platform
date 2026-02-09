import { useState } from 'react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Heart,
  CheckCircle,
  Loader2,
  DollarSign,
  History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';
import {
  usePaymentPendingList,
  usePaymentHistory,
  useProcessPayment,
  useBulkProcessPayment,
} from '../hooks/useCondolence';
import { ProcessPaymentRequest } from '../services/condolenceService';
import { CONDOLENCE_TYPE_LABELS } from '@hr-platform/shared-types';

export default function CondolencePaymentPage() {
  const { t } = useTranslation('condolence');
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const [historyPage, setHistoryPage] = useState(0);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH'>('BANK_TRANSFER');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const { data: pendingData, isLoading: isPendingLoading } = usePaymentPendingList({
    page,
    size: 10,
  });

  const { data: historyData, isLoading: isHistoryLoading } = usePaymentHistory({
    page: historyPage,
    size: 10,
  });

  const processPaymentMutation = useProcessPayment();
  const bulkProcessPaymentMutation = useBulkProcessPayment();

  const pendingList = pendingData?.data?.content ?? [];
  const pendingTotalPages = pendingData?.data?.page?.totalPages ?? 0;
  const historyList = historyData?.data?.content ?? [];
  const historyTotalPages = historyData?.data?.page?.totalPages ?? 0;

  const totalPendingAmount = pendingList
    .filter((item) => selectedIds.has(item.id))
    .reduce((sum, item) => sum + item.amount, 0);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(pendingList.map((item) => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const isAllSelected = pendingList.length > 0 && pendingList.every((item) => selectedIds.has(item.id));

  const handleOpenPaymentDialog = () => {
    if (selectedIds.size === 0) {
      toast({
        title: t('paymentToast.selectRequired'),
        description: t('paymentToast.selectRequiredDesc'),
        variant: 'destructive',
      });
      return;
    }
    setPaymentDialogOpen(true);
  };

  const handleProcessPayment = async () => {
    const paymentData: ProcessPaymentRequest = {
      paymentMethod,
      ...(paymentMethod === 'BANK_TRANSFER' && { bankName, accountNumber }),
    };

    try {
      if (selectedIds.size === 1) {
        const id = Array.from(selectedIds)[0];
        await processPaymentMutation.mutateAsync({ id, data: paymentData });
      } else {
        await bulkProcessPaymentMutation.mutateAsync({
          ids: Array.from(selectedIds),
          data: paymentData,
        });
      }

      setPaymentDialogOpen(false);
      setSelectedIds(new Set());
      setBankName('');
      setAccountNumber('');
      toast({
        title: t('paymentToast.success'),
        description: t('paymentToast.successDesc', { count: selectedIds.size }),
      });
    } catch {
      toast({
        title: t('paymentToast.failed'),
        description: t('paymentToast.failedDesc'),
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <PageHeader
        title={t('paymentPage.title')}
        description={t('paymentPage.description')}
      />

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            {t('paymentPage.pendingTab')}
            {pendingList.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingList.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            {t('paymentPage.completedTab')}
          </TabsTrigger>
        </TabsList>

        {/* Pending Payment Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" aria-hidden="true" />
                  {t('paymentPage.pendingTitle')}
                </CardTitle>
                {selectedIds.size > 0 && (
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {selectedIds.size}{t('paymentPage.selectedSummary')}{' '}
                      <span className="font-bold text-primary">
                        {totalPendingAmount.toLocaleString()}원
                      </span>
                    </span>
                    <Button onClick={handleOpenPaymentDialog}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      {t('paymentPage.batchPay')}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {isPendingLoading ? (
                <SkeletonTable rows={5} />
              ) : pendingList.length === 0 ? (
                <EmptyState
                  icon={Heart}
                  title={t('paymentPage.emptyPending')}
                  description={t('paymentPage.emptyPendingDesc')}
                />
              ) : (
                <>
                  <div className="overflow-x-auto" role="region" aria-label={t('paymentPage.pendingRegion')}>
                    <table className="w-full" role="grid">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left">
                            <Checkbox
                              checked={isAllSelected}
                              onCheckedChange={handleSelectAll}
                              aria-label="전체 선택"
                            />
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            {t('requestNumber')}
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            {t('paymentPage.table.employee')}
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            {t('paymentPage.table.department')}
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            {t('paymentPage.table.type')}
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            {t('eventDate')}
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                            {t('paymentPage.table.amount')}
                          </th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-muted-foreground">
                            {t('paymentPage.table.action')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingList.map((item) => (
                          <tr
                            key={item.id}
                            className={cn(
                              'border-b transition-colors',
                              selectedIds.has(item.id) && 'bg-muted/50'
                            )}
                          >
                            <td className="px-4 py-3">
                              <Checkbox
                                checked={selectedIds.has(item.id)}
                                onCheckedChange={(checked) =>
                                  handleSelectOne(item.id, checked as boolean)
                                }
                                aria-label={t('paymentPage.selectEmployee', { name: item.employeeName })}
                              />
                            </td>
                            <td className="px-4 py-3 font-mono text-sm">{item.requestNumber}</td>
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <p className="font-medium">{item.employeeName}</p>
                                <p className="text-xs text-muted-foreground">{item.employeeNumber}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">{item.departmentName}</td>
                            <td className="px-4 py-3 text-sm">{CONDOLENCE_TYPE_LABELS[item.eventType]}</td>
                            <td className="px-4 py-3 text-sm">
                              {format(new Date(item.eventDate), 'yyyy-MM-dd')}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {item.amount.toLocaleString()}원
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedIds(new Set([item.id]));
                                  setPaymentDialogOpen(true);
                                }}
                              >
                                {t('paymentPage.payButton')}
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={page} totalPages={pendingTotalPages} onPageChange={setPage} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" aria-hidden="true" />
                {t('paymentPage.completedTitle')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isHistoryLoading ? (
                <SkeletonTable rows={5} />
              ) : historyList.length === 0 ? (
                <EmptyState
                  icon={History}
                  title={t('paymentPage.emptyCompleted')}
                  description={t('paymentPage.emptyCompletedDesc')}
                />
              ) : (
                <>
                  <div className="overflow-x-auto" role="region" aria-label={t('paymentPage.completedRegion')}>
                    <table className="w-full" role="grid">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            {t('paymentPage.table.paymentDate')}
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            {t('requestNumber')}
                          </th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                            {t('paymentPage.table.amount')}
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            {t('paymentPage.table.paymentMethod')}
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                            {t('paymentPage.table.processor')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyList.map((payment) => (
                          <tr key={payment.id} className="border-b">
                            <td className="px-4 py-3 text-sm">
                              {format(new Date(payment.paymentDate), 'yyyy-MM-dd HH:mm', {
                                locale: ko,
                              })}
                            </td>
                            <td className="px-4 py-3 font-mono text-sm">
                              {payment.condolenceRequestId}
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-medium">
                              {payment.amount.toLocaleString()}원
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {payment.paymentMethod === 'BANK_TRANSFER'
                                ? t('paymentPage.bankTransfer', { bank: payment.bankName })
                                : t('paymentPage.cash')}
                            </td>
                            <td className="px-4 py-3 text-sm">{payment.processedByName}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination
                    page={historyPage}
                    totalPages={historyTotalPages}
                    onPageChange={setHistoryPage}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('paymentDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('paymentDialog.description', { count: selectedIds.size })}{' '}
              <span className="font-bold">{totalPendingAmount.toLocaleString()}원</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payment-method">{t('paymentDialog.methodLabel')}</Label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value as 'BANK_TRANSFER' | 'CASH')}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK_TRANSFER">{t('paymentDialog.bankTransfer')}</SelectItem>
                  <SelectItem value="CASH">{t('paymentDialog.cash')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === 'BANK_TRANSFER' && (
              <>
                <div>
                  <Label htmlFor="bank-name">{t('paymentDialog.bankName')}</Label>
                  <Input
                    id="bank-name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder={t('paymentDialog.bankNamePlaceholder')}
                  />
                </div>
                <div>
                  <Label htmlFor="account-number">{t('paymentDialog.accountNumber')}</Label>
                  <Input
                    id="account-number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={t('paymentDialog.accountNumberPlaceholder')}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              {t('paymentDialog.cancel')}
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={
                processPaymentMutation.isPending ||
                bulkProcessPaymentMutation.isPending ||
                (paymentMethod === 'BANK_TRANSFER' && (!bankName || !accountNumber))
              }
            >
              {(processPaymentMutation.isPending || bulkProcessPaymentMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t('paymentDialog.processing')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
