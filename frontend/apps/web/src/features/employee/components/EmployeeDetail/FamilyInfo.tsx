import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
import { FamilyAllowanceMapping } from './FamilyAllowanceMapping';

const RELATIONSHIP_KEYS = ['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'GRANDPARENT', 'OTHER'] as const;

const createFamilyMemberSchema = (t: TFunction) =>
  z.object({
    relationship: z.string().min(1, t('familyInfo.relationshipRequired')),
    name: z.string().min(1, t('familyInfo.nameRequired')),
    birthDate: z.date().optional(),
    occupation: z.string().optional(),
    contact: z.string().optional(),
    isCohabiting: z.boolean().default(false),
    isDependent: z.boolean().default(false),
    remarks: z.string().optional(),
  });

type FamilyMemberFormData = z.infer<ReturnType<typeof createFamilyMemberSchema>>;

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

export function FamilyInfo({
  data = [],
  editable = false,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
}: FamilyInfoProps) {
  const { t } = useTranslation('employee');
  const familyMemberSchema = React.useMemo(() => createFamilyMemberSchema(t), [t]);

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
    return t(`familyInfo.relationshipOptions.${value}`, value);
  };

  const familyMembersForAllowance = data.map((member) => ({
    id: member.id,
    name: member.name,
    relationship: member.relationship,
    birthDate: member.birthDate ? format(member.birthDate, 'yyyy-MM-dd') : '',
  }));

  return (
    <div className="space-y-6">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{t('familyInfo.title')}</CardTitle>
        {editable && (
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="mr-1 h-4 w-4" />
            {t('common.add')}
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            {t('familyInfo.empty')}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('familyInfo.relationship')}</TableHead>
                <TableHead>{t('familyInfo.name')}</TableHead>
                <TableHead>{t('familyInfo.birthDate')}</TableHead>
                <TableHead>{t('familyInfo.occupation')}</TableHead>
                <TableHead>{t('familyInfo.cohabiting')}</TableHead>
                <TableHead>{t('familyInfo.dependent')}</TableHead>
                {editable && <TableHead className="w-[100px]">{t('familyInfo.manage')}</TableHead>}
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
                {editingMember ? t('familyInfo.editDialog') : t('familyInfo.addDialog')}
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
                        <FormLabel>{t('familyInfo.relationship')}</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('familyInfo.relationshipPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {RELATIONSHIP_KEYS.map((key) => (
                              <SelectItem key={key} value={key}>
                                {t(`familyInfo.relationshipOptions.${key}`)}
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
                        <FormLabel>{t('familyInfo.name')}</FormLabel>
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
                        <FormLabel>{t('familyInfo.birthDate')}</FormLabel>
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
                        <FormLabel>{t('familyInfo.occupation')}</FormLabel>
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
                        <FormLabel>{t('familyInfo.contact')}</FormLabel>
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
                    {t('common.cancel')}
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? t('common.saving') : t('common.save')}
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
          title={t('familyInfo.deleteTitle')}
          description={t('familyInfo.deleteDescription')}
          confirmText={t('common.delete')}
          cancelText={t('common.cancel')}
          variant="destructive"
          onConfirm={handleDelete}
        />
      </CardContent>
    </Card>

    {data.length > 0 && (
      <FamilyAllowanceMapping familyMembers={familyMembersForAllowance} />
    )}
    </div>
  );
}

export default FamilyInfo;
