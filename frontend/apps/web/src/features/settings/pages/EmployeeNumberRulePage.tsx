import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
import { apiClient } from '@/lib/apiClient';
import { Save, Loader2, Eye, Hash, Settings2, RefreshCw, Info } from 'lucide-react';

interface EmployeeNumberRule {
  prefix: string;
  includeYear: boolean;
  sequenceDigits: number;
  allowReuse: boolean;
}

export default function EmployeeNumberRulePage() {
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [rule, setRule] = useState<EmployeeNumberRule>({
    prefix: 'EMP',
    includeYear: true,
    sequenceDigits: 3,
    allowReuse: false,
  });

  // Track the saved rule to detect changes
  const [savedRule, setSavedRule] = useState<EmployeeNumberRule>({
    prefix: 'EMP',
    includeYear: true,
    sequenceDigits: 3,
    allowReuse: false,
  });

  const hasChanges = useMemo(() => {
    return (
      rule.prefix !== savedRule.prefix ||
      rule.includeYear !== savedRule.includeYear ||
      rule.sequenceDigits !== savedRule.sequenceDigits ||
      rule.allowReuse !== savedRule.allowReuse
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
    parts.push(t('employeeNumberRule.preview.prefixPart', { prefix: rule.prefix || '???' }));
    if (rule.includeYear) {
      parts.push(t('employeeNumberRule.preview.yearPart'));
    }
    parts.push(t('employeeNumberRule.preview.sequencePart', { digits: rule.sequenceDigits }));
    return parts.join(' + ');
  }, [rule, t]);

  // Fetch current rule on mount
  useEffect(() => {
    const fetchRule = async () => {
      try {
        const response = await apiClient.get('/employees/number-rules');
        const data = response.data;
        if (data.success && data.data) {
          setRule(data.data);
          setSavedRule(data.data);
        }
      } catch {
        toast({
          title: t('employeeNumberRule.toast.loadFailed'),
          description: t('employeeNumberRule.toast.loadFailedDesc'),
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRule();
  }, [toast, t]);

  const handleSave = async () => {
    if (!rule.prefix.trim()) {
      toast({
        title: t('employeeNumberRule.toast.inputError'),
        description: t('employeeNumberRule.toast.inputErrorDesc'),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await apiClient.put('/employees/number-rules', rule);
      const data = response.data;

      if (data.success) {
        setSavedRule(data.data);
        setRule(data.data);
        toast({
          title: t('employeeNumberRule.toast.saveSuccess'),
          description: t('employeeNumberRule.toast.saveSuccessDesc'),
        });
      } else {
        toast({
          title: t('employeeNumberRule.toast.saveFailed'),
          description: data.error?.message || t('employeeNumberRule.toast.saveFailedDesc'),
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: t('employeeNumberRule.toast.saveFailed'),
        description: t('employeeNumberRule.toast.saveError'),
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
        title={t('employeeNumberRule.pageTitle')}
        description={t('employeeNumberRule.pageDescription')}
      />

      <div className="space-y-6">
        {/* Rule Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              {t('employeeNumberRule.ruleConfig.title')}
            </CardTitle>
            <CardDescription>
              {t('employeeNumberRule.ruleConfig.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Prefix */}
            <div className="space-y-2">
              <Label htmlFor="prefix">{t('employeeNumberRule.prefix.label')}</Label>
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
                {t('employeeNumberRule.prefix.description')}
              </p>
            </div>

            {/* Include Year Toggle */}
            <div className="flex items-center justify-between max-w-xs">
              <div className="space-y-0.5">
                <Label htmlFor="includeYear">{t('employeeNumberRule.includeYear.label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('employeeNumberRule.includeYear.description')}
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
              <Label htmlFor="sequenceDigits">{t('employeeNumberRule.sequenceDigits.label')}</Label>
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
                  <SelectValue placeholder={t('employeeNumberRule.sequenceDigits.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">{t('employeeNumberRule.sequenceDigits.option3')}</SelectItem>
                  <SelectItem value="4">{t('employeeNumberRule.sequenceDigits.option4')}</SelectItem>
                  <SelectItem value="5">{t('employeeNumberRule.sequenceDigits.option5')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {t('employeeNumberRule.sequenceDigits.description')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {t('employeeNumberRule.preview.title')}
            </CardTitle>
            <CardDescription>
              {t('employeeNumberRule.preview.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Format Description */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">{t('employeeNumberRule.preview.generationRule')}</Label>
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
              <Label className="text-muted-foreground">{t('employeeNumberRule.preview.exampleLabel')}</Label>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50 border">
                <Hash className="h-5 w-5 text-primary" />
                <span className="text-2xl font-mono font-bold tracking-wider text-primary">
                  {preview}
                </span>
              </div>
            </div>

            {/* Multiple Examples */}
            <div className="space-y-1">
              <Label className="text-muted-foreground text-sm">{t('employeeNumberRule.preview.additionalExamples')}</Label>
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
              {t('employeeNumberRule.recycling.title')}
            </CardTitle>
            <CardDescription>
              {t('employeeNumberRule.recycling.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between max-w-xs">
              <div className="space-y-0.5">
                <Label htmlFor="allowReuse">{t('employeeNumberRule.recycling.toggleLabel')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('employeeNumberRule.recycling.toggleDescription')}
                </p>
              </div>
              <Switch
                id="allowReuse"
                checked={rule.allowReuse}
                onCheckedChange={(checked) =>
                  setRule((prev) => ({ ...prev, allowReuse: checked }))
                }
              />
            </div>
            {rule.allowReuse && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {t('employeeNumberRule.recycling.conditionNotice')}
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
            {isSaving ? t('employeeNumberRule.saving') : t('employeeNumberRule.save')}
          </Button>
        </div>
      </div>
    </>
  );
}
