import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/useToast';
import { Save, Plus, Trash2, ShieldCheck, CalendarOff, FileText, Clock } from 'lucide-react';

interface BlackoutPeriod {
  startDate: string;
  endDate: string;
}

interface LeaveUsageCondition {
  leaveType: string;
  leaveTypeName: string;
  advanceNoticeDays: number;
  maxConsecutiveDays: number;
  requiredDocuments: string[];
  maxAnnualUsage: number; // 0 = unlimited
  minTenureMonths: number;
  availableDays: boolean[]; // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
  blackoutPeriods: BlackoutPeriod[];
  roleRestrictions: string[];
}

const DOCUMENT_OPTIONS = [
  { value: '진단서', labelKey: 'leaveUsageConditions.documents.diagnosis' },
  { value: '사유서', labelKey: 'leaveUsageConditions.documents.reason' },
  { value: '확인서', labelKey: 'leaveUsageConditions.documents.confirmation' },
  { value: '기타', labelKey: 'leaveUsageConditions.documents.other' },
];

const DAY_LABEL_KEYS = [
  'leaveUsageConditions.dayLabels.mon',
  'leaveUsageConditions.dayLabels.tue',
  'leaveUsageConditions.dayLabels.wed',
  'leaveUsageConditions.dayLabels.thu',
  'leaveUsageConditions.dayLabels.fri',
  'leaveUsageConditions.dayLabels.sat',
  'leaveUsageConditions.dayLabels.sun',
];

const ROLE_OPTIONS = [
  { value: 'EMPLOYEE', label: 'EMPLOYEE' },
  { value: 'TEAM_LEADER', label: 'TEAM_LEADER' },
  { value: 'DEPT_MANAGER', label: 'DEPT_MANAGER' },
  { value: 'HR_MANAGER', label: 'HR_MANAGER' },
];

const defaultConditions: LeaveUsageCondition[] = [
  {
    leaveType: 'ANNUAL',
    leaveTypeName: '연차',
    advanceNoticeDays: 3,
    maxConsecutiveDays: 5,
    requiredDocuments: [],
    maxAnnualUsage: 0,
    minTenureMonths: 0,
    availableDays: [true, true, true, true, true, false, false],
    blackoutPeriods: [],
    roleRestrictions: [],
  },
  {
    leaveType: 'HALF_DAY',
    leaveTypeName: '반차',
    advanceNoticeDays: 1,
    maxConsecutiveDays: 1,
    requiredDocuments: [],
    maxAnnualUsage: 0,
    minTenureMonths: 0,
    availableDays: [true, true, true, true, true, false, false],
    blackoutPeriods: [],
    roleRestrictions: [],
  },
  {
    leaveType: 'HOURLY',
    leaveTypeName: '시간제연차',
    advanceNoticeDays: 1,
    maxConsecutiveDays: 1,
    requiredDocuments: [],
    maxAnnualUsage: 0,
    minTenureMonths: 0,
    availableDays: [true, true, true, true, true, false, false],
    blackoutPeriods: [],
    roleRestrictions: [],
  },
  {
    leaveType: 'SICK',
    leaveTypeName: '병가',
    advanceNoticeDays: 0,
    maxConsecutiveDays: 30,
    requiredDocuments: ['진단서'],
    maxAnnualUsage: 0,
    minTenureMonths: 0,
    availableDays: [true, true, true, true, true, true, true],
    blackoutPeriods: [],
    roleRestrictions: [],
  },
  {
    leaveType: 'CONDOLENCE',
    leaveTypeName: '경조휴가',
    advanceNoticeDays: 0,
    maxConsecutiveDays: 7,
    requiredDocuments: ['확인서'],
    maxAnnualUsage: 0,
    minTenureMonths: 0,
    availableDays: [true, true, true, true, true, true, true],
    blackoutPeriods: [],
    roleRestrictions: [],
  },
  {
    leaveType: 'MATERNITY',
    leaveTypeName: '출산휴가',
    advanceNoticeDays: 14,
    maxConsecutiveDays: 90,
    requiredDocuments: ['진단서', '확인서'],
    maxAnnualUsage: 1,
    minTenureMonths: 0,
    availableDays: [true, true, true, true, true, true, true],
    blackoutPeriods: [],
    roleRestrictions: [],
  },
  {
    leaveType: 'PARENTAL',
    leaveTypeName: '육아휴직',
    advanceNoticeDays: 30,
    maxConsecutiveDays: 365,
    requiredDocuments: ['사유서', '확인서'],
    maxAnnualUsage: 1,
    minTenureMonths: 6,
    availableDays: [true, true, true, true, true, true, true],
    blackoutPeriods: [],
    roleRestrictions: [],
  },
];

