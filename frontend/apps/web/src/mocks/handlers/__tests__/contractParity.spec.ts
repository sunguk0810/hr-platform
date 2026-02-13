import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { appointmentHandlers } from '../appointmentHandlers';
import { certificateHandlers } from '../certificateHandlers';
import { fileHandlers } from '../fileHandlers';
import { server as globalServer } from '@/test/setup';

interface PagedResponse<T> {
  data: {
    content: T[];
  };
}

const server = setupServer(...appointmentHandlers, ...certificateHandlers, ...fileHandlers);

beforeAll(() => {
  globalServer.close();
  server.listen({ onUnhandledRequest: 'error' });
});

afterAll(() => {
  server.close();
  globalServer.listen({ onUnhandledRequest: 'error' });
});

describe('mock handler contract parity', () => {
  beforeEach(() => {
    server.resetHandlers(...appointmentHandlers, ...certificateHandlers, ...fileHandlers, 
      http.get('/api/v1/files/:id/preview', () => {
        return HttpResponse.json(
          {
            success: false,
            error: {
              code: 'FILE_PREVIEW_UNSUPPORTED',
              message: 'File preview endpoint is not supported. Use download URL.',
            },
          },
          { status: 404 }
        );
      })
    );
  });

  afterEach(() => {
    server.resetHandlers();
  });

  it('appointment drafts list supports startDate/endDate params and ignores effectiveDateFrom/effectiveDateTo aliases', async () => {
    const allRes = await fetch('/api/v1/appointments/drafts?page=0&size=20');
    expect(allRes.status).toBe(200);
    const allPayload = (await allRes.json()) as PagedResponse<
      { id: string; effectiveDate: string }
    >;
    const sampleDate = allPayload.data.content[0]?.effectiveDate;
    expect(sampleDate).toBeTruthy();

    const startDate = sampleDate;
    const endDate = sampleDate;

    const startDateFilteredRes = await fetch(
      `/api/v1/appointments/drafts?page=0&size=20&startDate=${startDate}&endDate=${endDate}`
    );
    const startDatePayload = (await startDateFilteredRes.json()) as PagedResponse<
      { effectiveDate: string }
    >;
    expect(startDateFilteredRes.status).toBe(200);
    expect(startDatePayload.data.content.length).toBeGreaterThan(0);
    expect(startDatePayload.data.content.every((item) => item.effectiveDate === sampleDate)).toBe(true);

    const legacyFilteredRes = await fetch(
      `/api/v1/appointments/drafts?page=0&size=20&effectiveDateFrom=${startDate}&effectiveDateTo=${endDate}`
    );
    const legacyPayload = (await legacyFilteredRes.json()) as PagedResponse<
      { effectiveDate: string }
    >;
    expect(legacyFilteredRes.status).toBe(200);
    expect(legacyPayload.data.content.length).toBe(startDatePayload.data.content.length);
  });

  it('certificate issues mock respects typeCode and includeExpired defaults', async () => {
    const issueRes = await fetch('/api/v1/certificates/issues/my?typeCode=EMPLOYMENT');
    expect(issueRes.status).toBe(200);
    const defaultPayload = (await issueRes.json()) as PagedResponse<{
      issueNumber: string;
      certificateTypeName: string;
      expiresAt: string;
    }>;
    expect(defaultPayload.data.content.length).toBeGreaterThanOrEqual(0);
    expect(defaultPayload.data.content.every((item) => item.certificateTypeName === '재직증명서')).toBe(true);
    expect(
      defaultPayload.data.content.every((item) => new Date(item.expiresAt).getTime() >= Date.now())
    ).toBe(true);

    const withExpiredRes = await fetch(
      '/api/v1/certificates/issues/my?typeCode=EMPLOYMENT&includeExpired=true'
    );
    expect(withExpiredRes.status).toBe(200);
    const withExpiredPayload = (await withExpiredRes.json()) as PagedResponse<{
      issueNumber: string;
      certificateTypeName: string;
      expiresAt: string;
    }>;
    expect(withExpiredPayload.data.content.length).toBeGreaterThanOrEqual(
      defaultPayload.data.content.length
    );
    expect(
      withExpiredPayload.data.content.some((item) => new Date(item.expiresAt).getTime() < Date.now())
    ).toBe(true);
  });

  it('certificate download endpoint follows id-based contract and keeps issueNumber compatibility route', async () => {
    const issueRedirectRes = await fetch(
      '/api/v1/certificates/issues/ISS-2024-0001/download',
      { redirect: 'manual' }
    );
    expect([301, 302, 307, 308]).toContain(issueRedirectRes.status);
    const location = issueRedirectRes.headers.get('Location') || '';
    expect(location).toContain('/api/v1/certificates/issues/issue-001/download');

    const idDownloadRes = await fetch('/api/v1/certificates/issues/issue-001/download');
    expect(idDownloadRes.status).toBe(200);
    expect(idDownloadRes.headers.get('Content-Type')).toBe('application/pdf');
    expect(idDownloadRes.headers.get('Content-Disposition')).toContain('attachment');
  });

  it('file preview path is not a valid contract endpoint, download is valid', async () => {
    const previewRes = await fetch('/api/v1/files/file-001/preview');
    expect(previewRes.status).toBe(404);

    const downloadRes = await fetch('/api/v1/files/file-001/download');
    expect(downloadRes.status).toBe(200);
    expect(downloadRes.headers.get('Content-Type')).toBe('application/pdf');
  });
});
