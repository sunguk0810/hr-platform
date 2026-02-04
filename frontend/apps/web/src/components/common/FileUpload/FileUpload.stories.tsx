import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FileUpload } from './FileUpload';

const meta: Meta<typeof FileUpload> = {
  title: 'Common/FileUpload',
  component: FileUpload,
  tags: ['autodocs'],
  argTypes: {
    multiple: { control: 'boolean' },
    disabled: { control: 'boolean' },
    maxFiles: { control: 'number' },
  },
};

export default meta;
type Story = StoryObj<typeof FileUpload>;

export const Default: Story = {
  args: {
    placeholder: '파일을 드래그하거나 클릭하여 업로드하세요',
  },
};

export const SingleFile: Story = {
  args: {
    multiple: false,
    placeholder: '파일을 선택하세요 (1개만 가능)',
  },
};

export const MultipleFiles: Story = {
  args: {
    multiple: true,
    maxFiles: 5,
    placeholder: '파일을 드래그하거나 클릭하여 업로드하세요 (최대 5개)',
  },
};

export const ImagesOnly: Story = {
  args: {
    accept: 'image/*',
    placeholder: '이미지 파일을 업로드하세요',
  },
};

export const DocumentsOnly: Story = {
  args: {
    accept: '.pdf,.doc,.docx,.xls,.xlsx',
    placeholder: '문서 파일을 업로드하세요 (PDF, Word, Excel)',
  },
};

export const PDFOnly: Story = {
  args: {
    accept: 'application/pdf,.pdf',
    placeholder: 'PDF 파일을 업로드하세요',
  },
};

export const SmallMaxSize: Story = {
  args: {
    maxSize: 1 * 1024 * 1024, // 1MB
    placeholder: '파일을 업로드하세요 (최대 1MB)',
  },
};

export const LargeMaxSize: Story = {
  args: {
    maxSize: 50 * 1024 * 1024, // 50MB
    placeholder: '파일을 업로드하세요 (최대 50MB)',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: '파일 업로드가 비활성화되었습니다',
  },
};

export const WithError: Story = {
  args: {
    error: '파일 업로드에 실패했습니다. 다시 시도해주세요.',
    placeholder: '파일을 업로드하세요',
  },
};

export const CustomPlaceholder: Story = {
  args: {
    placeholder: '여기에 파일을 놓으세요!',
  },
};

// Interactive single file example
export const InteractiveSingle: StoryObj = {
  render: function InteractiveSingle() {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <div className="space-y-4">
        <FileUpload
          value={files}
          onChange={setFiles}
          multiple={false}
          placeholder="파일을 선택하세요"
        />
        {files.length > 0 && (
          <div className="text-sm text-muted-foreground">
            선택된 파일: {files[0].name} ({(files[0].size / 1024).toFixed(1)} KB)
          </div>
        )}
      </div>
    );
  },
};

// Interactive multiple files example
export const InteractiveMultiple: StoryObj = {
  render: function InteractiveMultiple() {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <div className="space-y-4">
        <FileUpload
          value={files}
          onChange={setFiles}
          multiple
          maxFiles={5}
          placeholder="파일을 드래그하거나 클릭하여 업로드하세요 (최대 5개)"
        />
        <div className="text-sm text-muted-foreground">
          업로드된 파일: {files.length}개
        </div>
      </div>
    );
  },
};

// Image upload example
export const ImageUpload: StoryObj = {
  render: function ImageUpload() {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <div className="space-y-4">
        <FileUpload
          value={files}
          onChange={setFiles}
          accept="image/*"
          multiple
          maxFiles={3}
          maxSize={5 * 1024 * 1024}
          placeholder="이미지를 업로드하세요 (최대 3개, 각 5MB 이하)"
        />
      </div>
    );
  },
};

// Document upload example
export const DocumentUpload: StoryObj = {
  render: function DocumentUpload() {
    const [files, setFiles] = useState<File[]>([]);

    return (
      <div className="space-y-4">
        <FileUpload
          value={files}
          onChange={setFiles}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          multiple
          maxFiles={10}
          maxSize={20 * 1024 * 1024}
          placeholder="문서 파일을 업로드하세요 (최대 10개, 각 20MB 이하)"
        />
      </div>
    );
  },
};

// With pre-filled files
export const WithPrefilledFiles: StoryObj = {
  render: function WithPrefilledFiles() {
    // Create mock File objects
    const mockFile1 = new File(['content1'], 'document.pdf', { type: 'application/pdf' });
    const mockFile2 = new File(['content2'], 'image.jpg', { type: 'image/jpeg' });

    const [files, setFiles] = useState<File[]>([mockFile1, mockFile2]);

    return (
      <div className="space-y-4">
        <FileUpload
          value={files}
          onChange={setFiles}
          multiple
          maxFiles={5}
          placeholder="추가 파일을 업로드하세요"
        />
      </div>
    );
  },
};

// Validation example
export const WithValidation: StoryObj = {
  render: function WithValidation() {
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState<string>('');

    const handleChange = (newFiles: File[]) => {
      setError('');

      // Custom validation
      for (const file of newFiles) {
        if (file.name.includes(' ')) {
          setError('파일명에 공백이 포함될 수 없습니다.');
          return;
        }
      }

      setFiles(newFiles);
    };

    return (
      <div className="space-y-4">
        <FileUpload
          value={files}
          onChange={handleChange}
          multiple
          maxFiles={3}
          error={error}
          placeholder="파일을 업로드하세요 (파일명에 공백 불가)"
        />
      </div>
    );
  },
};
