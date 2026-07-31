import { test, expect } from '@playwright/test';
import {
  bucketKey,
  bucketLabel,
  buildActivitySeries,
  computeRejectionDepth,
  listBuckets,
  resolvePeriod,
} from '../src/lib/analytics';
import { ApplicationEvent, ApplicationStatus, InterviewRound, JobApplication } from '../src/types';

const makeEvent = (overrides: Partial<ApplicationEvent> = {}): ApplicationEvent => ({
  id: 'event-1',
  jobId: 'job-1',
  fromStatus: null,
  toStatus: ApplicationStatus.RESEARCH,
  occurredOn: '2026-07-27',
  backfilled: false,
  ...overrides,
});

const makeRound = (overrides: Partial<InterviewRound> = {}): InterviewRound => ({
  id: 'round-1',
  jobId: 'job-1',
  roundName: 'Screening',
  interviewDate: '2026-07-29',
  status: 'scheduled',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
  ...overrides,
});

const makeJob = (overrides: Partial<JobApplication> = {}): JobApplication => ({
  id: 'job-1',
  company: 'Example GmbH',
  position: 'Engineer',
  location: 'Remote',
  status: ApplicationStatus.APPLIED,
  dateAdded: '2026-07-01',
  lastUpdated: '2026-07-01',
  notes: '',
  interviewRounds: [],
  ...overrides,
});

test.describe('analytics date helpers', () => {
  test('uses Monday-start ISO weeks and calendar months', () => {
    expect(bucketKey('2026-07-26', 'week')).toBe('2026-07-20');
    expect(bucketKey('2026-07-27', 'week')).toBe('2026-07-27');
    expect(bucketKey('2026-07-31', 'day')).toBe('2026-07-31');
    expect(bucketKey('2026-07-31', 'month')).toBe('2026-07');
  });

  test('resolves fixed-date presets and inclusive custom ranges', () => {
    const today = new Date(2026, 6, 31, 23, 45);

    expect(resolvePeriod('this_week', null, today)).toEqual({ from: '2026-07-27', to: '2026-07-31' });
    expect(resolvePeriod('last_4_weeks', null, today)).toEqual({ from: '2026-07-06', to: '2026-07-31' });
    expect(resolvePeriod('last_8_weeks', null, today)).toEqual({ from: '2026-06-08', to: '2026-07-31' });
    expect(resolvePeriod('last_3_months', null, today)).toEqual({ from: '2026-05-01', to: '2026-07-31' });
    expect(resolvePeriod('this_year', null, today)).toEqual({ from: '2026-01-01', to: '2026-07-31' });
    expect(resolvePeriod('all_time', null, today, '2025-12-12')).toEqual({ from: '2025-12-12', to: '2026-07-31' });
    expect(resolvePeriod('all_time', null, today)).toEqual({ from: '2026-07-31', to: '2026-07-31' });
    expect(resolvePeriod('custom', { from: '2026-07-20', to: '2026-07-31' }, today)).toEqual({
      from: '2026-07-20',
      to: '2026-07-31',
    });
  });

  test('zero-fills all buckets intersecting a selected range', () => {
    expect(listBuckets({ from: '2026-07-26', to: '2026-08-05' }, 'week')).toEqual([
      '2026-07-20',
      '2026-07-27',
      '2026-08-03',
    ]);

    expect(listBuckets({ from: '2026-07-30', to: '2026-08-01' }, 'day')).toEqual([
      '2026-07-30',
      '2026-07-31',
      '2026-08-01',
    ]);
  });

  test('formats bucket labels for both supported languages', () => {
    expect(bucketLabel('2026-07-27', 'week', 'en')).toContain('27');
    expect(bucketLabel('2026-07-27', 'week', 'de')).toContain('27');
    expect(bucketLabel('2026-07', 'month', 'en')).toContain('2026');
    expect(bucketLabel('2026-07', 'month', 'de')).toContain('2026');
  });
});

