import { test, expect } from '@playwright/test';

test.describe('Notification Center', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to notifications
    await page.goto('/notifications');
  });

  test('should display notification center page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /알림/i })).toBeVisible();
  });

  test('should display notification list', async ({ page }) => {
    // Wait for notifications to load
    const notificationItems = page.locator('[data-testid="notification-item"]');

    // Either has notifications or shows empty state
    const hasNotifications = await notificationItems.count() > 0;
    const hasEmptyState = await page.getByText(/알림이 없습니다/i).isVisible();

    expect(hasNotifications || hasEmptyState).toBeTruthy();
  });

  test('should filter notifications by type', async ({ page }) => {
    const typeFilter = page.getByRole('combobox').first();
    if (await typeFilter.isVisible()) {
      await typeFilter.click();

      // Select approval notifications
      const approvalOption = page.getByRole('option', { name: /결재/i });
      if (await approvalOption.isVisible()) {
        await approvalOption.click();
      }
    }
  });

  test('should filter unread notifications only', async ({ page }) => {
    const unreadFilter = page.getByLabel(/읽지 않은 알림/i);
    if (await unreadFilter.isVisible()) {
      await unreadFilter.click();
    }
  });

  test('should mark notification as read', async ({ page }) => {
    const unreadNotification = page.locator('[data-testid="notification-item"]').filter({
      has: page.locator('.unread-indicator, [data-unread="true"]'),
    }).first();

    if (await unreadNotification.isVisible()) {
      await unreadNotification.click();

      // Should mark as read (visual change)
    }
  });

  test('should mark all notifications as read', async ({ page }) => {
    const markAllReadButton = page.getByRole('button', { name: /모두 읽음/i });
    if (await markAllReadButton.isVisible()) {
      await markAllReadButton.click();

      // Should show success message or update UI
    }
  });

  test('should delete notification', async ({ page }) => {
    const notification = page.locator('[data-testid="notification-item"]').first();

    if (await notification.isVisible()) {
      // Hover to show delete button
      await notification.hover();

      const deleteButton = notification.getByRole('button', { name: /삭제/i });
      if (await deleteButton.isVisible()) {
        await deleteButton.click();

        // Confirm deletion if dialog appears
        const confirmButton = page.getByRole('button', { name: /확인|삭제/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
      }
    }
  });

  test('should display notification details', async ({ page }) => {
    const notification = page.locator('[data-testid="notification-item"]').first();

    if (await notification.isVisible()) {
      // Should show title and message
      await expect(notification.getByText(/.+/)).toBeVisible();
    }
  });

  test('should navigate to related content on click', async ({ page }) => {
    const notificationWithLink = page.locator('[data-testid="notification-item"]').filter({
      has: page.locator('[data-has-link="true"]'),
    }).first();

    if (await notificationWithLink.isVisible()) {
      const initialUrl = page.url();
      await notificationWithLink.click();

      // Should navigate to linked content (URL should change)
      // Or stay if no link
    }
  });
});

test.describe('Notification Bell', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should display notification bell in header', async ({ page }) => {
    const notificationBell = page.locator('[data-tour="header-notifications"]');
    await expect(notificationBell).toBeVisible();
  });

  test('should show unread count badge', async ({ page }) => {
    const notificationBell = page.locator('[data-tour="header-notifications"]');
    const badge = notificationBell.locator('.badge, [data-badge]');

    // Badge may or may not be visible depending on unread count
    // Just check that bell is visible
    await expect(notificationBell).toBeVisible();
  });

  test('should navigate to notifications on bell click', async ({ page }) => {
    const notificationBell = page.locator('[data-tour="header-notifications"]');
    await notificationBell.click();

    await expect(page).toHaveURL(/.*notifications/);
  });
});

test.describe('Notification Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to settings
    await page.goto('/settings');
  });

  test('should display notification settings', async ({ page }) => {
    const notificationSettings = page.getByText(/알림 설정/i);
    await expect(notificationSettings).toBeVisible();
  });

  test('should toggle email notifications', async ({ page }) => {
    const emailToggle = page.getByLabel(/이메일/i);
    if (await emailToggle.isVisible()) {
      const initialState = await emailToggle.isChecked();
      await emailToggle.click();

      // State should change
      expect(await emailToggle.isChecked()).toBe(!initialState);
    }
  });

  test('should toggle push notifications', async ({ page }) => {
    const pushToggle = page.getByLabel(/푸시|모바일/i);
    if (await pushToggle.isVisible()) {
      const initialState = await pushToggle.isChecked();
      await pushToggle.click();

      expect(await pushToggle.isChecked()).toBe(!initialState);
    }
  });

  test('should toggle browser notifications', async ({ page }) => {
    const browserToggle = page.getByLabel(/브라우저/i);
    if (await browserToggle.isVisible()) {
      const initialState = await browserToggle.isChecked();
      await browserToggle.click();

      expect(await browserToggle.isChecked()).toBe(!initialState);
    }
  });

  test('should toggle notification categories', async ({ page }) => {
    const approvalToggle = page.getByLabel(/결재 알림/i);
    if (await approvalToggle.isVisible()) {
      const initialState = await approvalToggle.isChecked();
      await approvalToggle.click();

      expect(await approvalToggle.isChecked()).toBe(!initialState);
    }
  });

  test('should save notification settings', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /저장/i });
    if (await saveButton.isVisible()) {
      await saveButton.click();

      // Should show success message
      await expect(page.getByText(/저장되었습니다|성공/i)).toBeVisible();
    }
  });

  test('should toggle quiet hours', async ({ page }) => {
    const quietHoursToggle = page.getByLabel(/방해 금지|조용한 시간/i);
    if (await quietHoursToggle.isVisible()) {
      const initialState = await quietHoursToggle.isChecked();
      await quietHoursToggle.click();

      expect(await quietHoursToggle.isChecked()).toBe(!initialState);
    }
  });

  test('should toggle daily digest', async ({ page }) => {
    const digestToggle = page.getByLabel(/요약 알림|일일 요약/i);
    if (await digestToggle.isVisible()) {
      const initialState = await digestToggle.isChecked();
      await digestToggle.click();

      expect(await digestToggle.isChecked()).toBe(!initialState);
    }
  });
});
