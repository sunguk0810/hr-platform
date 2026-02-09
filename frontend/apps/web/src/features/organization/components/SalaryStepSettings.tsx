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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('organization');
  const { t: tCommon } = useTranslation('common');
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
        title: t('salaryStep.toast.saveSuccess'),
        description: t('salaryStep.toast.saveSuccessDesc', { gradeName }),
      });
    } catch {
      toast({
        title: t('salaryStep.toast.saveFailed'),
        description: t('salaryStep.toast.saveFailedDesc'),
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
            {t('salaryStep.title', { gradeName })}
          </CardTitle>
          <CardDescription>
            {t('salaryStep.description')}
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleAddRow}>
            <Plus className="mr-1 h-4 w-4" />
            {t('salaryStep.addRow')}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Save className="mr-1 h-4 w-4" />
            {isSaving ? tCommon('saving') : tCommon('save')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {steps.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
            <p className="font-medium">{t('salaryStep.noSteps')}</p>
            <p className="text-sm mt-1">{t('salaryStep.noStepsDescription')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px] text-center">{t('salaryStep.step')}</TableHead>
                <TableHead className="w-[200px]">{t('salaryStep.baseSalary')}</TableHead>
                <TableHead>{t('salaryStep.note')}</TableHead>
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
                      <span className="text-sm text-muted-foreground whitespace-nowrap">{t('salaryStep.currencyUnit')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={step.note}
                      onChange={(e) => handleNoteChange(step.id, e.target.value)}
                      placeholder={t('salaryStep.notePlaceholder')}
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
              {t('salaryStep.totalSteps', { count: steps.length })}
            </span>
            <span className="text-sm font-medium">
              {t('salaryStep.salaryRange')}: {Math.min(...steps.map((s) => s.baseSalary)).toLocaleString()}{t('salaryStep.currencyUnit')} ~{' '}
              {Math.max(...steps.map((s) => s.baseSalary)).toLocaleString()}{t('salaryStep.currencyUnit')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SalaryStepSettings;
