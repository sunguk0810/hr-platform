import React from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { FormRow } from '@/components/common/Form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Calendar, Plus, Trash2, GripVertical } from 'lucide-react';
import type { LeavePolicy } from '@hr-platform/shared-types';
import { DEFAULT_LEAVE_POLICY } from '@hr-platform/shared-types';

const createLeavePolicySchema = (t: TFunction) => {
  const leaveTypeSchema = z.object({
    code: z.string().min(1, t('validation.codeRequired')),
    name: z.string().min(1, t('validation.nameRequired')),
    paid: z.boolean(),
    requiresApproval: z.boolean(),
    minDays: z.number().min(0).optional(),
    maxConsecutiveDays: z.number().min(1).optional(),
    requiresDocument: z.boolean().optional(),
    documentRequiredDays: z.number().min(1).optional(),
  });

  const thresholdSchema = z.object({
    maxDays: z.number().min(1),
    approvalLevels: z.number().min(1).max(5),
  });

  return z.object({
    annualLeave: z.object({
      baseDays: z.number().min(0).max(30),
      additionalDaysPerYear: z.number().min(0).max(5),
      maxAnnualDays: z.number().min(0).max(40),
      carryoverAllowed: z.boolean(),
      carryoverMaxDays: z.number().min(0),
      carryoverExpireMonths: z.number().min(1).max(12),
    }),
    leaveTypes: z.array(leaveTypeSchema).min(1, t('validation.minOneLeaveType')),
    approvalRules: z.object({
      daysThreshold: z.array(thresholdSchema).min(1, t('validation.minOneApprovalRule')),
    }),
  });
};

export interface LeavePolicySettingsProps {
  initialData?: LeavePolicy;
  onSubmit: (data: LeavePolicy) => Promise<void>;
  isLoading?: boolean;
  readOnly?: boolean;
}

