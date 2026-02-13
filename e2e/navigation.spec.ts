import { test, expect } from '@playwright/test';
import { DE, navigateTo } from './helpers';

test.describe('Navigation - Desktop sidebar', () => {
    // These tests are desktop-only since the sidebar is always visible on desktop
    test.skip(({ isMobile }) => isMobile, 'Desktop sidebar tests');

    test('should display sidebar with all nav links', async ({ page }) => {
        await navigateTo(page, '/');

        const sidebar = page.locator('aside');

        // Sidebar branding
        await expect(sidebar.getByText('CareerTrack')).toBeVisible();
        await expect(sidebar.getByText(DE.nav.subtitle)).toBeVisible();

        // Nav links
        await expect(sidebar.getByRole('link', { name: DE.nav.board })).toBeVisible();
        await expect(sidebar.getByRole('link', { name: DE.nav.timeline })).toBeVisible();
        await expect(sidebar.getByRole('link', { name: DE.nav.schedule })).toBeVisible();
        await expect(sidebar.getByRole('link', { name: DE.nav.stats })).toBeVisible();
    });

    test('should navigate to all pages via sidebar links', async ({ page }) => {
        await navigateTo(page, '/');

        const sidebar = page.locator('aside');

        // Navigate to Timeline
        await sidebar.getByRole('link', { name: DE.nav.timeline }).click();
        await expect(page).toHaveURL(/\/timeline/);
        await expect(page.getByText(DE.timeline.title)).toBeVisible();

        // Navigate to Schedule
        await sidebar.getByRole('link', { name: DE.nav.schedule }).click();
        await expect(page).toHaveURL(/\/schedule/);
        await expect(page.getByText(DE.schedule.title)).toBeVisible();

        // Navigate to Stats
        await sidebar.getByRole('link', { name: DE.nav.stats }).click();
        await expect(page).toHaveURL(/\/stats/);
        await expect(page.getByText(DE.dashboard.title).first()).toBeVisible();

        // Navigate back to Board
        await sidebar.getByRole('link', { name: DE.nav.board }).click();
        await expect(page).toHaveURL('/');
        await expect(page.getByText(DE.board.title)).toBeVisible();
    });

    test('should show user profile in sidebar', async ({ page }) => {
        await navigateTo(page, '/');

        // User email should be visible in the sidebar profile section
        const sidebar = page.locator('aside');
        await expect(sidebar.locator('text=@')).toBeVisible({ timeout: 10000 });
    });

    test('should have logout button', async ({ page }) => {
        await navigateTo(page, '/');

        // Logout button is in the sidebar
        const logoutButton = page.getByTitle(DE.nav.logout);
        await expect(logoutButton).toBeVisible();
    });

    test('should highlight active nav link', async ({ page }) => {
        // Board is default — its link should have active class
        await navigateTo(page, '/');
        const sidebar = page.locator('aside');
        const boardLink = sidebar.getByRole('link', { name: DE.nav.board });
        await expect(boardLink).toHaveClass(/text-primary/);

        // Navigate to timeline — timeline link should be active
        await sidebar.getByRole('link', { name: DE.nav.timeline }).click();
        const timelineLink = sidebar.getByRole('link', { name: DE.nav.timeline });
        await expect(timelineLink).toHaveClass(/text-primary/);
    });
});