export function LeaveUsageConditions() {
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const [conditions, setConditions] = useState<LeaveUsageCondition[]>(defaultConditions);

  const updateCondition = (index: number, updates: Partial<LeaveUsageCondition>) => {
    setConditions((prev) =>
      prev.map((cond, i) => (i === index ? { ...cond, ...updates } : cond))
    );
  };

  const toggleDocument = (index: number, doc: string) => {
    setConditions((prev) =>
      prev.map((cond, i) => {
        if (i !== index) return cond;
        const docs = cond.requiredDocuments.includes(doc)
          ? cond.requiredDocuments.filter((d) => d !== doc)
          : [...cond.requiredDocuments, doc];
        return { ...cond, requiredDocuments: docs };
      })
    );
  };

  const toggleDay = (index: number, dayIndex: number) => {
    setConditions((prev) =>
      prev.map((cond, i) => {
        if (i !== index) return cond;
        const days = [...cond.availableDays];
        days[dayIndex] = !days[dayIndex];
        return { ...cond, availableDays: days };
      })
    );
  };

  const toggleRole = (index: number, role: string) => {
    setConditions((prev) =>
      prev.map((cond, i) => {
        if (i !== index) return cond;
        const roles = cond.roleRestrictions.includes(role)
          ? cond.roleRestrictions.filter((r) => r !== role)
          : [...cond.roleRestrictions, role];
        return { ...cond, roleRestrictions: roles };
      })
    );
  };

  const addBlackoutPeriod = (index: number) => {
    setConditions((prev) =>
      prev.map((cond, i) => {
        if (i !== index) return cond;
        return {
          ...cond,
          blackoutPeriods: [...cond.blackoutPeriods, { startDate: '', endDate: '' }],
        };
      })
    );
  };

  const removeBlackoutPeriod = (condIndex: number, periodIndex: number) => {
    setConditions((prev) =>
      prev.map((cond, i) => {
        if (i !== condIndex) return cond;
        return {
          ...cond,
          blackoutPeriods: cond.blackoutPeriods.filter((_, pi) => pi !== periodIndex),
        };
      })
    );
  };

  const updateBlackoutPeriod = (
    condIndex: number,
    periodIndex: number,
    field: keyof BlackoutPeriod,
    value: string
  ) => {
    setConditions((prev) =>
      prev.map((cond, i) => {
        if (i !== condIndex) return cond;
        const periods = cond.blackoutPeriods.map((p, pi) =>
          pi === periodIndex ? { ...p, [field]: value } : p
        );
        return { ...cond, blackoutPeriods: periods };
      })
    );
  };

  const handleSave = () => {
    toast({
      title: t('leaveUsageConditions.toast.saveSuccess'),
      description: t('leaveUsageConditions.toast.saveSuccessDesc'),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>{t('leaveUsageConditions.title')}</CardTitle>
              <CardDescription>
                {t('leaveUsageConditions.description')}
              </CardDescription>
            </div>
          </div>
          <Button onClick={handleSave} size="sm">
            <Save className="mr-2 h-4 w-4" />
            {t('leaveUsageConditions.saveButton')}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" className="w-full">
          {conditions.map((condition, index) => (
            <AccordionItem key={condition.leaveType} value={condition.leaveType}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{condition.leaveTypeName}</span>
                  <Badge variant="outline" className="text-xs">
                    {condition.leaveType}
                  </Badge>
                  {condition.requiredDocuments.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <FileText className="mr-1 h-3 w-3" />
                      {t('leaveUsageConditions.documentCount', { count: condition.requiredDocuments.length })}
                    </Badge>
                  )}
                  {condition.blackoutPeriods.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      <CalendarOff className="mr-1 h-3 w-3" />
                      {t('leaveUsageConditions.blackoutCount', { count: condition.blackoutPeriods.length })}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 pt-2">
                  {/* Row 1: advanceNoticeDays, maxConsecutiveDays */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label>
                        <Clock className="mr-1 inline h-3.5 w-3.5" />
                        {t('leaveUsageConditions.advanceNoticePeriod')}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={30}
                          value={condition.advanceNoticeDays}
                          onChange={(e) =>
                            updateCondition(index, {
                              advanceNoticeDays: Math.min(30, Math.max(0, Number(e.target.value))),
                            })
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">{t('leaveUsageConditions.daysBefore')}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('leaveUsageConditions.maxConsecutiveDays')}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          value={condition.maxConsecutiveDays}
                          onChange={(e) =>
                            updateCondition(index, {
                              maxConsecutiveDays: Math.min(365, Math.max(1, Number(e.target.value))),
                            })
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">{t('leaveUsageConditions.daysUnit')}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('leaveUsageConditions.maxAnnualUsage')}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={condition.maxAnnualUsage}
                          onChange={(e) =>
                            updateCondition(index, {
                              maxAnnualUsage: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">
                          {condition.maxAnnualUsage === 0 ? t('leaveUsageConditions.unlimited') : t('leaveUsageConditions.timesUnit')}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('leaveUsageConditions.minTenureMonths')}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          value={condition.minTenureMonths}
                          onChange={(e) =>
                            updateCondition(index, {
                              minTenureMonths: Math.max(0, Number(e.target.value)),
                            })
                          }
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">{t('leaveUsageConditions.monthsUnit')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Required Documents */}
                  <div className="space-y-2">
                    <Label>{t('leaveUsageConditions.requiredDocuments')}</Label>
                    <div className="flex flex-wrap gap-4">
                      {DOCUMENT_OPTIONS.map((doc) => (
                        <div key={doc.value} className="flex items-center gap-2">
                          <Checkbox
                            id={`doc-${condition.leaveType}-${doc.value}`}
                            checked={condition.requiredDocuments.includes(doc.value)}
                            onCheckedChange={() => toggleDocument(index, doc.value)}
                          />
                          <Label
                            htmlFor={`doc-${condition.leaveType}-${doc.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {t(doc.labelKey)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Row 3: Available Days */}
                  <div className="space-y-2">
                    <Label>{t('leaveUsageConditions.availableDays')}</Label>
                    <div className="flex flex-wrap gap-4">
                      {DAY_LABEL_KEYS.map((dayKey, dayIndex) => (
                        <div key={dayKey} className="flex items-center gap-2">
                          <Checkbox
                            id={`day-${condition.leaveType}-${dayIndex}`}
                            checked={condition.availableDays[dayIndex]}
                            onCheckedChange={() => toggleDay(index, dayIndex)}
                          />
                          <Label
                            htmlFor={`day-${condition.leaveType}-${dayIndex}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {t(dayKey)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Row 4: Role Restrictions */}
                  <div className="space-y-2">
                    <Label>{t('leaveUsageConditions.roleRestrictions')}</Label>
                    <p className="text-xs text-muted-foreground">
                      {t('leaveUsageConditions.roleRestrictionsDescription')}
                    </p>
                    <div className="flex flex-wrap gap-4">
                      {ROLE_OPTIONS.map((role) => (
                        <div key={role.value} className="flex items-center gap-2">
                          <Checkbox
                            id={`role-${condition.leaveType}-${role.value}`}
                            checked={condition.roleRestrictions.includes(role.value)}
                            onCheckedChange={() => toggleRole(index, role.value)}
                          />
                          <Label
                            htmlFor={`role-${condition.leaveType}-${role.value}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {role.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Row 5: Blackout Periods */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>{t('leaveUsageConditions.blackoutPeriods')}</Label>
                        <p className="text-xs text-muted-foreground">
                          {t('leaveUsageConditions.blackoutPeriodsDescription')}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addBlackoutPeriod(index)}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        {t('leaveUsageConditions.addPeriod')}
                      </Button>
                    </div>

                    {condition.blackoutPeriods.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">
                        {t('leaveUsageConditions.noBlackoutPeriods')}
                      </p>
                    )}

                    {condition.blackoutPeriods.map((period, periodIndex) => (
                      <div
                        key={periodIndex}
                        className="flex items-center gap-3 rounded-md border p-3"
                      >
                        <div className="flex items-center gap-2">
                          <Label className="text-sm whitespace-nowrap">{t('leaveUsageConditions.startDate')}</Label>
                          <Input
                            type="date"
                            value={period.startDate}
                            onChange={(e) =>
                              updateBlackoutPeriod(index, periodIndex, 'startDate', e.target.value)
                            }
                            className="w-auto"
                          />
                        </div>
                        <span className="text-muted-foreground">~</span>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm whitespace-nowrap">{t('leaveUsageConditions.endDate')}</Label>
                          <Input
                            type="date"
                            value={period.endDate}
                            onChange={(e) =>
                              updateBlackoutPeriod(index, periodIndex, 'endDate', e.target.value)
                            }
                            className="w-auto"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBlackoutPeriod(index, periodIndex)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
