import { test, expect } from '@playwright/test';
import { DE, navigateTo } from './helpers';

test.describe('JobCard Responsive Behavior', () => {
    test.beforeEach(async ({ page }) => {
        await navigateTo(page, '/');
        // Ensure we are logged in and on the board
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });
    });

    /** Helper to get the board container (single responsive board) */
    function visibleBoard(page: import('@playwright/test').Page) {
        return page.locator('[data-testid="job-board"]').first();
    }

    async function findClippedDescendants(locator: import('@playwright/test').Locator) {
        return locator.evaluate((element) => Array.from(element.querySelectorAll('*'))
            .filter((child) => {
                const style = window.getComputedStyle(child);
                return child.scrollWidth > child.clientWidth && ['hidden', 'clip'].includes(style.overflowX);
            })
            .map((child) => child.textContent?.trim())
            .filter(Boolean));
    }

    /** Helper to ensure applications are visible — expand accordion sections on mobile */
    async function ensureCardsVisible(page: import('@playwright/test').Page) {
        const viewport = page.viewportSize();
        if (viewport && viewport.width < 640) {
            const board = visibleBoard(page);
            const buttons = board.locator('button.column-accordion-button');
            const count = await buttons.count();
            for (let i = 0; i < count; i++) {
                const btn = buttons.nth(i);
                if (await btn.getAttribute('aria-expanded') === 'false') {
                    await btn.evaluate((el) => (el as HTMLElement).click());
                    await expect(btn).toHaveAttribute('aria-expanded', 'true', { timeout: 3000 });
                }
            }

            for (let i = 0; i < 40; i++) {
                const showNext = board.getByRole('button', { name: /Nächste/ }).first();
                if (await showNext.count() === 0) break;
                await showNext.click();
                await page.waitForTimeout(50);
            }
        }
    }

    /** Create an application with notes and return its locator */
    async function createJobWithNotes(page: import('@playwright/test').Page, company: string) {
        const viewport = page.viewportSize();
        const isMobile = viewport && viewport.width < 640;

        if (isMobile) {
            await page.getByLabel(DE.board.addJob).click();
        } else {
            await page.getByRole('button', { name: DE.board.addJob }).click();
        }

        await page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true }).fill(company);
        await page.getByRole('textbox', { name: DE.board.placeholders.position, exact: true }).fill('QA Engineer');
        await page.getByRole('textbox', { name: DE.board.placeholders.salary, exact: true }).fill('100k');
        await page.getByRole('textbox', { name: DE.board.placeholders.location, exact: true }).fill('Remote');
        await page.getByRole('textbox', { name: DE.board.placeholders.notes, exact: true }).fill('This is a test note for responsive behavior verification.');
        await page.getByRole('button', { name: DE.board.save }).click();
        await page.waitForTimeout(1000);
        await ensureCardsVisible(page);

        const board = visibleBoard(page);
        return board.locator('.job-card').filter({ hasText: company }).first();
    }

    test('desktop view: card stays slim below 2xl, notes expand on wide screens', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });

        const jobCard = await createJobWithNotes(page, `Responsive Desktop ${Date.now()}`);
        await expect(jobCard).toBeVisible();

        // Notes are hidden at rest below the 2xl expansion breakpoint
        await expect(jobCard.locator('p.line-clamp-2').first()).toBeHidden();

        // The dossier expands on 2xl screens
        await page.setViewportSize({ width: 1600, height: 1000 });
        await page.waitForTimeout(300);
        const notes = jobCard.locator('p.line-clamp-2').first();
        await expect(notes).toBeVisible();
    });

    test('mobile view: notes live behind the view modal', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });

        const jobCard = await createJobWithNotes(page, `Responsive Mobile ${Date.now()}`);
        await expect(jobCard).toBeVisible();

        // Notes are not on the at-rest card
        await expect(jobCard.locator('p.line-clamp-2').first()).toBeHidden();

        // The view modal shows the notes
        await jobCard.getByText(DE.board.viewDetails).click();
        await expect(page.getByText(DE.board.viewJob)).toBeVisible({ timeout: 5000 });
        const modal = page.locator('.fixed.inset-0');
        await expect(modal.getByText('This is a test note for responsive behavior verification.')).toBeVisible({ timeout: 5000 });
        await page.getByRole('button', { name: DE.board.close, exact: true }).click();
    });

    test('application footer avoids clipping across desktop, tablet, and mobile widths', async ({ page }) => {
        for (const width of [1280, 768, 375]) {
            await page.setViewportSize({ width, height: width === 768 ? 1024 : 900 });
            await ensureCardsVisible(page);

            const card = visibleBoard(page).locator('.job-card').first();
            const footer = card.getByTestId('job-card-footer');
            await expect(footer).toBeVisible();

            const clippedDescendants = await findClippedDescendants(footer);

            expect(clippedDescendants).toEqual([]);

            const updatedMetadata = card.getByTestId('job-card-updated-at');
            const metadataClippedDescendants = await findClippedDescendants(updatedMetadata);

            expect(metadataClippedDescendants).toEqual([]);

            if (width < 640) {
                await expect(footer.getByText('Verschieben', { exact: true })).toBeVisible();
            }
        }
    });

    test('shows relative update metadata with an exact accessible value', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 900 });
        const card = await createJobWithNotes(page, `Relative Timestamp ${Date.now()}`);
        const updatedAt = card.getByTestId('job-card-updated-at');
        const updatedAtValue = updatedAt.locator('time');

        await expect(updatedAt).toBeVisible();
        await expect(updatedAtValue).toContainText('gerade eben');
        await expect(updatedAtValue).toHaveAttribute('title', /Zuletzt aktualisiert:/);
        await expect(updatedAtValue).toHaveAttribute('aria-label', /Zuletzt aktualisiert:/);

        await page.setViewportSize({ width: 375, height: 667 });
        await ensureCardsVisible(page);
        await expect(updatedAt).toBeVisible();
    });

    test('tags live behind the view layer and expand on wide screens', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await ensureCardsVisible(page);

        const board = visibleBoard(page);
        let taggedCard = board.locator('.job-card').filter({ has: page.locator('span.bg-emerald-50').first() }).first();
        if (await taggedCard.count() === 0) {
            await createJobWithNotes(page, `Responsive Tag ${Date.now()}`);
            taggedCard = board.locator('.job-card').filter({ has: page.locator('span.bg-emerald-50').first() }).first();
        }
        const tag = taggedCard.locator('span.font-bold.uppercase').first();

        // Salary/remote tags are hidden at rest below the 2xl dossier layer
        await expect(tag).toBeHidden();

        // The tags expand with the dossier on 2xl screens
        await page.setViewportSize({ width: 1600, height: 1000 });
        await page.waitForTimeout(300);
        await expect(tag).toBeVisible();
        const className = await tag.getAttribute('class');
        expect(className).toContain('text-[11px]');
    });
});
