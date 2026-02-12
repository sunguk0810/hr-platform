import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OrgTree } from '@/features/organization/components/OrgTree';
import { apiClient } from '@/lib/apiClient';
import { Search, UserPlus, X, Check } from 'lucide-react';
import type { DepartmentTreeNode } from '@hr-platform/shared-types';

interface DepartmentEmployee {
  id: string;
  name: string;
  employeeNumber: string;
  positionName?: string;
  gradeName?: string;
  departmentName: string;
  departmentId: string;
  profileImageUrl?: string;
}

export interface SelectedApprover {
  id: string;
  name: string;
  departmentName: string;
  positionName?: string;
}

interface OrgTreeApproverPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (approvers: SelectedApprover[]) => void;
  /** Already selected approver IDs to exclude */
  excludeIds?: string[];
  /** Maximum number of approvers that can be selected (e.g., 1 for DIRECT mode) */
  maxSelection?: number;
}

export function OrgTreeApproverPicker({
  open,
  onOpenChange,
  onSelect,
  excludeIds = [],
  maxSelection,
}: OrgTreeApproverPickerProps) {
  const { t } = useTranslation('approval');
  const [selectedDeptId, setSelectedDeptId] = useState<string>();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [pendingApprovers, setPendingApprovers] = useState<SelectedApprover[]>([]);

  // Fetch org tree
  const { data: treeData } = useQuery({
    queryKey: ['departments', 'tree'],
    queryFn: async () => {
      const res = await apiClient.get('/departments/tree');
      const json = res.data;
      return json.data as DepartmentTreeNode[];
    },
    enabled: open,
  });

  // Fetch employees for selected department
  const { data: employees, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['departments', selectedDeptId, 'employees'],
    queryFn: async () => {
      const res = await apiClient.get(`/departments/${selectedDeptId}/employees`);
      const json = res.data;
      return json.data as DepartmentEmployee[];
    },
    enabled: !!selectedDeptId && open,
  });

  const handleDeptSelect = (node: DepartmentTreeNode) => {
    setSelectedDeptId(node.id);
  };

  const handleToggleEmployee = (emp: DepartmentEmployee) => {
    if (pendingApprovers.some(a => a.id === emp.id)) {
      setPendingApprovers(prev => prev.filter(a => a.id !== emp.id));
    } else {
      const newApprover: SelectedApprover = {
        id: emp.id,
        name: emp.name,
        departmentName: emp.departmentName,
        positionName: emp.positionName,
      };

      if (maxSelection === 1) {
        // In single-selection mode, replace the current selection
        setPendingApprovers([newApprover]);
      } else {
        setPendingApprovers(prev => [...prev, newApprover]);
      }
    }
  };

  const handleConfirm = () => {
    onSelect(pendingApprovers);
    setPendingApprovers([]);
    setSearchKeyword('');
    setSelectedDeptId(undefined);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setPendingApprovers([]);
    setSearchKeyword('');
    setSelectedDeptId(undefined);
    onOpenChange(false);
  };

  // Filter employees by search keyword
  const filteredEmployees = employees?.filter(emp => {
    if (!searchKeyword) return true;
    const lower = searchKeyword.toLowerCase();
    return (
      emp.name.toLowerCase().includes(lower) ||
      emp.employeeNumber.toLowerCase().includes(lower)
    );
  });

  const getInitials = (name: string) => name.slice(0, 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('orgTreeApproverPicker.title')}</DialogTitle>
        </DialogHeader>

        {/* Selected approvers chips */}
        {pendingApprovers.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-2 border-b">
            {pendingApprovers.map((approver) => (
              <Badge key={approver.id} variant="secondary" className="gap-1">
                {approver.name}
                {approver.positionName && (
                  <span className="text-muted-foreground">({approver.positionName})</span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    setPendingApprovers(prev => prev.filter(a => a.id !== approver.id))
                  }
                  className="ml-0.5 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {/* Left: Org Tree */}
          <div className="flex flex-col min-h-0">
            <ScrollArea className="flex-1">
              {treeData && treeData.length > 0 ? (
                <OrgTree
                  data={treeData}
                  selectedId={selectedDeptId}
                  onSelect={handleDeptSelect}
                />
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('orgTreeApproverPicker.loadingOrgTree')}
                </p>
              )}
            </ScrollArea>
          </div>

          {/* Right: Employee list */}
          <div className="flex flex-col min-h-0 border-l pl-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('orgTreeApproverPicker.searchPlaceholder')}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-9 h-8 text-sm"
              />
            </div>
            <ScrollArea className="flex-1">
              {selectedDeptId ? (
                isLoadingEmployees ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {t('orgTreeApproverPicker.loadingEmployees')}
                  </p>
                ) : filteredEmployees && filteredEmployees.length > 0 ? (
                  <div className="space-y-1">
                    {filteredEmployees.map((emp) => {
                      const selected = pendingApprovers.some(a => a.id === emp.id);
                      const excluded = excludeIds.includes(emp.id);
                      return (
                        <button
                          key={emp.id}
                          type="button"
                          disabled={excluded}
                          onClick={() => handleToggleEmployee(emp)}
                          className={`w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors ${
                            selected
                              ? 'bg-primary/10 ring-1 ring-primary/30'
                              : 'hover:bg-muted/50'
                          } ${excluded ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(emp.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {emp.positionName || emp.gradeName || '-'} · {emp.departmentName}
                            </p>
                          </div>
                          {selected && <Check className="h-4 w-4 text-primary" />}
                          {excluded && (
                            <Badge variant="outline" className="text-xs">
                              {t('orgTreeApproverPicker.alreadyAdded')}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {searchKeyword ? t('common.noSearchResultsDot') : t('orgTreeApproverPicker.noEmployees')}
                  </p>
                )
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('orgTreeApproverPicker.selectDepartment')}
                </p>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleConfirm} disabled={pendingApprovers.length === 0}>
            <UserPlus className="mr-2 h-4 w-4" />
            {t('orgTreeApproverPicker.addCount', { count: pendingApprovers.length })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
