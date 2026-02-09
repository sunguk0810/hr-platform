import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TFunction } from 'i18next';
import { format, parseISO, isBefore } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { DateRangePicker, type DateRange } from '@/components/common/DateRangePicker';
import { Plus, Trash2, Users, Loader2 } from 'lucide-react';

export interface DelegationRule {
  id: string;
  delegateId: string;
  delegateName: string;
  delegateDepartment: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

export interface DelegationSettingsProps {
  delegations: DelegationRule[];
  onAdd: (data: CreateDelegationData) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onToggle: (id: string, isActive: boolean) => Promise<void>;
  onSearchEmployees?: (keyword: string) => Promise<{ id: string; name: string; department: string }[]>;
  isLoading?: boolean;
}

export interface CreateDelegationData {
  delegateId: string;
  startDate: string;
  endDate: string;
}

const createDelegationSchema = (t: TFunction) => z.object({
  delegateId: z.string().min(1, t('delegationSettings.delegateValidation')),
  startDate: z.string().min(1, t('delegationSettings.startDateValidation')),
  endDate: z.string().min(1, t('delegationSettings.endDateValidation')),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return !isBefore(parseISO(data.endDate), parseISO(data.startDate));
  }
  return true;
}, {
  message: t('delegationSettings.endDateAfterStart'),
  path: ['endDate'],
});

type DelegationFormData = z.infer<ReturnType<typeof createDelegationSchema>>;

export function DelegationSettings({
  delegations,
  onAdd,
  onDelete,
  onToggle,
  onSearchEmployees,
  isLoading = false,
}: DelegationSettingsProps) {
  const { t } = useTranslation('approval');
  const delegationSchema = React.useMemo(() => createDelegationSchema(t), [t]);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [selectedDelegation, setSelectedDelegation] = React.useState<DelegationRule | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState<{ id: string; name: string; department: string }[]>([]);
  const [searchKeyword, setSearchKeyword] = React.useState('');
  const [selectedEmployee, setSelectedEmployee] = React.useState<{ id: string; name: string; department: string } | null>(null);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<DelegationFormData>({
    resolver: zodResolver(delegationSchema),
    defaultValues: {
      delegateId: '',
      startDate: '',
      endDate: '',
    },
  });

  const handleSearch = React.useCallback(async (keyword: string) => {
    setSearchKeyword(keyword);
    if (keyword.length < 2) {
      setSearchResults([]);
      return;
    }
    if (onSearchEmployees) {
      const results = await onSearchEmployees(keyword);
      setSearchResults(results);
    }
  }, [onSearchEmployees]);

  const handleSelectEmployee = (employee: { id: string; name: string; department: string }) => {
    setSelectedEmployee(employee);
    setValue('delegateId', employee.id);
    setSearchResults([]);
    setSearchKeyword('');
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setValue('startDate', format(range.from, 'yyyy-MM-dd'));
    }
    if (range?.to) {
      setValue('endDate', format(range.to, 'yyyy-MM-dd'));
    }
  };

  const handleFormSubmit = async (data: DelegationFormData) => {
    setIsSubmitting(true);
    try {
      await onAdd(data);
      setIsDialogOpen(false);
      reset();
      setSelectedEmployee(null);
    } catch (error) {
      console.error('Failed to add delegation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDelegation) return;
    setIsSubmitting(true);
    try {
      await onDelete(selectedDelegation.id);
      setIsDeleteDialogOpen(false);
      setSelectedDelegation(null);
    } catch (error) {
      console.error('Failed to delete delegation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (delegation: DelegationRule) => {
    await onToggle(delegation.id, !delegation.isActive);
  };

  const startDate = watch('startDate');
  const endDate = watch('endDate');

  // Track active delegations for possible future use
  const _activeDelegations = delegations.filter((d) => d.isActive);
  void _activeDelegations;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('delegationSettings.title')}</CardTitle>
              <CardDescription>
                {t('delegationSettings.description')}
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('delegationSettings.registerDelegate')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {delegations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">{t('delegationSettings.emptyDelegates')}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('delegationSettings.emptyDelegatesSubtext')}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('delegationSettings.tableDelegate')}</TableHead>
                  <TableHead>{t('delegationSettings.tablePeriod')}</TableHead>
                  <TableHead>{t('delegationSettings.tableStatus')}</TableHead>
                  <TableHead>{t('delegationSettings.tableEnabled')}</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {delegations.map((delegation) => {
                  const isExpired = isBefore(parseISO(delegation.endDate), new Date());
                  return (
                    <TableRow key={delegation.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{delegation.delegateName}</p>
                          <p className="text-sm text-muted-foreground">
                            {delegation.delegateDepartment}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {format(parseISO(delegation.startDate), 'yyyy.M.d', { locale: ko })}
                          {' ~ '}
                          {format(parseISO(delegation.endDate), 'yyyy.M.d', { locale: ko })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <StatusBadge status="default" label={t('delegationSettings.statusExpired')} />
                        ) : delegation.isActive ? (
                          <StatusBadge status="success" label={t('delegationSettings.statusActive')} />
                        ) : (
                          <StatusBadge status="warning" label={t('delegationSettings.statusInactive')} />
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={delegation.isActive}
                          onCheckedChange={() => handleToggle(delegation)}
                          disabled={isExpired || isLoading}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedDelegation(delegation);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('delegationSettings.addDialogTitle')}</DialogTitle>
            <DialogDescription>
              {t('delegationSettings.addDialogDescription')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="space-y-4 py-4">
              {/* Employee Search */}
              <div className="space-y-2">
                <Label>{t('delegationSettings.delegateLabel')}</Label>
                {selectedEmployee ? (
                  <div className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <p className="font-medium">{selectedEmployee.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedEmployee.department}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEmployee(null);
                        setValue('delegateId', '');
                      }}
                    >
                      {t('common.change')}
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder={t('delegationSettings.delegateSearchPlaceholder')}
                      value={searchKeyword}
                      onChange={(e) => handleSearch(e.target.value)}
                    />
                    {searchResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                        {searchResults.map((employee) => (
                          <button
                            key={employee.id}
                            type="button"
                            onClick={() => handleSelectEmployee(employee)}
                            className="w-full text-left px-3 py-2 hover:bg-muted"
                          >
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-sm text-muted-foreground">{employee.department}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {errors.delegateId && (
                  <p className="text-sm text-destructive">{errors.delegateId.message}</p>
                )}
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>{t('delegationSettings.delegationPeriodRequired')}</Label>
                <DateRangePicker
                  value={
                    startDate && endDate
                      ? { from: parseISO(startDate), to: parseISO(endDate) }
                      : undefined
                  }
                  onChange={handleDateRangeChange}
                  placeholder={t('delegationSettings.selectPeriod')}
                />
                {(errors.startDate || errors.endDate) && (
                  <p className="text-sm text-destructive">
                    {errors.startDate?.message || errors.endDate?.message}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('common.saving')}
                  </>
                ) : (
                  t('common.save')
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('delegationSettings.deleteDelegate')}</DialogTitle>
            <DialogDescription>
              {t('delegationSettings.deleteConfirm')}
              <br />
              <strong className="text-foreground">{selectedDelegation?.delegateName}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? t('delegationSettings.deleting') : t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
