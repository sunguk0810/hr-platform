import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImageUpload } from '@/components/common/FileUpload';
import { FormRow } from '@/components/common/Form';
import { Loader2, Palette, Image as ImageIcon, Eye } from 'lucide-react';
import type { TenantBranding } from '@hr-platform/shared-types';
import { cn } from '@/lib/utils';

function createBrandingSchema(t: TFunction) {
  return z.object({
    primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, t('validation.validColorCode')),
    secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, t('validation.validColorCode')),
    logoUrl: z.string().optional(),
    faviconUrl: z.string().optional(),
    loginBackgroundUrl: z.string().optional(),
  });
}

type BrandingFormData = z.infer<ReturnType<typeof createBrandingSchema>>;

export interface BrandingSettingsProps {
  initialData?: Partial<TenantBranding>;
  onSubmit?: (data: TenantBranding) => Promise<void>;
  onUploadImage?: (file: File, type: 'logo' | 'favicon' | 'background') => Promise<string>;
  isLoading?: boolean;
  readOnly?: boolean;
}

const defaultBranding: TenantBranding = {
  primaryColor: '#3B82F6',
  secondaryColor: '#6366F1',
  logoUrl: undefined,
  faviconUrl: undefined,
  loginBackgroundUrl: undefined,
};

