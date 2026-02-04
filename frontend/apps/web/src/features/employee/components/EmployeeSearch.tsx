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
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, X, RotateCcw } from 'lucide-react';
import type { EmploymentStatus, DepartmentTreeNode } from '@hr-platform/shared-types';

export interface EmployeeSearchFilters {
  keyword: string;
  employmentStatus: EmploymentStatus | '';
  departmentId: string;
  gradeId: string;
  positionId: string;
  hireDateFrom: string;
  hireDateTo: string;
}

export interface EmployeeSearchProps {
  filters: EmployeeSearchFilters;
  onFiltersChange: (filters: EmployeeSearchFilters) => void;
  departments?: DepartmentTreeNode[];
  grades?: { id: string; name: string }[];
  positions?: { id: string; name: string }[];
  onSearch?: () => void;
}

const EMPLOYMENT_STATUS_OPTIONS: { value: EmploymentStatus | ''; label: string }[] = [
  { value: '', label: '전체 상태' },
  { value: 'ACTIVE', label: '재직' },
  { value: 'ON_LEAVE', label: '휴직' },
  { value: 'RESIGNED', label: '퇴직' },
  { value: 'RETIRED', label: '정년퇴직' },
];

export function EmployeeSearch({
  filters,
  onFiltersChange,
  departments = [],
  grades = [],
  positions = [],
  onSearch,
}: EmployeeSearchProps) {
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);

  // Flatten department tree
  const flattenTree = (
    nodes: DepartmentTreeNode[],
    result: { id: string; name: string; level: number }[] = []
  ): { id: string; name: string; level: number }[] => {
    nodes.forEach((node) => {
      result.push({ id: node.id, name: node.name, level: node.level });
      if (node.children) {
        flattenTree(node.children, result);
      }
    });
    return result;
  };

  const flatDepartments = flattenTree(departments);

  const updateFilter = <K extends keyof EmployeeSearchFilters>(
    key: K,
    value: EmployeeSearchFilters[K]
  ) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFiltersChange({
      keyword: '',
      employmentStatus: '',
      departmentId: '',
      gradeId: '',
      positionId: '',
      hireDateFrom: '',
      hireDateTo: '',
    });
  };

  const activeFilterCount = [
    filters.departmentId,
    filters.gradeId,
    filters.positionId,
    filters.hireDateFrom,
    filters.hireDateTo,
  ].filter(Boolean).length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch?.();
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Keyword Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="이름, 사번, 이메일로 검색..."
              value={filters.keyword}
              onChange={(e) => updateFilter('keyword', e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-9"
            />
          </div>

          {/* Status Select */}
          <Select
            value={filters.employmentStatus}
            onValueChange={(value) => updateFilter('employmentStatus', value as EmploymentStatus | '')}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="전체 상태" />
            </SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value || 'all'} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Advanced Filter */}
          <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="mr-2 h-4 w-4" />
                상세 검색
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
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

                {/* Department */}
                {flatDepartments.length > 0 && (
                  <div className="space-y-2">
                    <Label>부서</Label>
                    <Select
                      value={filters.departmentId || '__all__'}
                      onValueChange={(value) => updateFilter('departmentId', value === '__all__' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="전체 부서" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">전체 부서</SelectItem>
                        {flatDepartments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {'　'.repeat(dept.level - 1)}
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Grade */}
                {grades.length > 0 && (
                  <div className="space-y-2">
                    <Label>직급</Label>
                    <Select
                      value={filters.gradeId || '__all__'}
                      onValueChange={(value) => updateFilter('gradeId', value === '__all__' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="전체 직급" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">전체 직급</SelectItem>
                        {grades.map((grade) => (
                          <SelectItem key={grade.id} value={grade.id}>
                            {grade.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Position */}
                {positions.length > 0 && (
                  <div className="space-y-2">
                    <Label>직책</Label>
                    <Select
                      value={filters.positionId || '__all__'}
                      onValueChange={(value) => updateFilter('positionId', value === '__all__' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="전체 직책" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">전체 직책</SelectItem>
                        {positions.map((pos) => (
                          <SelectItem key={pos.id} value={pos.id}>
                            {pos.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Hire Date Range */}
                <div className="space-y-2">
                  <Label>입사일</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="date"
                      value={filters.hireDateFrom}
                      onChange={(e) => updateFilter('hireDateFrom', e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-muted-foreground">~</span>
                    <Input
                      type="date"
                      value={filters.hireDateTo}
                      onChange={(e) => updateFilter('hireDateTo', e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Apply Button */}
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

          {/* Search Button */}
          <Button onClick={onSearch}>
            <Search className="mr-2 h-4 w-4" />
            검색
          </Button>
        </div>

        {/* Active Filters Display */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {filters.departmentId && (
              <FilterTag
                label={`부서: ${flatDepartments.find((d) => d.id === filters.departmentId)?.name || filters.departmentId}`}
                onRemove={() => updateFilter('departmentId', '')}
              />
            )}
            {filters.gradeId && (
              <FilterTag
                label={`직급: ${grades.find((g) => g.id === filters.gradeId)?.name || filters.gradeId}`}
                onRemove={() => updateFilter('gradeId', '')}
              />
            )}
            {filters.positionId && (
              <FilterTag
                label={`직책: ${positions.find((p) => p.id === filters.positionId)?.name || filters.positionId}`}
                onRemove={() => updateFilter('positionId', '')}
              />
            )}
            {filters.hireDateFrom && (
              <FilterTag
                label={`입사일 시작: ${filters.hireDateFrom}`}
                onRemove={() => updateFilter('hireDateFrom', '')}
              />
            )}
            {filters.hireDateTo && (
              <FilterTag
                label={`입사일 종료: ${filters.hireDateTo}`}
                onRemove={() => updateFilter('hireDateTo', '')}
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
