import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Settings2 } from 'lucide-react';
import type {
  FeatureCode,
  FeatureConfigMap,
  ParallelApprovalConfig,
  ConsensusConfig,
  DirectApprovalConfig,
  ProxyApprovalConfig,
  OkrConfig,
  KpiConfig,
} from '@hr-platform/shared-types';
import {
  TENANT_FEATURES,
  DEFAULT_FEATURE_CONFIGS,
  FEATURE_CONFIG_LABELS,
} from '@hr-platform/shared-types';

interface FeatureConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureCode: FeatureCode | null;
  currentConfig?: FeatureConfigMap[FeatureCode];
  onSave: (code: FeatureCode, config: FeatureConfigMap[FeatureCode]) => Promise<void>;
  isLoading?: boolean;
}

// 병렬결재 설정 폼
function ParallelApprovalForm({
  config,
  onChange,
  t,
}: {
  config: ParallelApprovalConfig;
  onChange: (config: ParallelApprovalConfig) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('featureConfig.minApprovers')}</Label>
        <Select
          value={config.minApprovers}
          onValueChange={(value) =>
            onChange({ ...config, minApprovers: value as ParallelApprovalConfig['minApprovers'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FEATURE_CONFIG_LABELS.minApprovers).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {t('featureConfig.minApproversDescription')}
        </p>
      </div>

      <div className="space-y-2">
        <Label>{t('featureConfig.approvalMode')}</Label>
        <Select
          value={config.approvalMode}
          onValueChange={(value) =>
            onChange({ ...config, approvalMode: value as ParallelApprovalConfig['approvalMode'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(FEATURE_CONFIG_LABELS.approvalMode).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// 합의 설정 폼
function ConsensusForm({
  config,
  onChange,
  t,
}: {
  config: ConsensusConfig;
  onChange: (config: ConsensusConfig) => void;
  t: (key: string) => string;
}) {
  const consensusTypeOptions = ['협조', '검토', '참조'] as const;

  const handleTypeToggle = (type: (typeof consensusTypeOptions)[number]) => {
    const current = config.consensusTypes || [];
    if (current.includes(type)) {
      onChange({ ...config, consensusTypes: current.filter((t) => t !== type) });
    } else {
      onChange({ ...config, consensusTypes: [...current, type] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('featureConfig.consensusTypes')}</Label>
        <div className="flex gap-4">
          {consensusTypeOptions.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox
                id={`consensus-${type}`}
                checked={config.consensusTypes?.includes(type) ?? false}
                onCheckedChange={() => handleTypeToggle(type)}
              />
              <Label htmlFor={`consensus-${type}`} className="cursor-pointer">
                {type}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label>{t('featureConfig.consensusBlocking')}</Label>
          <p className="text-sm text-muted-foreground">
            {t('featureConfig.consensusBlockingDescription')}
          </p>
        </div>
        <Switch
          checked={config.isBlocking}
          onCheckedChange={(checked) => onChange({ ...config, isBlocking: checked })}
        />
      </div>
    </div>
  );
}

// 전결 설정 폼
function DirectApprovalForm({
  config,
  onChange,
  t,
}: {
  config: DirectApprovalConfig;
  onChange: (config: DirectApprovalConfig) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('featureConfig.maxDirectApprovalAmount')}</Label>
        <Input
          type="number"
          value={config.maxAmount}
          onChange={(e) => onChange({ ...config, maxAmount: parseInt(e.target.value) || 0 })}
          placeholder={t('featureConfig.maxDirectApprovalAmountPlaceholder')}
        />
        <p className="text-xs text-muted-foreground">
          {t('featureConfig.maxDirectApprovalAmountHint')}
        </p>
      </div>

      <div className="space-y-2">
        <Label>{t('featureConfig.directApprovalDocTypes')}</Label>
        <Input
          value={config.allowedDocTypes?.join(', ') || ''}
          onChange={(e) =>
            onChange({
              ...config,
              allowedDocTypes: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder={t('featureConfig.docTypesPlaceholder')}
        />
        <p className="text-xs text-muted-foreground">
          {t('featureConfig.docTypesHint')}
        </p>
      </div>
    </div>
  );
}

// 대결 설정 폼
function ProxyApprovalForm({
  config,
  onChange,
  t,
}: {
  config: ProxyApprovalConfig;
  onChange: (config: ProxyApprovalConfig) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('featureConfig.maxProxyDays')}</Label>
        <Input
          type="number"
          value={config.maxDays}
          onChange={(e) => onChange({ ...config, maxDays: parseInt(e.target.value) || 30 })}
          min={1}
          max={365}
        />
      </div>

      <div className="space-y-2">
        <Label>{t('featureConfig.proxyDocTypes')}</Label>
        <Input
          value={config.allowedDocTypes?.join(', ') || ''}
          onChange={(e) =>
            onChange({
              ...config,
              allowedDocTypes: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder={t('featureConfig.docTypesPlaceholder')}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label>{t('featureConfig.proxyReasonRequired')}</Label>
          <p className="text-sm text-muted-foreground">{t('featureConfig.proxyReasonRequiredDescription')}</p>
        </div>
        <Switch
          checked={config.requireReason}
          onCheckedChange={(checked) => onChange({ ...config, requireReason: checked })}
        />
      </div>
    </div>
  );
}

// OKR 설정 폼
function OkrForm({
  config,
  onChange,
  t,
}: {
  config: OkrConfig;
  onChange: (config: OkrConfig) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('featureConfig.evaluationCycle')}</Label>
        <Select
          value={config.evaluationCycle}
          onValueChange={(value) =>
            onChange({ ...config, evaluationCycle: value as OkrConfig['evaluationCycle'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="quarterly">{t('featureConfig.cycleQuarterly')}</SelectItem>
            <SelectItem value="half">{t('featureConfig.cycleHalf')}</SelectItem>
            <SelectItem value="yearly">{t('featureConfig.cycleYearly')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('featureConfig.maxKeyResults')}</Label>
        <Input
          type="number"
          value={config.maxKeyResultsPerObjective}
          onChange={(e) =>
            onChange({ ...config, maxKeyResultsPerObjective: parseInt(e.target.value) || 5 })
          }
          min={1}
          max={10}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label>{t('featureConfig.allowSelfEvaluation')}</Label>
          <p className="text-sm text-muted-foreground">{t('featureConfig.allowSelfEvaluationDescription')}</p>
        </div>
        <Switch
          checked={config.allowSelfEvaluation}
          onCheckedChange={(checked) => onChange({ ...config, allowSelfEvaluation: checked })}
        />
      </div>
    </div>
  );
}

// KPI 설정 폼
function KpiForm({
  config,
  onChange,
  t,
}: {
  config: KpiConfig;
  onChange: (config: KpiConfig) => void;
  t: (key: string) => string;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('featureConfig.evaluationCycle')}</Label>
        <Select
          value={config.evaluationCycle}
          onValueChange={(value) =>
            onChange({ ...config, evaluationCycle: value as KpiConfig['evaluationCycle'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">{t('featureConfig.cycleMonthly')}</SelectItem>
            <SelectItem value="quarterly">{t('featureConfig.cycleQuarterly')}</SelectItem>
            <SelectItem value="half">{t('featureConfig.cycleHalf')}</SelectItem>
            <SelectItem value="yearly">{t('featureConfig.cycleYearly')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('featureConfig.ratingScale')}</Label>
        <Select
          value={String(config.ratingScale)}
          onValueChange={(value) =>
            onChange({ ...config, ratingScale: parseInt(value) as KpiConfig['ratingScale'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">{t('featureConfig.ratingScale3')}</SelectItem>
            <SelectItem value="5">{t('featureConfig.ratingScale5')}</SelectItem>
            <SelectItem value="7">{t('featureConfig.ratingScale7')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t('featureConfig.maxIndicators')}</Label>
        <Input
          type="number"
          value={config.maxIndicatorsPerEmployee}
          onChange={(e) =>
            onChange({ ...config, maxIndicatorsPerEmployee: parseInt(e.target.value) || 10 })
          }
          min={1}
          max={30}
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label>{t('featureConfig.weightingEnabled')}</Label>
          <p className="text-sm text-muted-foreground">{t('featureConfig.weightingEnabledDescription')}</p>
        </div>
        <Switch
          checked={config.weightingEnabled}
          onCheckedChange={(checked) => onChange({ ...config, weightingEnabled: checked })}
        />
      </div>
    </div>
  );
}

export function FeatureConfigDialog({
  open,
  onOpenChange,
  featureCode,
  currentConfig,
  onSave,
  isLoading = false,
}: FeatureConfigDialogProps) {
  const { t } = useTranslation('tenant');
  const [config, setConfig] = React.useState<FeatureConfigMap[FeatureCode] | null>(null);

  const feature = featureCode ? TENANT_FEATURES.find((f) => f.code === featureCode) : null;

  React.useEffect(() => {
    if (open && featureCode) {
      setConfig(
        (currentConfig as FeatureConfigMap[FeatureCode]) ||
          DEFAULT_FEATURE_CONFIGS[featureCode]
      );
    }
  }, [open, featureCode, currentConfig]);

  const handleSave = async () => {
    if (!featureCode || !config) return;
    await onSave(featureCode, config);
    onOpenChange(false);
  };

  const renderConfigForm = () => {
    if (!featureCode || !config) return null;

    switch (featureCode) {
      case 'PARALLEL_APPROVAL':
        return (
          <ParallelApprovalForm
            config={config as ParallelApprovalConfig}
            onChange={(c) => setConfig(c)}
            t={t}
          />
        );
      case 'CONSENSUS':
        return (
          <ConsensusForm
            config={config as ConsensusConfig}
            onChange={(c) => setConfig(c)}
            t={t}
          />
        );
      case 'DIRECT_APPROVAL':
        return (
          <DirectApprovalForm
            config={config as DirectApprovalConfig}
            onChange={(c) => setConfig(c)}
            t={t}
          />
        );
      case 'PROXY_APPROVAL':
        return (
          <ProxyApprovalForm
            config={config as ProxyApprovalConfig}
            onChange={(c) => setConfig(c)}
            t={t}
          />
        );
      case 'AUTO_APPROVAL_LINE':
        return (
          <div className="py-4 text-center text-muted-foreground">
            {t('featureConfig.autoApprovalLineNote')}
          </div>
        );
      case 'OKR':
        return <OkrForm config={config as OkrConfig} onChange={(c) => setConfig(c)} t={t} />;
      case 'KPI':
        return <KpiForm config={config as KpiConfig} onChange={(c) => setConfig(c)} t={t} />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            {t('featureConfig.settingsTitle', { name: feature?.name })}
          </DialogTitle>
          <DialogDescription>{feature?.description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">{renderConfigForm()}</div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.saving')}
              </>
            ) : (
              t('common.save')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
