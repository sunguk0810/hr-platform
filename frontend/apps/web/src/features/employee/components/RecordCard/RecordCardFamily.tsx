import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import type { FamilyMember } from '@hr-platform/shared-types';

interface RecordCardFamilyProps {
  family: FamilyMember[];
}

export function RecordCardFamily({ family }: RecordCardFamilyProps) {
  const { t } = useTranslation('employee');
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (family.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            {t('recordCard.family.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('recordCard.family.empty')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="h-4 w-4" />
          {t('recordCard.family.title')}
          <span className="text-sm font-normal text-muted-foreground">({t('recordCard.family.count', { count: family.length })})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('recordCard.family.relation')}</TableHead>
              <TableHead>{t('recordCard.family.name')}</TableHead>
              <TableHead>{t('recordCard.family.birthDate')}</TableHead>
              <TableHead>{t('recordCard.family.occupation')}</TableHead>
              <TableHead>{t('recordCard.family.cohabitant')}</TableHead>
              <TableHead>{t('recordCard.family.dependent')}</TableHead>
              <TableHead>{t('recordCard.family.phone')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {family.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.relation}</TableCell>
                <TableCell>{member.name}</TableCell>
                <TableCell>{formatDate(member.birthDate)}</TableCell>
                <TableCell>{member.occupation || '-'}</TableCell>
                <TableCell>
                  {member.isCohabitant ? (
                    <Badge variant="secondary">{t('recordCard.family.cohabitantBadge')}</Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {member.isDependent ? (
                    <Badge variant="outline">{t('recordCard.family.dependentBadge')}</Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{member.phone || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
