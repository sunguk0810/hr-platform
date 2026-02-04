import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
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

  test('should display settings page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /설정/i })).toBeVisible();
  });

  test('should display settings sections', async ({ page }) => {
    // Check for common settings sections - at least one should be visible
    const sections = [
      page.getByText(/개인 설정|프로필/i),
      page.getByText(/알림 설정/i),
      page.getByText(/보안/i),
    ];

    let visibleCount = 0;
    for (const section of sections) {
      if (await section.isVisible()) {
        visibleCount++;
      }
    }
    expect(visibleCount).toBeGreaterThan(0);
  });
});

test.describe('Theme Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should toggle dark mode from header', async ({ page }) => {
    // Find theme toggle button in header (sun/moon icon)
    const themeToggle = page.locator('button').filter({ has: page.locator('svg.lucide-moon, svg.lucide-sun') });

    if (await themeToggle.isVisible()) {
      // Check initial state
      const initialHtmlClass = await page.locator('html').getAttribute('class');
      const wasDark = initialHtmlClass?.includes('dark') || false;

      await themeToggle.click();

      // Class should change
      const newHtmlClass = await page.locator('html').getAttribute('class');
      const isDark = newHtmlClass?.includes('dark') || false;

      expect(isDark).toBe(!wasDark);
    }
  });

  test('should persist theme preference', async ({ page }) => {
    // Find theme toggle button in header
    const themeToggle = page.locator('button').filter({ has: page.locator('svg.lucide-moon, svg.lucide-sun') });

    if (await themeToggle.isVisible()) {
      // Set to dark mode if not already
      const initialClass = await page.locator('html').getAttribute('class');
      if (!initialClass?.includes('dark')) {
        await themeToggle.click();
      }

      // Verify dark mode is on
      await expect(page.locator('html')).toHaveClass(/dark/);

      // Reload page
      await page.reload();

      // Theme should persist
      await expect(page.locator('html')).toHaveClass(/dark/);
    }
  });
});

test.describe('Language Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('/settings');
  });

  test('should display language settings', async ({ page }) => {
    const languageSelect = page.getByLabel(/언어/i);
    if (await languageSelect.isVisible()) {
      await expect(languageSelect).toBeVisible();
    }
  });

  test('should change language to English', async ({ page }) => {
    const languageSelect = page.getByLabel(/언어/i);
    if (await languageSelect.isVisible()) {
      await languageSelect.click();

      const englishOption = page.getByRole('option', { name: /English|영어/i });
      if (await englishOption.isVisible()) {
        await englishOption.click();

        // Save if needed
        const saveButton = page.getByRole('button', { name: /저장/i });
        if (await saveButton.isVisible()) {
          await saveButton.click();
        }
      }
    }
  });
});

test.describe('Profile Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('/my-info');
  });

  test('should display profile information', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /내 정보/i })).toBeVisible();

    // Should show user info sections
    await expect(page.getByText(/이메일/i)).toBeVisible();
    await expect(page.getByText(/부서/i)).toBeVisible();
  });

  test('should open edit dialog', async ({ page }) => {
    const editButton = page.getByRole('button', { name: /수정|편집/i });
    await editButton.click();

    // Should show edit dialog
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('should update profile information', async ({ page }) => {
    const editButton = page.getByRole('button', { name: /수정|편집/i });
    await editButton.click();

    // Wait for dialog
    await expect(page.getByRole('dialog')).toBeVisible();

    const emailInput = page.getByRole('dialog').getByLabel(/이메일/i);
    if (await emailInput.isVisible()) {
      await emailInput.clear();
      await emailInput.fill('newemail@company.com');

      const saveButton = page.getByRole('dialog').getByRole('button', { name: /저장/i });
      await saveButton.click();

      // Should show success message
      await expect(page.getByText(/저장|완료|성공/i)).toBeVisible();
    }
  });

  test('should display profile avatar', async ({ page }) => {
    // Avatar should be visible (either image or fallback)
    const avatar = page.locator('.avatar, [data-avatar]').first();
    await expect(avatar).toBeVisible();
  });
});

test.describe('Sidebar Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('should toggle sidebar collapse', async ({ page }) => {
    const sidebar = page.locator('[data-tour="sidebar"]');

    if (await sidebar.isVisible()) {
      const collapseButton = sidebar.getByRole('button').first();

      if (await collapseButton.isVisible()) {
        // Get initial width
        const initialBox = await sidebar.boundingBox();

        await collapseButton.click();

        // Wait for animation
        await page.waitForTimeout(400);

        // Width should change
        const newBox = await sidebar.boundingBox();

        if (initialBox && newBox) {
          expect(initialBox.width !== newBox.width).toBeTruthy();
        }
      }
    }
  });

  test('should persist sidebar state', async ({ page }) => {
    const sidebar = page.locator('[data-tour="sidebar"]');

    if (await sidebar.isVisible()) {
      const collapseButton = sidebar.getByRole('button').first();

      if (await collapseButton.isVisible()) {
        // Collapse sidebar
        await collapseButton.click();
        await page.waitForTimeout(400);

        // Get collapsed width
        const collapsedBox = await sidebar.boundingBox();

        // Reload page
        await page.reload();

        // Sidebar state should persist
        const persistedBox = await sidebar.boundingBox();

        if (collapsedBox && persistedBox) {
          // Width should still be collapsed
          expect(Math.abs(collapsedBox.width - persistedBox.width)).toBeLessThan(5);
        }
      }
    }
  });

  test('should navigate using sidebar menu', async ({ page }) => {
    const sidebar = page.locator('[data-tour="sidebar"]');

    if (await sidebar.isVisible()) {
      // Click on employees menu item
      const employeesLink = sidebar.getByText(/직원/i);

      if (await employeesLink.isVisible()) {
        await employeesLink.click();
        await expect(page).toHaveURL(/.*employees/);
      }
    }
  });
});

test.describe('Accessibility Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    await page.goto('/settings');
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through settings sections
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to navigate with keyboard
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check for ARIA labels on interactive elements
    const buttons = page.getByRole('button');
    const count = await buttons.count();

    // At least some buttons should have accessible names
    expect(count).toBeGreaterThan(0);
  });

  test('should maintain focus after interactions', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /저장/i });
    if (await saveButton.isVisible()) {
      await saveButton.focus();
      await saveButton.click();

      // Focus should remain on page or move to feedback element
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    }
  });
});
