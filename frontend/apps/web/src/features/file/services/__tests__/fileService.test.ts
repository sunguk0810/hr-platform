import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { fileService } from '../fileService';

describe('fileService', () => {
  beforeEach(() => {
    vi.stubGlobal('import.meta', {
      env: {
        VITE_API_BASE_URL: '/api/v1',
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should build download URL for preview/download workflow', () => {
    const url = fileService.getDownloadUrl('file-001');

    expect(url).toBe('/api/v1/files/file-001/download');
  });

  it('should build presigned URL with expiration', () => {
    const url = fileService.getPresignedUrl('file-001', 30);

    expect(url).toBe('/api/v1/files/file-001/presigned-url?expirationMinutes=30');
  });
});
