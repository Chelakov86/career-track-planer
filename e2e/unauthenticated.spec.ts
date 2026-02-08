import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Unauthenticated user', () => {
  test('should see login page on root', async ({ page }) => {
    await page.goto('/');
    // Default language is DE — login page shows German title
    await expect(page.getByText('Willkommen zurück')).toBeVisible({ timeout: 15000 });
  });

  test('should redirect /board to login', async ({ page }) => {
    await page.goto('/board');
    await expect(page.getByText('Willkommen zurück')).toBeVisible({ timeout: 15000 });
  });

  test('should redirect /stats to login', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.getByText('Willkommen zurück')).toBeVisible({ timeout: 15000 });
  });
});
