import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, X, File, AlertCircle } from 'lucide-react';

export interface FileUploadProps {
  value?: File[];
  onChange?: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  error?: string;
}

// FileWithPreview interface reserved for future preview functionality
// interface FileWithPreview extends File { preview?: string; }

export function FileUpload({
  value = [],
  onChange,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  disabled = false,
  className,
  placeholder,
  error,
}: FileUploadProps) {
  const { t } = useTranslation('common');
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const displayError = error || localError;

  const validateFiles = React.useCallback(
    (files: File[]): { valid: File[]; error: string | null } => {
      const validFiles: File[] = [];
      let errorMsg: string | null = null;

      for (const file of files) {
        if (maxSize && file.size > maxSize) {
          const maxSizeMB = Math.round(maxSize / 1024 / 1024);
          errorMsg = t('component.fileSizeError', { maxSize: maxSizeMB });
          continue;
        }

        if (accept) {
          const acceptedTypes = accept.split(',').map((t) => t.trim());
          const isAccepted = acceptedTypes.some((type) => {
            if (type.startsWith('.')) {
              return file.name.toLowerCase().endsWith(type.toLowerCase());
            }
            if (type.endsWith('/*')) {
              const baseType = type.replace('/*', '');
              return file.type.startsWith(baseType);
            }
            return file.type === type;
          });
          if (!isAccepted) {
            errorMsg = t('component.unsupportedFileType');
            continue;
          }
        }

        validFiles.push(file);
      }

      return { valid: validFiles, error: errorMsg };
    },
    [accept, maxSize, t]
  );

  const handleFiles = React.useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles || newFiles.length === 0) return;

      const filesArray = Array.from(newFiles);
      const { valid, error: validationError } = validateFiles(filesArray);

      if (validationError) {
        setLocalError(validationError);
        return;
      }

      setLocalError(null);

      if (multiple) {
        const combinedFiles = [...value, ...valid];
        if (maxFiles && combinedFiles.length > maxFiles) {
          setLocalError(t('component.maxFilesError', { maxFiles }));
          return;
        }
        onChange?.(combinedFiles);
      } else {
        onChange?.(valid.slice(0, 1));
      }
    },
    [value, onChange, multiple, maxFiles, validateFiles, t]
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
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (index: number) => {
    const newFiles = [...value];
    newFiles.splice(index, 1);
    onChange?.(newFiles);
    setLocalError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
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
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
          disabled={disabled}
          className="hidden"
        />
        <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">{placeholder ?? t('upload')}</p>
        {accept && (
          <p className="text-xs text-muted-foreground mt-1">
            허용 형식: {accept}
          </p>
        )}
        {maxSize && (
          <p className="text-xs text-muted-foreground">
            최대 크기: {formatFileSize(maxSize)}
          </p>
        )}
      </div>

      {displayError && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {displayError}
        </div>
      )}

      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((file, index) => (
            <li
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-2 bg-muted rounded-md"
            >
              <div className="flex items-center gap-2 min-w-0">
                <File className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  ({formatFileSize(file.size)})
                </span>
              </div>
              {!disabled && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
