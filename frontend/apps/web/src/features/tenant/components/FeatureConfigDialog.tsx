import * as React from 'react';
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
}: {
  config: ParallelApprovalConfig;
  onChange: (config: ParallelApprovalConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>최소 승인자 수</Label>
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
          병렬 결재자 중 몇 명이 승인해야 하는지 설정합니다.
        </p>
      </div>

      <div className="space-y-2">
        <Label>승인 방식</Label>
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
}: {
  config: ConsensusConfig;
  onChange: (config: ConsensusConfig) => void;
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
        <Label>허용 합의 유형</Label>
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
          <Label>합의 차단</Label>
          <p className="text-sm text-muted-foreground">
            합의 미완료 시 다음 결재 단계 진행 차단
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
}: {
  config: DirectApprovalConfig;
  onChange: (config: DirectApprovalConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>전결 가능 최대 금액</Label>
        <Input
          type="number"
          value={config.maxAmount}
          onChange={(e) => onChange({ ...config, maxAmount: parseInt(e.target.value) || 0 })}
          placeholder="0 (무제한)"
        />
        <p className="text-xs text-muted-foreground">
          0을 입력하면 금액 제한 없이 전결 가능합니다.
        </p>
      </div>

      <div className="space-y-2">
        <Label>전결 가능 문서 유형</Label>
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
          placeholder="쉼표로 구분 (비워두면 전체)"
        />
        <p className="text-xs text-muted-foreground">
          예: 휴가신청, 지출결의, 출장신청
        </p>
      </div>
    </div>
  );
}

// 대결 설정 폼
function ProxyApprovalForm({
  config,
  onChange,
}: {
  config: ProxyApprovalConfig;
  onChange: (config: ProxyApprovalConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>최대 대결 기간 (일)</Label>
        <Input
          type="number"
          value={config.maxDays}
          onChange={(e) => onChange({ ...config, maxDays: parseInt(e.target.value) || 30 })}
          min={1}
          max={365}
        />
      </div>

      <div className="space-y-2">
        <Label>대결 가능 문서 유형</Label>
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
          placeholder="쉼표로 구분 (비워두면 전체)"
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <Label>대결 사유 필수</Label>
          <p className="text-sm text-muted-foreground">대결 지정 시 사유 입력 필수</p>
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
}: {
  config: OkrConfig;
  onChange: (config: OkrConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>평가 주기</Label>
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
            <SelectItem value="quarterly">분기</SelectItem>
            <SelectItem value="half">반기</SelectItem>
            <SelectItem value="yearly">연간</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>목표당 최대 핵심결과 수</Label>
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
          <Label>자기 평가 허용</Label>
          <p className="text-sm text-muted-foreground">직원이 자신의 OKR을 평가할 수 있음</p>
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
}: {
  config: KpiConfig;
  onChange: (config: KpiConfig) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>평가 주기</Label>
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
            <SelectItem value="monthly">월간</SelectItem>
            <SelectItem value="quarterly">분기</SelectItem>
            <SelectItem value="half">반기</SelectItem>
            <SelectItem value="yearly">연간</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>등급 체계</Label>
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
            <SelectItem value="3">3단계 (S/A/B)</SelectItem>
            <SelectItem value="5">5단계 (S/A/B/C/D)</SelectItem>
            <SelectItem value="7">7단계 (S/A+/A/B+/B/C/D)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>직원당 최대 지표 수</Label>
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
          <Label>가중치 사용</Label>
          <p className="text-sm text-muted-foreground">KPI 항목별 가중치 설정 가능</p>
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
          />
        );
      case 'CONSENSUS':
        return (
          <ConsensusForm
            config={config as ConsensusConfig}
            onChange={(c) => setConfig(c)}
          />
        );
      case 'DIRECT_APPROVAL':
        return (
          <DirectApprovalForm
            config={config as DirectApprovalConfig}
            onChange={(c) => setConfig(c)}
          />
        );
      case 'PROXY_APPROVAL':
        return (
          <ProxyApprovalForm
            config={config as ProxyApprovalConfig}
            onChange={(c) => setConfig(c)}
          />
        );
      case 'AUTO_APPROVAL_LINE':
        return (
          <div className="py-4 text-center text-muted-foreground">
            결재선 템플릿은 결재 관리 메뉴에서 설정할 수 있습니다.
          </div>
        );
      case 'OKR':
        return <OkrForm config={config as OkrConfig} onChange={(c) => setConfig(c)} />;
      case 'KPI':
        return <KpiForm config={config as KpiConfig} onChange={(c) => setConfig(c)} />;
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
            {feature?.name} 설정
          </DialogTitle>
          <DialogDescription>{feature?.description}</DialogDescription>
        </DialogHeader>

        <div className="py-4">{renderConfigForm()}</div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              '저장'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
