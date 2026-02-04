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
            가족사항
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            등록된 가족정보가 없습니다.
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
          가족사항
          <span className="text-sm font-normal text-muted-foreground">({family.length}명)</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>관계</TableHead>
              <TableHead>성명</TableHead>
              <TableHead>생년월일</TableHead>
              <TableHead>직업</TableHead>
              <TableHead>동거</TableHead>
              <TableHead>부양</TableHead>
              <TableHead>연락처</TableHead>
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
                    <Badge variant="secondary">동거</Badge>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {member.isDependent ? (
                    <Badge variant="outline">부양</Badge>
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
