import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRangePicker, type DateRange } from '@/components/common/DateRangePicker';
import { Search, Filter, RotateCcw, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { AuditAction, AuditResult } from '@hr-platform/shared-types';

export interface AuditFilterValues {
  keyword: string;
  action: AuditAction | '';
  result: AuditResult | '';
  targetType: string;
  startDate: string;
  endDate: string;
  userId: string;
}

export interface AuditFilterProps {
  filters: AuditFilterValues;
  onFiltersChange: (filters: AuditFilterValues) => void;
  onSearch?: () => void;
  targetTypes?: string[];
  className?: string;
}

export function AuditFilter({
  filters,
  onFiltersChange,
  onSearch,
  targetTypes = [],
  className,
}: AuditFilterProps) {
  const { t } = useTranslation('audit');
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

  const ACTION_OPTIONS: { value: AuditAction | ''; label: string }[] = React.useMemo(() => [
    { value: '', label: t('filter.all') },
    { value: 'LOGIN', label: t('actions.LOGIN') },
    { value: 'LOGOUT', label: t('actions.LOGOUT') },
    { value: 'CREATE', label: t('actions.CREATE') },
    { value: 'UPDATE', label: t('actions.UPDATE') },
    { value: 'DELETE', label: t('actions.DELETE') },
    { value: 'READ', label: t('actions.READ') },
    { value: 'EXPORT', label: t('actions.EXPORT') },
    { value: 'IMPORT', label: t('actions.IMPORT') },
    { value: 'APPROVE', label: t('actions.APPROVE') },
    { value: 'REJECT', label: t('actions.REJECT') },
    { value: 'PASSWORD_CHANGE', label: t('actions.PASSWORD_CHANGE') },
    { value: 'PERMISSION_CHANGE', label: t('actions.PERMISSION_CHANGE') },
  ], [t]);

  const RESULT_OPTIONS: { value: AuditResult | ''; label: string }[] = React.useMemo(() => [
    { value: '', label: t('filter.all') },
    { value: 'SUCCESS', label: t('detail.success') },
    { value: 'FAILURE', label: t('detail.failure') },
  ], [t]);

  const updateFilter = <K extends keyof AuditFilterValues>(
    key: K,
    value: AuditFilterValues[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFiltersChange({
      keyword: '',
      action: '',
      result: '',
      targetType: '',
      startDate: '',
      endDate: '',
      userId: '',
    });
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      updateFilter('startDate', format(range.from, 'yyyy-MM-dd'));
    } else {
      updateFilter('startDate', '');
    }
    if (range?.to) {
      updateFilter('endDate', format(range.to, 'yyyy-MM-dd'));
    } else {
      updateFilter('endDate', '');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.();
    }
  };

  const activeFilterCount = [
    filters.action,
    filters.result,
    filters.targetType,
    filters.startDate,
    filters.endDate,
    filters.userId,
  ].filter(Boolean).length;

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          {t('filter.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic filters */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Keyword */}
          <div className="space-y-2">
            <Label>{t('filter.keyword')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('filter.keywordPlaceholder')}
                value={filters.keyword}
                onChange={(e) => updateFilter('keyword', e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
          </div>

          {/* Action */}
          <div className="space-y-2">
            <Label>{t('filter.actionType')}</Label>
            <Select
              value={filters.action}
              onValueChange={(value) => updateFilter('action', value as AuditAction | '')}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('filter.all')} />
              </SelectTrigger>
              <SelectContent>
                {ACTION_OPTIONS.map((option) => (
                  <SelectItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Result */}
          <div className="space-y-2">
            <Label>{t('filter.result')}</Label>
            <Select
              value={filters.result}
              onValueChange={(value) => updateFilter('result', value as AuditResult | '')}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('filter.all')} />
              </SelectTrigger>
              <SelectContent>
                {RESULT_OPTIONS.map((option) => (
                  <SelectItem key={option.value || 'all'} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search Button */}
          <div className="flex items-end gap-2">
            <Button onClick={onSearch} className="flex-1">
              <Search className="h-4 w-4 mr-2" />
              {t('filter.search')}
            </Button>
            <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="relative">
                  <Filter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center">
                      {activeFilterCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{t('filter.advanced')}</h4>
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                      <RotateCcw className="mr-1 h-3 w-3" />
                      {t('filter.reset')}
                    </Button>
                  </div>

                  {/* Target Type */}
                  {targetTypes.length > 0 && (
                    <div className="space-y-2">
                      <Label>{t('filter.targetType')}</Label>
                      <Select
                        value={filters.targetType || '__all__'}
                        onValueChange={(value) => updateFilter('targetType', value === '__all__' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('filter.all')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">{t('filter.all')}</SelectItem>
                          {targetTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Date Range */}
                  <div className="space-y-2">
                    <Label>{t('filter.period')}</Label>
                    <DateRangePicker
                      value={
                        filters.startDate && filters.endDate
                          ? {
                              from: parseISO(filters.startDate),
                              to: parseISO(filters.endDate),
                            }
                          : undefined
                      }
                      onChange={handleDateRangeChange}
                      placeholder={t('filter.periodSelect')}
                    />
                  </div>

                  {/* User ID */}
                  <div className="space-y-2">
                    <Label>{t('filter.userId')}</Label>
                    <Input
                      placeholder={t('filter.userIdPlaceholder')}
                      value={filters.userId}
                      onChange={(e) => updateFilter('userId', e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => {
                      setIsAdvancedOpen(false);
                      onSearch?.();
                    }}
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {t('filter.search')}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            {filters.action && (
              <FilterTag
                label={t('filter.activeAction', { value: ACTION_OPTIONS.find((o) => o.value === filters.action)?.label })}
                onRemove={() => updateFilter('action', '')}
              />
            )}
            {filters.result && (
              <FilterTag
                label={t('filter.activeResult', { value: RESULT_OPTIONS.find((o) => o.value === filters.result)?.label })}
                onRemove={() => updateFilter('result', '')}
              />
            )}
            {filters.targetType && (
              <FilterTag
                label={t('filter.activeTarget', { value: filters.targetType })}
                onRemove={() => updateFilter('targetType', '')}
              />
            )}
            {filters.startDate && (
              <FilterTag
                label={t('filter.activeStartDate', { value: filters.startDate })}
                onRemove={() => updateFilter('startDate', '')}
              />
            )}
            {filters.endDate && (
              <FilterTag
                label={t('filter.activeEndDate', { value: filters.endDate })}
                onRemove={() => updateFilter('endDate', '')}
              />
            )}
            {filters.userId && (
              <FilterTag
                label={t('filter.activeUser', { value: filters.userId })}
                onRemove={() => updateFilter('userId', '')}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="ml-1 hover:text-destructive"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