export function BrandingSettings({
  initialData,
  onSubmit,
  onUploadImage,
  isLoading = false,
  readOnly = false,
}: BrandingSettingsProps) {
  const { t } = useTranslation('tenant');
  const [logoFile, setLogoFile] = React.useState<File | undefined>();
  const [faviconFile, setFaviconFile] = React.useState<File | undefined>();
  const [backgroundFile, setBackgroundFile] = React.useState<File | undefined>();
  const [uploading, setUploading] = React.useState(false);

  const brandingSchema = React.useMemo(() => createBrandingSchema(t), [t]);

  const COLOR_PRESETS = React.useMemo(() => [
    { name: t('branding.presetBlue'), primary: '#3B82F6', secondary: '#6366F1' },
    { name: t('branding.presetGreen'), primary: '#10B981', secondary: '#059669' },
    { name: t('branding.presetPurple'), primary: '#8B5CF6', secondary: '#7C3AED' },
    { name: t('branding.presetRed'), primary: '#EF4444', secondary: '#DC2626' },
    { name: t('branding.presetOrange'), primary: '#F97316', secondary: '#EA580C' },
    { name: t('branding.presetGray'), primary: '#6B7280', secondary: '#4B5563' },
  ], [t]);

  const methods = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      ...defaultBranding,
      ...initialData,
    },
  });

  const { register, watch, setValue, handleSubmit, formState: { errors } } = methods;

  const primaryColor = watch('primaryColor');
  const secondaryColor = watch('secondaryColor');

  const applyPreset = (preset: typeof COLOR_PRESETS[number]) => {
    setValue('primaryColor', preset.primary);
    setValue('secondaryColor', preset.secondary);
  };

  const handleImageUpload = async (file: File, type: 'logo' | 'favicon' | 'background') => {
    if (!onUploadImage) return;

    setUploading(true);
    try {
      const url = await onUploadImage(file, type);
      switch (type) {
        case 'logo':
          setValue('logoUrl', url);
          break;
        case 'favicon':
          setValue('faviconUrl', url);
          break;
        case 'background':
          setValue('loginBackgroundUrl', url);
          break;
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFormSubmit = async (data: BrandingFormData) => {
    await onSubmit?.(data as TenantBranding);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Color Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('branding.colorSettings')}
            </CardTitle>
            <CardDescription>{t('branding.colorSettingsDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Presets */}
            <div className="space-y-2">
              <Label>{t('branding.preset')}</Label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    disabled={readOnly}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm transition-colors',
                      'hover:bg-accent disabled:opacity-50',
                      primaryColor === preset.primary && 'border-primary bg-accent'
                    )}
                    onClick={() => applyPreset(preset)}
                  >
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
                    />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            <FormRow cols={2}>
              <div className="space-y-2">
                <Label>{t('branding.primaryColor')}</Label>
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 rounded-md border shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  />
                  <Input
                    {...register('primaryColor')}
                    placeholder="#3B82F6"
                    disabled={readOnly}
                  />
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setValue('primaryColor', e.target.value)}
                    disabled={readOnly}
                    className="h-10 w-10 rounded cursor-pointer"
                  />
                </div>
                {errors.primaryColor && (
                  <p className="text-sm text-destructive">{errors.primaryColor.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t('branding.secondaryColor')}</Label>
                <div className="flex gap-2">
                  <div
                    className="h-10 w-10 rounded-md border shrink-0"
                    style={{ backgroundColor: secondaryColor }}
                  />
                  <Input
                    {...register('secondaryColor')}
                    placeholder="#6366F1"
                    disabled={readOnly}
                  />
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setValue('secondaryColor', e.target.value)}
                    disabled={readOnly}
                    className="h-10 w-10 rounded cursor-pointer"
                  />
                </div>
                {errors.secondaryColor && (
                  <p className="text-sm text-destructive">{errors.secondaryColor.message}</p>
                )}
              </div>
            </FormRow>

            {/* Preview */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {t('branding.preview')}
              </Label>
              <div className="flex gap-4 p-4 rounded-lg border bg-card">
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-white text-sm font-medium"
                  style={{ backgroundColor: primaryColor }}
                >
                  Primary Button
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-md text-white text-sm font-medium"
                  style={{ backgroundColor: secondaryColor }}
                >
                  Secondary Button
                </button>
                <div
                  className="h-2 w-24 rounded-full self-center"
                  style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Image Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              {t('branding.imageSettings')}
            </CardTitle>
            <CardDescription>{t('branding.imageSettingsDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Logo */}
              <div className="space-y-2">
                <Label>{t('branding.logo')}</Label>
                <ImageUpload
                  value={watch('logoUrl') || logoFile}
                  onChange={(file) => {
                    setLogoFile(file);
                    if (file) handleImageUpload(file, 'logo');
                  }}
                  disabled={readOnly || uploading}
                  variant="square"
                  size="md"
                  placeholder={t('branding.logoPlaceholder')}
                  accept="image/png,image/svg+xml"
                  maxSize={2 * 1024 * 1024}
                />
                <p className="text-xs text-muted-foreground">
                  {t('branding.logoRecommend')}
                </p>
              </div>

              {/* Favicon */}
              <div className="space-y-2">
                <Label>{t('branding.favicon')}</Label>
                <ImageUpload
                  value={watch('faviconUrl') || faviconFile}
                  onChange={(file) => {
                    setFaviconFile(file);
                    if (file) handleImageUpload(file, 'favicon');
                  }}
                  disabled={readOnly || uploading}
                  variant="square"
                  size="sm"
                  placeholder={t('branding.faviconPlaceholder')}
                  accept="image/png,image/x-icon"
                  maxSize={512 * 1024}
                />
                <p className="text-xs text-muted-foreground">
                  {t('branding.faviconRecommend')}
                </p>
              </div>

              {/* Login Background */}
              <div className="space-y-2">
                <Label>{t('branding.loginBackground')}</Label>
                <ImageUpload
                  value={watch('loginBackgroundUrl') || backgroundFile}
                  onChange={(file) => {
                    setBackgroundFile(file);
                    if (file) handleImageUpload(file, 'background');
                  }}
                  disabled={readOnly || uploading}
                  variant="square"
                  size="md"
                  placeholder={t('branding.loginBackgroundPlaceholder')}
                  accept="image/jpeg,image/png"
                  maxSize={5 * 1024 * 1024}
                />
                <p className="text-xs text-muted-foreground">
                  {t('branding.loginBackgroundRecommend')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {!readOnly && (
          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading || uploading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('branding.saveBranding')
              )}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
