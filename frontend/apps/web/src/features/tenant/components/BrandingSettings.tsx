import * as React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
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

const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '올바른 색상 코드를 입력하세요'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '올바른 색상 코드를 입력하세요'),
  logoUrl: z.string().optional(),
  faviconUrl: z.string().optional(),
  loginBackgroundUrl: z.string().optional(),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

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

const COLOR_PRESETS = [
  { name: '블루', primary: '#3B82F6', secondary: '#6366F1' },
  { name: '그린', primary: '#10B981', secondary: '#059669' },
  { name: '퍼플', primary: '#8B5CF6', secondary: '#7C3AED' },
  { name: '레드', primary: '#EF4444', secondary: '#DC2626' },
  { name: '오렌지', primary: '#F97316', secondary: '#EA580C' },
  { name: '그레이', primary: '#6B7280', secondary: '#4B5563' },
];

export function BrandingSettings({
  initialData,
  onSubmit,
  onUploadImage,
  isLoading = false,
  readOnly = false,
}: BrandingSettingsProps) {
  const [logoFile, setLogoFile] = React.useState<File | undefined>();
  const [faviconFile, setFaviconFile] = React.useState<File | undefined>();
  const [backgroundFile, setBackgroundFile] = React.useState<File | undefined>();
  const [uploading, setUploading] = React.useState(false);

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
              색상 설정
            </CardTitle>
            <CardDescription>브랜드 색상을 설정합니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Presets */}
            <div className="space-y-2">
              <Label>프리셋</Label>
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
                <Label>주요 색상</Label>
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
                <Label>보조 색상</Label>
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
                미리보기
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
              이미지 설정
            </CardTitle>
            <CardDescription>로고 및 배경 이미지를 설정합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {/* Logo */}
              <div className="space-y-2">
                <Label>로고</Label>
                <ImageUpload
                  value={watch('logoUrl') || logoFile}
                  onChange={(file) => {
                    setLogoFile(file);
                    if (file) handleImageUpload(file, 'logo');
                  }}
                  disabled={readOnly || uploading}
                  variant="square"
                  size="md"
                  placeholder="로고 업로드"
                  accept="image/png,image/svg+xml"
                  maxSize={2 * 1024 * 1024}
                />
                <p className="text-xs text-muted-foreground">
                  권장: 200x200 PNG/SVG
                </p>
              </div>

              {/* Favicon */}
              <div className="space-y-2">
                <Label>파비콘</Label>
                <ImageUpload
                  value={watch('faviconUrl') || faviconFile}
                  onChange={(file) => {
                    setFaviconFile(file);
                    if (file) handleImageUpload(file, 'favicon');
                  }}
                  disabled={readOnly || uploading}
                  variant="square"
                  size="sm"
                  placeholder="파비콘"
                  accept="image/png,image/x-icon"
                  maxSize={512 * 1024}
                />
                <p className="text-xs text-muted-foreground">
                  권장: 32x32 PNG/ICO
                </p>
              </div>

              {/* Login Background */}
              <div className="space-y-2">
                <Label>로그인 배경</Label>
                <ImageUpload
                  value={watch('loginBackgroundUrl') || backgroundFile}
                  onChange={(file) => {
                    setBackgroundFile(file);
                    if (file) handleImageUpload(file, 'background');
                  }}
                  disabled={readOnly || uploading}
                  variant="square"
                  size="md"
                  placeholder="배경 이미지"
                  accept="image/jpeg,image/png"
                  maxSize={5 * 1024 * 1024}
                />
                <p className="text-xs text-muted-foreground">
                  권장: 1920x1080 JPG/PNG
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
                  저장 중...
                </>
              ) : (
                '브랜딩 저장'
              )}
            </Button>
          </div>
        )}
      </form>
    </FormProvider>
  );
}
