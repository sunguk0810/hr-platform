import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/useToast';
import { Plus, Trash2, Save, DollarSign } from 'lucide-react';

interface SalaryStep {
  id: string;
  stepNumber: number;
  baseSalary: number;
  note: string;
}

interface SalaryStepSettingsProps {
  gradeId: string;
  gradeName: string;
}

const MOCK_SALARY_STEPS: SalaryStep[] = [
  { id: 'ss-1', stepNumber: 1, baseSalary: 3000000, note: '신입' },
  { id: 'ss-2', stepNumber: 2, baseSalary: 3200000, note: '' },
  { id: 'ss-3', stepNumber: 3, baseSalary: 3500000, note: '' },
  { id: 'ss-4', stepNumber: 4, baseSalary: 3800000, note: '' },
  { id: 'ss-5', stepNumber: 5, baseSalary: 4200000, note: '승진 기준' },
];

let nextId = 6;

export function SalaryStepSettings({ gradeId: _gradeId, gradeName }: SalaryStepSettingsProps) {
  const { toast } = useToast();
  const [steps, setSteps] = useState<SalaryStep[]>(MOCK_SALARY_STEPS);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddRow = useCallback(() => {
    const newStepNumber = steps.length > 0 ? Math.max(...steps.map((s) => s.stepNumber)) + 1 : 1;
    const lastSalary = steps.length > 0 ? steps[steps.length - 1].baseSalary : 3000000;
    const newStep: SalaryStep = {
      id: `ss-${nextId++}`,
      stepNumber: newStepNumber,
      baseSalary: lastSalary + 200000,
      note: '',
    };
    setSteps((prev) => [...prev, newStep]);
  }, [steps]);

  const handleDeleteRow = useCallback((id: string) => {
    setSteps((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      return filtered.map((s, idx) => ({ ...s, stepNumber: idx + 1 }));
    });
  }, []);

  const handleSalaryChange = useCallback((id: string, value: string) => {
    const numericValue = parseInt(value.replace(/[^0-9]/g, ''), 10) || 0;
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, baseSalary: numericValue } : s)));
  }, []);

  const handleNoteChange = useCallback((id: string, value: string) => {
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, note: value } : s)));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: '저장 완료',
        description: `${gradeName} 직급의 호봉 설정이 저장되었습니다.`,
      });
    } catch {
      toast({
        title: '저장 실패',
        description: '호봉 설정 저장 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            호봉 설정 - {gradeName}
          </CardTitle>
          <CardDescription>
            직급별 호봉 기본급을 설정합니다. 호봉은 근속 연수에 따라 자동 적용됩니다.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddRow}>
            <Plus className="mr-1 h-4 w-4" />
            행 추가
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-1 h-4 w-4" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {steps.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium">등록된 호봉이 없습니다</p>
            <p className="text-sm mt-1">행 추가 버튼을 눌러 호봉을 등록해주세요.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">호봉</TableHead>
                <TableHead className="w-[200px]">기본급 (원)</TableHead>
                <TableHead>비고</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {steps.map((step) => (
                <TableRow key={step.id}>
                  <TableCell className="text-center font-medium">{step.stepNumber}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={step.baseSalary.toLocaleString()}
                        onChange={(e) => handleSalaryChange(step.id, e.target.value)}
                        className="w-[180px] text-right"
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">원</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={step.note}
                      onChange={(e) => handleNoteChange(step.id, e.target.value)}
                      placeholder="비고 입력"
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteRow(step.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {steps.length > 0 && (
          <div className="mt-4 flex justify-between items-center px-4 py-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">
              총 {steps.length}개 호봉
            </span>
            <span className="text-sm font-medium">
              기본급 범위: {Math.min(...steps.map((s) => s.baseSalary)).toLocaleString()}원 ~{' '}
              {Math.max(...steps.map((s) => s.baseSalary)).toLocaleString()}원
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SalaryStepSettings;
