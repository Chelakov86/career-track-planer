import { test, expect, Page } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

type SortField = 'dateAdded' | 'lastUpdated' | 'company' | 'position';
type SortDirection = 'asc' | 'desc';

const ids = [1, 2, 3, 4].map(value => `00000000-0000-4000-8000-00000000000${value}`);
const user = {
    id: '00000000-0000-4000-8000-000000000010',
    email: 'ordering@example.invalid',
    user_metadata: { full_name: 'Ordering Test' },
    app_metadata: {},
    aud: 'authenticated',
    created_at: '2026-01-01T00:00:00Z',
};

const makeRows = () => ids.map((id, index) => ({
    id,
    user_id: user.id,
    company: index < 2 ? 'Alpha' : 'Zulu',
    position: index < 2 ? 'Alpha Role' : 'Zulu Role',
    status: 'RESEARCH',
    date_added: index < 2 ? '2026-10-23' : '2026-10-24',
    last_updated: '2026-10-24',
    updated_at: index < 2 ? '2026-10-24T10:00:00Z' : '2026-10-24T11:00:00Z',
    link: `https://example.invalid/${id}`,
    notes: '',
    location: '',
    salary: null,
}));

async function openBoard(page: Page, sortField: SortField, sortDirection: SortDirection) {
    const expiresAt = Math.floor(Date.now() / 1000) + 3600;
    const accessToken = [
        'eyJhbGciOiJIUzI1NiJ9',
        Buffer.from(JSON.stringify({ exp: expiresAt, sub: user.id })).toString('base64url'),
        'test-signature',
    ].join('.');
    const session = {
        access_token: accessToken,
        refresh_token: 'test-refresh-token',
        expires_at: expiresAt,
        expires_in: 3600,
        token_type: 'bearer',
        user,
    };
    await page.addInitScript(({ session, sortField, sortDirection }) => {
        localStorage.setItem('sb-ordering-auth-token', JSON.stringify(session));
        sessionStorage.setItem('careertrack.boardState', JSON.stringify({
            sortField,
            sortDirection,
            mobileOpenStatuses: ['RESEARCH'],
        }));
    }, { session, sortField, sortDirection });

    // Keep the real SDK (including visibility-driven session recovery), but
    // point it at a fully intercepted service instead of the configured project.
    await page.route('**/src/lib/supabase.ts', route => route.fulfill({
        contentType: 'application/javascript',
        body: `import { createClient } from '/node_modules/.vite/deps/@supabase_supabase-js.js';
            export const supabase = createClient('https://ordering.supabase.co', 'test-anon-key');`,
    }));
    // Popup navigation is routed at context level because its first request
    // happens before Playwright can attach page-level routes to the popup.
    await page.context().route('https://example.invalid/**', route => route.fulfill({
        contentType: 'text/html', body: '<p>External job link</p>',
    }));

    const state = {
        rows: makeRows(),
        reads: 0,
        orders: [] as (string | null)[],
        writes: [] as string[],
    };
    await page.route('https://**/*', async route => {
        const request = route.request();
        const url = new URL(request.url());
        if (url.hostname === 'ordering.supabase.co') {
            if (!['GET', 'OPTIONS'].includes(request.method())) {
                state.writes.push(`${request.method()} ${url.pathname}`);
            }
            let body: unknown = [];
            if (url.pathname === '/rest/v1/jobs') {
                state.reads++;
                state.orders.push(url.searchParams.get('order'));
                // Intentionally vary response order even if ORDER BY is present:
                // the board must also resolve ties independently of its input.
                body = state.rows;
            } else if (url.pathname === '/auth/v1/user') {
                body = user;
            }
            await route.fulfill({ contentType: 'application/json', body: JSON.stringify(body) });
        } else if (url.hostname === 'example.invalid') {
            await route.fulfill({ contentType: 'text/html', body: '<p>External job link</p>' });
        } else {
            // No CDN, fonts, avatars, or other external services are needed here.
            await route.abort();
        }
    });
    return state;
}

