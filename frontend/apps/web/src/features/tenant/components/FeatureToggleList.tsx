import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileCheck, Target, Settings2 } from 'lucide-react';
import { FeatureConfigDialog } from './FeatureConfigDialog';
import type { TenantFeature, FeatureCode, FeatureConfigMap } from '@hr-platform/shared-types';
import { TENANT_FEATURES, DEFAULT_FEATURE_CONFIGS } from '@hr-platform/shared-types';

interface FeatureToggleListProps {
  features: TenantFeature[];
  onToggle: (code: FeatureCode, enabled: boolean, config?: FeatureConfigMap[FeatureCode]) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

interface FeatureGroupProps {
  title: string;
  icon: React.ReactNode;
  features: typeof TENANT_FEATURES;
  enabledFeatures: TenantFeature[];
  onToggle: (code: FeatureCode, enabled: boolean) => Promise<void>;
  onConfigClick: (code: FeatureCode) => void;
  togglingCode: FeatureCode | null;
  readOnly?: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}

function FeatureGroup({
  title,
  icon,
  features,
  enabledFeatures,
  onToggle,
  onConfigClick,
  togglingCode,
  readOnly,
  t,
}: FeatureGroupProps) {
  const getFeature = (code: FeatureCode) => {
    return enabledFeatures.find(f => f.code === code);
  };

  const getConfigSummary = (code: FeatureCode, config?: Record<string, unknown>) => {
    if (!config) return null;

    switch (code) {
      case 'PARALLEL_APPROVAL': {
        const c = config as { minApprovers?: string; approvalMode?: string };
        const labels: Record<string, string> = {
          all: t('featureToggle.configSummary.all'),
          majority: t('featureToggle.configSummary.majority'),
          one: t('featureToggle.configSummary.one'),
        };
        return labels[c.minApprovers || 'all'] || '';
      }
      case 'PROXY_APPROVAL': {
        const c = config as { maxDays?: number };
        return c.maxDays ? t('featureToggle.configSummary.maxDays', { days: c.maxDays }) : '';
      }
      case 'OKR':
      case 'KPI': {
        const c = config as { evaluationCycle?: string };
        const labels: Record<string, string> = {
          monthly: t('featureToggle.configSummary.monthly'),
          quarterly: t('featureToggle.configSummary.quarterly'),
          half: t('featureToggle.configSummary.half'),
          yearly: t('featureToggle.configSummary.yearly'),
        };
        return labels[c.evaluationCycle || 'quarterly'] || '';
      }
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
        <CardDescription>
          {title} {t('featureToggle.relatedFeatures')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {features.map((feature) => {
          const featureData = getFeature(feature.code);
          const isEnabled = featureData?.enabled ?? false;
          const isToggling = togglingCode === feature.code;
          const configSummary = getConfigSummary(feature.code, featureData?.config as unknown as Record<string, unknown>);

          return (
            <div
              key={feature.code}
              className="flex items-center justify-between rounded-lg border p-4"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Label className="font-medium">{feature.name}</Label>
                  {isEnabled && (
                    <Badge variant="secondary" className="text-xs">
                      {t('featureToggle.enabled')}
                    </Badge>
                  )}
                  {isEnabled && configSummary && (
                    <Badge variant="outline" className="text-xs">
                      {configSummary}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
              <div className="flex items-center gap-2 ml-4">
                {isEnabled && !readOnly && feature.code !== 'AUTO_APPROVAL_LINE' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onConfigClick(feature.code)}
                    title={t('featureToggle.detailSettings')}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                )}
                {isToggling && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => onToggle(feature.code, checked)}
                  disabled={readOnly || isToggling}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function FeatureToggleList({
  features,
  onToggle,
  isLoading = false,
  readOnly = false,
}: FeatureToggleListProps) {
  const { t } = useTranslation('tenant');
  const [togglingCode, setTogglingCode] = React.useState<FeatureCode | null>(null);
  const [configDialogCode, setConfigDialogCode] = React.useState<FeatureCode | null>(null);
  const [savingConfig, setSavingConfig] = React.useState(false);

  const handleToggle = async (code: FeatureCode, enabled: boolean) => {
    setTogglingCode(code);
    try {
      // 활성화할 때 기본 config도 함께 전달
      const defaultConfig = enabled ? DEFAULT_FEATURE_CONFIGS[code] : undefined;
      await onToggle(code, enabled, defaultConfig);
    } finally {
      setTogglingCode(null);
    }
  };

  const handleConfigSave = async (code: FeatureCode, config: FeatureConfigMap[FeatureCode]) => {
    setSavingConfig(true);
    try {
      await onToggle(code, true, config);
    } finally {
      setSavingConfig(false);
    }
  };

  const getCurrentConfig = (code: FeatureCode) => {
    const feature = features.find(f => f.code === code);
    return feature?.config as FeatureConfigMap[FeatureCode] | undefined;
  };

  // 그룹별 기능 분리
  const approvalFeatures = TENANT_FEATURES.filter(f => f.group === '결재');
  const performanceFeatures = TENANT_FEATURES.filter(f => f.group === '성과');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <FeatureGroup
          title={t('featureToggle.groups.approval')}
          icon={<FileCheck className="h-5 w-5" />}
          features={approvalFeatures}
          enabledFeatures={features}
          onToggle={handleToggle}
          onConfigClick={setConfigDialogCode}
          togglingCode={togglingCode}
          readOnly={readOnly}
          t={t}
        />

        <FeatureGroup
          title={t('featureToggle.groups.performance')}
          icon={<Target className="h-5 w-5" />}
          features={performanceFeatures}
          enabledFeatures={features}
          onToggle={handleToggle}
          onConfigClick={setConfigDialogCode}
          togglingCode={togglingCode}
          readOnly={readOnly}
          t={t}
        />
      </div>

      <FeatureConfigDialog
        open={!!configDialogCode}
        onOpenChange={(open) => !open && setConfigDialogCode(null)}
        featureCode={configDialogCode}
        currentConfig={configDialogCode ? getCurrentConfig(configDialogCode) : undefined}
        onSave={handleConfigSave}
        isLoading={savingConfig}
      />
    </>
  );
}
