import { test, expect } from '@playwright/test';
import { DE, navigateTo } from './helpers';

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await navigateTo(page, '/stats');
    });

    test('should display dashboard title and subtitle', async ({ page }) => {
        await expect(page.getByText(DE.dashboard.title).first()).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(DE.dashboard.subtitle)).toBeVisible();
    });

    test('should display stat cards', async ({ page }) => {
        // Total Applications card
        await expect(page.getByText(DE.dashboard.total)).toBeVisible({ timeout: 10000 });

        // Active Pipeline card
        await expect(page.getByText(DE.dashboard.active)).toBeVisible();

        // Interviews card
        await expect(page.getByText(DE.dashboard.interviews)).toBeVisible();
    });

    test('should display stat values as numbers', async ({ page }) => {
        // Each stat card has an h3 with a number
        const statValues = page.locator('h3.text-2xl');
        await expect(statValues.first()).toBeVisible({ timeout: 10000 });
        expect(await statValues.count()).toBeGreaterThanOrEqual(3);
    });

    test('should display funnel chart section', async ({ page }) => {
        await expect(page.getByText(DE.dashboard.funnel)).toBeVisible({ timeout: 10000 });
    });

    test('should display applications over time chart', async ({ page }) => {
        await expect(page.getByText(DE.dashboard.applicationsOverTime)).toBeVisible({ timeout: 10000 });
    });

    test('should display recent activity section', async ({ page }) => {
        await expect(page.getByText(DE.dashboard.recentActivity)).toBeVisible({ timeout: 10000 });
    });
});
