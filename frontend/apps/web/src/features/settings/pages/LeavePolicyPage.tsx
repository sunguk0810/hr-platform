import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/useToast';
import { CalendarDays, Save } from 'lucide-react';
import { LeaveUsageConditions } from '../components/LeaveUsageConditions';
import { LeaveApprovalLineRules } from '../components/LeaveApprovalLineRules';

interface TenureBonusRow {
  id: string;
  yearFrom: number;
  yearTo: number | null;
  bonusDays: number;
}

interface SpecialLeaveRow {
  id: string;
  name: string;
  days: number;
  description: string;
}

export default function LeavePolicyPage() {
  const { t } = useTranslation('settings');
  const { toast } = useToast();

  // Basic Annual Leave Settings
  const [monthlyAccrualCount, setMonthlyAccrualCount] = useState(1);
  const [baseAnnualDays, setBaseAnnualDays] = useState(15);

  // Tenure-based bonus days table
  const [tenureBonusRows, setTenureBonusRows] = useState<TenureBonusRow[]>([
    { id: 'tb-1', yearFrom: 3, yearTo: 5, bonusDays: 1 },
    { id: 'tb-2', yearFrom: 5, yearTo: 10, bonusDays: 3 },
    { id: 'tb-3', yearFrom: 10, yearTo: 15, bonusDays: 5 },
    { id: 'tb-4', yearFrom: 15, yearTo: 20, bonusDays: 7 },
    { id: 'tb-5', yearFrom: 20, yearTo: null, bonusDays: 10 },
  ]);

  // Special Leave Settings
  const [specialLeaves, setSpecialLeaves] = useState<SpecialLeaveRow[]>([
    { id: 'sl-1', name: '결혼', days: 5, description: '본인 결혼' },
    { id: 'sl-2', name: '출산', days: 10, description: '배우자 출산 시' },
    { id: 'sl-3', name: '사망 (배우자)', days: 5, description: '배우자 사망' },
    { id: 'sl-4', name: '사망 (부모)', days: 5, description: '본인 또는 배우자의 부모 사망' },
    { id: 'sl-5', name: '사망 (자녀)', days: 5, description: '자녀 사망' },
    { id: 'sl-6', name: '사망 (조부모/형제)', days: 3, description: '조부모 또는 형제자매 사망' },
    { id: 'sl-7', name: '자녀 결혼', days: 1, description: '자녀 결혼' },
    { id: 'sl-8', name: '생일', days: 0.5, description: '본인 생일 (반차)' },
  ]);

  // Carry-over Policy
  const [carryOverEnabled, setCarryOverEnabled] = useState(true);
  const [maxCarryOverDays, setMaxCarryOverDays] = useState(5);
  const [carryOverExpiry, setCarryOverExpiry] = useState('6');

  const handleTenureBonusChange = (id: string, field: keyof TenureBonusRow, value: number | null) => {
    setTenureBonusRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const handleSpecialLeaveChange = (id: string, days: number) => {
    setSpecialLeaves((prev) =>
      prev.map((row) => (row.id === id ? { ...row, days } : row))
    );
  };

  const handleSave = () => {
    toast({
      title: t('leavePolicy.toast.saveSuccess'),
      description: t('leavePolicy.toast.saveSuccessDesc'),
    });
  };

  return (
    <>
      <PageHeader
        title={t('leavePolicy.pageTitle')}
        description={t('leavePolicy.pageDescription')}
        actions={
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            {t('leavePolicy.save')}
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Basic Annual Leave Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{t('leavePolicy.basicSettings.title')}</CardTitle>
                <CardDescription>{t('leavePolicy.basicSettings.description')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="monthlyAccrual">{t('leavePolicy.basicSettings.monthlyAccrual')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="monthlyAccrual"
                    type="number"
                    min={0}
                    max={5}
                    step={0.5}
                    value={monthlyAccrualCount}
                    onChange={(e) => setMonthlyAccrualCount(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">{t('leavePolicy.basicSettings.monthlyAccrualUnit')}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('leavePolicy.basicSettings.monthlyAccrualDescription')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="baseAnnualDays">{t('leavePolicy.basicSettings.baseAnnualDays')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="baseAnnualDays"
                    type="number"
                    min={0}
                    max={30}
                    value={baseAnnualDays}
                    onChange={(e) => setBaseAnnualDays(Number(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">{t('leavePolicy.basicSettings.baseAnnualDaysUnit')}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('leavePolicy.basicSettings.baseAnnualDaysDescription')}
                </p>
              </div>
            </div>

            {/* Tenure-based bonus days table */}
            <div className="space-y-3">
              <Label>{t('leavePolicy.tenureBonus.label')}</Label>
              <p className="text-xs text-muted-foreground">
                {t('leavePolicy.tenureBonus.description')}
              </p>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">{t('leavePolicy.tenureBonus.yearFromHeader')}</TableHead>
                      <TableHead className="w-[140px]">{t('leavePolicy.tenureBonus.yearToHeader')}</TableHead>
                      <TableHead className="w-[140px]">{t('leavePolicy.tenureBonus.bonusDaysHeader')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenureBonusRows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            value={row.yearFrom}
                            onChange={(e) =>
                              handleTenureBonusChange(row.id, 'yearFrom', Number(e.target.value))
                            }
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          {row.yearTo !== null ? (
                            <Input
                              type="number"
                              min={row.yearFrom + 1}
                              value={row.yearTo}
                              onChange={(e) =>
                                handleTenureBonusChange(row.id, 'yearTo', Number(e.target.value))
                              }
                              className="w-20"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground">{t('leavePolicy.tenureBonus.andAbove')}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={0}
                              max={30}
                              value={row.bonusDays}
                              onChange={(e) =>
                                handleTenureBonusChange(row.id, 'bonusDays', Number(e.target.value))
                              }
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">{t('leavePolicy.tenureBonus.daysUnit')}</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Special Leave Settings */}
        <Card>
          <CardHeader>
            <CardTitle>{t('leavePolicy.specialLeave.title')}</CardTitle>
            <CardDescription>{t('leavePolicy.specialLeave.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">{t('leavePolicy.specialLeave.typeHeader')}</TableHead>
                    <TableHead>{t('leavePolicy.specialLeave.descriptionHeader')}</TableHead>
                    <TableHead className="w-[140px]">{t('leavePolicy.specialLeave.daysHeader')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {specialLeaves.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.description}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={0}
                            max={30}
                            step={0.5}
                            value={row.days}
                            onChange={(e) =>
                              handleSpecialLeaveChange(row.id, Number(e.target.value))
                            }
                            className="w-20"
                          />
                          <span className="text-sm text-muted-foreground">{t('leavePolicy.specialLeave.daysUnit')}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Carry-over Policy */}
        <Card>
          <CardHeader>
            <CardTitle>{t('leavePolicy.carryOver.title')}</CardTitle>
            <CardDescription>{t('leavePolicy.carryOver.description')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('leavePolicy.carryOver.enableLabel')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('leavePolicy.carryOver.enableDescription')}
                </p>
              </div>
              <Switch
                checked={carryOverEnabled}
                onCheckedChange={setCarryOverEnabled}
              />
            </div>

            {carryOverEnabled && (
              <div className="grid gap-6 md:grid-cols-2 border-t pt-6">
                <div className="space-y-2">
                  <Label htmlFor="maxCarryOver">{t('leavePolicy.carryOver.maxDays')}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="maxCarryOver"
                      type="number"
                      min={0}
                      max={30}
                      value={maxCarryOverDays}
                      onChange={(e) => setMaxCarryOverDays(Number(e.target.value))}
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">{t('leavePolicy.carryOver.maxDaysUnit')}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('leavePolicy.carryOver.maxDaysDescription')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="carryOverExpiry">{t('leavePolicy.carryOver.expiry')}</Label>
                  <Select
                    value={carryOverExpiry}
                    onValueChange={setCarryOverExpiry}
                  >
                    <SelectTrigger className="w-48" id="carryOverExpiry">
                      <SelectValue placeholder={t('leavePolicy.carryOver.expiryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">{t('leavePolicy.carryOver.expiryMonths3')}</SelectItem>
                      <SelectItem value="6">{t('leavePolicy.carryOver.expiryMonths6')}</SelectItem>
                      <SelectItem value="12">{t('leavePolicy.carryOver.expiryMonths12')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('leavePolicy.carryOver.expiryDescription')}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Usage Conditions - FR-ATT-003-02 */}
        <LeaveUsageConditions />

        {/* Leave Approval Line Rules - FR-ATT-003-03 */}
        <LeaveApprovalLineRules />
      </div>
    </>
  );
}
