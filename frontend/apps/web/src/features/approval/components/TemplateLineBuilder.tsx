import { useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { ApprovalLineTemplate, ApprovalStepType } from '@hr-platform/shared-types';

interface TemplateLineBuilderProps {
  value: ApprovalLineTemplate[];
  onChange: (value: ApprovalLineTemplate[]) => void;
}

export function TemplateLineBuilder({ value, onChange }: TemplateLineBuilderProps) {
  const { t } = useTranslation('approval');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const STEP_TYPE_LABELS: Record<ApprovalStepType, string> = {
    APPROVAL: t('templateLineBuilder.stepTypeApproval'),
    AGREEMENT: t('templateLineBuilder.stepTypeAgreement'),
    REFERENCE: t('templateLineBuilder.stepTypeReference'),
  };

  const APPROVER_TYPE_OPTIONS = [
    { value: 'DEPARTMENT_HEAD', label: t('templateLineBuilder.approverTypeDeptHead') },
    { value: 'ROLE', label: t('templateLineBuilder.approverTypeRole') },
    { value: 'SPECIFIC', label: t('templateLineBuilder.approverTypeSpecific') },
  ];

  const ROLE_OPTIONS = [
    { value: 'HR_MANAGER', label: t('templateLineBuilder.roleHrManager') },
    { value: 'TENANT_ADMIN', label: t('templateLineBuilder.roleTenantAdmin') },
    { value: 'DEPT_MANAGER', label: t('templateLineBuilder.roleDeptManager') },
    { value: 'TEAM_LEADER', label: t('templateLineBuilder.roleTeamLeader') },
  ];

  const handleAdd = () => {
    const newStep: ApprovalLineTemplate = {
      stepOrder: value.length + 1,
      stepType: 'APPROVAL',
      approverType: 'DEPARTMENT_HEAD',
      isRequired: true,
    };
    onChange([...value, newStep]);
    setExpandedIndex(value.length);
  };

  const handleRemove = (index: number) => {
    const newValue = value
      .filter((_, i) => i !== index)
      .map((step, i) => ({ ...step, stepOrder: i + 1 }));
    onChange(newValue);
    setExpandedIndex(null);
  };

  const handleUpdate = (index: number, updates: Partial<ApprovalLineTemplate>) => {
    const newValue = value.map((step, i) =>
      i === index ? { ...step, ...updates } : step
    );
    onChange(newValue);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newValue = [...value];
    [newValue[index - 1], newValue[index]] = [newValue[index], newValue[index - 1]];
    onChange(newValue.map((step, i) => ({ ...step, stepOrder: i + 1 })));
    setExpandedIndex(index - 1);
  };

  const handleMoveDown = (index: number) => {
    if (index === value.length - 1) return;
    const newValue = [...value];
    [newValue[index], newValue[index + 1]] = [newValue[index + 1], newValue[index]];
    onChange(newValue.map((step, i) => ({ ...step, stepOrder: i + 1 })));
    setExpandedIndex(index + 1);
  };

  if (value.length === 0) {
    return (
      <div className="text-center py-8 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground mb-4">{t('templateLineBuilder.emptyLine')}</p>
        <Button onClick={handleAdd} variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          {t('templateLineBuilder.addStep')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {value.map((step, index) => (
        <Card key={index} className="overflow-hidden">
          <div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50"
            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">
              {t('templateLineBuilder.stepLabel', { n: step.stepOrder })}
            </span>
            <span className="text-sm text-muted-foreground">
              {STEP_TYPE_LABELS[step.stepType]}
              {' · '}
              {APPROVER_TYPE_OPTIONS.find(o => o.value === step.approverType)?.label}
              {step.approverType === 'ROLE' && step.approverRole && (
                <> ({ROLE_OPTIONS.find(r => r.value === step.approverRole)?.label})</>
              )}
            </span>
            {step.isRequired && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{t('templateLineBuilder.requiredBadge')}</span>
            )}
            <div className="flex-1" />
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMoveDown(index)}
                disabled={index === value.length - 1}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => handleRemove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {expandedIndex === index && (
            <CardContent className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{t('templateLineBuilder.approvalType')}</Label>
                  <Select
                    value={step.stepType}
                    onValueChange={(val) =>
                      handleUpdate(index, { stepType: val as ApprovalStepType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STEP_TYPE_LABELS).map(([val, label]) => (
                        <SelectItem key={val} value={val}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t('templateLineBuilder.assignMethod')}</Label>
                  <Select
                    value={step.approverType}
                    onValueChange={(val) =>
                      handleUpdate(index, {
                        approverType: val as 'SPECIFIC' | 'ROLE' | 'DEPARTMENT_HEAD',
                        approverId: undefined,
                        approverRole: undefined,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPROVER_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {step.approverType === 'ROLE' && (
                <div className="space-y-2">
                  <Label>{t('templateLineBuilder.roleLabel')}</Label>
                  <Select
                    value={step.approverRole || ''}
                    onValueChange={(val) => handleUpdate(index, { approverRole: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('role.select')} />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {step.approverType === 'SPECIFIC' && (
                <div className="space-y-2">
                  <Label>{t('templateLineBuilder.approverId')}</Label>
                  <Input
                    placeholder={t('templateLineBuilder.approverIdPlaceholder')}
                    value={step.approverId || ''}
                    onChange={(e) => handleUpdate(index, { approverId: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('templateLineBuilder.approverIdHint')}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label>{t('templateLineBuilder.requiredStep')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('templateLineBuilder.requiredStepDesc')}
                  </p>
                </div>
                <Switch
                  checked={step.isRequired}
                  onCheckedChange={(checked) => handleUpdate(index, { isRequired: checked })}
                />
              </div>
            </CardContent>
          )}
        </Card>
      ))}

      <Button onClick={handleAdd} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        {t('templateLineBuilder.addStep')}
      </Button>
    </div>
  );
}