test.describe('buildActivitySeries', () => {
  test('counts event facts independently, including backfilled and repeated outcomes', () => {
    const events = [
      makeEvent({ id: 'created-applied', toStatus: ApplicationStatus.APPLIED, occurredOn: '2026-07-27' }),
      makeEvent({
        id: 'backward-move',
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.TO_APPLY,
        occurredOn: '2026-07-28',
        backfilled: true,
      }),
      makeEvent({
        id: 'reapplication',
        fromStatus: ApplicationStatus.TO_APPLY,
        toStatus: ApplicationStatus.APPLIED,
        occurredOn: '2026-07-29',
      }),
      makeEvent({
        id: 'rejection',
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.REJECTED,
        occurredOn: '2026-07-30',
        backfilled: true,
      }),
      makeEvent({ id: 'outside', occurredOn: '2026-07-31' }),
    ];

    expect(buildActivitySeries(events, [], { from: '2026-07-27', to: '2026-07-30' }, 'day')).toEqual([
      { bucket: '2026-07-27', added: 1, applied: 1, rejected: 0, interviews: 0 },
      { bucket: '2026-07-28', added: 0, applied: 0, rejected: 0, interviews: 0 },
      { bucket: '2026-07-29', added: 0, applied: 1, rejected: 0, interviews: 0 },
      { bucket: '2026-07-30', added: 0, applied: 0, rejected: 1, interviews: 0 },
    ]);
  });

  test('places current interview rounds in their date grain regardless of status', () => {
    const job = makeJob({
      interviewRounds: [
        makeRound({ id: 'scheduled', interviewDate: '2026-07-27', status: 'scheduled' }),
        makeRound({ id: 'completed', interviewDate: '2026-07-29', status: 'completed' }),
      ],
    });
    const period = { from: '2026-07-27', to: '2026-07-31' };

    expect(buildActivitySeries([], [job], period, 'day')).toEqual([
      { bucket: '2026-07-27', added: 0, applied: 0, rejected: 0, interviews: 1 },
      { bucket: '2026-07-28', added: 0, applied: 0, rejected: 0, interviews: 0 },
      { bucket: '2026-07-29', added: 0, applied: 0, rejected: 0, interviews: 1 },
      { bucket: '2026-07-30', added: 0, applied: 0, rejected: 0, interviews: 0 },
      { bucket: '2026-07-31', added: 0, applied: 0, rejected: 0, interviews: 0 },
    ]);

    const rescheduledJob = makeJob({
      interviewRounds: [makeRound({ id: 'scheduled', interviewDate: '2026-07-31' })],
    });
    expect(buildActivitySeries([], [rescheduledJob], period, 'day').map(bucket => bucket.interviews)).toEqual([
      0, 0, 0, 0, 1,
    ]);
    expect(buildActivitySeries([], [makeJob()], period, 'day').every(bucket => bucket.interviews === 0)).toBe(true);
  });
});

test.describe('computeRejectionDepth', () => {
  test('classifies rounds reached on or before each rejection date', () => {
    const jobs = [
      makeJob({ id: 'zero', interviewRounds: [] }),
      makeJob({
        id: 'one',
        interviewRounds: [
          makeRound({ id: 'one-before', jobId: 'one', interviewDate: '2026-07-10' }),
          makeRound({ id: 'one-after', jobId: 'one', interviewDate: '2026-07-11' }),
        ],
      }),
      makeJob({
        id: 'two',
        interviewRounds: [
          makeRound({ id: 'two-first', jobId: 'two', interviewDate: '2026-07-08' }),
          makeRound({ id: 'two-second', jobId: 'two', interviewDate: '2026-07-10' }),
          makeRound({ id: 'two-after', jobId: 'two', interviewDate: '2026-07-11' }),
        ],
      }),
      makeJob({
        id: 'three-plus',
        interviewRounds: [0, 1, 2, 3].map(index =>
          makeRound({ id: `three-${index}`, jobId: 'three-plus', interviewDate: `2026-07-0${index + 1}` })
        ),
      }),
    ];
    const events = [
      makeEvent({ id: 'zero-rejection', jobId: 'zero', toStatus: ApplicationStatus.REJECTED, occurredOn: '2026-07-10' }),
      makeEvent({ id: 'one-rejection', jobId: 'one', toStatus: ApplicationStatus.REJECTED, occurredOn: '2026-07-10' }),
      makeEvent({ id: 'two-rejection', jobId: 'two', toStatus: ApplicationStatus.REJECTED, occurredOn: '2026-07-10' }),
      makeEvent({ id: 'three-rejection', jobId: 'three-plus', toStatus: ApplicationStatus.REJECTED, occurredOn: '2026-07-10' }),
      makeEvent({ id: 'outside-rejection', jobId: 'zero', toStatus: ApplicationStatus.REJECTED, occurredOn: '2026-08-01' }),
    ];

    expect(computeRejectionDepth(events, jobs, { from: '2026-07-01', to: '2026-07-31' })).toEqual({
      zero: 1,
      one: 1,
      two: 1,
      threePlus: 1,
    });
  });

  test('counts repeated rejection events separately using each event date', () => {
    const job = makeJob({
      id: 'reapplied',
      interviewRounds: [
        makeRound({ id: 'first-round', jobId: 'reapplied', interviewDate: '2026-07-05' }),
        makeRound({ id: 'second-round', jobId: 'reapplied', interviewDate: '2026-07-15' }),
      ],
    });
    const events = [
      makeEvent({ id: 'first-rejection', jobId: 'reapplied', toStatus: ApplicationStatus.REJECTED, occurredOn: '2026-07-05' }),
      makeEvent({ id: 'second-rejection', jobId: 'reapplied', toStatus: ApplicationStatus.REJECTED, occurredOn: '2026-07-15' }),
    ];

    expect(computeRejectionDepth(events, [job], { from: '2026-07-01', to: '2026-07-31' })).toEqual({
      zero: 0,
      one: 1,
      two: 1,
      threePlus: 0,
    });
  });
});
