import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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

const delegationSchema = z.object({
  delegateId: z.string().min(1, '대결자를 선택해주세요'),
  startDate: z.string().min(1, '시작일을 선택해주세요'),
  endDate: z.string().min(1, '종료일을 선택해주세요'),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return !isBefore(parseISO(data.endDate), parseISO(data.startDate));
  }
  return true;
}, {
  message: '종료일은 시작일 이후여야 합니다',
  path: ['endDate'],
});

type DelegationFormData = z.infer<typeof delegationSchema>;

export function DelegationSettings({
  delegations,
  onAdd,
  onDelete,
  onToggle,
  onSearchEmployees,
  isLoading = false,
}: DelegationSettingsProps) {
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
              <CardTitle>대결/위임 설정</CardTitle>
              <CardDescription>
                부재 시 다른 직원에게 결재 권한을 위임합니다.
              </CardDescription>
            </div>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              대결자 등록
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {delegations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">등록된 대결자가 없습니다.</p>
              <p className="text-sm text-muted-foreground mt-1">
                대결자를 등록하면 부재 시 결재 업무를 위임할 수 있습니다.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>대결자</TableHead>
                  <TableHead>기간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>활성화</TableHead>
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
                          <StatusBadge status="default" label="만료됨" />
                        ) : delegation.isActive ? (
                          <StatusBadge status="success" label="활성" />
                        ) : (
                          <StatusBadge status="warning" label="비활성" />
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
            <DialogTitle>대결자 등록</DialogTitle>
            <DialogDescription>
              부재 시 결재 권한을 위임할 직원을 등록합니다.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="space-y-4 py-4">
              {/* Employee Search */}
              <div className="space-y-2">
                <Label>대결자 *</Label>
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
                      변경
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      placeholder="이름으로 검색..."
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
                <Label>위임 기간 *</Label>
                <DateRangePicker
                  value={
                    startDate && endDate
                      ? { from: parseISO(startDate), to: parseISO(endDate) }
                      : undefined
                  }
                  onChange={handleDateRangeChange}
                  placeholder="기간 선택"
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
                취소
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  '저장'
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
            <DialogTitle>대결자 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 대결 설정을 삭제하시겠습니까?
              <br />
              <strong className="text-foreground">{selectedDelegation?.delegateName}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? '삭제 중...' : '삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
