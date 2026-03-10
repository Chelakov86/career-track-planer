import { test, expect } from '@playwright/test';
import { DE, navigateTo } from './helpers';

test.describe('Authenticated user', () => {
  test('should not show login page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(DE.login.title)).not.toBeVisible();
    await expect(page.getByText('Welcome Back')).not.toBeVisible();
  });

  test('should display board content', async ({ page, isMobile }) => {
    await navigateTo(page, '/');
    await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

    if (isMobile) {
      // Mobile shows accordion sections with aria-expanded
      const accordionButtons = page.locator('button[aria-expanded]');
      await expect(accordionButtons.first()).toBeVisible({ timeout: 10000 });
      expect(await accordionButtons.count()).toBeGreaterThanOrEqual(1);
    } else {
      for (const column of DE.board.columns.slice(0, 4)) {
        await expect(page.getByText(column).first()).toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should navigate between pages', async ({ page }) => {
    await navigateTo(page, '/');
    await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

    await page.goto('/timeline');
    await expect(page).toHaveURL(/\/timeline/);
    await expect(page.getByText(DE.timeline.title)).toBeVisible({ timeout: 10000 });

    await page.goto('/stats');
    await expect(page).toHaveURL(/\/stats/);
    await expect(page.getByText(DE.dashboard.title).first()).toBeVisible({ timeout: 10000 });

    await page.goto('/schedule');
    await expect(page).toHaveURL(/\/schedule/);
    await expect(page.getByText(DE.schedule.title)).toBeVisible({ timeout: 10000 });
  });
});
