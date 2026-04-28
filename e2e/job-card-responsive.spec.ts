import { test, expect } from '@playwright/test';
import { DE, navigateTo } from './helpers';

test.describe('JobCard Responsive Behavior', () => {
    test.beforeEach(async ({ page }) => {
        await navigateTo(page, '/');
        // Ensure we are logged in and on the board
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });
    });

    /** Helper to get the visible board section depending on viewport */
    function visibleBoard(page: import('@playwright/test').Page) {
        // If width < 640px (sm), it's mobile
        const viewport = page.viewportSize();
        if (viewport && viewport.width < 640) {
            return page.locator('div.sm\\:hidden').first();
        } else {
            return page.locator('div.hidden.sm\\:block').first();
        }
    }

    /** Helper to ensure cards are visible — expand accordion sections on mobile */
    async function ensureCardsVisible(page: import('@playwright/test').Page) {
        const viewport = page.viewportSize();
        if (viewport && viewport.width < 640) {
            const board = visibleBoard(page);
            // Click all collapsed accordion sections
            for (let i = 0; i < 6; i++) {
                const collapsed = board.locator('button.column-accordion-button[aria-expanded="false"]').first();
                if (await collapsed.count() > 0) {
                    await collapsed.click();
                    await page.waitForTimeout(300);
                } else {
                    break;
                }
            }
        }
    }

    /** Ensure at least one job with notes and tags exists */
    async function ensureTestJobExists(page: import('@playwright/test').Page) {
        await ensureCardsVisible(page);
        const board = visibleBoard(page);
        const hasNotes = await board.locator('p.line-clamp-2').count() > 0;
        
        if (!hasNotes) {
            // Create a job with notes and tags
            const viewport = page.viewportSize();
            const isMobile = viewport && viewport.width < 640;
            
            if (isMobile) {
                await page.getByLabel(DE.board.addJob).click();
            } else {
                await page.getByRole('button', { name: DE.board.addJob }).click();
            }
            
            await page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true }).fill('ResponsiveTest Co');
            await page.getByRole('textbox', { name: DE.board.placeholders.position, exact: true }).fill('QA Engineer');
            await page.getByRole('textbox', { name: DE.board.placeholders.salary, exact: true }).fill('100k');
            await page.getByRole('textbox', { name: DE.board.placeholders.location, exact: true }).fill('Remote');
            await page.getByRole('textbox', { name: DE.board.placeholders.notes, exact: true }).fill('This is a test note for responsive behavior verification.');
            await page.getByRole('button', { name: DE.board.save }).click();
            await page.waitForTimeout(1000);
            await ensureCardsVisible(page);
        }
    }

    test('desktop view: should show notes by default', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });
        await ensureTestJobExists(page);
        
        const board = visibleBoard(page);
        const jobCard = board.locator('.job-card').first();
        await expect(jobCard).toBeVisible();
        
        // Notes should be visible by default on desktop
        const notesContainer = jobCard.locator('div:has(p.line-clamp-2)');
        await expect(notesContainer).toBeVisible();
        
        // Toggle button should be hidden on desktop
        const toggleButton = jobCard.locator('.job-card-expand-button');
        await expect(toggleButton).toBeHidden();
    });

    test('mobile view: should hide notes by default and toggle them', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await ensureTestJobExists(page);

        const board = visibleBoard(page);
        const jobCard = board.locator('.job-card').first();
        await expect(jobCard).toBeVisible();

        const toggleButton = jobCard.locator('.job-card-expand-button');
        await expect(toggleButton).toBeVisible();
        
        const notesContainer = jobCard.locator('div:has(p.line-clamp-2)');
        
        await expect(notesContainer).toBeHidden();
        
        // Toggle expansion
        await toggleButton.click();
        await expect(notesContainer).toBeVisible();
        await expect(toggleButton).toHaveAttribute('aria-expanded', 'true');
        
        // Toggle collapse
        await toggleButton.click();
        await expect(notesContainer).toBeHidden();
    });

    test('mobile view: should have smaller tags', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await ensureTestJobExists(page);

        const board = visibleBoard(page);
        const jobCard = board.locator('.job-card').first();
        const tag = jobCard.locator('span.font-bold.uppercase').first();
        
        await expect(tag).toBeVisible();
        const className = await tag.getAttribute('class');
        expect(className).toContain('text-[9px]');
        expect(className).toContain('md:text-[10px]');
    });
});
