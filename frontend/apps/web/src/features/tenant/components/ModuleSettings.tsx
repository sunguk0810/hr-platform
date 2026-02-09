import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Check, Package } from 'lucide-react';
import { TENANT_MODULES } from '@hr-platform/shared-types';

export interface ModuleSettingsProps {
  enabledModules: string[];
  onSave: (modules: string[]) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function ModuleSettings({
  enabledModules,
  onSave,
  isLoading = false,
  readOnly = false,
}: ModuleSettingsProps) {
  const { t } = useTranslation('tenant');
  const [selectedModules, setSelectedModules] = React.useState<string[]>(enabledModules);
  const [isSaving, setIsSaving] = React.useState(false);

  // 변경 여부 확인
  const hasChanges = React.useMemo(() => {
    const sorted1 = [...enabledModules].sort();
    const sorted2 = [...selectedModules].sort();
    return JSON.stringify(sorted1) !== JSON.stringify(sorted2);
  }, [enabledModules, selectedModules]);

  // enabledModules가 변경되면 selectedModules 업데이트
  React.useEffect(() => {
    setSelectedModules(enabledModules);
  }, [enabledModules]);

  const handleToggle = (moduleCode: string, enabled: boolean) => {
    if (readOnly) return;

    if (enabled) {
      setSelectedModules(prev => [...prev, moduleCode]);
    } else {
      setSelectedModules(prev => prev.filter(m => m !== moduleCode));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(selectedModules);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedModules(enabledModules);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('moduleSettings.title')}
          </CardTitle>
          <CardDescription>
            {t('moduleSettings.description')}
          </CardDescription>
        </div>
        {!readOnly && hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              {t('moduleSettings.revert')}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  {t('common.save')}
                </>
              )}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {TENANT_MODULES.map((module) => {
            const isEnabled = selectedModules.includes(module.code);
            const isCore = module.code === 'EMPLOYEE' || module.code === 'ORGANIZATION';

            return (
              <div
                key={module.code}
                className={`flex items-center justify-between rounded-lg border p-4 ${
                  isEnabled ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">{module.name}</Label>
                    {isCore && (
                      <Badge variant="secondary" className="text-xs">
                        {t('moduleSettings.required')}
                      </Badge>
                    )}
                    {isEnabled && !isCore && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        {t('moduleSettings.active')}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t(`moduleSettings.modules.${module.code}`)}
                  </p>
                </div>
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => handleToggle(module.code, checked)}
                  disabled={readOnly || isCore || isSaving}
                />
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>{t('common.notePrefix')}</strong> {t('moduleSettings.note')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
