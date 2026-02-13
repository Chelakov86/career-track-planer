import { test, expect } from '@playwright/test';
import { DE, EN, navigateTo } from './helpers';

test.describe('Settings - Language & Theme', () => {
    test('should switch language EN → DE in sidebar', async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        // Default is DE — switch to EN
        const sidebar = page.locator('aside');
        const enButton = sidebar.getByRole('button', { name: 'EN' });

        // On desktop, sidebar is visible
        if (await enButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await enButton.click();

            // Board title should switch to English
            await expect(page.getByText(EN.board.title)).toBeVisible();

            // Column headers should be English
            await expect(page.getByText('Research').first()).toBeVisible();

            // Switch back to DE
            await sidebar.getByRole('button', { name: 'DE' }).click();
            await expect(page.getByText(DE.board.title)).toBeVisible();
        }
    });

    test('should switch language via mobile header', async ({ page, isMobile }) => {
        test.skip(!isMobile, 'Mobile-only test');

        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        // Mobile header has a language toggle button showing current language
        const header = page.locator('.md\\:hidden').first();
        const langButton = header.getByText(/^de$/i).or(header.getByText(/^en$/i));

        if (await langButton.isVisible({ timeout: 3000 }).catch(() => false)) {
            await langButton.click();
            // Should toggle to EN
            await expect(page.getByText(EN.board.title)).toBeVisible({ timeout: 5000 });
        }
    });

    test('should toggle dark mode', async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        // Get initial theme state
        const html = page.locator('html');

        // Find the theme toggle button
        const themeButton = page.getByTitle(DE.toggleTheme).or(page.getByLabel(DE.toggleTheme));

        if (await themeButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
            // Click to toggle theme
            await themeButton.first().click();

            // Check if dark class appeared or disappeared
            const hasDark = await html.getAttribute('class');
            const isDark = hasDark?.includes('dark');

            // Toggle again
            await themeButton.first().click();

            // Class should have changed
            const hasDarkAfter = await html.getAttribute('class');
            const isDarkAfter = hasDarkAfter?.includes('dark');

            expect(isDark).not.toEqual(isDarkAfter);
        }
    });

    test('should persist theme preference on page reload', async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        const html = page.locator('html');
        const themeButton = page.getByTitle(DE.toggleTheme).or(page.getByLabel(DE.toggleTheme));

        if (await themeButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
            // Get current state
            const classBefore = await html.getAttribute('class');

            // Toggle theme
            await themeButton.first().click();
            await page.waitForTimeout(300);
            const classAfter = await html.getAttribute('class');

            // Reload page
            await page.reload();
            await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

            // Theme should persist from localStorage
            const classAfterReload = await html.getAttribute('class');
            const darkAfter = classAfter?.includes('dark') ?? false;
            const darkAfterReload = classAfterReload?.includes('dark') ?? false;
            expect(darkAfter).toEqual(darkAfterReload);

            // Toggle back to restore original state
            await themeButton.first().click();
        }
    });

    test('should update navigation labels when language changes', async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });

        const sidebar = page.locator('aside');
        const enButton = sidebar.getByRole('button', { name: 'EN' });

        if (await enButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await enButton.click();

            // Nav links should update to English
            await expect(page.getByRole('link', { name: EN.nav.board })).toBeVisible();
            await expect(page.getByRole('link', { name: EN.nav.timeline })).toBeVisible();
            await expect(page.getByRole('link', { name: EN.nav.schedule })).toBeVisible();
            await expect(page.getByRole('link', { name: EN.nav.stats })).toBeVisible();

            // Restore to DE
            await sidebar.getByRole('button', { name: 'DE' }).click();
        }
    });
});
