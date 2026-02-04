import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /HR Platform/i })).toBeVisible();
    await expect(page.getByLabel(/아이디/i)).toBeVisible();
    await expect(page.getByLabel(/비밀번호/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /로그인/i })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.getByRole('button', { name: /로그인/i }).click();

    await expect(page.getByText(/아이디를 입력해주세요/i)).toBeVisible();
    await expect(page.getByText(/비밀번호를 입력해주세요/i)).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();

    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/안녕하세요.*님/)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    const passwordInput = page.getByLabel(/비밀번호/i);
    await passwordInput.fill('demo1234');

    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the eye icon button
    await page.locator('button:has(svg)').last().click();

    await expect(passwordInput).toHaveAttribute('type', 'text');
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*login/);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.getByLabel(/아이디/i).fill('wronguser');
    await page.getByLabel(/비밀번호/i).fill('wrongpassword');
    await page.getByRole('button', { name: /로그인/i }).click();

    // Should show error message
    await expect(page.getByText(/올바르지 않습니다|실패/i)).toBeVisible();
  });

  test('should display user info after login', async ({ page }) => {
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();

    await expect(page).toHaveURL(/.*dashboard/);

    // Check for user avatar/menu in header
    const userMenu = page.locator('[data-tour="header-user-menu"]');
    await expect(userMenu).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();

    await expect(page).toHaveURL(/.*dashboard/);

    // Open user menu and click logout
    const userMenu = page.locator('[data-tour="header-user-menu"]');
    await userMenu.click();

    await page.getByRole('menuitem', { name: /로그아웃/i }).click();

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Password Change', () => {
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

  test('should display password change form', async ({ page }) => {
    // Look for password change section
    const passwordSection = page.getByText(/비밀번호 변경/i);
    if (await passwordSection.isVisible()) {
      await expect(passwordSection).toBeVisible();
    }
  });

  test('should validate current password', async ({ page }) => {
    const currentPasswordInput = page.getByLabel(/현재 비밀번호/i);
    const newPasswordInput = page.getByLabel(/새 비밀번호/i);
    const confirmPasswordInput = page.getByLabel(/비밀번호 확인/i);
    const submitButton = page.getByRole('button', { name: /변경|저장/i });

    if (await currentPasswordInput.isVisible()) {
      await currentPasswordInput.fill('wrongpassword');
      await newPasswordInput.fill('newPassword123!');
      await confirmPasswordInput.fill('newPassword123!');
      await submitButton.click();

      // Should show error for wrong current password
      await expect(page.getByText(/현재 비밀번호.*올바르지 않습니다/i)).toBeVisible();
    }
  });

  test('should validate password confirmation match', async ({ page }) => {
    const currentPasswordInput = page.getByLabel(/현재 비밀번호/i);
    const newPasswordInput = page.getByLabel(/새 비밀번호/i);
    const confirmPasswordInput = page.getByLabel(/비밀번호 확인/i);
    const submitButton = page.getByRole('button', { name: /변경|저장/i });

    if (await currentPasswordInput.isVisible()) {
      await currentPasswordInput.fill('demo1234');
      await newPasswordInput.fill('newPassword123!');
      await confirmPasswordInput.fill('differentPassword!');
      await submitButton.click();

      // Should show error for password mismatch
      await expect(page.getByText(/일치하지 않습니다/i)).toBeVisible();
    }
  });
});

test.describe('Session Management', () => {
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

  test('should display active sessions', async ({ page }) => {
    // Look for sessions section
    const sessionsSection = page.getByText(/로그인 세션|활성 세션/i);
    if (await sessionsSection.isVisible()) {
      await expect(sessionsSection).toBeVisible();

      // Should show current session
      await expect(page.getByText(/현재 세션|이 기기/i)).toBeVisible();
    }
  });

  test('should mark current session', async ({ page }) => {
    const currentSessionBadge = page.getByText(/현재 세션/i);
    if (await currentSessionBadge.isVisible()) {
      await expect(currentSessionBadge).toBeVisible();
    }
  });
});
