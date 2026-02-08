import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { PageHeader } from '@/components/common/PageHeader';
import { EmptyState } from '@/components/common/EmptyState';
import { SkeletonTable } from '@/components/common/Skeleton';
import { Pagination } from '@/components/common/Pagination';
import { PullToRefreshContainer } from '@/components/mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileIcon,
  Upload,
  Download,
  Trash2,
  Eye,
  Search,
  FolderOpen,
  Image,
  FileText,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useFiles, useUploadFile, useDeleteFile, useDownloadFile } from '../hooks/useFiles';
import {
  fileService,
  FileCategory,
  FILE_CATEGORY_LABELS,
  FileInfo,
} from '../services/fileService';

export default function FileManagementPage() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [category, setCategory] = useState<FileCategory | ''>('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileInfo | null>(null);
  const [uploadCategory, setUploadCategory] = useState<FileCategory>('DOCUMENT');
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const { data, isLoading } = useFiles({
    category: category || undefined,
    originalName: searchKeyword || undefined,
    page,
    size: 10,
  });

  const uploadMutation = useUploadFile();
  const deleteMutation = useDeleteFile();
  const downloadMutation = useDownloadFile();

  const files = data?.data?.content ?? [];
  const totalPages = data?.data?.page?.totalPages ?? 0;

  const handleRefresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['files'] });
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    setUploadFiles((prev) => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setUploadFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeUploadFile = (index: number) => {
    setUploadFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    for (const file of uploadFiles) {
      await uploadMutation.mutateAsync({
        file,
        category: uploadCategory,
      });
    }
    setUploadFiles([]);
    setUploadDialogOpen(false);
  };

  const handlePreview = (file: FileInfo) => {
    if (fileService.isImageFile(file.contentType) || fileService.isPdfFile(file.contentType)) {
      setSelectedFile(file);
      setPreviewDialogOpen(true);
    }
  };

  const handleDownload = (file: FileInfo) => {
    downloadMutation.mutate({ id: file.id, originalName: file.originalName });
  };

  const handleDeleteClick = (file: FileInfo) => {
    setSelectedFile(file);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedFile) {
      await deleteMutation.mutateAsync(selectedFile.id);
      setDeleteDialogOpen(false);
      setSelectedFile(null);
    }
  };

  const getFileIcon = (contentType: string) => {
    if (fileService.isImageFile(contentType)) {
      return <Image className="h-5 w-5 text-green-500" aria-hidden="true" />;
    }
    if (fileService.isPdfFile(contentType)) {
      return <FileText className="h-5 w-5 text-red-500" aria-hidden="true" />;
    }
    return <FileIcon className="h-5 w-5 text-blue-500" aria-hidden="true" />;
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <PullToRefreshContainer onRefresh={handleRefresh}>
        <div className="space-y-4 pb-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">파일 관리</h1>
              <p className="text-sm text-muted-foreground">업로드된 파일을 관리합니다</p>
            </div>
            <Button size="sm" onClick={() => setUploadDialogOpen(true)}>
              <Upload className="mr-1 h-4 w-4" aria-hidden="true" />
              업로드
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
            <button
              onClick={() => {
                setCategory('');
                setPage(0);
              }}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
                category === ''
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              전체
            </button>
            {fileService.getCategories().map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setPage(0);
                }}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  category === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {FILE_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="파일이 없습니다"
              description="파일을 업로드하세요."
              action={{ label: '파일 업로드', onClick: () => setUploadDialogOpen(true) }}
            />
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => handlePreview(file)}
                  className="w-full bg-card rounded-xl border p-4 text-left transition-colors active:bg-muted"
                >
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.contentType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.originalName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {file.category ? FILE_CATEGORY_LABELS[file.category] : '-'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {fileService.formatFileSize(file.fileSize)}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </button>
              ))}
              {totalPages > 1 && (
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              )}
            </div>
          )}
        </div>
      </PullToRefreshContainer>
    );
  }

  // Desktop Layout
  return (
    <>
      <PageHeader
        title="파일 관리"
        description="업로드된 파일을 조회하고 관리합니다."
        actions={
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" aria-hidden="true" />
            파일 업로드
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" aria-hidden="true" />
            파일 목록
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="file-search" className="sr-only">
                파일명 검색
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="file-search"
                  placeholder="파일명으로 검색..."
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setPage(0);
                  }}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Label htmlFor="category-filter" className="sr-only">
                카테고리 필터
              </Label>
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value as FileCategory | '');
                  setPage(0);
                }}
              >
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">전체</SelectItem>
                  {fileService.getCategories().map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {FILE_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <SkeletonTable rows={5} />
          ) : files.length === 0 ? (
            <EmptyState
              icon={FolderOpen}
              title="파일이 없습니다"
              description="파일을 업로드하세요."
              action={{ label: '파일 업로드', onClick: () => setUploadDialogOpen(true) }}
            />
          ) : (
            <>
              <div className="overflow-x-auto" role="region" aria-label="파일 목록">
                <table className="w-full" role="grid" aria-label="파일">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                      >
                        파일명
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                      >
                        카테고리
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-right text-sm font-medium text-muted-foreground"
                      >
                        크기
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                      >
                        업로드
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-left text-sm font-medium text-muted-foreground"
                      >
                        업로드일
                      </th>
                      <th
                        scope="col"
                        className="px-4 py-3 text-center text-sm font-medium text-muted-foreground"
                      >
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((file) => (
                      <tr key={file.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getFileIcon(file.contentType)}
                            <span className="text-sm font-medium truncate max-w-xs">
                              {file.originalName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{file.category ? FILE_CATEGORY_LABELS[file.category] : '-'}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-sm">
                          {fileService.formatFileSize(file.fileSize)}
                        </td>
                        <td className="px-4 py-3 text-sm">{file.uploaderName}</td>
                        <td className="px-4 py-3 text-sm">
                          {format(new Date(file.createdAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {(fileService.isImageFile(file.contentType) ||
                              fileService.isPdfFile(file.contentType)) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handlePreview(file)}
                                aria-label={`${file.originalName} 미리보기`}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownload(file)}
                              aria-label={`${file.originalName} 다운로드`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(file)}
                              className="text-destructive hover:text-destructive"
                              aria-label={`${file.originalName} 삭제`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>파일 업로드</DialogTitle>
            <DialogDescription>업로드할 파일을 선택하거나 드래그하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="upload-category">카테고리</Label>
              <Select
                value={uploadCategory}
                onValueChange={(value) => setUploadCategory(value as FileCategory)}
              >
                <SelectTrigger id="upload-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fileService.getCategories().map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {FILE_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                파일을 여기에 드래그하거나 클릭하여 선택
              </p>
              <input
                id="file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <Button variant="outline" asChild>
                <label htmlFor="file-upload" className="cursor-pointer">
                  파일 선택
                </label>
              </Button>
            </div>
            {uploadFiles.length > 0 && (
              <div className="space-y-2">
                <Label>선택된 파일</Label>
                <ul className="space-y-1">
                  {uploadFiles.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-muted rounded-md text-sm"
                    >
                      <span className="truncate flex-1">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeUploadFile(index)}
                        aria-label={`${file.name} 제거`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              취소
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploadFiles.length === 0 || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? '업로드 중...' : '업로드'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>{selectedFile?.originalName}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh]">
            {selectedFile && fileService.isImageFile(selectedFile.contentType) && (
              <img
                src={fileService.getPreviewUrl(selectedFile.id)}
                alt={selectedFile.originalName}
                className="w-full h-auto"
              />
            )}
            {selectedFile && fileService.isPdfFile(selectedFile.contentType) && (
              <iframe
                src={fileService.getPreviewUrl(selectedFile.id)}
                title={selectedFile.originalName}
                className="w-full h-[60vh]"
              />
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              닫기
            </Button>
            {selectedFile && (
              <Button onClick={() => handleDownload(selectedFile)}>
                <Download className="mr-2 h-4 w-4" />
                다운로드
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>파일 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              '{selectedFile?.originalName}' 파일을 삭제하시겠습니까? 이 작업은 되돌릴 수
              없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
