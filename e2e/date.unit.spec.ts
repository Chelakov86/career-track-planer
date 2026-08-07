import { test, expect } from '@playwright/test';
import { formatLocalizedDateTime } from '../src/lib/date';

test.describe('Localized date formatting', () => {
    test('formats precise timestamps for German and English viewers', () => {
        const timestamp = '2026-08-06T14:32:00.000Z';

        const german = formatLocalizedDateTime(timestamp, 'de');
        const english = formatLocalizedDateTime(timestamp, 'en');

        expect(german).toContain('2026');
        expect(german).toContain('.');
        expect(german).toMatch(/\d{2}:\d{2}/);
        expect(english).toContain('2026');
        expect(english).toContain('/');
        expect(english).toMatch(/\d{1,2}:\d{2}/);
    });

    test('returns no value for a missing or invalid timestamp', () => {
        expect(formatLocalizedDateTime(null, 'de')).toBeNull();
        expect(formatLocalizedDateTime('not-a-date', 'en')).toBeNull();
    });
});
