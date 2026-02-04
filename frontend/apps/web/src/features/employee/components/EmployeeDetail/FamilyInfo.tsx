import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/common/Form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/common/DatePicker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

const familyMemberSchema = z.object({
  relationship: z.string().min(1, '관계는 필수입니다'),
  name: z.string().min(1, '이름은 필수입니다'),
  birthDate: z.date().optional(),
  occupation: z.string().optional(),
  contact: z.string().optional(),
  isCohabiting: z.boolean().default(false),
  isDependent: z.boolean().default(false),
  remarks: z.string().optional(),
});

type FamilyMemberFormData = z.infer<typeof familyMemberSchema>;

export interface FamilyMember {
  id: string;
  relationship: string;
  name: string;
  birthDate?: Date;
  occupation?: string;
  contact?: string;
  isCohabiting: boolean;
  isDependent: boolean;
  remarks?: string;
}

interface FamilyInfoProps {
  data?: FamilyMember[];
  editable?: boolean;
  onAdd?: (member: FamilyMemberFormData) => void;
  onUpdate?: (id: string, member: FamilyMemberFormData) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

const relationshipOptions = [
  { value: 'SPOUSE', label: '배우자' },
  { value: 'CHILD', label: '자녀' },
  { value: 'PARENT', label: '부모' },
  { value: 'SIBLING', label: '형제/자매' },
  { value: 'GRANDPARENT', label: '조부모' },
  { value: 'OTHER', label: '기타' },
];

export function FamilyInfo({
  data = [],
  editable = false,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}: FamilyInfoProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<FamilyMemberFormData>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      relationship: '',
      name: '',
      occupation: '',
      contact: '',
      isCohabiting: false,
      isDependent: false,
      remarks: '',
    },
  });

  const handleOpenDialog = (member?: FamilyMember) => {
    if (member) {
      setEditingMember(member);
      form.reset({
        relationship: member.relationship,
        name: member.name,
        birthDate: member.birthDate,
        occupation: member.occupation || '',
        contact: member.contact || '',
        isCohabiting: member.isCohabiting,
        isDependent: member.isDependent,
        remarks: member.remarks || '',
      });
    } else {
      setEditingMember(null);
      form.reset({
        relationship: '',
        name: '',
        occupation: '',
        contact: '',
        isCohabiting: false,
        isDependent: false,
        remarks: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMember(null);
    form.reset();
  };

  const handleSubmit = (values: FamilyMemberFormData) => {
    if (editingMember) {
      onUpdate?.(editingMember.id, values);
    } else {
      onAdd?.(values);
    }
    handleCloseDialog();
  };

  const handleDelete = () => {
    if (deleteId) {
      onDelete?.(deleteId);
      setDeleteId(null);
    }
  };

  const getRelationshipLabel = (value: string) => {
    return relationshipOptions.find((opt) => opt.value === value)?.label || value;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">가족 정보</CardTitle>
        {editable && (
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="mr-1 h-4 w-4" />
            추가
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            등록된 가족 정보가 없습니다.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>관계</TableHead>
                <TableHead>이름</TableHead>
                <TableHead>생년월일</TableHead>
                <TableHead>직업</TableHead>
                <TableHead>동거여부</TableHead>
                <TableHead>부양가족</TableHead>
                {editable && <TableHead className="w-[100px]">관리</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{getRelationshipLabel(member.relationship)}</TableCell>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>
                    {member.birthDate
                      ? format(member.birthDate, 'yyyy-MM-dd')
                      : '-'}
                  </TableCell>
                  <TableCell>{member.occupation || '-'}</TableCell>
                  <TableCell>{member.isCohabiting ? 'O' : 'X'}</TableCell>
                  <TableCell>{member.isDependent ? 'O' : 'X'}</TableCell>
                  {editable && (
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(member)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingMember ? '가족 정보 수정' : '가족 정보 추가'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="relationship"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>관계 *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="관계 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {relationshipOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이름 *</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>생년월일</FormLabel>
                        <FormControl>
                          <DatePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>직업</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="contact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>연락처</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirm Dialog */}
        <ConfirmDialog
          open={!!deleteId}
          onOpenChange={(open) => !open && setDeleteId(null)}
          title="가족 정보 삭제"
          description="선택한 가족 정보를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다."
          confirmText="삭제"
          cancelText="취소"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </CardContent>
    </Card>
  );
}

export default FamilyInfo;
