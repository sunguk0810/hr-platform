import { describe, it, expect, vi, beforeEach } from 'vitest';
import { certificateService } from '../certificateService';
import { apiClient } from '@/lib/apiClient';

vi.mock('@/lib/apiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('certificateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch my requests with given params', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true },
        timestamp: '2026-02-12T00:00:00Z',
      },
    };

    vi.mocked(apiClient.get).mockResolvedValue(mockResponse);

    const params = { page: 0, size: 20, status: 'ISSUED' as const, typeCode: 'EMPLOYMENT' };
    await certificateService.getMyRequests(params);

    expect(apiClient.get).toHaveBeenCalledWith('/certificates/requests/my', { params });
  });

  it('should download certificate using id-based endpoint', async () => {
    const mockBlob = new Blob(['pdf'], { type: 'application/pdf' });
    vi.mocked(apiClient.get).mockResolvedValue({ data: mockBlob });

    const blob = await certificateService.downloadCertificate('issue-123');

    expect(apiClient.get).toHaveBeenCalledWith('/certificates/issues/issue-123/download', {
      responseType: 'blob',
    });
    expect(blob).toBeInstanceOf(Blob);
  });
});
