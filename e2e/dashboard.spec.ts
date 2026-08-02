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
        const presets = ['this_week', 'last_4_weeks', 'last_8_weeks', 'last_3_months', 'this_year', 'all_time'];

        for (const preset of presets) {
            await period.selectOption(preset);
            await expect(period).toHaveValue(preset);
        }

        await page.getByTestId('analytics-grain-day').click();
        await expect(page.getByTestId('analytics-grain-day')).toHaveAttribute('aria-pressed', 'true');
        await page.getByTestId('analytics-grain-month').click();
        await expect(page.getByTestId('analytics-grain-month')).toHaveAttribute('aria-pressed', 'true');

        await period.selectOption('custom');
        await expect(page.getByLabel(DE.dashboard.from)).toBeVisible();
        await expect(page.getByLabel(DE.dashboard.to)).toBeVisible();
        await expect(page.getByText(DE.dashboard.funnel)).toBeVisible();
        await expect(page.getByText(DE.dashboard.recentActivity)).toBeVisible();
    });

    test('should keep analytics surfaces readable in dark mode', async ({ page }) => {
        const html = page.locator('html');
        const themeButton = page.locator(`button[title="${DE.toggleTheme}"]:visible`).first();
        const isDark = (await html.getAttribute('class'))?.includes('dark') ?? false;
        if (!isDark) await themeButton.click();

        await expect(html).toHaveClass(/dark/);
        await expect(page.getByTestId('analytics-controls')).toBeVisible();
        await expect(page.getByTestId('rejection-depth')).toBeVisible();

        if (!isDark) await themeButton.click();
    });

    test('should localize the replacement analytics section in English', async ({ page, isMobile }) => {
        test.skip(isMobile, 'The desktop sidebar exposes the stable EN language control.');

        await page.getByRole('button', { name: 'EN', exact: true }).click();
        await expect(page.getByText(EN.dashboard.title)).toBeVisible();
        await expect(page.getByText(EN.dashboard.analyticsTitle)).toBeVisible();
        await page.getByTestId('analytics-total-added').click();
        await expect(page.getByText(EN.dashboard.jobsInPeriod)).toBeVisible();
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

    test('should list a newly created Job Application when filtered and omit activity badges', async ({ page, isMobile }) => {
        test.skip(isMobile, 'The mutation flow is covered on the desktop dashboard path.');

        const company = `Analytics Job ${Date.now()}`;
        await navigateTo(page, '/');
        await page.getByRole('button', { name: DE.board.addJob }).click();
        await page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true }).fill(company);
        await page.getByRole('textbox', { name: DE.board.placeholders.position, exact: true }).fill('Analytics Row Test');
        await page.getByRole('button', { name: DE.board.save }).click();
        await expect(page.getByText(company).first()).toBeVisible({ timeout: 10000 });

        await navigateTo(page, '/stats');
        await page.getByTestId('analytics-total-added').click();
        await expect(page.getByText(DE.dashboard.jobsInPeriod)).toBeVisible({ timeout: 10000 });
        await expect(page.getByTestId('analytics-job-list')).toBeVisible({ timeout: 10000 });

        const row = page.getByTestId('analytics-job-row').filter({ hasText: company });
        await expect(row).toBeVisible({ timeout: 10000 });
        await expect(row.getByTestId('analytics-badge-added')).toHaveCount(0);

        await navigateTo(page, '/');
        const board = page.locator('div.hidden.sm\\:block').first();
        const jobCard = board.locator('.job-card').filter({ hasText: company });
        await jobCard.getByRole('button', { name: DE.board.confirmDelete }).click();
        await page.locator('.fixed.inset-0').getByRole('button', { name: DE.board.confirmDelete }).click();
        await expect(page.getByText(company)).not.toBeVisible({ timeout: 10000 });
    });

    test('should filter the analytics job list via period-total cards', async ({ page, isMobile }) => {
        test.skip(isMobile, 'The mutation flow is covered on the desktop dashboard path.');

        const company = `Analytics Filter ${Date.now()}`;
        await navigateTo(page, '/');
        await page.getByRole('button', { name: DE.board.addJob }).click();
        await page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true }).fill(company);
        await page.getByRole('textbox', { name: DE.board.placeholders.position, exact: true }).fill('Analytics Filter Test');
        await page.getByRole('button', { name: DE.board.save }).click();
        await expect(page.getByText(company).first()).toBeVisible({ timeout: 10000 });

        await navigateTo(page, '/stats');
        await expect(page.getByTestId('analytics-jobs')).toHaveCount(0);

        const addedCard = page.getByTestId('analytics-total-added');
        const rejectedCard = page.getByTestId('analytics-total-rejected');

        await addedCard.click();
        await expect(addedCard).toHaveAttribute('aria-pressed', 'true');
        const row = page.getByTestId('analytics-job-row').filter({ hasText: company });
        await expect(row).toBeVisible({ timeout: 10000 });

        // Switch to rejected filter: job without rejection disappears
        await rejectedCard.click();
        await expect(rejectedCard).toHaveAttribute('aria-pressed', 'true');
        await expect(addedCard).toHaveAttribute('aria-pressed', 'false');
        await expect(row).toHaveCount(0);

        // Click active card again to clear filter: list hides
        await rejectedCard.click();
        await expect(rejectedCard).toHaveAttribute('aria-pressed', 'false');
        await expect(page.getByTestId('analytics-jobs')).toHaveCount(0);

        await navigateTo(page, '/');
        const board = page.locator('div.hidden.sm\\:block').first();
        const jobCard = board.locator('.job-card').filter({ hasText: company });
        await jobCard.getByRole('button', { name: DE.board.confirmDelete }).click();
        await page.locator('.fixed.inset-0').getByRole('button', { name: DE.board.confirmDelete }).click();
        await expect(page.getByText(company)).not.toBeVisible({ timeout: 10000 });
    });

    test('should keep the filter active across period changes and not change card values', async ({ page }) => {
        await navigateTo(page, '/stats');
        // Pin a custom range with no data so card values are stable and free of
        // cross-project interference (concurrent tests share the test user's board).
        await page.getByTestId('analytics-period').selectOption('custom');
        await page.getByLabel(DE.dashboard.from).fill('2020-01-01');
        await page.getByLabel(DE.dashboard.to).fill('2020-01-02');
        await expect(page.getByTestId('activity-chart')).toBeVisible({ timeout: 10000 });

        const addedCard = page.getByTestId('analytics-total-added');
        const rejectedCard = page.getByTestId('analytics-total-rejected');

        // Card values are unchanged by filtering: 0 stays 0 after a filter is applied.
        await expect(addedCard.locator('p.text-xl')).toHaveText('0');
        await rejectedCard.click();
        await expect(rejectedCard).toHaveAttribute('aria-pressed', 'true');
        await expect(addedCard).toHaveAttribute('aria-pressed', 'false');
        await expect(addedCard.locator('p.text-xl')).toHaveText('0');

        // The filter persists across a Selected Period preset change.
        await page.getByTestId('analytics-period').selectOption('this_week');
        await expect(rejectedCard).toHaveAttribute('aria-pressed', 'true');

        // With the filter still active, an invalid custom range yields no matches -> empty state.
        await page.getByTestId('analytics-period').selectOption('custom');
        await page.getByLabel(DE.dashboard.from).fill('2026-01-10');
        await page.getByLabel(DE.dashboard.to).fill('2026-01-01');
        await expect(page.getByTestId('analytics-job-list-empty')).toBeVisible({ timeout: 10000 });
        await expect(rejectedCard).toHaveAttribute('aria-pressed', 'true');
    });

    test('should open a read-only job details modal from the analytics job list', async ({ page, isMobile }) => {
        test.skip(isMobile, 'The mutation flow is covered on the desktop dashboard path.');

        const company = `Analytics Modal ${Date.now()}`;
        await navigateTo(page, '/');
        await page.getByRole('button', { name: DE.board.addJob }).click();
        await page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true }).fill(company);
        await page.getByRole('textbox', { name: DE.board.placeholders.position, exact: true }).fill('Analytics Modal Test');
        await page.getByRole('button', { name: DE.board.save }).click();
        await expect(page.getByText(company).first()).toBeVisible({ timeout: 10000 });

        await navigateTo(page, '/stats');
        await page.getByTestId('analytics-total-added').click();
        const row = page.getByTestId('analytics-job-row').filter({ hasText: company });
        await expect(row).toBeVisible({ timeout: 10000 });

        const modal = page.locator('.fixed.inset-0');

        // Row click opens the job details modal in view mode.
        await row.click();
        await expect(modal.getByText(DE.board.viewJob)).toBeVisible({ timeout: 10000 });
        // No edit action is offered from analytics.
        await expect(modal.getByRole('button', { name: DE.board.edit })).toHaveCount(0);

        // Escape dismisses.
        await page.keyboard.press('Escape');
        await expect(modal.getByText(DE.board.viewJob)).toHaveCount(0);

        // Reopen and dismiss via the Close button.
        await row.click();
        await expect(modal.getByText(DE.board.viewJob)).toBeVisible({ timeout: 10000 });
        await modal.getByRole('button', { name: DE.board.close }).click();
        await expect(modal.getByText(DE.board.viewJob)).toHaveCount(0);

        await navigateTo(page, '/');
        const board = page.locator('div.hidden.sm\\:block').first();
        const jobCard = board.locator('.job-card').filter({ hasText: company });
        await jobCard.getByRole('button', { name: DE.board.confirmDelete }).click();
        await page.locator('.fixed.inset-0').getByRole('button', { name: DE.board.confirmDelete }).click();
        await expect(page.getByText(company)).not.toBeVisible({ timeout: 10000 });
    });

    test('should show the job-list empty state for an invalid custom range', async ({ page }) => {
        await navigateTo(page, '/stats');
        await page.getByTestId('analytics-total-added').click();
        await page.getByTestId('analytics-period').selectOption('custom');
        // Invalid range (to before from) resolves to an empty period deterministically.
        await page.getByLabel(DE.dashboard.from).fill('2026-01-10');
        await page.getByLabel(DE.dashboard.to).fill('2026-01-01');
        const empty = page.getByTestId('analytics-job-list-empty');
        await expect(empty).toBeVisible({ timeout: 10000 });
        await expect(empty).toContainText(DE.dashboard.noApplicationDataInPeriod);
    });

    test('should allow toggling rejection depth cards and opening job details modal from rejection job list', async ({ page, isMobile }) => {
        test.skip(isMobile, 'The mutation flow is covered on the desktop dashboard path.');

        const company = `Rejection Depth Modal ${Date.now()}`;
        await navigateTo(page, '/');
        await page.getByRole('button', { name: DE.board.addJob }).click();
        await page.getByRole('textbox', { name: DE.board.placeholders.company, exact: true }).fill(company);
        await page.getByRole('textbox', { name: DE.board.placeholders.position, exact: true }).fill('Rejection Depth Test');
        await page.getByRole('combobox').selectOption('REJECTED');
        await page.getByRole('button', { name: DE.board.save }).click();
        await expect(page.getByText(company).first()).toBeVisible({ timeout: 10000 });

        await navigateTo(page, '/stats');
        await expect(page.getByTestId('rejection-depth')).toBeVisible({ timeout: 10000 });

        const zeroCard = page.getByTestId('rejection-depth-total-zero');
        const oneCard = page.getByTestId('rejection-depth-total-one');

        await expect(zeroCard).toHaveAttribute('aria-pressed', 'false');
        await expect(oneCard).toHaveAttribute('aria-pressed', 'false');
        await expect(page.getByTestId('rejection-depth-jobs')).toHaveCount(0);

        // Click zero rounds card to toggle on
        await zeroCard.click();
        await expect(zeroCard).toHaveAttribute('aria-pressed', 'true');
        await expect(page.getByTestId('rejection-depth-jobs')).toBeVisible({ timeout: 10000 });

        // Verify job row appears in rejection list and opens read-only JobModal when clicked
        const row = page.getByTestId('rejection-depth-job-row').filter({ hasText: company });
        await expect(row).toBeVisible({ timeout: 10000 });

        const modal = page.locator('.fixed.inset-0');
        await row.click();
        await expect(modal.getByText(DE.board.viewJob)).toBeVisible({ timeout: 10000 });
        await expect(modal.getByRole('button', { name: DE.board.edit })).toHaveCount(0);
        await modal.getByRole('button', { name: DE.board.close }).click();
        await expect(modal.getByText(DE.board.viewJob)).toHaveCount(0);

        // Switch to one round card
        await oneCard.click();
        await expect(oneCard).toHaveAttribute('aria-pressed', 'true');
        await expect(zeroCard).toHaveAttribute('aria-pressed', 'false');

        // Click active card again to deselect
        await oneCard.click();
        await expect(oneCard).toHaveAttribute('aria-pressed', 'false');
        await expect(page.getByTestId('rejection-depth-jobs')).toHaveCount(0);

        // Clean up created job
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
