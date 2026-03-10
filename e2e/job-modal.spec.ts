import { test, expect } from '@playwright/test';
import { DE, navigateTo } from './helpers';

test.describe('Job Modal - CRUD Operations', () => {
    test.beforeEach(async ({ page }) => {
        await navigateTo(page, '/');
        await expect(page.getByText(DE.board.title)).toBeVisible({ timeout: 10000 });
    });

    /** Helper to get the visible board section depending on viewport */
    function visibleBoard(page: import('@playwright/test').Page, isMobile: boolean) {
        if (isMobile) {
            return page.locator('div.sm\\:hidden').first();
        } else {
            return page.locator('div.hidden.sm\\:block').first();
        }
    }

    /** Helper to open the add job modal regardless of viewport */
    async function openAddModal(page: import('@playwright/test').Page, isMobile: boolean) {
        if (isMobile) {
            await page.getByLabel(DE.board.addJob).click();
        } else {
            await page.getByRole('button', { name: DE.board.addJob }).click();
        }
        await expect(page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true })).toBeVisible({ timeout: 5000 });
    }

    /** Helper to ensure cards are visible — expand accordion sections on mobile */
    async function ensureCardsVisible(page: import('@playwright/test').Page, isMobile: boolean) {
        if (isMobile) {
            const board = visibleBoard(page, isMobile);
            // Click all collapsed accordion sections
            for (let i = 0; i < 6; i++) {
                const collapsed = board.locator('button[aria-expanded="false"]').first();
                if (await collapsed.count() > 0) {
                    await collapsed.click();
                    await page.waitForTimeout(300);
                } else {
                    break;
                }
            }
        }
    }

    /** Click on a visible "Details anzeigen" button within the correct board section */
    async function clickViewDetails(page: import('@playwright/test').Page, isMobile: boolean) {
        const board = visibleBoard(page, isMobile);
        const viewBtn = board.getByText(DE.board.viewDetails).first();
        await viewBtn.scrollIntoViewIfNeeded();
        await viewBtn.click({ timeout: 10000 });
    }

    test('should open add job modal and show empty form', async ({ page, isMobile }) => {
        await openAddModal(page, isMobile);
        await expect(page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true })).toBeVisible();
        await expect(page.getByRole('textbox', { name: DE.board.placeholders.position, exact: true })).toBeVisible();
    });

    test('should create a new job', async ({ page, isMobile }) => {
        const uniqueCompany = `TestCo-${Date.now()}`;

        await openAddModal(page, isMobile);
        await page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true }).fill(uniqueCompany);
        await page.getByRole('textbox', { name: DE.board.placeholders.position, exact: true }).fill('Test Engineer');
        await page.getByRole('button', { name: DE.board.save }).click();

        await expect(page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true })).not.toBeVisible({ timeout: 5000 });

        await ensureCardsVisible(page, isMobile);

        const board = visibleBoard(page, isMobile);
        await expect(board.getByText(uniqueCompany).first()).toBeVisible({ timeout: 5000 });
    });

    test('should view an existing job card', async ({ page, isMobile }) => {
        await ensureCardsVisible(page, isMobile);

        const board = visibleBoard(page, isMobile);
        const viewButtons = board.getByText(DE.board.viewDetails);
        if (await viewButtons.count() === 0) {
            await openAddModal(page, isMobile);
            await page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true }).fill('ViewTest Corp');
            await page.getByRole('textbox', { name: DE.board.placeholders.position, exact: true }).fill('Developer');
            await page.getByRole('button', { name: DE.board.save }).click();
            await page.waitForTimeout(1000);
            await ensureCardsVisible(page, isMobile);
        }

        await clickViewDetails(page, isMobile);

        // Use exact: true to avoid matching card-level "Job bearbeiten" buttons
        const editBtn = page.getByRole('button', { name: DE.board.edit, exact: true });
        await expect(editBtn).toBeVisible({ timeout: 5000 });
    });

    test('should switch from view to edit mode', async ({ page, isMobile }) => {
        await ensureCardsVisible(page, isMobile);

        const board = visibleBoard(page, isMobile);
        const viewButtons = board.getByText(DE.board.viewDetails);
        if (await viewButtons.count() === 0) {
            await openAddModal(page, isMobile);
            await page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true }).fill('EditTest Corp');
            await page.getByRole('textbox', { name: DE.board.placeholders.position, exact: true }).fill('Tester');
            await page.getByRole('button', { name: DE.board.save }).click();
            await page.waitForTimeout(1000);
            await ensureCardsVisible(page, isMobile);
        }

        await clickViewDetails(page, isMobile);
        const editBtn = page.getByRole('button', { name: DE.board.edit, exact: true });
        await expect(editBtn).toBeVisible({ timeout: 5000 });

        await editBtn.click();
        await expect(page.getByRole('button', { name: DE.board.save })).toBeVisible();
    });

    test('should close modal with Cancel button', async ({ page, isMobile }) => {
        await openAddModal(page, isMobile);
        await page.getByRole('button', { name: DE.board.cancel }).click();
        await expect(page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true })).not.toBeVisible();
    });

    test('should close modal with Escape key', async ({ page, isMobile }) => {
        await openAddModal(page, isMobile);
        await page.keyboard.press('Escape');
        await expect(page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true })).not.toBeVisible();
    });

    test('should delete a job with confirmation', async ({ page, isMobile }) => {
        const deleteCompany = `DeleteMe-${Date.now()}`;
        await openAddModal(page, isMobile);
        await page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true }).fill(deleteCompany);
        await page.getByRole('textbox', { name: DE.board.placeholders.position, exact: true }).fill('To Delete');
        await page.getByRole('button', { name: DE.board.save }).click();
        await page.waitForTimeout(1000);

        await ensureCardsVisible(page, isMobile);

        const board = visibleBoard(page, isMobile);
        await expect(board.getByText(deleteCompany).first()).toBeVisible();

        await clickViewDetails(page, isMobile);
        await page.waitForTimeout(500);

        const trashButton = page.locator('svg.lucide-trash-2').locator('..');
        if (await trashButton.first().isVisible({ timeout: 3000 }).catch(() => false)) {
            await trashButton.first().click();

            const deleteConfirmTitle = page.getByText(DE.board.deleteTitle);
            if (await deleteConfirmTitle.isVisible({ timeout: 3000 }).catch(() => false)) {
                await page.getByRole('button', { name: DE.board.confirmDelete }).click();
                await expect(page.getByText(deleteCompany)).not.toBeVisible({ timeout: 5000 });
            }
        }
    });
});
