import { test, expect } from '@playwright/test';
import { DE, EN, navigateTo } from './helpers';

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
        await expect(page.getByText(DE.dashboard.interviews).first()).toBeVisible();
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

    test('should display the selected-period activity sections', async ({ page }) => {
        await expect(page.getByText(DE.dashboard.analyticsTitle)).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('analytics-period')).toHaveValue('last_8_weeks');
        await expect(page.getByTestId('analytics-grain-week')).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('analytics-total-added')).toBeVisible();
        await expect(page.getByTestId('analytics-total-applied')).toBeVisible();
        await expect(page.getByTestId('analytics-total-rejected')).toBeVisible();
        await expect(page.getByTestId('analytics-total-interviews')).toBeVisible();
        await expect(page.getByText(DE.dashboard.rejectionDepth)).toBeVisible();
    });

    test('should update the selected period and grain controls', async ({ page }) => {
        const period = page.getByTestId('analytics-period');
        await period.selectOption('last_4_weeks');
        await expect(period).toHaveValue('last_4_weeks');

        await page.getByTestId('analytics-grain-day').click();
        await expect(page.getByTestId('analytics-grain-day')).toHaveAttribute('aria-pressed', 'true');

        await period.selectOption('custom');
        await expect(page.getByLabel(DE.dashboard.from)).toBeVisible();
        await expect(page.getByLabel(DE.dashboard.to)).toBeVisible();
    });

    test('should localize the replacement analytics section in English', async ({ page, isMobile }) => {
        test.skip(isMobile, 'The desktop sidebar exposes the stable EN language control.');

        await page.getByRole('button', { name: 'EN', exact: true }).click();
        await expect(page.getByText(EN.dashboard.title)).toBeVisible();
        await expect(page.getByText(EN.dashboard.analyticsTitle)).toBeVisible();
        await expect(page.getByTestId('analytics-period')).toHaveValue('last_8_weeks');
    });

    test('should update the added series after creating a Job Application', async ({ page, isMobile }) => {
        test.skip(isMobile, 'The mutation flow is covered on the desktop dashboard path.');

        const chart = page.getByTestId('activity-chart');
        await expect(chart).toBeVisible({ timeout: 10000 });
        const initialCount = Number(await chart.getAttribute('data-added-count'));
        const company = `Analytics Smoke ${Date.now()}`;

        await navigateTo(page, '/');
        await page.getByRole('button', { name: DE.board.addJob }).click();
        await page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true }).fill(company);
        await page.getByRole('textbox', { name: DE.board.placeholders.position, exact: true }).fill('Analytics Smoke Test');
        await page.getByRole('button', { name: DE.board.save }).click();
        await expect(page.getByText(company).first()).toBeVisible({ timeout: 10000 });

        await navigateTo(page, '/stats');
        const updatedChart = page.getByTestId('activity-chart');
        await expect.poll(
            async () => Number(await updatedChart.getAttribute('data-added-count')),
            { timeout: 10000 }
        ).toBeGreaterThanOrEqual(initialCount + 1);

        await navigateTo(page, '/');
        const board = page.locator('div.hidden.sm\\:block').first();
        const jobCard = board.locator('.job-card').filter({ hasText: company });
        await jobCard.getByRole('button', { name: DE.board.confirmDelete }).click();
        await page.locator('.fixed.inset-0').getByRole('button', { name: DE.board.confirmDelete }).click();
        await expect(page.getByText(company)).not.toBeVisible({ timeout: 10000 });
    });

    test('should display recent activity section', async ({ page }) => {
        await expect(page.getByText(DE.dashboard.recentActivity)).toBeVisible({ timeout: 10000 });
    });
});
