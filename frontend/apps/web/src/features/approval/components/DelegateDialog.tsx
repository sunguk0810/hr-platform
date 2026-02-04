import { useState, useMemo } from 'react';
import { UserCheck, Search, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEmployeeSearch } from '../hooks/useApprovals';

interface DelegateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (delegateToId: string, delegateToName: string, reason?: string) => Promise<void>;
  isLoading?: boolean;
  currentApproverName?: string;
}

export function DelegateDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading = false,
  currentApproverName,
}: DelegateDialogProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    name: string;
    departmentName: string;
  } | null>(null);
  const [reason, setReason] = useState('');

  const { data: searchResult, isLoading: isSearching } = useEmployeeSearch(searchKeyword);
  const employees = searchResult?.data || [];

  const filteredEmployees = useMemo(() => {
    if (!searchKeyword.trim()) return employees;
    const lower = searchKeyword.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(lower) ||
        emp.departmentName.toLowerCase().includes(lower)
    );
  }, [employees, searchKeyword]);

  const handleConfirm = async () => {
    if (!selectedEmployee) return;
    await onConfirm(selectedEmployee.id, selectedEmployee.name, reason.trim() || undefined);
    resetState();
  };

  const resetState = () => {
    setSearchKeyword('');
    setSelectedEmployee(null);
    setReason('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-indigo-500" />
            대결 지정
          </DialogTitle>
          <DialogDescription>
            {currentApproverName ? (
              <>
                <strong>{currentApproverName}</strong>님의 결재를 대신 처리할 대결자를 지정합니다.
              </>
            ) : (
              '결재를 대신 처리할 대결자를 지정합니다.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* 대결자 검색 */}
          <div className="grid gap-2">
            <Label htmlFor="delegate-search">
              대결자 검색 <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="delegate-search"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="이름 또는 부서명으로 검색"
                className="pl-9"
              />
            </div>
          </div>

          {/* 검색 결과 목록 */}
          <div className="grid gap-2">
            <Label>검색 결과</Label>
            <ScrollArea className="h-[200px] rounded-md border">
              {isSearching ? (
                <div className="flex h-full items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                  {searchKeyword ? '검색 결과가 없습니다.' : '이름으로 검색하세요.'}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredEmployees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => setSelectedEmployee(employee)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-lg p-2 text-left transition-colors',
                        selectedEmployee?.id === employee.id
                          ? 'bg-indigo-50 border border-indigo-200'
                          : 'hover:bg-muted'
                      )}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(employee.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {employee.departmentName}
                        </p>
                      </div>
                      {selectedEmployee?.id === employee.id && (
                        <div className="ml-auto">
                          <div className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center">
                            <UserCheck className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* 선택된 대결자 */}
          {selectedEmployee && (
            <div className="rounded-lg bg-indigo-50 border border-indigo-200 p-3">
              <Label className="text-xs text-indigo-600">선택된 대결자</Label>
              <div className="flex items-center gap-2 mt-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {getInitials(selectedEmployee.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{selectedEmployee.name}</span>
                <span className="text-sm text-muted-foreground">
                  ({selectedEmployee.departmentName})
                </span>
              </div>
            </div>
          )}

          {/* 대결 사유 */}
          <div className="grid gap-2">
            <Label htmlFor="delegate-reason">대결 사유 (선택)</Label>
            <Textarea
              id="delegate-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="대결 사유를 입력하세요. (예: 출장, 휴가 등)"
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedEmployee || isLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading ? '처리 중...' : '대결 지정'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DelegateDialog;
