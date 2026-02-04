import * as React from 'react';
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

const ACTION_OPTIONS: { value: AuditAction | ''; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'LOGIN', label: '로그인' },
  { value: 'LOGOUT', label: '로그아웃' },
  { value: 'CREATE', label: '생성' },
  { value: 'UPDATE', label: '수정' },
  { value: 'DELETE', label: '삭제' },
  { value: 'READ', label: '조회' },
  { value: 'EXPORT', label: '내보내기' },
  { value: 'IMPORT', label: '가져오기' },
  { value: 'APPROVE', label: '승인' },
  { value: 'REJECT', label: '반려' },
  { value: 'PASSWORD_CHANGE', label: '비밀번호 변경' },
  { value: 'PERMISSION_CHANGE', label: '권한 변경' },
];

const RESULT_OPTIONS: { value: AuditResult | ''; label: string }[] = [
  { value: '', label: '전체' },
  { value: 'SUCCESS', label: '성공' },
  { value: 'FAILURE', label: '실패' },
];

export function AuditFilter({
  filters,
  onFiltersChange,
  onSearch,
  targetTypes = [],
  className,
}: AuditFilterProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

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
          검색 필터
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic filters */}
        <div className="grid gap-4 md:grid-cols-4">
          {/* Keyword */}
          <div className="space-y-2">
            <Label>키워드</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="사용자, 대상, IP 검색"
                value={filters.keyword}
                onChange={(e) => updateFilter('keyword', e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-9"
              />
            </div>
          </div>

          {/* Action */}
          <div className="space-y-2">
            <Label>액션 유형</Label>
            <Select
              value={filters.action}
              onValueChange={(value) => updateFilter('action', value as AuditAction | '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
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
            <Label>결과</Label>
            <Select
              value={filters.result}
              onValueChange={(value) => updateFilter('result', value as AuditResult | '')}
            >
              <SelectTrigger>
                <SelectValue placeholder="전체" />
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
              검색
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
                    <h4 className="font-medium">상세 검색</h4>
                    <Button variant="ghost" size="sm" onClick={handleReset}>
                      <RotateCcw className="mr-1 h-3 w-3" />
                      초기화
                    </Button>
                  </div>

                  {/* Target Type */}
                  {targetTypes.length > 0 && (
                    <div className="space-y-2">
                      <Label>대상 유형</Label>
                      <Select
                        value={filters.targetType || '__all__'}
                        onValueChange={(value) => updateFilter('targetType', value === '__all__' ? '' : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">전체</SelectItem>
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
                    <Label>기간</Label>
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
                      placeholder="기간 선택"
                    />
                  </div>

                  {/* User ID */}
                  <div className="space-y-2">
                    <Label>사용자 ID</Label>
                    <Input
                      placeholder="사용자 ID 입력"
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
                    검색
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
                label={`액션: ${ACTION_OPTIONS.find((o) => o.value === filters.action)?.label}`}
                onRemove={() => updateFilter('action', '')}
              />
            )}
            {filters.result && (
              <FilterTag
                label={`결과: ${RESULT_OPTIONS.find((o) => o.value === filters.result)?.label}`}
                onRemove={() => updateFilter('result', '')}
              />
            )}
            {filters.targetType && (
              <FilterTag
                label={`대상: ${filters.targetType}`}
                onRemove={() => updateFilter('targetType', '')}
              />
            )}
            {filters.startDate && (
              <FilterTag
                label={`시작일: ${filters.startDate}`}
                onRemove={() => updateFilter('startDate', '')}
              />
            )}
            {filters.endDate && (
              <FilterTag
                label={`종료일: ${filters.endDate}`}
                onRemove={() => updateFilter('endDate', '')}
              />
            )}
            {filters.userId && (
              <FilterTag
                label={`사용자: ${filters.userId}`}
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
