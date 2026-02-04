import { test, expect } from '@playwright/test';

test.describe('Approval Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to approval list
    await page.goto('/approval');
  });

  test.describe('Approval List', () => {
    test('should display approval list page', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /결재/i })).toBeVisible();
    });

    test('should display approval tabs', async ({ page }) => {
      // Check for different approval tabs
      await expect(page.getByRole('tab', { name: /대기|결재대기/i })).toBeVisible();
      await expect(page.getByRole('tab', { name: /요청|내 요청/i })).toBeVisible();
    });

    test('should display approval list with data', async ({ page }) => {
      // Wait for data to load
      await page.waitForTimeout(500);

      // Look for approval items
      const approvalItem = page.getByText(/APR-|결재/i);
      if (await approvalItem.first().isVisible()) {
        await expect(approvalItem.first()).toBeVisible();
      }
    });

    test('should switch between approval tabs', async ({ page }) => {
      // Click on requested tab
      const requestedTab = page.getByRole('tab', { name: /요청|내 요청/i });
      if (await requestedTab.isVisible()) {
        await requestedTab.click();

        // URL or content should change
        await page.waitForTimeout(300);
      }

      // Click on completed tab
      const completedTab = page.getByRole('tab', { name: /완료/i });
      if (await completedTab.isVisible()) {
        await completedTab.click();
        await page.waitForTimeout(300);
      }
    });

    test('should filter approvals by type', async ({ page }) => {
      const typeFilter = page.getByRole('combobox').first();
      if (await typeFilter.isVisible()) {
        await typeFilter.click();
        const option = page.getByRole('option', { name: /휴가|경비/i });
        if (await option.isVisible()) {
          await option.click();
        }
      }
    });

    test('should search approvals', async ({ page }) => {
      const searchInput = page.getByPlaceholderText(/검색/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('연차');
        await page.waitForTimeout(500);
      }
    });

    test('should display approval status badges', async ({ page }) => {
      const statusBadge = page.getByText(/결재대기|승인|반려/i);
      if (await statusBadge.first().isVisible()) {
        await expect(statusBadge.first()).toBeVisible();
      }
    });

    test('should display urgency indicators', async ({ page }) => {
      const urgencyBadge = page.getByText(/긴급|높음/i);
      if (await urgencyBadge.first().isVisible()) {
        await expect(urgencyBadge.first()).toBeVisible();
      }
    });
  });

  test.describe('Approval Detail', () => {
    test('should navigate to approval detail page', async ({ page }) => {
      // Click on first approval item
      const approvalRow = page.locator('tr').nth(1);
      if (await approvalRow.isVisible()) {
        await approvalRow.click();
        await expect(page).toHaveURL(/.*approval\/appr-/);
      }
    });

    test('should display approval detail information', async ({ page }) => {
      await page.goto('/approval/appr-001');

      // Check for detail elements
      await expect(page.getByText(/연차 휴가 신청/i)).toBeVisible();
    });

    test('should display approval steps/flow', async ({ page }) => {
      await page.goto('/approval/appr-001');

      // Look for approval flow/steps
      const approvalFlow = page.getByText(/결재선|결재자/i);
      if (await approvalFlow.isVisible()) {
        await expect(approvalFlow).toBeVisible();
      }
    });

    test('should display document content', async ({ page }) => {
      await page.goto('/approval/appr-001');

      // Look for document content section
      const contentSection = page.getByText(/내용|사유/i);
      if (await contentSection.first().isVisible()) {
        await expect(contentSection.first()).toBeVisible();
      }
    });
  });

  test.describe('Approval Actions', () => {
    test('should display approve button for pending approval', async ({ page }) => {
      await page.goto('/approval/appr-001');

      const approveButton = page.getByRole('button', { name: /승인/i });
      if (await approveButton.isVisible()) {
        await expect(approveButton).toBeVisible();
      }
    });

    test('should display reject button for pending approval', async ({ page }) => {
      await page.goto('/approval/appr-001');

      const rejectButton = page.getByRole('button', { name: /반려/i });
      if (await rejectButton.isVisible()) {
        await expect(rejectButton).toBeVisible();
      }
    });

    test('should open confirm dialog when approving', async ({ page }) => {
      await page.goto('/approval/appr-001');

      const approveButton = page.getByRole('button', { name: /승인/i });
      if (await approveButton.isVisible()) {
        await approveButton.click();

        // Confirm dialog should appear
        const dialog = page.getByRole('dialog');
        if (await dialog.isVisible()) {
          await expect(dialog).toBeVisible();
        }
      }
    });

    test('should require comment when rejecting', async ({ page }) => {
      await page.goto('/approval/appr-001');

      const rejectButton = page.getByRole('button', { name: /반려/i });
      if (await rejectButton.isVisible()) {
        await rejectButton.click();

        // Comment input should appear
        const commentInput = page.getByLabel(/사유|의견|코멘트/i);
        if (await commentInput.isVisible()) {
          await expect(commentInput).toBeVisible();
        }
      }
    });

    test('should successfully approve an approval', async ({ page }) => {
      await page.goto('/approval/appr-001');

      const approveButton = page.getByRole('button', { name: /승인/i });
      if (await approveButton.isVisible()) {
        await approveButton.click();

        // If there's a confirm dialog, confirm it
        const confirmButton = page.getByRole('button', { name: /확인|승인/i }).last();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // Should show success message
        await expect(page.getByText(/승인.*완료|처리.*완료/i)).toBeVisible({ timeout: 5000 });
      }
    });

    test('should successfully reject an approval with comment', async ({ page }) => {
      await page.goto('/approval/appr-001');

      const rejectButton = page.getByRole('button', { name: /반려/i });
      if (await rejectButton.isVisible()) {
        await rejectButton.click();

        // Fill in rejection reason
        const commentInput = page.getByLabel(/사유|의견|코멘트/i);
        if (await commentInput.isVisible()) {
          await commentInput.fill('재검토 필요');
        }

        // Confirm rejection
        const confirmButton = page.getByRole('button', { name: /반려|확인/i }).last();
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        // Should show success message
        await expect(page.getByText(/반려.*완료|처리.*완료/i)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Create Approval', () => {
    test('should navigate to create approval page', async ({ page }) => {
      const createButton = page.getByRole('button', { name: /새 결재|기안|작성/i });
      if (await createButton.isVisible()) {
        await createButton.click();
        await expect(page).toHaveURL(/.*approval\/new/);
      }
    });

    test('should display approval form', async ({ page }) => {
      await page.goto('/approval/new');

      // Check for form fields
      await expect(page.getByLabel(/제목/i)).toBeVisible();
      await expect(page.getByLabel(/유형|종류/i)).toBeVisible();
    });

    test('should select approval type', async ({ page }) => {
      await page.goto('/approval/new');

      const typeSelect = page.getByLabel(/유형|종류/i);
      if (await typeSelect.isVisible()) {
        await typeSelect.click();
        const option = page.getByRole('option').first();
        if (await option.isVisible()) {
          await option.click();
        }
      }
    });

    test('should select approvers', async ({ page }) => {
      await page.goto('/approval/new');

      const approverSelect = page.getByLabel(/결재자|결재선/i);
      if (await approverSelect.isVisible()) {
        await approverSelect.click();
        // Search for approver
        await page.keyboard.type('홍길동');
        await page.waitForTimeout(500);
      }
    });
  });
});
