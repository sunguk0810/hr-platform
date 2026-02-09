import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';

interface FamilyMemberInfo {
  id: string;
  name: string;
  relationship: string;
  birthDate: string;
}

interface FamilyAllowanceMappingProps {
  familyMembers: FamilyMemberInfo[];
}

const ALLOWANCE_RULES: Record<string, number> = {
  'SPOUSE': 100000,
  'CHILD': 50000,
  'PARENT': 30000,
  'SIBLING': 0,
  'GRANDPARENT': 20000,
};

function getAllowanceAmount(relationship: string): number {
  return ALLOWANCE_RULES[relationship] ?? 0;
}

export function FamilyAllowanceMapping({ familyMembers }: FamilyAllowanceMappingProps) {
  const { t } = useTranslation('employee');

  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    familyMembers.forEach((member) => {
      const amount = getAllowanceAmount(member.relationship);
      // Enable by default if there is an allowance amount for this relationship
      initial[member.id] = amount > 0;
    });
    return initial;
  });

  const handleToggle = (memberId: string, checked: boolean) => {
    setEnabledMap((prev) => ({ ...prev, [memberId]: checked }));
  };

  const totalAllowance = useMemo(() => {
    return familyMembers.reduce((sum, member) => {
      if (enabledMap[member.id]) {
        return sum + getAllowanceAmount(member.relationship);
      }
      return sum;
    }, 0);
  }, [familyMembers, enabledMap]);

  if (familyMembers.length === 0) {
    return null;
  }

  // Build display labels for allowance rules
  const allowanceDisplayEntries = Object.entries(ALLOWANCE_RULES)
    .filter(([, amount]) => amount > 0)
    .map(([key, amount]) => ({
      label: t(`familyInfo.relationshipOptions.${key}`, key),
      amount,
    }));

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          {t('familyAllowance.title')}
        </CardTitle>
        <CardDescription>
          {t('familyAllowance.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {allowanceDisplayEntries.map(({ label, amount }) => (
            <Badge key={label} variant="outline" className="text-xs">
              {label}: {amount.toLocaleString()}{t('common.wonPerMonth')}
            </Badge>
          ))}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('familyInfo.name')}</TableHead>
              <TableHead>{t('familyInfo.relationship')}</TableHead>
              <TableHead>{t('familyInfo.birthDate')}</TableHead>
              <TableHead className="text-right">{t('familyAllowance.monthlyAmount')}</TableHead>
              <TableHead className="text-center w-[120px]">{t('familyAllowance.applyLabel')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {familyMembers.map((member) => {
              const label = t(`familyInfo.relationshipOptions.${member.relationship}`, member.relationship);
              const amount = getAllowanceAmount(member.relationship);
              const isEnabled = enabledMap[member.id] ?? false;
              const isEligible = amount > 0;

              return (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell>{label}</TableCell>
                  <TableCell className="text-muted-foreground">{member.birthDate}</TableCell>
                  <TableCell className="text-right">
                    {isEligible ? (
                      <span className={isEnabled ? 'font-medium' : 'text-muted-foreground'}>
                        {amount.toLocaleString()}{t('common.won')}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {isEligible ? (
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggle(member.id, checked)}
                        aria-label={t('familyAllowance.ariaLabel', { name: member.name })}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">{t('common.notApplicable')}</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                {t('familyAllowance.totalMonthly')}
              </TableCell>
              <TableCell className="text-right font-bold text-primary">
                {totalAllowance.toLocaleString()}{t('common.won')}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

export default FamilyAllowanceMapping;
