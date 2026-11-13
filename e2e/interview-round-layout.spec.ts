import { test, expect } from '@playwright/test';
import { TRANSLATIONS } from '../src/constants';

// Render the real dialog and its ancestors, replacing only auth and persistence.
// No test account or writes to a Supabase project are needed for layout checks.
test.use({ storageState: { cookies: [], origins: [] } });

for (const language of ['de', 'en'] as const) {
    for (const iosSizing of [false, true]) {
        test(`interview fields fit the complete edit dialog (${language}, iOS sizing=${iosSizing})`, async ({ page }, testInfo) => {
            const pageErrors: string[] = [];
            page.on('pageerror', error => pageErrors.push(error.message));
            await page.route('**/src/contexts/AuthContext.tsx*', route => route.fulfill({
                contentType: 'application/javascript',
                body: 'export const useAuth = () => ({ user: { id: "layout-user" } });',
            }));
            await page.route('**/src/hooks/useInterviewRounds.ts*', route => route.fulfill({
                contentType: 'application/javascript',
                body: `
                    import React from '/node_modules/.vite/deps/react.js';
                    export const useInterviewRounds = () => {
                        const [rounds, setRounds] = React.useState([{
                            id: 'layout-round', jobId: 'layout-job', roundName: 'Technical interview',
                            interviewDate: '2026-11-20', startTime: '10:00', endTime: '11:00',
                            status: 'awaiting_feedback', meetingLink: 'https://example.com/interview',
                        }]);
                        return { rounds, addRound: () => {}, deleteRound: () => {},
                            updateRound: (id, updates) => setRounds(previous => previous.map(
                                round => round.id === id ? { ...round, ...updates } : round
                            )) };
                    };
                `,
            }));
            await page.route('**/src/main.tsx*', route => route.fulfill({
                contentType: 'application/javascript',
                body: `
                    import React from '/node_modules/.vite/deps/react.js';
                    import ReactDOM from '/node_modules/.vite/deps/react-dom_client.js';
                    import { JobModal } from '/src/components/JobModal.tsx';
                    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(JobModal, {
                        initialData: { id: 'layout-job', company: 'Example', position: 'Engineer', status: 'INTERVIEW' },
                        language: '${language}', initialShowInterviews: true,
                        onSave: () => {}, onCancel: () => {},
                    }));
                `,
            }));
            await page.goto('/');
            const dialog = page.getByRole('dialog');
            const date = dialog.locator('input[type="date"]');
            await expect(date).toBeAttached();
            // Fail explicitly if CDN styling is unavailable, instead of testing an unstyled page.
            await expect.poll(() => dialog.evaluate(el => getComputedStyle(el).maxWidth)).toBe('512px');

            if (iosSizing) {
                // Linux WebKit does not run RenderThemeIOS. Model its content-box
                // override for native date/time controls, which ignores the author's
                // border-box sizing. appearance:none bypasses that native theme path.
                // https://bugs.webkit.org/show_bug.cgi?id=301648
                // Source/WebCore/rendering/ios/RenderThemeIOS.mm: adjustInputElementButtonStyle
                await dialog.locator('input[type="date"], input[type="time"]').evaluateAll(inputs => {
                    for (const input of inputs) {
                        if (getComputedStyle(input).appearance !== 'none') {
                            (input as HTMLInputElement).style.boxSizing = 'content-box';
                        }
                    }
                });
            }

            const t = TRANSLATIONS[language];
            const card = dialog.locator('div.border').filter({ has: page.locator('input[type="date"]') }).last();
            await card.getByRole('button', { name: t.interviewRound.notes, exact: true }).click();

            for (const width of [320, 390, 639, 640, 768, 1024, 1280]) {
                await page.setViewportSize({ width, height: 900 });
                for (const dark of [false, true]) {
                    await page.evaluate(dark => document.documentElement.classList.toggle('dark', dark), dark);
                    const layout = await dialog.evaluate(element => {
                        const scroller = element.querySelector('.overflow-y-auto')!;
                        const boundary = scroller.getBoundingClientRect();
                        const controls = Array.from(element.querySelectorAll('input, select, textarea, button'));
                        // Compare controls in the same scrolling region; offscreen content
                        // can geometrically intersect the fixed header/footer while being clipped.
                        const scrollControls = controls.filter(control => scroller.contains(control));
                        const overlaps = scrollControls.flatMap((control, index) => {
                            const rect = control.getBoundingClientRect();
                            return scrollControls.slice(index + 1).filter(other => {
                                const otherRect = other.getBoundingClientRect();
                                return Math.min(rect.right, otherRect.right) - Math.max(rect.left, otherRect.left) > 1
                                    && Math.min(rect.bottom, otherRect.bottom) - Math.max(rect.top, otherRect.top) > 1;
                            }).map(other => [control.outerHTML, other.outerHTML]);
                        });
                        return {
                            overlaps,
                            escapedFields: scrollControls.filter(control => {
                                if (!control.matches('input, select, textarea')) return false;
                                const rect = control.getBoundingClientRect();
                                const parent = control.parentElement!.getBoundingClientRect();
                                return rect.left < parent.left - 1 || rect.right > parent.right + 1;
                            }).map(control => control.outerHTML),
                            scrollWidth: scroller.scrollWidth,
                            clientWidth: scroller.clientWidth,
                            overflow: controls.filter(control => {
                                const rect = control.getBoundingClientRect();
                                return rect.left < boundary.left - 1 || rect.right > boundary.right + 1;
                            }).map(control => control.outerHTML),
                            clipped: controls.filter(control => control.matches('button, select, input[type="date"], input[type="time"]') && control.scrollWidth > control.clientWidth + 1)
                                .map(control => `${control.tagName}: ${control.getAttribute('type') || control.textContent}`),
                        };
                    });
                    expect(layout, `width=${width}, dark=${dark}`).toMatchObject({ overlaps: [], escapedFields: [], overflow: [], clipped: [] });
                    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth + 1);
                    if (width === 640 && !dark && language === 'de' && iosSizing) {
                        await date.scrollIntoViewIfNeeded();
                        await page.screenshot({ path: testInfo.outputPath('interview-fields.png') });
                    }
                }
            }

            await date.fill('2026-11-23');
            await expect(date).toHaveValue('2026-11-23');
            const startTime = dialog.locator('input[type="time"]').first();
            await startTime.fill('09:30');
            await expect(startTime).toHaveValue('09:30');
            await startTime.fill('');
            await expect(startTime).toHaveValue('');
            expect(await startTime.evaluate(input => input.getBoundingClientRect().height)).toBeGreaterThanOrEqual(38);
            const status = card.locator('select');
            await status.selectOption('completed');
            await expect(status).toHaveValue('completed');
            const notes = card.locator('textarea');
            await notes.fill('Follow up after interview');
            await expect(notes).toHaveValue('Follow up after interview');
            expect(pageErrors).toEqual([]);
        });
    }
}
