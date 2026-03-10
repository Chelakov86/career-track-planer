import { test, expect } from '@playwright/test';
import { DE, navigateTo } from './helpers';

test.describe('Schedule View', () => {
    test.beforeEach(async ({ page }) => {
        await navigateTo(page, '/schedule');
    });

    test('should display schedule page title and subtitle', async ({ page }) => {
        await expect(page.getByText(DE.schedule.title)).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(DE.schedule.subtitle)).toBeVisible();
    });

    test('should display schedule blocks with time ranges', async ({ page }) => {
        // Schedule has blocks from 09:00 to 15:00
        await expect(page.getByText('09:00 - 10:00')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('10:00 - 12:00')).toBeVisible();
        await expect(page.getByText('12:00 - 13:00')).toBeVisible();
        await expect(page.getByText('13:00 - 14:00')).toBeVisible();
        await expect(page.getByText('14:00 - 15:00')).toBeVisible();
    });

    test('should display schedule block titles', async ({ page }) => {
        // German block titles
        await expect(page.getByText('Recherche & Screening')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Fokusarbeit: Bewerbungen')).toBeVisible();
        await expect(page.getByText('Mittagspause')).toBeVisible();
        await expect(page.getByText('Weiterbildung (Hard Skills)')).toBeVisible();
        await expect(page.getByText('Netzwerken & Admin')).toBeVisible();
    });

    test('should display category badges', async ({ page }) => {
        // Category badges use the translated German category names
        // These appear as small badges on each block
        await expect(page.getByText('Recherche').first()).toBeVisible({ timeout: 10000 });
        await expect(page.getByText('Fokusarbeit').first()).toBeVisible();
        await expect(page.getByText('Pause').first()).toBeVisible();
        await expect(page.getByText('Lernen').first()).toBeVisible();
        await expect(page.getByText('Netzwerken').first()).toBeVisible();
    });

    test('should have export calendar button', async ({ page }) => {
        await expect(page.getByRole('button', { name: /exportieren/i })).toBeVisible({ timeout: 10000 });
    });

    test('should have action buttons on schedule blocks', async ({ page }) => {
        // "Kalender" buttons for adding to calendar
        const calButtons = page.getByRole('button', { name: DE.schedule.addToCal });
        await expect(calButtons.first()).toBeVisible({ timeout: 10000 });
        expect(await calButtons.count()).toBeGreaterThanOrEqual(4);
    });

    test('should have focus buttons on non-Break blocks', async ({ page }) => {
        // "Fokus starten" appears on non-Break blocks (4 out of 5)
        const focusButtons = page.getByRole('button', { name: DE.schedule.getFocus });
        await expect(focusButtons.first()).toBeVisible({ timeout: 10000 });
        expect(await focusButtons.count()).toBe(4);
    });
});
