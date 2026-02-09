import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  File,
  Download,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';

export interface FilePreviewProps {
  file: File | { name: string; url: string; type?: string; size?: number };
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDownload?: () => void;
}

const getFileIcon = (type: string) => {
  if (type.startsWith('image/')) return ImageIcon;
  if (type.includes('pdf')) return FileText;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return FileSpreadsheet;
  if (type.includes('json') || type.includes('xml') || type.includes('javascript') || type.includes('typescript')) return FileCode;
  if (type.includes('zip') || type.includes('rar') || type.includes('7z') || type.includes('tar')) return FileArchive;
  return File;
};

const getFileType = (file: FilePreviewProps['file']): string => {
  if ('type' in file && file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const extToType: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',
    txt: 'text/plain',
    json: 'application/json',
    xml: 'application/xml',
    zip: 'application/zip',
  };
  return extToType[ext] || 'application/octet-stream';
};

export function FilePreview({
  file,
  open,
  onOpenChange,
  onDownload,
}: FilePreviewProps) {
  const { t } = useTranslation('common');
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);

  const fileType = getFileType(file);
  const isImage = fileType.startsWith('image/');
  const isPdf = fileType.includes('pdf');
  const FileIcon = getFileIcon(fileType);

  React.useEffect(() => {
    if (!open) {
      setZoom(1);
      setRotation(0);
      return;
    }

    if ('url' in file && file.url) {
      setPreviewUrl(file.url);
    } else if (file instanceof File) {
      const url = URL.createObjectURL(file as Blob);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, open]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const formatFileSize = (bytes: number | undefined): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const fileSize = 'size' in file ? file.size : file instanceof File ? file.size : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className="flex items-center gap-2 truncate">
              <FileIcon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">{file.name}</span>
              {fileSize && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({formatFileSize(fileSize)})
                </span>
              )}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center justify-between py-2 border-b">
          <div className="flex items-center gap-1">
            {isImage && (
              <>
                <Button variant="ghost" size="sm" onClick={handleZoomOut} disabled={zoom <= 0.5}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground w-16 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <Button variant="ghost" size="sm" onClick={handleZoomIn} disabled={zoom >= 3}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleRotate}>
                  <RotateCw className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {previewUrl && (
              <Button variant="ghost" size="sm" asChild>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {t('component.newTab')}
                </a>
              </Button>
            )}
            {onDownload && (
              <Button variant="ghost" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-1" />
                {t('download')}
              </Button>
            )}
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto min-h-0 flex items-center justify-center bg-muted/30 rounded-lg">
          {isImage && previewUrl ? (
            <div className="overflow-auto max-w-full max-h-full p-4">
              <img
                src={previewUrl}
                alt={file.name}
                className="max-w-full h-auto transition-transform duration-200"
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                }}
              />
            </div>
          ) : isPdf && previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full min-h-[500px] border-0"
              title={file.name}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">{file.name}</p>
              {fileSize && (
                <p className="text-sm text-muted-foreground mt-1">
                  {formatFileSize(fileSize)}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-4">
                {t('component.unsupportedFormat')}
              </p>
              {onDownload && (
                <Button className="mt-4" onClick={onDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  {t('component.downloadFile')}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
