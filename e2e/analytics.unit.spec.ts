import { test, expect } from '@playwright/test';
import { buildRecentAddedEventSeries } from '../src/lib/analytics';
import { formatLocalDate } from '../src/lib/date';
import { ApplicationEvent, ApplicationStatus } from '../src/types';

const makeEvent = (overrides: Partial<ApplicationEvent> = {}): ApplicationEvent => ({
  id: 'event-1',
  jobId: 'job-1',
  fromStatus: null,
  toStatus: ApplicationStatus.RESEARCH,
  occurredOn: '2026-07-27',
  backfilled: false,
  ...overrides,
});

test.describe('buildRecentAddedEventSeries', () => {
  test('formats a Date using its local calendar date', () => {
    const localDate = new Date(2026, 6, 31, 23, 45);

    expect(formatLocalDate(localDate)).toBe('2026-07-31');
  });

  test('counts creation Application Events and preserves every recent weekly bucket', () => {
    const events = [
      makeEvent({ id: 'current-week', occurredOn: '2026-07-31' }),
      makeEvent({ id: 'sunday', occurredOn: '2026-07-26' }),
      makeEvent({ id: 'backfilled', occurredOn: '2026-06-08', backfilled: true }),
      makeEvent({
        id: 'status-transition',
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.INTERVIEW,
        occurredOn: '2026-07-30',
      }),
      makeEvent({ id: 'outside-window', occurredOn: '2026-06-07' }),
    ];

    expect(buildRecentAddedEventSeries(events, new Date(2026, 6, 31))).toEqual([
      { bucket: '2026-06-08', added: 1 },
      { bucket: '2026-06-15', added: 0 },
      { bucket: '2026-06-22', added: 0 },
      { bucket: '2026-06-29', added: 0 },
      { bucket: '2026-07-06', added: 0 },
      { bucket: '2026-07-13', added: 0 },
      { bucket: '2026-07-20', added: 1 },
      { bucket: '2026-07-27', added: 1 },
    ]);
  });

  test('includes the first and current bucket boundaries', () => {
    const events = [
      makeEvent({ id: 'first-boundary', occurredOn: '2026-06-08' }),
      makeEvent({ id: 'before-first-boundary', occurredOn: '2026-06-07' }),
      makeEvent({ id: 'current-boundary', occurredOn: '2026-07-27' }),
      makeEvent({ id: 'future', occurredOn: '2026-08-01' }),
    ];

    const eventSeries = buildRecentAddedEventSeries(events, new Date(2026, 6, 31));

    expect(eventSeries[0]).toEqual({ bucket: '2026-06-08', added: 1 });
    expect(eventSeries.at(-1)).toEqual({ bucket: '2026-07-27', added: 1 });
    expect(eventSeries.reduce((total, bucket) => total + bucket.added, 0)).toBe(2);
  });
});
