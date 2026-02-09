import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
import { StatusBadge } from '@/components/common/StatusBadge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowRight, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import {
  useCommonCodeList,
  useCodeGroupList,
  useMigrationPreview,
  useMigrateCode,
} from '../hooks/useMdm';
import type { CommonCodeListItem, MigrationResult } from '@hr-platform/shared-types';

interface CodeMigrationWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceCode?: CommonCodeListItem;
}

type WizardStep = 'select' | 'preview' | 'complete';

export function CodeMigrationWizard({ open, onOpenChange, sourceCode }: CodeMigrationWizardProps) {
  const { t } = useTranslation('mdm');
  const [step, setStep] = useState<WizardStep>('select');
  const [selectedSourceId, setSelectedSourceId] = useState<string>(sourceCode?.id || '');
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [groupCode, setGroupCode] = useState<string>(sourceCode?.groupCode || '');
  const [reason, setReason] = useState('');
  const [deprecateSource, setDeprecateSource] = useState(true);
  const [result, setResult] = useState<MigrationResult | null>(null);

  const { data: codeGroupsData } = useCodeGroupList({ size: 100 });
  const codeGroups = codeGroupsData?.data ?? [];

  const { data: codesData } = useCommonCodeList({ groupCode, size: 100 });
  const codes = codesData?.data?.content ?? [];

  const { data: previewData, isLoading: previewLoading, refetch: refetchPreview } = useMigrationPreview(
    selectedSourceId,
    selectedTargetId,
    step === 'preview' && !!selectedSourceId && !!selectedTargetId
  );

  const migrateMutation = useMigrateCode();

  const selectedSource = codes.find(c => c.id === selectedSourceId);
  const selectedTarget = codes.find(c => c.id === selectedTargetId);

  useEffect(() => {
    if (open && sourceCode) {
      setSelectedSourceId(sourceCode.id);
      setGroupCode(sourceCode.groupCode);
    }
  }, [open, sourceCode]);

  useEffect(() => {
    if (!open) {
      setStep('select');
      setSelectedSourceId(sourceCode?.id || '');
      setSelectedTargetId('');
      setGroupCode(sourceCode?.groupCode || '');
      setReason('');
      setDeprecateSource(true);
      setResult(null);
    }
  }, [open, sourceCode]);

  const handleNextStep = () => {
    if (step === 'select') {
      setStep('preview');
      refetchPreview();
    }
  };

  const handlePrevStep = () => {
    if (step === 'preview') {
      setStep('select');
    }
  };

  const handleMigrate = async () => {
    if (!selectedSourceId || !selectedTargetId || !reason) return;

    try {
      const response = await migrateMutation.mutateAsync({
        sourceCodeId: selectedSourceId,
        targetCodeId: selectedTargetId,
        reason,
        deprecateSource,
      });
      setResult(response.data);
      setStep('complete');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  };

  const canProceed = () => {
    if (step === 'select') {
      return selectedSourceId && selectedTargetId && selectedSourceId !== selectedTargetId;
    }
    if (step === 'preview') {
      return !!reason && !previewLoading && previewData?.data;
    }
    return false;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('migration.wizardTitle')}</DialogTitle>
          <DialogDescription>
            {step === 'select' && t('migration.steps.selectDescription')}
            {step === 'preview' && t('migration.steps.previewDescription')}
            {step === 'complete' && t('migration.steps.completeDescription')}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center gap-2 py-4">
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
            step === 'select' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            1
          </div>
          <div className="h-px w-12 bg-border" />
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
            step === 'preview' ? 'bg-primary text-primary-foreground' :
            step === 'complete' ? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
          <div className="h-px w-12 bg-border" />
          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
            step === 'complete' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            3
          </div>
        </div>

        {/* Step 1: Select Codes */}
        {step === 'select' && (
          <div className="space-y-4">
            <div>
              <Label>{t('migration.fields.codeGroupLabel')}</Label>
              <Select
                value={groupCode}
                onValueChange={(value) => {
                  setGroupCode(value);
                  setSelectedSourceId('');
                  setSelectedTargetId('');
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={t('migration.fields.codeGroupPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {codeGroups.map((group) => (
                    <SelectItem key={group.id} value={group.groupCode}>
                      {group.groupName} ({group.groupCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label>{t('migration.fields.sourceCodeLabel')}</Label>
                <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t('migration.fields.sourceCodePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {codes
                      .filter(c => c.id !== selectedTargetId)
                      .map((code) => (
                        <SelectItem key={code.id} value={code.id}>
                          {code.code} - {code.codeName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedSource && (
                  <Card className="mt-2">
                    <CardContent className="p-3">
                      <div className="text-sm">
                        <span className="font-mono font-medium">{selectedSource.code}</span>
                        <span className="ml-2 text-muted-foreground">{selectedSource.codeName}</span>
                      </div>
                      <div className="mt-1">
                        <StatusBadge
                          status={selectedSource.active ? 'success' : 'default'}
                          label={selectedSource.active ? t('common.statusActive') : t('common.statusInactive')}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex items-center justify-center pt-6">
                <ArrowRight className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="flex-1">
                <Label>{t('migration.fields.targetCodeLabel')}</Label>
                <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder={t('migration.fields.targetCodePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {codes
                      .filter(c => c.id !== selectedSourceId)
                      .map((code) => (
                        <SelectItem key={code.id} value={code.id}>
                          {code.code} - {code.codeName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedTarget && (
                  <Card className="mt-2">
                    <CardContent className="p-3">
                      <div className="text-sm">
                        <span className="font-mono font-medium">{selectedTarget.code}</span>
                        <span className="ml-2 text-muted-foreground">{selectedTarget.codeName}</span>
                      </div>
                      <div className="mt-1">
                        <StatusBadge
                          status={selectedTarget.active ? 'success' : 'default'}
                          label={selectedTarget.active ? t('common.statusActive') : t('common.statusInactive')}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            {selectedSourceId && selectedTargetId && selectedSourceId === selectedTargetId && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('migration.fields.sameCodeError')}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Step 2: Preview & Confirm */}
        {step === 'preview' && (
          <div className="space-y-4">
            {previewLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : previewData?.data ? (
              <>
                <div className="flex items-center gap-4 rounded-lg bg-muted p-4">
                  <div className="flex-1 text-center">
                    <div className="font-mono font-medium">{previewData.data.sourceCode.code}</div>
                    <div className="text-sm text-muted-foreground">{previewData.data.sourceCode.name}</div>
                  </div>
                  <ArrowRight className="h-6 w-6" />
                  <div className="flex-1 text-center">
                    <div className="font-mono font-medium">{previewData.data.targetCode.code}</div>
                    <div className="text-sm text-muted-foreground">{previewData.data.targetCode.name}</div>
                  </div>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium">{t('migration.impactAnalysis.title')}</h4>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('migration.impactAnalysis.totalAffectedRecords')}</span>
                        <span className="font-medium">{t('common.recordCount', { count: previewData.data.totalAffectedRecords })}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{t('migration.impactAnalysis.estimatedDuration')}</span>
                        <span className="font-medium">{previewData.data.estimatedDuration}</span>
                      </div>
                    </div>
                    {previewData.data.affectedTables.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="text-sm font-medium">{t('migration.impactAnalysis.affectedTables')}</div>
                        {previewData.data.affectedTables.map((table, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="font-mono text-muted-foreground">{table.tableName}</span>
                            <span>{t('common.recordCount', { count: table.recordCount })}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {previewData.data.warnings.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="space-y-1">
                        {previewData.data.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div>
                  <Label htmlFor="migration-reason">{t('migration.fields.reasonLabel')}</Label>
                  <Textarea
                    id="migration-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t('migration.fields.reasonPlaceholder')}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="deprecate-source"
                    checked={deprecateSource}
                    onChange={(e) => setDeprecateSource(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="deprecate-source" className="text-sm font-normal">
                    {t('migration.fields.deprecateSourceLabel')}
                  </Label>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                {t('migration.previewError')}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 'complete' && result && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h3 className="mt-4 text-lg font-medium">{t('migration.completion.title')}</h3>
              <p className="text-muted-foreground">
                {t('migration.completion.description', { count: result.totalMigrated })}
              </p>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('migration.completion.sourceCode')}</span>
                    <span className="font-mono">{result.sourceCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('migration.completion.targetCode')}</span>
                    <span className="font-mono">{result.targetCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('migration.completion.migratedCount')}</span>
                    <span>{t('common.recordCount', { count: result.totalMigrated })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('migration.completion.completedAt')}</span>
                    <span>{new Date(result.completedAt).toLocaleString('ko-KR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('migration.completion.status')}</span>
                    <StatusBadge
                      status={result.status === 'COMPLETED' ? 'success' : 'error'}
                      label={result.status === 'COMPLETED' ? t('migration.completion.statusCompleted') : t('migration.completion.statusFailed')}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {step === 'select' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t('common.cancelButton')}
              </Button>
              <Button onClick={handleNextStep} disabled={!canProceed()}>
                {t('common.nextButton')}
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handlePrevStep}>
                {t('common.prevButton')}
              </Button>
              <Button
                onClick={handleMigrate}
                disabled={!canProceed() || migrateMutation.isPending}
              >
                {migrateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('migration.migratingText')}
                  </>
                ) : (
                  t('migration.migrateButton')
                )}
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={() => onOpenChange(false)}>
              {t('common.closeButton')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
