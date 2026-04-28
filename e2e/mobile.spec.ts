import { test, expect, devices } from '@playwright/test';
import { DE, navigateTo } from './helpers';

/**
 * Mobile-specific tests that verify behaviors unique to mobile viewports.
 * These use Pixel 5 device emulation explicitly.
 */
test.use({ ...devices['Pixel 5'] });

test.describe('Mobile View', () => {
    test('should show mobile header with hamburger', async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        // Mobile header is visible (md:hidden)
        const header = page.locator('.md\\:hidden').first();
        await expect(header).toBeVisible();

        // CareerTrack branding in header
        await expect(header.getByText('CareerTrack')).toBeVisible();
    });

    test('should open sidebar via hamburger menu', async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        // Click the last button in header (hamburger menu icon)
        const header = page.locator('.md\\:hidden').first();
        const menuButton = header.locator('button').last();
        await menuButton.click();

        // Sidebar should slide in
        const sidebar = page.locator('aside');
        await expect(sidebar.getByRole('link', { name: DE.nav.board })).toBeVisible();
        await expect(sidebar.getByRole('link', { name: DE.nav.timeline })).toBeVisible();
    });

    test('should navigate via mobile sidebar and close it', async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        // Open menu
        const header = page.locator('.md\\:hidden').first();
        await header.locator('button').last().click();

        // Navigate to timeline
        const sidebar = page.locator('aside');
        await sidebar.getByRole('link', { name: DE.nav.timeline }).click();

        // Should arrive at timeline
        await expect(page).toHaveURL(/\/timeline/);
        await expect(page.getByText(DE.timeline.title)).toBeVisible();
    });

    test('should show mobile board with accordion sections', async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        // Mobile board shows collapsible status sections with aria-expanded
        const accordionButtons = page.locator('button.column-accordion-button');
        const count = await accordionButtons.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should toggle mobile accordion sections', async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        const accordionButtons = page.locator('button.column-accordion-button');
        const count = await accordionButtons.count();

        if (count > 1) {
            const secondSection = accordionButtons.nth(1);
            const wasExpanded = await secondSection.getAttribute('aria-expanded');
            await secondSection.click();
            const isNowExpanded = await secondSection.getAttribute('aria-expanded');
            expect(isNowExpanded).not.toEqual(wasExpanded);
        }
    });

    test('should show floating action button (FAB) for adding jobs', async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        // FAB has aria-label matching "Job hinzufügen"
        const fab = page.getByLabel(DE.board.addJob);
        await expect(fab).toBeVisible();
    });

    test('should open add modal from FAB', async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        // Click FAB
        await page.getByLabel(DE.board.addJob).click();

        // Modal should open — use role-based locator to avoid ambiguity with filter search
        await expect(page.getByRole('textbox', { name: DE.board.placeholders.company })).toBeVisible({ timeout: 5000 });
    });

    test('should show theme toggle in mobile header', async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        const header = page.locator('.md\\:hidden').first();
        const themeButton = header.getByTitle(DE.toggleTheme).or(header.getByLabel(DE.toggleTheme));
        await expect(themeButton).toBeVisible();
    });

    test('should show language toggle in mobile header', async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        const header = page.locator('.md\\:hidden').first();
        // Language button shows current language as text ("de" or "en")
        const langButton = header.locator('button').filter({ hasText: /^(de|en)$/i });
        await expect(langButton).toBeVisible();
    });
});
