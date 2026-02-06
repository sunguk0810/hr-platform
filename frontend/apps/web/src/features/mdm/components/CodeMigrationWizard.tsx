import { useState, useEffect } from 'react';
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
          <DialogTitle>코드 마이그레이션</DialogTitle>
          <DialogDescription>
            {step === 'select' && '원본 코드와 대상 코드를 선택하세요.'}
            {step === 'preview' && '마이그레이션 영향을 확인하고 사유를 입력하세요.'}
            {step === 'complete' && '마이그레이션이 완료되었습니다.'}
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
              <Label>코드그룹</Label>
              <Select
                value={groupCode}
                onValueChange={(value) => {
                  setGroupCode(value);
                  setSelectedSourceId('');
                  setSelectedTargetId('');
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="코드그룹 선택" />
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
                <Label>원본 코드</Label>
                <Select value={selectedSourceId} onValueChange={setSelectedSourceId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="원본 코드 선택" />
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
                          label={selectedSource.active ? '활성' : '비활성'}
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
                <Label>대상 코드</Label>
                <Select value={selectedTargetId} onValueChange={setSelectedTargetId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="대상 코드 선택" />
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
                          label={selectedTarget.active ? '활성' : '비활성'}
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
                  원본 코드와 대상 코드는 서로 달라야 합니다.
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
                    <h4 className="font-medium">영향 분석</h4>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">총 영향 레코드</span>
                        <span className="font-medium">{previewData.data.totalAffectedRecords}건</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">예상 소요 시간</span>
                        <span className="font-medium">{previewData.data.estimatedDuration}</span>
                      </div>
                    </div>
                    {previewData.data.affectedTables.length > 0 && (
                      <div className="mt-3 space-y-1">
                        <div className="text-sm font-medium">영향받는 테이블</div>
                        {previewData.data.affectedTables.map((table, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="font-mono text-muted-foreground">{table.tableName}</span>
                            <span>{table.recordCount}건</span>
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
                  <Label htmlFor="migration-reason">마이그레이션 사유 *</Label>
                  <Textarea
                    id="migration-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="코드를 통합하는 사유를 입력하세요."
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
                    마이그레이션 후 원본 코드를 폐기(Deprecated) 상태로 변경
                  </Label>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                미리보기 데이터를 불러올 수 없습니다.
              </div>
            )}
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 'complete' && result && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center justify-center text-center">
              <CheckCircle className="h-16 w-16 text-green-500" />
              <h3 className="mt-4 text-lg font-medium">마이그레이션 완료</h3>
              <p className="text-muted-foreground">
                {result.totalMigrated}건의 데이터가 성공적으로 마이그레이션되었습니다.
              </p>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">원본 코드</span>
                    <span className="font-mono">{result.sourceCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">대상 코드</span>
                    <span className="font-mono">{result.targetCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">마이그레이션 건수</span>
                    <span>{result.totalMigrated}건</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">완료 시간</span>
                    <span>{new Date(result.completedAt).toLocaleString('ko-KR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">상태</span>
                    <StatusBadge
                      status={result.status === 'COMPLETED' ? 'success' : 'error'}
                      label={result.status === 'COMPLETED' ? '완료' : '실패'}
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
                취소
              </Button>
              <Button onClick={handleNextStep} disabled={!canProceed()}>
                다음
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={handlePrevStep}>
                이전
              </Button>
              <Button
                onClick={handleMigrate}
                disabled={!canProceed() || migrateMutation.isPending}
              >
                {migrateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    마이그레이션 중...
                  </>
                ) : (
                  '마이그레이션 실행'
                )}
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button onClick={() => onOpenChange(false)}>
              닫기
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
