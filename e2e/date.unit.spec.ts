import { test, expect } from '@playwright/test';
import { formatLocalizedDateTime, formatRelativeTime, getLastUpdatedTimestamp } from '../src/lib/date';

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

    test('prefers a precise update timestamp over a legacy date-only value', () => {
        const precise = getLastUpdatedTimestamp('2026-08-06T14:32:00.000Z', '2026-08-06');
        const legacy = getLastUpdatedTimestamp(null, '2026-08-06');

        expect(precise).toBeGreaterThan(legacy);
    });

    test('formats recent updates with locale-aware relative labels', () => {
        const now = new Date(2026, 7, 7, 14, 0, 0);
        const twoMinutesAgo = new Date(2026, 7, 7, 13, 58, 0).toISOString();
        const yesterday = new Date(2026, 7, 6, 9, 0, 0).toISOString();
        const twoDaysAgo = new Date(2026, 7, 5, 9, 0, 0).toISOString();

        expect(formatRelativeTime(twoMinutesAgo, '2026-08-07', 'de', now)).toBe('vor 2 Min.');
        expect(formatRelativeTime(twoMinutesAgo, '2026-08-07', 'en', now)).toBe('2 min ago');
        expect(formatRelativeTime(yesterday, '2026-08-06', 'de', now)).toBe('gestern');
        expect(formatRelativeTime(yesterday, '2026-08-06', 'en', now)).toBe('yesterday');
        expect(formatRelativeTime(twoDaysAgo, '2026-08-05', 'de', now)).toBe('05.08.2026');
    });
});
