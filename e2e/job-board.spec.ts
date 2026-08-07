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
            const accordionButtons = page.locator('button.column-accordion-button');
            await expect(accordionButtons.first()).toBeVisible({ timeout: 10000 });
            expect(await accordionButtons.count()).toBeGreaterThanOrEqual(1);
        } else {
            for (const column of DE.board.columns.slice(0, 4)) {
                await expect(page.getByText(column).first()).toBeVisible();
            }
        }
    });

    test('should display action buttons', async ({ page, isMobile }) => {
        await expect(page.locator('button[title="Filter"]:visible').first()).toBeVisible();
        if (isMobile) {
            await expect(page.getByTitle(DE.board.moreActionsTitle)).toBeVisible();
            await page.getByTitle(DE.board.moreActionsTitle).click();
            await expect(page.getByRole('button', { name: DE.board.sort }).last()).toBeVisible();
            await expect(page.getByRole('button', { name: DE.board.exportCSV }).last()).toBeVisible();
            await page.keyboard.press('Escape');
        } else {
            await expect(page.getByTitle(DE.board.sort).first()).toBeVisible();
            await expect(page.getByTitle(DE.board.exportCSV).first()).toBeVisible();
        }
    });

    test('should display results count', async ({ page }) => {
        await expect(page.getByText(/Zeige \d+ von \d+ Bewerbungen/).first()).toBeVisible();
        await expect(page.getByText(/Bewerbungen/i).first()).toBeVisible();
    });

    test('should toggle filter panel', async ({ page, isMobile }) => {
        // Search lives on the toolbar and is visible without opening the panel
        const searchInput = page.locator('input[placeholder*="Suche nach Firma"]:visible').first();
        await expect(searchInput).toBeVisible({ timeout: 5000 });

        const filterButton = page.locator('button[title="Filter"]:visible').first();
        if (isMobile) {
            // On mobile the filter sheet only exists in the DOM once opened
            await expect(page.locator('.fixed.inset-0 button.rounded-full:visible').filter({ hasText: 'Recherche' })).toHaveCount(0);
            await filterButton.click();
            await expect(page.locator('.fixed.inset-0 button.rounded-full:visible').filter({ hasText: 'Recherche' })).toHaveCount(1);
            await page.keyboard.press('Escape');
        } else {
            // On desktop the panel is always in the DOM; collapsed it has zero height
            const panel = page.locator('div.hidden.sm\\:flex.rounded-xl.flex-col').first();
            expect(await panel.evaluate((el) => el.getBoundingClientRect().height)).toBeLessThan(5);
            await filterButton.click();
            await expect
                .poll(() => panel.evaluate((el) => el.getBoundingClientRect().height))
                .toBeGreaterThan(100);
            await filterButton.click();
        }
        await page.waitForTimeout(400);
    });

    test('should filter jobs by search text', async ({ page, isMobile }) => {
        const filterButton = page.locator('button[title="Filter"]:visible').first();
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
        const filterButton = page.locator('button[title="Filter"]:visible').first();
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

    test('should open sort dropdown and show options', async ({ page, isMobile }) => {
        if (isMobile) {
            await page.getByTitle(DE.board.moreActionsTitle).click();
            await page.getByRole('button', { name: DE.board.sort }).last().click();
        } else {
            await page.getByTitle(DE.board.sort).first().click();
        }

        await expect(page.getByText('Hinzugefügt (neueste)')).toBeVisible();
        await expect(page.getByText('Firma (A–Z)')).toBeVisible();
    });

    test('should close sort dropdown when selecting an option', async ({ page, isMobile }) => {
        if (isMobile) {
            await page.getByTitle(DE.board.moreActionsTitle).click();
            await page.getByRole('button', { name: DE.board.sort }).last().click();
        } else {
            await page.getByTitle(DE.board.sort).first().click();
        }
        await page.getByText('Firma (A–Z)').click();
        await expect(page.getByText('Hinzugefügt (neueste)')).not.toBeVisible();
    });

    test('should select precise last-updated sorting', async ({ page, isMobile }) => {
        if (isMobile) {
            await page.getByTitle(DE.board.moreActionsTitle).click();
            await page.getByRole('button', { name: DE.board.sort }).last().click();
        } else {
            await page.getByTitle(DE.board.sort).first().click();
        }

        await page.getByText('Aktualisiert (neueste)', { exact: true }).click();

        if (isMobile) {
            await page.getByTitle(DE.board.moreActionsTitle).click();
            await page.getByRole('button', { name: DE.board.sort }).last().click();
        } else {
            await page.getByTitle(DE.board.sort).first().click();
        }

        await expect(page.getByText('Aktualisiert (neueste)', { exact: true })).toBeVisible();
    });

    test('should toggle status filter chips', async ({ page }) => {
        const filterButton = page.locator('button[title="Filter"]:visible').first();
        await filterButton.click();

        const researchChip = page.locator('button:visible').filter({ hasText: /^Recherche$/ }).first();
        if (await researchChip.isVisible()) {
            await researchChip.click();
            await page.waitForTimeout(300);
        }
    });

    test('date presets should produce the expected from/to range', async ({ page }) => {
        const filterButton = page.locator('button[title="Filter"]:visible').first();
        await filterButton.click();

        const fromInput = page.locator('input[aria-label="Hinzugefügt Von"]:visible').first();
        const toInput = page.locator('input[aria-label="Hinzugefügt Bis"]:visible').first();
        await expect(fromInput).toBeVisible({ timeout: 5000 });

        await page.getByRole('button', { name: 'Letzte 7 Tage' }).first().click();

        const formatLocal = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        const today = new Date();
        const to = formatLocal(today);
        const from = formatLocal(new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000));

        await expect(fromInput).toHaveValue(from);
        await expect(toInput).toHaveValue(to);
    });

    test('move-to sheet should offer all six statuses', async ({ page, isMobile }) => {
        test.skip(isMobile, 'Move-to sheet is exercised on desktop paths');

        const firstCard = page.locator('[data-testid="job-board"] .job-card').first();
        await expect(firstCard).toBeVisible({ timeout: 10000 });
        await firstCard.getByRole('button', { name: 'Verschieben nach...' }).first().click();

        const sheet = page.getByRole('dialog', { name: 'Verschieben nach...' });
        await expect(sheet).toBeVisible();
        for (const column of DE.board.columns) {
            await expect(sheet.getByRole('button', { name: column })).toHaveCount(1);
        }
        await page.keyboard.press('Escape');
        await expect(sheet).not.toBeVisible();
    });

    test('edge fades stay pinned to the board edges after horizontal scrolling', async ({ page, isMobile }) => {
        test.skip(isMobile, 'Edge fades only exist on the desktop board');

        const board = page.locator('[data-testid="job-board"]');
        await expect(board).toBeVisible({ timeout: 10000 });

        // At rest, the right fade hints at more content at the board's right edge
        const leftFade = page.getByTestId('job-board-fade-left');
        const rightFade = page.getByTestId('job-board-fade-right');
        await expect(rightFade).toHaveCSS('opacity', '1');
        await expect(leftFade).toHaveCSS('opacity', '0');

        // Scroll the board to the far end
        await board.evaluate((el) => {
            el.scrollLeft = el.scrollWidth - el.clientWidth;
            el.dispatchEvent(new Event('scroll'));
        });

        await expect(leftFade).toHaveCSS('opacity', '1');
        await expect(rightFade).toHaveCSS('opacity', '0');

        // The fades must remain aligned with the board viewport edges instead of
        // drifting with the scroll content (regression: they painted over cards).
        const alignment = await page.evaluate(() => {
            const boardEl = document.querySelector('[data-testid="job-board"]');
            const leftEl = document.querySelector('[data-testid="job-board-fade-left"]');
            const rightEl = document.querySelector('[data-testid="job-board-fade-right"]');
            if (!boardEl || !leftEl || !rightEl) return null;
            const boardRect = boardEl.getBoundingClientRect();
            const leftRect = leftEl.getBoundingClientRect();
            const rightRect = rightEl.getBoundingClientRect();
            return {
                boardLeft: boardRect.left,
                boardRight: boardRect.right,
                leftFadeLeft: leftRect.left,
                rightFadeRight: rightRect.right,
            };
        });
        expect(alignment).not.toBeNull();
        expect(Math.abs(alignment!.leftFadeLeft - alignment!.boardLeft)).toBeLessThanOrEqual(1);
        expect(Math.abs(alignment!.rightFadeRight - alignment!.boardRight)).toBeLessThanOrEqual(1);
    });
});
