import { test, expect, request, Page } from '@playwright/test';

// Exercise the real app and routing without credentials or writes to a live project.
test.use({ storageState: { cookies: [], origins: [] } });

const storageKey = 'career_track_sidebar_collapsed';
const collapseLabel = 'Menüleiste einklappen';
const expandLabel = 'Menüleiste ausklappen';
const sidebar = (page: Page) => page.locator('#app-sidebar');
const toggle = (page: Page) => sidebar(page).getByRole('button', { name: /Menüleiste (ein|aus)klappen/ });
const width = (page: Page) => sidebar(page).evaluate(element => element.getBoundingClientRect().width);
let tailwindScript: string;

test.beforeAll(async () => {
    // Fetch the app's CDN dependency once, using Node's configured CA trust.
    const context = await request.newContext({
        proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY } : undefined,
    });
    try {
        const response = await context.get('https://cdn.tailwindcss.com');
        expect(response.ok()).toBeTruthy();
        tailwindScript = await response.text();
    } finally {
        await context.dispose();
    }
});

async function openApp(page: Page) {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Bewerbungstracker', exact: true })).toBeVisible();
    await expect(page.getByTestId('job-board')).toBeVisible();
}

async function expectHeaderNotOverlapping(page: Page) {
    const title = page.getByRole('heading', { name: 'Bewerbungstracker', exact: true });
    const heading = await title.evaluate(element => {
        const range = document.createRange();
        range.selectNodeContents(element);
        const { x, y, width, height } = range.getBoundingClientRect();
        return { x, y, width, height };
    });
    const controls = await title.locator('..').locator('xpath=following-sibling::div').boundingBox();
    expect(heading!.x + heading!.width <= controls!.x || heading!.y + heading!.height <= controls!.y).toBeTruthy();
}

// Only seed once: reloading must exercise the value actually saved by the app.
async function seedPreference(page: Page, value: string) {
    await page.addInitScript(({ key, value }) => {
        if (!sessionStorage.getItem('sidebar-test-seeded')) {
            localStorage.setItem(key, value);
            sessionStorage.setItem('sidebar-test-seeded', 'true');
        }
    }, { key: storageKey, value });
}

test.beforeEach(async ({ page }) => {
    await page.route('https://cdn.tailwindcss.com/**', route => route.fulfill({
        contentType: 'application/javascript', body: tailwindScript,
    }));
    await page.route('**/src/contexts/AuthContext.tsx*', route => route.fulfill({
        contentType: 'application/javascript',
        body: `const auth = {
                user: { id: '00000000-0000-4000-8000-000000000010', name: 'Sidebar Test', email: 'sidebar@example.invalid' },
                isLoading: false,
                logout: async () => window.dispatchEvent(new Event('sidebar-test-logout'))
            };
            export const AuthProvider = ({ children }) => children;
            export const useAuth = () => auth;`,
    }));
    await page.route('**/rest/v1/**', route => route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(new URL(route.request().url()).pathname.endsWith('/jobs') ? [{
            id: '00000000-0000-4000-8000-000000000001',
            company: 'Beispiel GmbH', position: 'Projektmanager', status: 'RESEARCH',
            date_added: '2026-11-13', last_updated: '2026-11-13', notes: '', location: 'Berlin',
        }] : []),
    }));
    await page.route('https://accounts.google.com/**', route => route.abort());
});

