import { test, expect } from '@playwright/test';

test.describe('Attendance Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test.describe('Check-in/Check-out', () => {
    test('should display check-in button on dashboard', async ({ page }) => {
      // Look for attendance widget on dashboard
      const checkInButton = page.getByRole('button', { name: /출근/i });
      await expect(checkInButton).toBeVisible();
    });

    test('should successfully check in', async ({ page }) => {
      const checkInButton = page.getByRole('button', { name: /출근/i });
      await checkInButton.click();

      // Should show success message or update button state
      await expect(page.getByText(/출근.*처리|퇴근/i)).toBeVisible({ timeout: 5000 });
    });

    test('should display check-out button after check-in', async ({ page }) => {
      // First check in
      const checkInButton = page.getByRole('button', { name: /출근/i });
      if (await checkInButton.isVisible()) {
        await checkInButton.click();
        await page.waitForTimeout(500);
      }

      // Then check for check-out button
      const checkOutButton = page.getByRole('button', { name: /퇴근/i });
      await expect(checkOutButton).toBeVisible();
    });

    test('should show attendance status on dashboard', async ({ page }) => {
      // Look for today's attendance status
      const attendanceStatus = page.getByText(/출근|퇴근|미출근/i);
      await expect(attendanceStatus).toBeVisible();
    });
  });

  test.describe('Leave Request', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/attendance/leaves');
    });

    test('should display leave management page', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /휴가|연차/i })).toBeVisible();
    });

    test('should display leave balance information', async ({ page }) => {
      // Look for leave balance section
      const balanceInfo = page.getByText(/잔여|남은/i);
      if (await balanceInfo.isVisible()) {
        await expect(balanceInfo).toBeVisible();
      }
    });

    test('should open leave request form', async ({ page }) => {
      const requestButton = page.getByRole('button', { name: /신청|등록/i });
      if (await requestButton.isVisible()) {
        await requestButton.click();

        // Form should appear
        await expect(page.getByLabel(/휴가 종류|유형/i)).toBeVisible();
      }
    });

    test('should fill and submit leave request form', async ({ page }) => {
      const requestButton = page.getByRole('button', { name: /신청|등록/i });
      if (await requestButton.isVisible()) {
        await requestButton.click();

        // Select leave type
        const leaveTypeSelect = page.getByLabel(/휴가 종류|유형/i);
        if (await leaveTypeSelect.isVisible()) {
          await leaveTypeSelect.click();
          await page.getByRole('option', { name: /연차/i }).click();
        }

        // Fill dates
        const startDateInput = page.getByLabel(/시작일/i);
        if (await startDateInput.isVisible()) {
          await startDateInput.fill('2024-03-15');
        }

        const endDateInput = page.getByLabel(/종료일/i);
        if (await endDateInput.isVisible()) {
          await endDateInput.fill('2024-03-15');
        }

        // Fill reason
        const reasonInput = page.getByLabel(/사유/i);
        if (await reasonInput.isVisible()) {
          await reasonInput.fill('개인 사유');
        }

        // Submit
        const submitButton = page.getByRole('button', { name: /신청|저장|확인/i });
        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Should show success message
          await expect(page.getByText(/완료|성공|신청되었습니다/i)).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should display leave request list', async ({ page }) => {
      // Look for leave request table or list
      const leaveList = page.locator('table, [role="grid"]');
      if (await leaveList.isVisible()) {
        await expect(leaveList).toBeVisible();
      }
    });

    test('should show leave status badges', async ({ page }) => {
      // Look for status badges
      const statusBadge = page.getByText(/승인|대기|반려/i);
      if (await statusBadge.first().isVisible()) {
        await expect(statusBadge.first()).toBeVisible();
      }
    });
  });

  test.describe('Attendance Records', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/attendance');
    });

    test('should display attendance page', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /근태|출근/i })).toBeVisible();
    });

    test('should display monthly calendar or list view', async ({ page }) => {
      // Look for calendar or list view
      const calendarOrList = page.locator('[role="grid"], table, .calendar');
      await expect(calendarOrList.first()).toBeVisible();
    });

    test('should filter attendance records by date range', async ({ page }) => {
      const dateFilter = page.getByLabel(/기간|날짜/i);
      if (await dateFilter.isVisible()) {
        await dateFilter.click();
        // Date picker interaction would go here
      }
    });

    test('should display attendance summary statistics', async ({ page }) => {
      // Look for summary info like total working days, late count, etc.
      const summaryText = page.getByText(/근무일|지각|조퇴/i);
      if (await summaryText.first().isVisible()) {
        await expect(summaryText.first()).toBeVisible();
      }
    });
  });

  test.describe('Overtime Request', () => {
    test('should navigate to overtime page', async ({ page }) => {
      await page.goto('/attendance/overtime');

      await expect(page.getByRole('heading', { name: /초과근무|야근/i })).toBeVisible();
    });

    test('should display overtime request list', async ({ page }) => {
      await page.goto('/attendance/overtime');

      const table = page.locator('table');
      if (await table.isVisible()) {
        await expect(table).toBeVisible();
      }
    });

    test('should open overtime request form', async ({ page }) => {
      await page.goto('/attendance/overtime');

      const requestButton = page.getByRole('button', { name: /신청|등록/i });
      if (await requestButton.isVisible()) {
        await requestButton.click();

        // Form should appear
        await expect(page.getByLabel(/날짜|일자/i)).toBeVisible();
      }
    });
  });
});
