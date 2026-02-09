import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowDown } from 'lucide-react';
import type { TenantListItem, PolicyType } from '@hr-platform/shared-types';
import { POLICY_TYPE_LABELS } from '@hr-platform/shared-types';

interface PolicyInheritDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentName: string;
  subsidiaries: TenantListItem[];
  onSubmit: (childIds: string[], policyTypes: PolicyType[]) => Promise<void>;
  isLoading?: boolean;
}

const ALL_POLICY_TYPES: PolicyType[] = [
  'LEAVE',
  'ATTENDANCE',
  'APPROVAL',
  'PASSWORD',
  'SECURITY',
  'NOTIFICATION',
  'ORGANIZATION',
];

export function PolicyInheritDialog({
  open,
  onOpenChange,
  parentName,
  subsidiaries,
  onSubmit,
  isLoading = false,
}: PolicyInheritDialogProps) {
  const { t } = useTranslation('tenant');
  const [selectedChildIds, setSelectedChildIds] = React.useState<string[]>([]);
  const [selectedPolicyTypes, setSelectedPolicyTypes] = React.useState<PolicyType[]>([]);

  React.useEffect(() => {
    if (open) {
      setSelectedChildIds([]);
      setSelectedPolicyTypes([]);
    }
  }, [open]);

  const handleChildToggle = (childId: string) => {
    setSelectedChildIds((prev) =>
      prev.includes(childId)
        ? prev.filter((id) => id !== childId)
        : [...prev, childId]
    );
  };

  const handlePolicyToggle = (policyType: PolicyType) => {
    setSelectedPolicyTypes((prev) =>
      prev.includes(policyType)
        ? prev.filter((p) => p !== policyType)
        : [...prev, policyType]
    );
  };

  const handleSelectAllChildren = () => {
    if (selectedChildIds.length === subsidiaries.length) {
      setSelectedChildIds([]);
    } else {
      setSelectedChildIds(subsidiaries.map((s) => s.id));
    }
  };

  const handleSelectAllPolicies = () => {
    if (selectedPolicyTypes.length === ALL_POLICY_TYPES.length) {
      setSelectedPolicyTypes([]);
    } else {
      setSelectedPolicyTypes([...ALL_POLICY_TYPES]);
    }
  };

  const handleSubmit = async () => {
    await onSubmit(selectedChildIds, selectedPolicyTypes);
    onOpenChange(false);
  };

  const isValid = selectedChildIds.length > 0 && selectedPolicyTypes.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowDown className="h-5 w-5" />
            {t('policyInherit.title')}
          </DialogTitle>
          <DialogDescription>
            {t('policyInherit.description', { name: parentName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 계열사 선택 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">{t('policyInherit.selectSubsidiaries')}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAllChildren}
              >
                {selectedChildIds.length === subsidiaries.length ? t('policyInherit.deselectAll') : t('policyInherit.selectAll')}
              </Button>
            </div>
            {subsidiaries.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('policyInherit.noSubsidiaries')}</p>
            ) : (
              <div className="grid gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                {subsidiaries.map((sub) => (
                  <div key={sub.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`child-${sub.id}`}
                      checked={selectedChildIds.includes(sub.id)}
                      onCheckedChange={() => handleChildToggle(sub.id)}
                    />
                    <Label
                      htmlFor={`child-${sub.id}`}
                      className="text-sm cursor-pointer flex-1"
                    >
                      {sub.name}
                      <span className="text-muted-foreground ml-2">({sub.code})</span>
                    </Label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 정책 유형 선택 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">{t('policyInherit.selectPolicyTypes')}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAllPolicies}
              >
                {selectedPolicyTypes.length === ALL_POLICY_TYPES.length
                  ? t('policyInherit.deselectAll')
                  : t('policyInherit.selectAll')}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 border rounded-md p-3">
              {ALL_POLICY_TYPES.map((policyType) => (
                <div key={policyType} className="flex items-center space-x-2">
                  <Checkbox
                    id={`policy-${policyType}`}
                    checked={selectedPolicyTypes.includes(policyType)}
                    onCheckedChange={() => handlePolicyToggle(policyType)}
                  />
                  <Label
                    htmlFor={`policy-${policyType}`}
                    className="text-sm cursor-pointer"
                  >
                    {POLICY_TYPE_LABELS[policyType]} {t('policyInherit.policySuffix')}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* 경고 메시지 */}
          {isValid && (
            <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
              <p className="text-sm text-amber-800">
                {t('policyInherit.overwriteWarning', {
                  count: selectedChildIds.length,
                  policies: selectedPolicyTypes.map((p) => POLICY_TYPE_LABELS[p]).join(', '),
                })}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('policyInherit.inheriting')}
              </>
            ) : (
              t('policyInherit.inherit')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