test.describe('Desktop and tablet sidebar', () => {
    test.skip(({ isMobile }) => isMobile, 'The collapse control starts at 768px');

    test('reclaims space, navigates and persists across routes and reloads', async ({ page }) => {
        await openApp(page);
        await expect.poll(() => width(page)).toBe(256);
        await expectHeaderNotOverlapping(page);
        await page.screenshot({ path: test.info().outputPath('sidebar-expanded.png') });
        const before = await page.locator('main').boundingBox();
        await toggle(page).click();
        await expect(toggle(page)).toHaveAccessibleName(expandLabel);
        await expect(toggle(page)).toHaveAttribute('aria-expanded', 'false');
        await expect(toggle(page)).toHaveAttribute('aria-controls', 'app-sidebar');
        await expect.poll(() => width(page)).toBe(80);
        const after = await page.locator('main').boundingBox();
        expect(after!.width - before!.width).toBe(176);
        await expectHeaderNotOverlapping(page);
        await page.mouse.move(500, 0);
        await page.screenshot({ path: test.info().outputPath('sidebar-collapsed.png') });
        await expect(sidebar(page).getByText('CareerTrack', { exact: true })).toBeHidden();
        await expect(sidebar(page).getByText('Sidebar Test', { exact: true })).toBeHidden();

        for (const [label, path] of [['Timeline', '/timeline'], ['Tagesplan', '/schedule'], ['Statistik', '/stats'], ['Bewerbungen', '/']] as const) {
            const link = sidebar(page).getByRole('link', { name: label, exact: true });
            await link.click();
            await expect(page).toHaveURL(new RegExp(`${path}$`));
            await expect(link).toHaveAttribute('aria-current', 'page');
            await expect.poll(() => width(page)).toBe(80);
        }
        await page.reload();
        await expect(toggle(page)).toHaveAccessibleName(expandLabel);
        await expect.poll(() => width(page)).toBe(80);
        await toggle(page).click();
        await expect.poll(() => width(page)).toBe(256);
        await page.reload();
        await expect(toggle(page)).toHaveAccessibleName(collapseLabel);
        await expect.poll(() => width(page)).toBe(256);
    });

    test('supports keyboard toggling and tooltips on hover and focus', async ({ page }) => {
        await openApp(page);
        await toggle(page).focus();
        await page.keyboard.press('Enter');
        await expect.poll(() => width(page)).toBe(80);
        await expect(toggle(page)).toBeFocused();
        const timeline = sidebar(page).getByRole('link', { name: 'Timeline', exact: true });
        const tooltip = timeline.getByRole('tooltip');
        await timeline.hover();
        await expect(tooltip).toBeVisible();
        await page.mouse.move(500, 0);
        await expect(tooltip).toBeHidden();
        await timeline.focus();
        await expect(tooltip).toBeVisible();
        await page.keyboard.press('Enter');
        await expect(page).toHaveURL(/\/timeline$/);
        await toggle(page).focus();
        await page.keyboard.press('Space');
        await expect.poll(() => width(page)).toBe(256);
    });

    test('keeps language, theme and logout usable in compact mode', async ({ page }) => {
        await openApp(page);
        await toggle(page).click();
        await expect.poll(() => width(page)).toBe(80);
        await sidebar(page).getByRole('button', { name: 'EN', exact: true }).click();
        await expect(sidebar(page).getByRole('button', { name: 'Expand sidebar' })).toBeVisible();
        await expect(sidebar(page).getByRole('link', { name: 'Application Board', exact: true })).toBeVisible();
        await sidebar(page).getByRole('button', { name: 'DE', exact: true }).click();
        await sidebar(page).getByRole('button', { name: 'Design wechseln' }).click();
        await page.getByRole('menuitemradio', { name: 'Dunkel', exact: true }).click();
        await expect(page.locator('html')).toHaveClass(/dark/);
        await expect(sidebar(page)).toHaveCSS('background-color', 'rgb(15, 23, 42)');
        await page.screenshot({ path: test.info().outputPath('sidebar-dark.png') });
        await sidebar(page).getByRole('button', { name: 'Design wechseln' }).click();
        await page.getByRole('menuitemradio', { name: 'Hell', exact: true }).click();
        await expect(sidebar(page)).toHaveCSS('background-color', 'rgb(255, 255, 255)');
        await page.evaluate(() => window.addEventListener('sidebar-test-logout', () => {
            document.body.dataset.loggedOut = 'true';
        }));
        await sidebar(page).getByRole('button', { name: 'Abmelden' }).click();
        await expect(page.locator('body')).toHaveAttribute('data-logged-out', 'true');
    });

    for (const saved of ['false', 'invalid', '1']) {
        test(`defaults to expanded for preference ${saved}`, async ({ page }) => {
            await seedPreference(page, saved);
            await openApp(page);
            await expect.poll(() => width(page)).toBe(256);
            await expect(toggle(page)).toHaveAccessibleName(collapseLabel);
        });
    }

    test('works when localStorage reads and writes throw', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(() => {
            const storage = window.localStorage;
            const get = Storage.prototype.getItem;
            const set = Storage.prototype.setItem;
            Storage.prototype.getItem = function(name) {
                if (this === storage) throw new DOMException('Storage blocked', 'SecurityError');
                return get.call(this, name);
            };
            Storage.prototype.setItem = function(name, value) {
                if (this === storage) throw new DOMException('Storage full', 'QuotaExceededError');
                return set.call(this, name, value);
            };
        });
        await openApp(page);
        await expect.poll(() => width(page)).toBe(256);
        await toggle(page).click();
        await expect.poll(() => width(page)).toBe(80);
        await toggle(page).click();
        await expect.poll(() => width(page)).toBe(256);
        expect(errors).toEqual([]);
    });

    test('preserves desktop preference across the mobile breakpoint', async ({ page }) => {
        await seedPreference(page, 'true');
        await openApp(page);
        await expect.poll(() => width(page)).toBe(80);
        await page.setViewportSize({ width: 767, height: 1024 });
        const openMenu = page.getByRole('button', { name: 'Menü öffnen', exact: true });
        await openMenu.click();
        await expect.poll(() => width(page)).toBe(256);
        await expect(toggle(page)).toBeHidden();
        await expect(sidebar(page).getByRole('link', { name: 'Timeline', exact: true }).locator('span').first()).toBeVisible();
        await expect(sidebar(page).getByText('CareerTrack', { exact: true })).toBeVisible();
        await expect(sidebar(page).getByText('Sidebar Test', { exact: true })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(openMenu).toHaveAttribute('aria-expanded', 'false');
        await openMenu.click();
        await sidebar(page).getByRole('link', { name: 'Timeline', exact: true }).click();
        await expect(openMenu).toHaveAttribute('aria-expanded', 'false');
        await openMenu.click();
        await page.setViewportSize({ width: 768, height: 1024 });
        await expect.poll(() => width(page)).toBe(80);
        await page.setViewportSize({ width: 767, height: 1024 });
        await expect(openMenu).toHaveAttribute('aria-expanded', 'false');
        expect(await page.evaluate(key => localStorage.getItem(key), storageKey)).toBe('true');
    });

    test('respects reduced motion', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await openApp(page);
        await toggle(page).click();
        await expect.poll(() => width(page)).toBe(80);
        await expect(sidebar(page)).toHaveCSS('transition-property', 'none');
    });
});

test('mobile menu shows complete navigation despite a saved compact preference', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Smartphone regression');
    await seedPreference(page, 'true');
    await openApp(page);
    await expect(toggle(page)).toBeHidden();
    await page.getByRole('button', { name: 'Menü öffnen', exact: true }).click();
    await expect.poll(() => width(page)).toBe(256);
    await expect(sidebar(page).getByText('Jobsuche Planer', { exact: true })).toBeVisible();
    await expect(sidebar(page).getByText('Sidebar Test', { exact: true })).toBeVisible();
    await page.screenshot({ path: test.info().outputPath('sidebar-mobile.png') });
    await sidebar(page).getByRole('link', { name: 'Timeline', exact: true }).click();
    await expect(page).toHaveURL(/\/timeline$/);
    await expect(page.getByRole('button', { name: 'Menü öffnen', exact: true })).toHaveAttribute('aria-expanded', 'false');
});
