import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';
import { employeeService } from '../services/employeeService';
import {
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmployeeImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ImportStatus = 'idle' | 'uploading' | 'success' | 'error';

interface ImportResult {
  success: number;
  failed: number;
  errors?: string[];
}

export function EmployeeImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: EmployeeImportDialogProps) {
  const { t } = useTranslation('employee');
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];

    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!validTypes.includes(file.type) && !hasValidExtension) {
      toast({
        title: t('importDialog.unsupportedFileType'),
        description: t('importDialog.unsupportedFileTypeDesc'),
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: t('importDialog.fileSizeExceeded'),
        description: t('importDialog.fileSizeExceededDesc'),
        variant: 'destructive',
      });
      return;
    }

    setSelectedFile(file);
    setStatus('idle');
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const blob = await employeeService.getImportTemplate();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'employee_import_template.xlsx';
      link.click();
      URL.revokeObjectURL(url);

      toast({
        title: t('toast.templateDownload'),
        description: t('importDialog.templateDownloadSuccess'),
      });
    } catch {
      toast({
        title: t('toast.downloadFailure'),
        description: t('importDialog.templateDownloadFailure'),
        variant: 'destructive',
      });
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setStatus('uploading');
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 10, 90));
    }, 200);

    try {
      const response = await employeeService.importEmployees(selectedFile);
      clearInterval(progressInterval);
      setProgress(100);

      if (response.data) {
        setResult(response.data);
        setStatus(response.data.failed > 0 ? 'error' : 'success');

        if (response.data.success > 0) {
          toast({
            title: t('importDialog.importComplete'),
            description: t('importDialog.importCompleteDesc', { count: response.data.success }),
          });
          onSuccess?.();
        }
      }
    } catch (error) {
      clearInterval(progressInterval);
      setStatus('error');
      setResult({
        success: 0,
        failed: 1,
        errors: [t('importDialog.importFailureDesc')],
      });

      toast({
        title: t('importDialog.importFailure'),
        description: t('importDialog.importFailureDesc'),
        variant: 'destructive',
      });
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setStatus('idle');
    setProgress(0);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('importDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('importDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <Alert>
            <FileSpreadsheet className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{t('importDialog.templateDownload')}</span>
              <Button variant="link" size="sm" onClick={handleDownloadTemplate}>
                <Download className="mr-1 h-4 w-4" />
                {t('importDialog.templateButton')}
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload Area */}
          {!selectedFile ? (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors',
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              )}
            >
              <Upload className="mb-4 h-10 w-10 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium">
                {t('importDialog.dropzone')}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('importDialog.dropzoneDescription')}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                {status === 'idle' && (
                  <Button variant="ghost" size="icon" onClick={handleReset}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Progress */}
              {status === 'uploading' && (
                <div className="mt-4 space-y-2">
                  <Progress value={progress} />
                  <p className="text-center text-xs text-muted-foreground">
                    {t('importDialog.processing', { progress })}
                  </p>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-4 text-sm">
                    {result.success > 0 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>{t('importDialog.success', { count: result.success })}</span>
                      </div>
                    )}
                    {result.failed > 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <XCircle className="h-4 w-4" />
                        <span>{t('importDialog.failure', { count: result.failed })}</span>
                      </div>
                    )}
                  </div>

                  {result.errors && result.errors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <ul className="mt-1 list-inside list-disc text-xs">
                          {result.errors.slice(0, 5).map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                          {result.errors.length > 5 && (
                            <li>{t('importDialog.moreErrors', { count: result.errors.length - 5 })}</li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileInputChange}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {status === 'success' ? t('common.close') : t('common.cancel')}
          </Button>
          {status === 'idle' && selectedFile && (
            <Button onClick={handleImport}>
              <Upload className="mr-2 h-4 w-4" />
              {t('importDialog.importButton')}
            </Button>
          )}
          {(status === 'success' || status === 'error') && (
            <Button onClick={handleReset}>{t('importDialog.newFile')}</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
