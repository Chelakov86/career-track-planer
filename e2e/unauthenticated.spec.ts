import { test, expect } from '@playwright/test';
import { DE, EN } from './helpers';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Unauthenticated user', () => {
  test('should see login page on root', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(DE.login.title)).toBeVisible({ timeout: 15000 });
  });

  test('should redirect /board to login', async ({ page }) => {
    await page.goto('/board');
    await expect(page.getByText(DE.login.title)).toBeVisible({ timeout: 15000 });
  });

  test('should redirect /stats to login', async ({ page }) => {
    await page.goto('/stats');
    await expect(page.getByText(DE.login.title)).toBeVisible({ timeout: 15000 });
  });

  test('should redirect /timeline to login', async ({ page }) => {
    await page.goto('/timeline');
    await expect(page.getByText(DE.login.title)).toBeVisible({ timeout: 15000 });
  });

  test('should redirect /schedule to login', async ({ page }) => {
    await page.goto('/schedule');
    await expect(page.getByText(DE.login.title)).toBeVisible({ timeout: 15000 });
  });

  test('should display login page elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(DE.login.title)).toBeVisible({ timeout: 15000 });

    // Logo
    await expect(page.getByText('CT').first()).toBeVisible();

    // Subtitle
    await expect(page.getByText(DE.login.subtitle)).toBeVisible();

    // Email input
    await expect(page.getByPlaceholder(DE.login.emailPlaceholder)).toBeVisible();

    // Submit button
    await expect(page.getByRole('button', { name: DE.login.sendMagicLink })).toBeVisible();

    // Secured by notice
    await expect(page.getByText(DE.login.securedBy)).toBeVisible();

    // Footer
    await expect(page.getByText(DE.login.footer)).toBeVisible();

    // Language section
    const langSection = page.getByText('LANGUAGE');
    await langSection.scrollIntoViewIfNeeded();
    await expect(langSection).toBeVisible();
  });

  test('should switch language on login page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(DE.login.title)).toBeVisible({ timeout: 15000 });

    // Scroll language buttons into view
    const langSection = page.getByText('LANGUAGE');
    await langSection.scrollIntoViewIfNeeded();

    // Switch to English — use exact match to avoid matching submit button
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.getByText(EN.login.title)).toBeVisible();

    // Switch back to German
    await page.getByRole('button', { name: 'DE', exact: true }).click();
    await expect(page.getByText(DE.login.title)).toBeVisible();
  });
});
