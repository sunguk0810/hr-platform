import { useState, useMemo } from 'react';
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
  '배우자': 100000,
  '자녀': 50000,
  '부모': 30000,
  '형제자매': 0,
  '조부모': 20000,
};

/**
 * Maps the relationship code (e.g., SPOUSE, CHILD) to the Korean label used for allowance lookup.
 */
const RELATIONSHIP_LABEL_MAP: Record<string, string> = {
  SPOUSE: '배우자',
  CHILD: '자녀',
  PARENT: '부모',
  SIBLING: '형제자매',
  GRANDPARENT: '조부모',
  OTHER: '기타',
};

function getRelationshipLabel(relationship: string): string {
  return RELATIONSHIP_LABEL_MAP[relationship] || relationship;
}

function getAllowanceAmount(relationship: string): number {
  const label = getRelationshipLabel(relationship);
  return ALLOWANCE_RULES[label] ?? 0;
}

export function FamilyAllowanceMapping({ familyMembers }: FamilyAllowanceMappingProps) {
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

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          가족수당 매핑
        </CardTitle>
        <CardDescription>
          가족 구성원별 수당 적용 여부를 설정합니다. 관계 유형에 따라 수당 금액이 결정됩니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(ALLOWANCE_RULES)
            .filter(([, amount]) => amount > 0)
            .map(([label, amount]) => (
              <Badge key={label} variant="outline" className="text-xs">
                {label}: {amount.toLocaleString()}원/월
              </Badge>
            ))}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>이름</TableHead>
              <TableHead>관계</TableHead>
              <TableHead>생년월일</TableHead>
              <TableHead className="text-right">월 수당액</TableHead>
              <TableHead className="text-center w-[120px]">가족 수당 적용</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {familyMembers.map((member) => {
              const label = getRelationshipLabel(member.relationship);
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
                        {amount.toLocaleString()}원
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
                        aria-label={`${member.name} 가족 수당 적용`}
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">대상 외</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                월 가족수당 합계
              </TableCell>
              <TableCell className="text-right font-bold text-primary">
                {totalAllowance.toLocaleString()}원
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
