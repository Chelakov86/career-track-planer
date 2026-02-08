import { test, expect } from '@playwright/test';

test.describe('Authenticated user', () => {
  test('should not show login page', async ({ page }) => {
    await page.goto('/');
    // Login page title should not be visible (EN or DE)
    await expect(page.getByText('Willkommen zurück')).not.toBeVisible();
    await expect(page.getByText('Welcome Back')).not.toBeVisible();
  });

  test('should display board columns', async ({ page }) => {
    await page.goto('/');
    // Default language is DE — check German column headers
    // Use .first() since status names appear in both column headers and filter buttons
    await expect(page.getByText('Recherche').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Zu bewerben').first()).toBeVisible();
    await expect(page.getByText('Beworben').first()).toBeVisible();
    await expect(page.getByText('Interview').first()).toBeVisible();
  });

  test('should navigate between pages', async ({ page }) => {
    // Board is the default route at /
    await page.goto('/');
    await expect(page.getByText('Bewerbungstracker')).toBeVisible({ timeout: 10000 });

    // Timeline
    await page.goto('/timeline');
    await expect(page).toHaveURL(/\/timeline/);

    // Stats
    await page.goto('/stats');
    await expect(page).toHaveURL(/\/stats/);
  });
});
