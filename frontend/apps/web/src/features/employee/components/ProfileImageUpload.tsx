import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ImageCropper } from '@/components/common/FileUpload/ImageCropper';
import { Upload, X, User, Camera, AlertCircle } from 'lucide-react';

export interface ProfileImageUploadProps {
  value?: string | File;
  onChange?: (file: File | undefined) => void;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
}

const sizeConfig = {
  sm: { container: 'h-16 w-16', icon: 'h-6 w-6', badge: 'h-5 w-5', badgeIcon: 'h-3 w-3' },
  md: { container: 'h-24 w-24', icon: 'h-10 w-10', badge: 'h-7 w-7', badgeIcon: 'h-4 w-4' },
  lg: { container: 'h-32 w-32', icon: 'h-14 w-14', badge: 'h-8 w-8', badgeIcon: 'h-5 w-5' },
};

export function ProfileImageUpload({
  value,
  onChange,
  maxSize = 5 * 1024 * 1024, // 5MB
  disabled = false,
  className,
  size = 'md',
  error,
}: ProfileImageUploadProps) {
  const { t } = useTranslation('employee');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [localError, setLocalError] = React.useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = React.useState(false);
  const [pendingFile, setPendingFile] = React.useState<File | null>(null);

  const displayError = error || localError;
  const config = sizeConfig[size];

  React.useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    if (typeof value === 'string') {
      setPreview(value);
    } else {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [value]);

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return t('profileImage.imageOnly');
    }
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024);
      return t('profileImage.maxSize', { size: maxSizeMB });
    }
    return null;
  };

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    setLocalError(null);
    setPendingFile(file);
    setCropperOpen(true);
  };

  const handleCropComplete = (croppedImage: File) => {
    onChange?.(croppedImage);
    setPendingFile(null);
    setCropperOpen(false);
  };

  const handleCropCancel = () => {
    setPendingFile(null);
    setCropperOpen(false);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
    setPreview(null);
    setLocalError(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative cursor-pointer group',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          disabled={disabled}
          className="hidden"
        />

        <Avatar className={cn(config.container, 'ring-2 ring-muted ring-offset-2')}>
          <AvatarImage src={preview || undefined} alt="Profile" className="object-cover" />
          <AvatarFallback className="bg-muted">
            <User className={cn(config.icon, 'text-muted-foreground')} />
          </AvatarFallback>
        </Avatar>

        {/* Overlay on hover */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity',
            disabled && 'group-hover:opacity-0'
          )}
        >
          <Camera className={cn(config.icon, 'text-white')} />
        </div>

        {/* Edit badge */}
        {!disabled && (
          <div
            className={cn(
              'absolute bottom-0 right-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center',
              config.badge
            )}
          >
            <Upload className={config.badgeIcon} />
          </div>
        )}

        {/* Remove button */}
        {preview && !disabled && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className={cn(
              'absolute -top-1 -right-1 rounded-full',
              config.badge
            )}
            onClick={handleRemove}
          >
            <X className={config.badgeIcon} />
          </Button>
        )}
      </div>

      {displayError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {displayError}
        </div>
      )}

      {/* Image Cropper Dialog */}
      <ImageCropper
        open={cropperOpen}
        onOpenChange={(open) => {
          if (!open) handleCropCancel();
        }}
        image={pendingFile}
        onCropComplete={handleCropComplete}
        aspect={1}
        circularCrop
        outputWidth={256}
        outputHeight={256}
      />
    </div>
  );
}
