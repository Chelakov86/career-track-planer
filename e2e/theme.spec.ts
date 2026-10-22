import { test, expect } from '@playwright/test';

test.setTimeout(15000);

test.use({ storageState: { cookies: [], origins: [] } });

async function openTheme(page: import('@playwright/test').Page, saved?: string) {
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    await page.addInitScript(value => {
        if (value) localStorage.setItem('career_track_theme', value);
    }, saved);
    await page.route('**/theme-test', route => route.fulfill({ contentType: 'text/html', body: `
      <html><body><div id="root"></div><button id="outside">Outside</button>
      <script type="module">
        import React from '/node_modules/.vite/deps/react.js';
        import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
        import RefreshRuntime from '/@react-refresh';
        RefreshRuntime.injectIntoGlobalHook(window);
        window.$RefreshReg$ = () => {};
        window.$RefreshSig$ = () => type => type;
        window.__vite_plugin_react_preamble_installed__ = true;
        const { ThemeProvider } = await import('/src/contexts/ThemeContext.tsx');
        const { ThemeSelector } = await import('/src/components/ThemeSelector.tsx');
        ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(ThemeProvider, null,
          React.createElement(ThemeSelector, { language: 'de' })));
      </script></body></html>` })) ;
    await page.goto('/theme-test');
    await expect(page.getByRole('button', { name: 'Design wechseln' })).toBeVisible();
}

async function choose(page: import('@playwright/test').Page, name: string) {
    await page.getByRole('button', { name: 'Design wechseln' }).click();
    await page.getByRole('menuitemradio', { name, exact: true }).click();
}

test('system follows live changes; explicit choices persist and override system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await openTheme(page);
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(html).not.toHaveClass(/dark/);
    await choose(page, 'Dunkel');
    await expect(html).toHaveClass(/dark/);
    await page.reload();
    await expect(html).toHaveClass(/dark/);
    await choose(page, 'Hell');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(html).not.toHaveClass(/dark/);
    await choose(page, 'System');
    await expect(html).toHaveClass(/dark/);
    await page.reload();
    await page.emulateMedia({ colorScheme: 'light' });
    await expect(html).not.toHaveClass(/dark/);
    await expect.poll(() => page.evaluate(() => localStorage.getItem('career_track_theme'))).toBe('system');
});

for (const saved of ['light', 'dark', 'invalid']) {
    test(`handles saved preference ${saved}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: 'dark' });
        await openTheme(page, saved);
        if (saved === 'light') await expect(page.locator('html')).not.toHaveClass(/dark/);
        else await expect(page.locator('html')).toHaveClass(/dark/);
    });
}

test('menu supports keyboard, checked state, escape and outside click', async ({ page }) => {
    await openTheme(page);
    const trigger = page.getByRole('button', { name: 'Design wechseln' });
    await trigger.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menuitemradio', { name: 'System', exact: true })).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('Enter');
    await expect(trigger).toBeFocused();
    await trigger.click();
    await expect(page.getByRole('menuitemradio', { name: 'Dunkel', exact: true })).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    await trigger.click();
    await page.locator('#outside').click();
    await expect(page.getByRole('menu')).toHaveCount(0);
});
