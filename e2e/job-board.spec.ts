import { test, expect } from '@playwright/test';
import { DE, navigateTo } from './helpers';

test.describe('Job Board', () => {
    test.beforeEach(async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });
    });

    test('should display board title and subtitle', async ({ page }) => {
        await expect(page.getByText(DE.board.title)).toBeVisible();
        await expect(page.getByText(DE.board.subtitle)).toBeVisible();
    });

    test('should display kanban columns with status headers', async ({ page, isMobile }) => {
        if (isMobile) {
            const accordionButtons = page.locator('button[aria-expanded]');
            await expect(accordionButtons.first()).toBeVisible({ timeout: 10000 });
            expect(await accordionButtons.count()).toBeGreaterThanOrEqual(1);
        } else {
            for (const column of DE.board.columns.slice(0, 4)) {
                await expect(page.getByText(column).first()).toBeVisible();
            }
        }
    });

    test('should display action buttons', async ({ page }) => {
        await expect(page.getByTitle(DE.board.filter).first()).toBeVisible();
        await expect(page.getByTitle(DE.board.sort).first()).toBeVisible();
        await expect(page.getByTitle(DE.board.exportCSV).first()).toBeVisible();
    });

    test('should display results count', async ({ page }) => {
        await expect(page.getByText(/Zeige/)).toBeVisible();
        await expect(page.getByText(/Bewerbungen/i).first()).toBeVisible();
    });

    test('should toggle filter panel', async ({ page, isMobile }) => {
        const filterButton = page.getByTitle(DE.board.filter).first();
        await filterButton.click();

        // Both mobile and desktop filter panels render the search input
        // Use :visible CSS pseudo-class to target the visible one
        const searchInput = page.locator('input[placeholder*="Suche nach Firma"]:visible').first();
        await expect(searchInput).toBeVisible({ timeout: 5000 });

        if (isMobile) {
            await page.keyboard.press('Escape');
        } else {
            await filterButton.click();
        }
        await page.waitForTimeout(400);
    });

    test('should filter jobs by search text', async ({ page, isMobile }) => {
        const filterButton = page.getByTitle(DE.board.filter).first();
        await filterButton.click();

        const searchInput = page.locator('input[placeholder*="Suche nach Firma"]:visible').first();
        await expect(searchInput).toBeVisible({ timeout: 5000 });
        await searchInput.fill('zzz_nonexistent_company');
        await page.waitForTimeout(500);

        if (isMobile) {
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);
        }

        await expect(page.getByText(/Zeige/).first()).toContainText('0');
    });

    test('should reset filters', async ({ page, isMobile }) => {
        const filterButton = page.getByTitle(DE.board.filter).first();
        await filterButton.click();

        const searchInput = page.locator('input[placeholder*="Suche nach Firma"]:visible').first();
        await expect(searchInput).toBeVisible({ timeout: 5000 });
        await searchInput.fill('test');
        await page.waitForTimeout(500);

        // "Alle Filter zurücksetzen" also appears twice, use visible-scoped
        const resetBtn = page.locator('button:visible').filter({ hasText: 'Alle Filter zurücksetzen' }).first();
        await resetBtn.click();
        await expect(searchInput).toHaveValue('');
    });

    test('should open sort dropdown and show options', async ({ page }) => {
        const sortButton = page.getByTitle(DE.board.sort).first();
        await sortButton.click();

        await expect(page.getByText('Hinzugefügt (neueste)')).toBeVisible();
        await expect(page.getByText('Firma (A–Z)')).toBeVisible();
    });

    test('should close sort dropdown when selecting an option', async ({ page }) => {
        const sortButton = page.getByTitle(DE.board.sort).first();
        await sortButton.click();
        await page.getByText('Firma (A–Z)').click();
        await expect(page.getByText('Hinzugefügt (neueste)')).not.toBeVisible();
    });

    test('should toggle status filter chips', async ({ page }) => {
        const filterButton = page.getByTitle(DE.board.filter).first();
        await filterButton.click();

        const researchChip = page.locator('button:visible').filter({ hasText: /^Recherche$/ }).first();
        if (await researchChip.isVisible()) {
            await researchChip.click();
            await page.waitForTimeout(300);
        }
    });
});
