import { test, expect, type Page } from '@playwright/test';

async function signIn(page: Page) {
  await page.goto('/login');
  await page.getByLabel(/아이디/i).fill('demo');
  await page.getByLabel(/비밀번호/i).fill('demo1234');
  await page.getByRole('button', { name: /로그인/i }).click();
  await expect(page).toHaveURL(/.*dashboard/);
}

test.describe('P0 smoke (contract critical flows)', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page);
  });

  test('내 발령 목록 조회가 동작한다', async ({ page }) => {
    await page.goto('/appointments');
    await expect(page).toHaveURL(/.*appointments/);
    await expect(page.locator('role=region').first()).toBeVisible({ timeout: 10000 });

    const table = page.locator('table');
    const hasTable = (await table.count()) > 0;
    if (hasTable) {
      await expect(table.first()).toBeVisible();
      return;
    }

    const emptyMessage = page.getByText(/발령.*없|No data|데이터가 없습니다/i);
    await expect(emptyMessage.first()).toBeVisible();
  });

  test('증명서 신청 목록과 발급 이력을 조회한다', async ({ page }) => {
    const requestResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/v1/certificates/requests/my') &&
      response.request().method() === 'GET'
    );

    await page.goto('/certificates');
    const requestResponse = await requestResponsePromise;
    expect(requestResponse.status()).toBe(200);
    await expect(page).toHaveURL(/.*certificates(?!\/issued)/);

    const issueResponsePromise = page.waitForResponse((response) =>
      response.url().includes('/api/v1/certificates/issues/my') &&
      response.request().method() === 'GET'
    );

    await page.goto('/certificates/issued');
    const issueResponse = await issueResponsePromise;
    expect(issueResponse.status()).toBe(200);
    await expect(page).toHaveURL(/.*certificates\/issued/);
  });

  test('증명서 PDF 다운로드가 id 경로로 수행된다', async ({ page }) => {
    await page.goto('/certificates/issued');

    const issueRows = page.locator('table tbody tr');
    const issueRowCount = await issueRows.count();
    if (issueRowCount === 0) {
      test.skip();
    }

    const downloadButton = issueRows.first().getByRole('button', { name: /다운로드|Download/i });
    const downloadResponsePromise = page.waitForResponse((response) =>
      response.request().method() === 'GET' &&
      /\/api\/v1\/certificates\/issues\/[^/]+\/download/.test(response.url())
    );

    await downloadButton.click();

    const downloadResponse = await downloadResponsePromise;
    expect(downloadResponse.status()).toBe(200);
    expect(downloadResponse.url()).toMatch(/\/api\/v1\/certificates\/issues\/[^/]+\/download/);
  });

  test('파일 미리보기가 download/presigned URL을 사용한다', async ({ page }) => {
    await page.goto('/files');
    await expect(page).toHaveURL(/.*files/);

    const previewCandidates = page.getByRole('button', { name: /미리보기|preview/i });
    const candidateCount = await previewCandidates.count();
    if (candidateCount === 0) {
      test.skip();
    }

    await previewCandidates.first().click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    const previewNode = dialog.locator('iframe[src*="/files/"], img[src*="/files/"]').first();
    await expect(previewNode).toBeVisible();
    const src = await previewNode.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toMatch(/\/files\/[^/]+\/(download|presigned-url)/);
    expect(src).not.toContain('/preview');
  });
});
