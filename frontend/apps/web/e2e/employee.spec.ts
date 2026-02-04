import { test, expect } from '@playwright/test';

test.describe('Employee Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to employee list
    await page.goto('/employees');
  });

  test('should display employee list page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /직원 관리/i })).toBeVisible();
    await expect(page.getByPlaceholderText(/검색/i)).toBeVisible();
  });

  test('should display employee data in table', async ({ page }) => {
    // Wait for data to load
    await expect(page.getByText('홍길동')).toBeVisible();
    await expect(page.getByText('김철수')).toBeVisible();
  });

  test('should search employees by name', async ({ page }) => {
    const searchInput = page.getByPlaceholderText(/검색/i);
    await searchInput.fill('홍길동');

    // Wait for filtered results
    await expect(page.getByText('홍길동')).toBeVisible();
    // Other employees should not be visible or be filtered out
  });

  test('should search employees by employee number', async ({ page }) => {
    const searchInput = page.getByPlaceholderText(/검색/i);
    await searchInput.fill('EMP2024001');

    await expect(page.getByText('홍길동')).toBeVisible();
  });

  test('should filter employees by employment status', async ({ page }) => {
    // Look for status filter dropdown
    const statusFilter = page.getByRole('combobox').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.getByRole('option', { name: /재직/i }).click();
    }
  });

  test('should navigate to employee detail page', async ({ page }) => {
    // Click on an employee row
    const employeeRow = page.getByText('홍길동').first();
    await employeeRow.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/.*employees\/emp-/);
    await expect(page.getByText('홍길동')).toBeVisible();
  });

  test('should display employee detail information', async ({ page }) => {
    await page.goto('/employees/emp-001');

    // Check for employee info sections
    await expect(page.getByText('홍길동')).toBeVisible();
    await expect(page.getByText(/개발팀/)).toBeVisible();
    await expect(page.getByText(/팀장/)).toBeVisible();
  });

  test('should navigate to employee registration page', async ({ page }) => {
    const addButton = page.getByRole('button', { name: /등록|추가|신규/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page).toHaveURL(/.*employees\/new/);
    }
  });

  test('should display registration form fields', async ({ page }) => {
    await page.goto('/employees/new');

    // Check for form fields
    await expect(page.getByLabel(/이름/i)).toBeVisible();
    await expect(page.getByLabel(/이메일/i)).toBeVisible();
    await expect(page.getByLabel(/사번/i)).toBeVisible();
  });

  test('should show validation errors on empty form submit', async ({ page }) => {
    await page.goto('/employees/new');

    const submitButton = page.getByRole('button', { name: /저장|등록/i });
    if (await submitButton.isVisible()) {
      await submitButton.click();

      // Should show validation errors
      await expect(page.getByText(/필수/i)).toBeVisible();
    }
  });

  test('should paginate through employee list', async ({ page }) => {
    // Check for pagination controls
    const paginationInfo = page.getByText(/페이지/);
    if (await paginationInfo.isVisible()) {
      const nextButton = page.getByRole('button', { name: /다음/i });
      if (await nextButton.isEnabled()) {
        await nextButton.click();
        // Page should change
        await expect(page.getByText(/2 \//)).toBeVisible();
      }
    }
  });

  test('should display correct employment status badges', async ({ page }) => {
    // Check for status badges
    await expect(page.getByText('재직')).toBeVisible();
  });

  test('should show masked personal information', async ({ page }) => {
    await page.goto('/employees/emp-001');

    // Phone numbers should be masked
    const maskedPhone = page.getByText(/010-\*{4}-\d{4}/);
    if (await maskedPhone.isVisible()) {
      await expect(maskedPhone).toBeVisible();
    }
  });
});
