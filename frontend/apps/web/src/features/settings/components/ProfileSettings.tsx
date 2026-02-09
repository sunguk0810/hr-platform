import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, User } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/common/Form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

function createProfileSchema(t: TFunction) {
  return z.object({
    name: z.string().min(1, t('profileSettings.validation.nameRequired')),
    nameEn: z.string().optional(),
    email: z.string().email(t('profileSettings.validation.emailInvalid')),
    mobile: z.string().min(1, t('profileSettings.validation.mobileRequired')),
    bio: z.string().max(200, t('profileSettings.validation.bioMaxLength')).optional(),
  });
}

type ProfileFormData = z.infer<ReturnType<typeof createProfileSchema>>;

interface ProfileSettingsProps {
  initialValues?: Partial<ProfileFormData> & { profileImage?: string };
  onSave: (data: ProfileFormData) => void;
  onImageChange?: (file: File) => void;
  isLoading?: boolean;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileSettings({
  initialValues,
  onSave,
  onImageChange,
  isLoading,
}: ProfileSettingsProps) {
  const { t } = useTranslation('settings');
  const profileSchema = React.useMemo(() => createProfileSchema(t), [t]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | undefined>(
    initialValues?.profileImage
  );

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: initialValues?.name || '',
      nameEn: initialValues?.nameEn || '',
      email: initialValues?.email || '',
      mobile: initialValues?.mobile || '',
      bio: initialValues?.bio || '',
    },
  });

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      onImageChange?.(file);
    }
  };

  const handleSubmit = (values: ProfileFormData) => {
    onSave(values);
  };

  const name = form.watch('name');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{t('profileSettings.title')}</CardTitle>
        <CardDescription>
          {t('profileSettings.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Profile Image */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewImage} alt={name} />
                  <AvatarFallback className="text-2xl">
                    {name ? getInitials(name) : <User className="h-8 w-8" />}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={handleImageClick}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
                  aria-label={t('profileSettings.changeImageAriaLabel')}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <div className="text-sm text-muted-foreground">
                <p>{t('profileSettings.photoFileInfo')}</p>
                <p>{t('profileSettings.recommendedSize')}</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('profileSettings.nameLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nameEn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('profileSettings.nameEnLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('profileSettings.nameEnPlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('profileSettings.emailLabel')}</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('profileSettings.emailReadonly')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('profileSettings.mobileLabel')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('profileSettings.mobilePlaceholder')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('profileSettings.bioLabel')}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      placeholder={t('profileSettings.bioPlaceholder')}
                    />
                  </FormControl>
                  <FormDescription>
                    {t('profileSettings.bioMaxLength')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('profileSettings.saving') : t('profileSettings.saveChanges')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default ProfileSettings;
