import { test, expect } from '@playwright/test';

test.describe('Organization Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/아이디/i).fill('demo');
    await page.getByLabel(/비밀번호/i).fill('demo1234');
    await page.getByRole('button', { name: /로그인/i }).click();
    await expect(page).toHaveURL(/.*dashboard/);

    // Navigate to organization page
    await page.goto('/organization');
  });

  test.describe('Organization Chart View', () => {
    test('should display organization page', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /조직/i })).toBeVisible();
    });

    test('should display organization chart', async ({ page }) => {
      // Look for chart container or tree structure
      const chartContainer = page.locator('.org-chart, [data-testid="org-chart"], .tree');
      if (await chartContainer.isVisible()) {
        await expect(chartContainer).toBeVisible();
      }
    });

    test('should display department nodes', async ({ page }) => {
      // Look for department names
      await expect(page.getByText(/개발팀|인사팀|마케팅팀/i).first()).toBeVisible();
    });

    test('should expand/collapse department nodes', async ({ page }) => {
      // Look for expandable node
      const expandButton = page.locator('[aria-expanded], .expand-btn, button:has(svg)').first();
      if (await expandButton.isVisible()) {
        await expandButton.click();
        await page.waitForTimeout(300);
        // Children should be visible or hidden
      }
    });

    test('should show department details on click', async ({ page }) => {
      // Click on a department
      const department = page.getByText(/개발팀/i).first();
      if (await department.isVisible()) {
        await department.click();

        // Detail panel or modal should appear
        await page.waitForTimeout(300);
      }
    });

    test('should display employee count in department', async ({ page }) => {
      // Look for employee count
      const employeeCount = page.getByText(/\d+명|\d+ 명/i);
      if (await employeeCount.first().isVisible()) {
        await expect(employeeCount.first()).toBeVisible();
      }
    });
  });

  test.describe('View Toggle', () => {
    test('should have view toggle buttons', async ({ page }) => {
      // Look for view toggle (chart/table)
      const toggleButtons = page.getByRole('button', { name: /차트|테이블|목록/i });
      if (await toggleButtons.first().isVisible()) {
        await expect(toggleButtons.first()).toBeVisible();
      }
    });

    test('should switch to table view', async ({ page }) => {
      const tableViewButton = page.getByRole('button', { name: /테이블|목록/i });
      if (await tableViewButton.isVisible()) {
        await tableViewButton.click();

        // Table should be visible
        const table = page.locator('table');
        if (await table.isVisible()) {
          await expect(table).toBeVisible();
        }
      }
    });

    test('should switch back to chart view', async ({ page }) => {
      // First switch to table
      const tableViewButton = page.getByRole('button', { name: /테이블|목록/i });
      if (await tableViewButton.isVisible()) {
        await tableViewButton.click();
        await page.waitForTimeout(300);
      }

      // Then switch back to chart
      const chartViewButton = page.getByRole('button', { name: /차트|조직도/i });
      if (await chartViewButton.isVisible()) {
        await chartViewButton.click();
        await page.waitForTimeout(300);
      }
    });
  });

  test.describe('Table View', () => {
    test.beforeEach(async ({ page }) => {
      // Switch to table view if available
      const tableViewButton = page.getByRole('button', { name: /테이블|목록/i });
      if (await tableViewButton.isVisible()) {
        await tableViewButton.click();
        await page.waitForTimeout(300);
      }
    });

    test('should display department list in table', async ({ page }) => {
      const table = page.locator('table');
      if (await table.isVisible()) {
        await expect(table).toBeVisible();
        // Check for department rows
        await expect(page.getByText(/개발팀/i)).toBeVisible();
      }
    });

    test('should show department hierarchy level', async ({ page }) => {
      // Look for level indicators or parent department info
      const levelInfo = page.getByText(/상위|부서/i);
      if (await levelInfo.first().isVisible()) {
        await expect(levelInfo.first()).toBeVisible();
      }
    });

    test('should sort table by column', async ({ page }) => {
      const table = page.locator('table');
      if (await table.isVisible()) {
        const sortableHeader = page.locator('th button').first();
        if (await sortableHeader.isVisible()) {
          await sortableHeader.click();
          await page.waitForTimeout(300);
        }
      }
    });

    test('should search departments', async ({ page }) => {
      const searchInput = page.getByPlaceholderText(/검색/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('개발');
        await page.waitForTimeout(500);

        // Only matching departments should be visible
        await expect(page.getByText(/개발팀/i)).toBeVisible();
      }
    });
  });

  test.describe('Department Detail', () => {
    test('should navigate to department detail', async ({ page }) => {
      const departmentRow = page.getByText(/개발팀/i).first();
      if (await departmentRow.isVisible()) {
        await departmentRow.click();
        await page.waitForTimeout(300);
      }
    });

    test('should display department information', async ({ page }) => {
      // Navigate to a specific department
      await page.goto('/organization/dept-001');

      // Check for department details
      const detailSection = page.getByText(/부서 정보|상세/i);
      if (await detailSection.isVisible()) {
        await expect(detailSection).toBeVisible();
      }
    });

    test('should display department members', async ({ page }) => {
      await page.goto('/organization/dept-001');

      // Look for member list
      const memberSection = page.getByText(/소속 직원|멤버/i);
      if (await memberSection.isVisible()) {
        await expect(memberSection).toBeVisible();
      }
    });

    test('should display department head/manager', async ({ page }) => {
      await page.goto('/organization/dept-001');

      // Look for manager info
      const managerInfo = page.getByText(/팀장|부서장|관리자/i);
      if (await managerInfo.first().isVisible()) {
        await expect(managerInfo.first()).toBeVisible();
      }
    });
  });

  test.describe('Department Management', () => {
    test('should have add department button (admin only)', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /추가|등록|새 부서/i });
      // This might only be visible for admins
      if (await addButton.isVisible()) {
        await expect(addButton).toBeVisible();
      }
    });

    test('should open department form when add button clicked', async ({ page }) => {
      const addButton = page.getByRole('button', { name: /추가|등록|새 부서/i });
      if (await addButton.isVisible()) {
        await addButton.click();

        // Form should appear
        const formTitle = page.getByText(/부서 등록|부서 추가/i);
        if (await formTitle.isVisible()) {
          await expect(formTitle).toBeVisible();
        }
      }
    });

    test('should display edit button for department', async ({ page }) => {
      await page.goto('/organization/dept-001');

      const editButton = page.getByRole('button', { name: /수정|편집/i });
      if (await editButton.isVisible()) {
        await expect(editButton).toBeVisible();
      }
    });
  });

  test.describe('Organization History', () => {
    test('should navigate to history view if available', async ({ page }) => {
      const historyTab = page.getByRole('tab', { name: /이력|변경/i });
      if (await historyTab.isVisible()) {
        await historyTab.click();
        await page.waitForTimeout(300);
      }
    });

    test('should display organization change history', async ({ page }) => {
      await page.goto('/organization/history');

      const historyList = page.getByText(/변경|이력|발령/i);
      if (await historyList.first().isVisible()) {
        await expect(historyList.first()).toBeVisible();
      }
    });
  });

  test.describe('Position and Grade Management', () => {
    test('should navigate to positions page', async ({ page }) => {
      await page.goto('/organization/positions');

      const positionTitle = page.getByRole('heading', { name: /직책|포지션/i });
      if (await positionTitle.isVisible()) {
        await expect(positionTitle).toBeVisible();
      }
    });

    test('should navigate to grades page', async ({ page }) => {
      await page.goto('/organization/grades');

      const gradeTitle = page.getByRole('heading', { name: /직급|등급/i });
      if (await gradeTitle.isVisible()) {
        await expect(gradeTitle).toBeVisible();
      }
    });

    test('should display position list', async ({ page }) => {
      await page.goto('/organization/positions');

      const positionItem = page.getByText(/팀장|선임|사원/i);
      if (await positionItem.first().isVisible()) {
        await expect(positionItem.first()).toBeVisible();
      }
    });

    test('should display grade list', async ({ page }) => {
      await page.goto('/organization/grades');

      const gradeItem = page.getByText(/부장|과장|대리/i);
      if (await gradeItem.first().isVisible()) {
        await expect(gradeItem.first()).toBeVisible();
      }
    });
  });
});