const links = (page: Page) => page.locator('[data-testid="job-board"] .job-card > a');

async function expectOrder(page: Page, expected: string[]) {
    await expect.poll(() => links(page).evaluateAll(elements => elements.map(element =>
        new URL((element as HTMLAnchorElement).href).pathname.slice(1)
    ))).toEqual(expected);
}

async function returnToBoard(page: Page) {
    // Headless browsers do not reliably hide the opener when opening a tab.
    // Dispatch the same event the SDK receives when the opener becomes visible.
    await page.evaluate(() => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
        window.dispatchEvent(new Event('visibilitychange'));
    });
}

for (const sortField of ['dateAdded', 'lastUpdated', 'company', 'position'] as const) {
    for (const sortDirection of ['asc', 'desc'] as const) {
        test(`${sortField} ${sortDirection}: ties use ascending IDs and preserve primary ordering`, async ({ page }) => {
            const state = await openBoard(page, sortField, sortDirection);
            const rows = state.rows;
            state.rows = [rows[3], rows[1], rows[2], rows[0]];
            await page.goto('/');
            await expectOrder(page, sortDirection === 'asc'
                ? [ids[0], ids[1], ids[2], ids[3]]
                : [ids[2], ids[3], ids[0], ids[1]]);
        });
    }
}

test('missing precise timestamps use the date fallback with ascending IDs', async ({ page }) => {
    const state = await openBoard(page, 'lastUpdated', 'desc');
    state.rows = state.rows.reverse().map(row => ({ ...row, updated_at: null }));
    await page.goto('/');
    await expectOrder(page, ids);
});

test('job reads request a deterministic order within each creation date', async ({ page }) => {
    const state = await openBoard(page, 'dateAdded', 'desc');
    await page.goto('/');
    await expect(links(page)).toHaveCount(4);
    expect(state.orders.length).toBeGreaterThan(0);
    expect(state.orders.every(order => order === 'date_added.desc,id.asc')).toBe(true);
});

for (const sortField of ['dateAdded', 'lastUpdated'] as const) {
    test(`${sortField}: link return preserves ties and still loads external changes`, async ({ page }) => {
        const state = await openBoard(page, sortField, 'desc');
        state.rows = state.rows.map(row => ({ ...row, date_added: '2026-10-24', updated_at: '2026-10-24T10:00:00Z' }));
        await page.goto('/');
        await expectOrder(page, ids);

        const popupOpened = page.waitForEvent('popup');
        await links(page).first().evaluate(element => (element as HTMLAnchorElement).click());
        const popup = await popupOpened;
        await expect(popup).toHaveURL(`https://example.invalid/${ids[0]}`);
        await popup.close();

        state.rows = [...state.rows].reverse().map(row => ({ ...row, notes: 'After tab return' }));
        let readsBefore = state.reads;
        await returnToBoard(page);
        await expect.poll(() => state.reads).toBeGreaterThan(readsBefore);
        // Wait for React to consume the response before checking the order.
        await expect(page.locator('.job-card').filter({ hasText: 'After tab return' })).toHaveCount(4);
        await expectOrder(page, ids);
        expect(state.writes).toEqual([]);

        state.rows = state.rows.map(row => row.id === ids[3] ? {
            ...row,
            company: 'Changed elsewhere',
            date_added: '2026-10-25',
            updated_at: '2026-10-25T12:00:00Z',
        } : row);
        readsBefore = state.reads;
        await returnToBoard(page);
        await expect.poll(() => state.reads).toBeGreaterThan(readsBefore);
        await expectOrder(page, [ids[3], ids[0], ids[1], ids[2]]);
        await expect(page.locator('.job-card').filter({ hasText: 'Changed elsewhere' })).toHaveCount(1);
        expect(state.writes).toEqual([]);
    });
}
