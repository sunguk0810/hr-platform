import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, X, AlertCircle, User } from 'lucide-react';

export interface ImageUploadProps {
  value?: string | File;
  onChange?: (file: File | undefined) => void;
  onCropRequest?: (file: File) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  error?: string;
  variant?: 'square' | 'circle';
  size?: 'sm' | 'md' | 'lg';
}

export function ImageUpload({
  value,
  onChange,
  onCropRequest,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  disabled = false,
  className,
  placeholder = '이미지를 업로드하세요',
  error,
  variant = 'square',
  size = 'md',
}: ImageUploadProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const displayError = error || localError;

  const sizeClasses = {
    sm: 'h-20 w-20',
    md: 'h-32 w-32',
    lg: 'h-48 w-48',
  };

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

  const validateFile = React.useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith('image/')) {
        return '이미지 파일만 업로드할 수 있습니다.';
      }
      if (maxSize && file.size > maxSize) {
        const maxSizeMB = Math.round(maxSize / 1024 / 1024);
        return `파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`;
      }
      return null;
    },
    [maxSize]
  );

  const handleFile = React.useCallback(
    (file: File | null) => {
      if (!file) return;

      const error = validateFile(file);
      if (error) {
        setLocalError(error);
        return;
      }

      setLocalError(null);

      if (onCropRequest) {
        onCropRequest(file);
      } else {
        onChange?.(file);
      }
    },
    [onChange, onCropRequest, validateFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(undefined);
    setPreview(null);
    setLocalError(null);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed cursor-pointer transition-colors overflow-hidden',
          sizeClasses[size],
          variant === 'circle' ? 'rounded-full' : 'rounded-lg',
          isDragging && 'border-primary bg-primary/5',
          displayError && 'border-destructive',
          disabled && 'opacity-50 cursor-not-allowed',
          !isDragging && !displayError && 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
          disabled={disabled}
          className="hidden"
        />

        {preview ? (
          <>
            <img
              src={preview}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            {!disabled && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className={cn(
                  'absolute top-1 right-1 h-6 w-6',
                  variant === 'circle' && 'top-0 right-0'
                )}
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center p-2">
            {variant === 'circle' ? (
              <User className="h-8 w-8 text-muted-foreground" />
            ) : (
              <>
                <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground text-center">
                  {placeholder}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {displayError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {displayError}
        </div>
      )}
    </div>
  );
}