export function LeavePolicySettings({
  initialData,
  onSubmit,
  isLoading = false,
  readOnly = false,
}: LeavePolicySettingsProps) {
  const { t } = useTranslation('tenant');
  const leavePolicySchema = React.useMemo(() => createLeavePolicySchema(t), [t]);

  const methods = useForm<LeavePolicy>({
    resolver: zodResolver(leavePolicySchema),
    defaultValues: initialData ?? DEFAULT_LEAVE_POLICY,
  });

  const { register, watch, setValue, handleSubmit, control, formState: { errors } } = methods;

  const {
    fields: leaveTypeFields,
    append: appendLeaveType,
    remove: removeLeaveType,
  } = useFieldArray({
    control,
    name: 'leaveTypes',
  });

  const {
    fields: thresholdFields,
    append: appendThreshold,
    remove: removeThreshold,
  } = useFieldArray({
    control,
    name: 'approvalRules.daysThreshold',
  });

  const handleAddLeaveType = () => {
    appendLeaveType({
      code: '',
      name: '',
      paid: true,
      requiresApproval: true,
    });
  };

  const handleAddThreshold = () => {
    appendThreshold({
      maxDays: 5,
      approvalLevels: 1,
    });
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 연차 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('leavePolicy.annualLeaveTitle')}
            </CardTitle>
            <CardDescription>{t('leavePolicy.annualLeaveDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormRow cols={3}>
              <div className="space-y-2">
                <Label>{t('leavePolicy.baseDays')}</Label>
                <Input
                  type="number"
                  {...register('annualLeave.baseDays', { valueAsNumber: true })}
                  disabled={readOnly}
                />
                {errors.annualLeave?.baseDays && (
                  <p className="text-sm text-destructive">{errors.annualLeave.baseDays.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('leavePolicy.additionalDaysPerYear')}</Label>
                <Input
                  type="number"
                  {...register('annualLeave.additionalDaysPerYear', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
              <div className="space-y-2">
                <Label>{t('leavePolicy.maxAnnualDays')}</Label>
                <Input
                  type="number"
                  {...register('annualLeave.maxAnnualDays', { valueAsNumber: true })}
                  disabled={readOnly}
                />
              </div>
            </FormRow>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>{t('leavePolicy.carryoverAllowed')}</Label>
                <p className="text-sm text-muted-foreground">{t('leavePolicy.carryoverAllowedDescription')}</p>
              </div>
              <Switch
                checked={watch('annualLeave.carryoverAllowed')}
                onCheckedChange={(checked) => setValue('annualLeave.carryoverAllowed', checked)}
                disabled={readOnly}
              />
            </div>

            {watch('annualLeave.carryoverAllowed') && (
              <FormRow cols={2}>
                <div className="space-y-2">
                  <Label>{t('leavePolicy.maxCarryoverDays')}</Label>
                  <Input
                    type="number"
                    {...register('annualLeave.carryoverMaxDays', { valueAsNumber: true })}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('leavePolicy.carryoverExpireMonths')}</Label>
                  <Input
                    type="number"
                    {...register('annualLeave.carryoverExpireMonths', { valueAsNumber: true })}
                    disabled={readOnly}
                  />
                </div>
              </FormRow>
            )}
          </CardContent>
        </Card>

        {/* 휴가 유형 관리 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('leavePolicy.leaveTypes')}</CardTitle>
              <CardDescription>{t('leavePolicy.leaveTypesDescription')}</CardDescription>
            </div>
            {!readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={handleAddLeaveType}>
                <Plus className="mr-1 h-4 w-4" />
                {t('leavePolicy.addLeaveType')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>{t('leavePolicy.tableCode')}</TableHead>
                  <TableHead>{t('leavePolicy.tableName')}</TableHead>
                  <TableHead className="text-center">{t('leavePolicy.tablePaid')}</TableHead>
                  <TableHead className="text-center">{t('leavePolicy.tableApprovalRequired')}</TableHead>
                  <TableHead>{t('leavePolicy.tableMinDays')}</TableHead>
                  <TableHead>{t('leavePolicy.tableMaxConsecutiveDays')}</TableHead>
                  <TableHead className="text-center">{t('leavePolicy.tableDocumentRequired')}</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaveTypeFields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                    </TableCell>
                    <TableCell>
                      <Input
                        {...register(`leaveTypes.${index}.code`)}
                        disabled={readOnly}
                        className="h-8 w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        {...register(`leaveTypes.${index}.name`)}
                        disabled={readOnly}
                        className="h-8 w-28"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={watch(`leaveTypes.${index}.paid`)}
                        onCheckedChange={(checked) => setValue(`leaveTypes.${index}.paid`, checked)}
                        disabled={readOnly}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={watch(`leaveTypes.${index}.requiresApproval`)}
                        onCheckedChange={(checked) =>
                          setValue(`leaveTypes.${index}.requiresApproval`, checked)
                        }
                        disabled={readOnly}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.5"
                        {...register(`leaveTypes.${index}.minDays`, { valueAsNumber: true })}
                        disabled={readOnly}
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        {...register(`leaveTypes.${index}.maxConsecutiveDays`, {
                          valueAsNumber: true,
                        })}
                        disabled={readOnly}
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={watch(`leaveTypes.${index}.requiresDocument`) ?? false}
                        onCheckedChange={(checked) =>
                          setValue(`leaveTypes.${index}.requiresDocument`, checked)
                        }
                        disabled={readOnly}
                      />
                    </TableCell>
                    <TableCell>
                      {!readOnly && leaveTypeFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeLeaveType(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {errors.leaveTypes && (
              <p className="text-sm text-destructive mt-2">{errors.leaveTypes.message}</p>
            )}
          </CardContent>
        </Card>

        {/* 결재 규칙 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>{t('leavePolicy.approvalRules')}</CardTitle>
              <CardDescription>{t('leavePolicy.approvalRulesDescription')}</CardDescription>
            </div>
            {!readOnly && (
              <Button type="button" variant="outline" size="sm" onClick={handleAddThreshold}>
                <Plus className="mr-1 h-4 w-4" />
                {t('leavePolicy.addRule')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('leavePolicy.tableMaxDays')}</TableHead>
                  <TableHead>{t('leavePolicy.tableApprovalLevels')}</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {thresholdFields.map((field, index) => (
                  <TableRow key={field.id}>
                    <TableCell>
                      <Input
                        type="number"
                        {...register(`approvalRules.daysThreshold.${index}.maxDays`, {
                          valueAsNumber: true,
                        })}
                        disabled={readOnly}
                        className="h-8 w-28"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        {...register(`approvalRules.daysThreshold.${index}.approvalLevels`, {
                          valueAsNumber: true,
                        })}
                        disabled={readOnly}
                        className="h-8 w-20"
                      />
                    </TableCell>
                    <TableCell>
                      {!readOnly && thresholdFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeThreshold(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {errors.approvalRules?.daysThreshold && (
              <p className="text-sm text-destructive mt-2">
                {errors.approvalRules.daysThreshold.message}
              </p>
            )}
          </CardContent>
        </Card>

        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
