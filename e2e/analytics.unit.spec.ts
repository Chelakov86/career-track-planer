import { test, expect } from '@playwright/test';
import {
  bucketKey,
  bucketLabel,
  buildActivitySeries,
  computeRejectionDepth,
  findEarliestDataDate,
  listBuckets,
  listJobActivities,
  resolvePeriod,
} from '../src/lib/analytics';
import { ApplicationEvent, ApplicationStatus, InterviewRound, JobApplication } from '../src/types';
import { getMillisecondsUntilNextLocalMidnight } from '../src/lib/date';

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
    const earliestData = findEarliestDataDate(
      [makeEvent({ occurredOn: '2025-12-12' })],
      [makeJob({ interviewRounds: [makeRound({ interviewDate: '2026-01-01' })] })]
    );
    expect(resolvePeriod('all_time', null, today, earliestData)).toEqual({ from: '2025-12-12', to: '2026-07-31' });
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

  test('returns stable zero values for an empty data set', () => {
    const period = { from: '2026-07-30', to: '2026-07-31' };

    expect(buildActivitySeries([], [], period, 'day')).toEqual([
      { bucket: '2026-07-30', added: 0, applied: 0, rejected: 0, interviews: 0 },
      { bucket: '2026-07-31', added: 0, applied: 0, rejected: 0, interviews: 0 },
    ]);
    expect(computeRejectionDepth([], [], period)).toEqual({ zero: 0, one: 0, two: 0, threePlus: 0 });
  });

  test('formats bucket labels for both supported languages', () => {
    expect(bucketLabel('2026-07-27', 'week', 'en')).toContain('27');
    expect(bucketLabel('2026-07-27', 'week', 'de')).toContain('27');
    expect(bucketLabel('2026-07', 'month', 'en')).toContain('2026');
    expect(bucketLabel('2026-07', 'month', 'de')).toContain('2026');
  });

  test('calculates the delay until the next local midnight', () => {
    expect(getMillisecondsUntilNextLocalMidnight(new Date(2026, 6, 31, 23, 59, 50))).toBe(10_000);
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
        id: 'backfilled-applied',
        fromStatus: ApplicationStatus.RESEARCH,
        toStatus: ApplicationStatus.APPLIED,
        occurredOn: '2026-07-28',
        backfilled: true,
      }),
      makeEvent({
        id: 'rejection',
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.REJECTED,
        occurredOn: '2026-07-30',
        backfilled: true,
      }),
      makeEvent({
        id: 'repeated-rejection',
        fromStatus: ApplicationStatus.APPLIED,
        toStatus: ApplicationStatus.REJECTED,
        occurredOn: '2026-07-30',
      }),
      makeEvent({ id: 'outside', occurredOn: '2026-07-31' }),
    ];

    expect(buildActivitySeries(events, [], { from: '2026-07-27', to: '2026-07-30' }, 'day')).toEqual([
      { bucket: '2026-07-27', added: 1, applied: 1, rejected: 0, interviews: 0 },
      { bucket: '2026-07-28', added: 0, applied: 1, rejected: 0, interviews: 0 },
      { bucket: '2026-07-29', added: 0, applied: 1, rejected: 0, interviews: 0 },
      { bucket: '2026-07-30', added: 0, applied: 0, rejected: 2, interviews: 0 },
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

test.describe('listJobActivities', () => {
  test('counts each activity type for a job with events and interview rounds in the period', () => {
    const job = makeJob({
      id: 'job-1',
      interviewRounds: [makeRound({ id: 'round-1', jobId: 'job-1', interviewDate: '2026-07-15' })],
    });
    const events = [
      makeEvent({ id: 'added', jobId: 'job-1', fromStatus: null, toStatus: ApplicationStatus.RESEARCH, occurredOn: '2026-07-10' }),
      makeEvent({ id: 'applied', jobId: 'job-1', fromStatus: ApplicationStatus.RESEARCH, toStatus: ApplicationStatus.APPLIED, occurredOn: '2026-07-12' }),
      makeEvent({ id: 'rejected', jobId: 'job-1', fromStatus: ApplicationStatus.APPLIED, toStatus: ApplicationStatus.REJECTED, occurredOn: '2026-07-14' }),
    ];
    const period = { from: '2026-07-01', to: '2026-07-31' };

    expect(listJobActivities(events, [job], period)).toEqual([
      {
        job,
        added: 1,
        applied: 1,
        rejected: 1,
        interviews: 1,
        lastActivity: '2026-07-15',
      },
    ]);
  });

  test('skips events whose job no longer exists', () => {
    const job = makeJob({ id: 'job-1' });
    const events = [
      makeEvent({ id: 'added', jobId: 'job-1', occurredOn: '2026-07-10' }),
      makeEvent({ id: 'ghost-added', jobId: 'deleted-job', occurredOn: '2026-07-11' }),
    ];
    const period = { from: '2026-07-01', to: '2026-07-31' };

    const activities = listJobActivities(events, [job], period);

    expect(activities).toHaveLength(1);
    expect(activities[0].job.id).toBe('job-1');
  });

  test('excludes jobs with no activity in the period', () => {
    const inside = makeJob({ id: 'inside', dateAdded: '2026-07-10' });
    const outside = makeJob({
      id: 'outside',
      dateAdded: '2026-06-01',
      interviewRounds: [makeRound({ id: 'outside-round', jobId: 'outside', interviewDate: '2026-06-15' })],
    });
    const events = [
      makeEvent({ id: 'added-inside', jobId: 'inside', occurredOn: '2026-07-10' }),
      makeEvent({ id: 'added-outside', jobId: 'outside', occurredOn: '2026-06-01' }),
    ];
    const period = { from: '2026-07-01', to: '2026-07-31' };

    const activities = listJobActivities(events, [inside, outside], period);

    expect(activities).toHaveLength(1);
    expect(activities[0].job.id).toBe('inside');
  });

  test('counts repeated events of the same type as facts', () => {
    const job = makeJob({ id: 'reapplied' });
    const events = [
      makeEvent({ id: 'applied-1', jobId: 'reapplied', fromStatus: ApplicationStatus.RESEARCH, toStatus: ApplicationStatus.APPLIED, occurredOn: '2026-07-05' }),
      makeEvent({ id: 'backward', jobId: 'reapplied', fromStatus: ApplicationStatus.APPLIED, toStatus: ApplicationStatus.TO_APPLY, occurredOn: '2026-07-06' }),
      makeEvent({ id: 'applied-2', jobId: 'reapplied', fromStatus: ApplicationStatus.TO_APPLY, toStatus: ApplicationStatus.APPLIED, occurredOn: '2026-07-07' }),
      makeEvent({ id: 'rejected-1', jobId: 'reapplied', fromStatus: ApplicationStatus.APPLIED, toStatus: ApplicationStatus.REJECTED, occurredOn: '2026-07-08' }),
      makeEvent({ id: 'rejected-2', jobId: 'reapplied', fromStatus: ApplicationStatus.APPLIED, toStatus: ApplicationStatus.REJECTED, occurredOn: '2026-07-09' }),
    ];
    const period = { from: '2026-07-01', to: '2026-07-31' };

    const activities = listJobActivities(events, [job], period);

    expect(activities[0].added).toBe(0);
    expect(activities[0].applied).toBe(2);
    expect(activities[0].rejected).toBe(2);
    expect(activities[0].lastActivity).toBe('2026-07-09');
  });

  test('counts interview rounds regardless of their status', () => {
    const job = makeJob({
      id: 'interviews',
      interviewRounds: [
        makeRound({ id: 'scheduled', jobId: 'interviews', interviewDate: '2026-07-10', status: 'scheduled' }),
        makeRound({ id: 'completed', jobId: 'interviews', interviewDate: '2026-07-12', status: 'completed' }),
        makeRound({ id: 'awaiting', jobId: 'interviews', interviewDate: '2026-07-14', status: 'awaiting_feedback' }),
      ],
    });
    const period = { from: '2026-07-01', to: '2026-07-31' };

    const activities = listJobActivities([], [job], period);

    expect(activities[0].interviews).toBe(3);
    expect(activities[0].lastActivity).toBe('2026-07-14');
  });

  test('respects inclusive period boundaries and ignores out-of-range activity', () => {
    const job = makeJob({ id: 'boundaries' });
    const events = [
      makeEvent({ id: 'on-from', jobId: 'boundaries', fromStatus: null, occurredOn: '2026-07-01' }),
      makeEvent({ id: 'on-to', jobId: 'boundaries', fromStatus: ApplicationStatus.RESEARCH, toStatus: ApplicationStatus.APPLIED, occurredOn: '2026-07-31' }),
      makeEvent({ id: 'before', jobId: 'boundaries', fromStatus: null, occurredOn: '2026-06-30' }),
      makeEvent({ id: 'after', jobId: 'boundaries', fromStatus: null, occurredOn: '2026-08-01' }),
    ];
    const period = { from: '2026-07-01', to: '2026-07-31' };

    const activities = listJobActivities(events, [job], period);

    expect(activities[0].added).toBe(1);
    expect(activities[0].applied).toBe(1);
    expect(activities[0].lastActivity).toBe('2026-07-31');
  });

  test('sorts results by most recent activity first', () => {
    const newer = makeJob({ id: 'newer' });
    const older = makeJob({ id: 'older' });
    const events = [
      makeEvent({ id: 'older-added', jobId: 'older', occurredOn: '2026-07-05' }),
      makeEvent({ id: 'newer-added', jobId: 'newer', occurredOn: '2026-07-20' }),
    ];
    const period = { from: '2026-07-01', to: '2026-07-31' };

    const activities = listJobActivities(events, [newer, older], period);

    expect(activities.map(activity => activity.job.id)).toEqual(['newer', 'older']);
  });

  test('returns an empty list for an invalid or empty period', () => {
    const job = makeJob({ id: 'job-1' });
    const events = [makeEvent({ id: 'added', jobId: 'job-1', occurredOn: '2026-07-10' })];

    expect(listJobActivities(events, [job], { from: '', to: '' })).toEqual([]);
    expect(listJobActivities(events, [job], { from: '2026-07-31', to: '2026-07-01' })).toEqual([]);
  });

  test('does not surface jobs whose only in-period event is a non-counted transition', () => {
    const job = makeJob({ id: 'only-backward' });
    const events = [
      makeEvent({ id: 'backward', jobId: 'only-backward', fromStatus: ApplicationStatus.APPLIED, toStatus: ApplicationStatus.TO_APPLY, occurredOn: '2026-07-10' }),
    ];
    const period = { from: '2026-07-01', to: '2026-07-31' };

    expect(listJobActivities(events, [job], period)).toEqual([]);
  });
});
