import * as React from 'react';
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
            모듈 설정
          </CardTitle>
          <CardDescription>
            테넌트에서 사용할 모듈을 선택합니다.
          </CardDescription>
        </div>
        {!readOnly && hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              되돌리기
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  저장
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
                        필수
                      </Badge>
                    )}
                    {isEnabled && !isCore && (
                      <Badge variant="outline" className="text-xs text-green-600">
                        활성
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getModuleDescription(module.code)}
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
            <strong>참고:</strong> 직원 관리와 조직 관리는 기본 모듈로 항상 활성화되어 있습니다.
            모듈을 비활성화하면 해당 기능에 대한 접근이 제한됩니다.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function getModuleDescription(code: string): string {
  const descriptions: Record<string, string> = {
    EMPLOYEE: '직원 정보 등록 및 관리, 인사 발령 처리',
    ORGANIZATION: '부서/팀 구조 관리, 직위/직급 관리',
    ATTENDANCE: '출퇴근 기록, 근태 현황 조회',
    LEAVE: '휴가 신청 및 승인, 휴가 잔여일수 관리',
    APPROVAL: '전자결재 문서 작성 및 결재 처리',
    MDM: '공통코드, 기준정보 관리',
    NOTIFICATION: '알림 발송 및 이력 관리',
  };
  return descriptions[code] || '';
}
