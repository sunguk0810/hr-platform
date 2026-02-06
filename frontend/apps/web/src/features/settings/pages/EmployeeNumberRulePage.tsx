import { useState, useEffect, useMemo } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { Save, Loader2, Eye, Hash, Settings2, RefreshCw, Info } from 'lucide-react';

interface EmployeeNumberRule {
  prefix: string;
  includeYear: boolean;
  sequenceDigits: number;
  allowRecycling: boolean;
}

export default function EmployeeNumberRulePage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [rule, setRule] = useState<EmployeeNumberRule>({
    prefix: 'EMP',
    includeYear: true,
    sequenceDigits: 3,
    allowRecycling: false,
  });

  // Track the saved rule to detect changes
  const [savedRule, setSavedRule] = useState<EmployeeNumberRule>({
    prefix: 'EMP',
    includeYear: true,
    sequenceDigits: 3,
    allowRecycling: false,
  });

  const hasChanges = useMemo(() => {
    return (
      rule.prefix !== savedRule.prefix ||
      rule.includeYear !== savedRule.includeYear ||
      rule.sequenceDigits !== savedRule.sequenceDigits ||
      rule.allowRecycling !== savedRule.allowRecycling
    );
  }, [rule, savedRule]);

  // Generate preview based on current rule
  const preview = useMemo(() => {
    const year = new Date().getFullYear().toString();
    const sampleSeq = '1'.padStart(rule.sequenceDigits, '0');

    let result = rule.prefix;
    if (rule.includeYear) {
      result += year;
    }
    result += sampleSeq;

    return result;
  }, [rule]);

  // Format description
  const formatDescription = useMemo(() => {
    const parts: string[] = [];
    parts.push(`접두사(${rule.prefix || '???'})`);
    if (rule.includeYear) {
      parts.push('연도(4자리)');
    }
    parts.push(`순번(${rule.sequenceDigits}자리)`);
    return parts.join(' + ');
  }, [rule]);

  // Fetch current rule on mount
  useEffect(() => {
    const fetchRule = async () => {
      try {
        const response = await fetch('/api/v1/settings/employee-number-rule');
        const data = await response.json();
        if (data.success) {
          setRule(data.data);
          setSavedRule(data.data);
        }
      } catch {
        toast({
          title: '설정 조회 실패',
          description: '사번 규칙을 불러올 수 없습니다.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRule();
  }, [toast]);

  const handleSave = async () => {
    if (!rule.prefix.trim()) {
      toast({
        title: '입력 오류',
        description: '접두사를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/v1/settings/employee-number-rule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule),
      });
      const data = await response.json();

      if (data.success) {
        setSavedRule(data.data);
        setRule(data.data);
        toast({
          title: '저장 완료',
          description: '사번 규칙이 저장되었습니다.',
        });
      } else {
        toast({
          title: '저장 실패',
          description: data.error?.message || '사번 규칙 저장에 실패했습니다.',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: '저장 실패',
        description: '사번 규칙 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="사번 규칙 설정"
        description="직원 등록 시 자동 생성되는 사번의 형식을 설정합니다."
      />

      <div className="space-y-6">
        {/* Rule Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              사번 생성 규칙
            </CardTitle>
            <CardDescription>
              사번은 접두사, 연도, 순번의 조합으로 자동 생성됩니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prefix */}
            <div className="space-y-2">
              <Label htmlFor="prefix">접두사 (Prefix)</Label>
              <Input
                id="prefix"
                value={rule.prefix}
                onChange={(e) =>
                  setRule((prev) => ({
                    ...prev,
                    prefix: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="EMP"
                maxLength={10}
                className="max-w-xs"
              />
              <p className="text-sm text-muted-foreground">
                사번 앞에 붙는 문자열입니다. 예: EMP, ELEC, HR
              </p>
            </div>

            {/* Include Year Toggle */}
            <div className="flex items-center justify-between max-w-xs">
              <div className="space-y-0.5">
                <Label htmlFor="includeYear">연도 포함</Label>
                <p className="text-sm text-muted-foreground">
                  사번에 4자리 연도를 포함합니다.
                </p>
              </div>
              <Switch
                id="includeYear"
                checked={rule.includeYear}
                onCheckedChange={(checked) =>
                  setRule((prev) => ({ ...prev, includeYear: checked }))
                }
              />
            </div>

            {/* Sequence Digits */}
            <div className="space-y-2">
              <Label htmlFor="sequenceDigits">순번 자릿수</Label>
              <Select
                value={String(rule.sequenceDigits)}
                onValueChange={(value) =>
                  setRule((prev) => ({
                    ...prev,
                    sequenceDigits: parseInt(value, 10),
                  }))
                }
              >
                <SelectTrigger id="sequenceDigits" className="max-w-xs">
                  <SelectValue placeholder="자릿수 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3자리 (001 ~ 999)</SelectItem>
                  <SelectItem value="4">4자리 (0001 ~ 9999)</SelectItem>
                  <SelectItem value="5">5자리 (00001 ~ 99999)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                순번의 자릿수를 설정합니다. 큰 조직일수록 높은 자릿수를 권장합니다.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              미리보기
            </CardTitle>
            <CardDescription>
              현재 설정으로 생성될 사번의 형식입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Format Description */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">생성 규칙</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="secondary">{rule.prefix || '???'}</Badge>
                {rule.includeYear && (
                  <>
                    <span className="text-muted-foreground">+</span>
                    <Badge variant="secondary">
                      {new Date().getFullYear()}
                    </Badge>
                  </>
                )}
                <span className="text-muted-foreground">+</span>
                <Badge variant="secondary">
                  {'0'.repeat(rule.sequenceDigits - 1)}1
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{formatDescription}</p>
            </div>

            {/* Example Preview */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">사번 예시</Label>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                <Hash className="h-5 w-5 text-primary" />
                <span className="text-2xl font-mono font-bold tracking-wider text-primary">
                  {preview}
                </span>
              </div>
            </div>

            {/* Multiple Examples */}
            <div className="space-y-1">
              <Label className="text-muted-foreground text-sm">추가 예시</Label>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 10, 100].map((seq) => {
                  const seqStr = String(seq).padStart(rule.sequenceDigits, '0');
                  let example = rule.prefix;
                  if (rule.includeYear) {
                    example += new Date().getFullYear();
                  }
                  example += seqStr;
                  return (
                    <span
                      key={seq}
                      className="text-sm font-mono px-2 py-1 bg-muted rounded"
                    >
                      {example}
                    </span>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Employee Number Recycling Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              퇴직자 사번 재활용
            </CardTitle>
            <CardDescription>
              퇴직한 직원의 사번을 신규 직원에게 재할당할 수 있도록 허용합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between max-w-xs">
              <div className="space-y-0.5">
                <Label htmlFor="allowRecycling">퇴직자 사번 재활용 허용</Label>
                <p className="text-sm text-muted-foreground">
                  퇴직자의 사번을 신규 직원에게 재할당합니다.
                </p>
              </div>
              <Switch
                id="allowRecycling"
                checked={rule.allowRecycling}
                onCheckedChange={(checked) =>
                  setRule((prev) => ({ ...prev, allowRecycling: checked }))
                }
              />
            </div>
            {rule.allowRecycling && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  재활용 가능 조건: 퇴직 후 1년 이상 경과한 사번만 재활용 가능
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving || !hasChanges || !rule.prefix.trim()}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>
    </>
  );
}
