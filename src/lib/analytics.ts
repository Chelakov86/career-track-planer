import {
  ApplicationEvent,
  ApplicationStatus,
  Grain,
  InterviewRound,
  JobApplication,
  Language,
  PeriodPreset,
} from '../types';
import { formatLocalDate } from './date';

export interface PeriodRange {
  from: string;
  to: string;
}

export interface ActivityBucket {
  bucket: string;
  added: number;
  applied: number;
  rejected: number;
  interviews: number;
}

export interface RejectionDepth {
  zero: number;
  one: number;
  two: number;
  threePlus: number;
}

const parseLocalDate = (dateString: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return null;

  const [, yearString, monthString, dayString] = match;
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const startOfIsoWeek = (date: Date): Date => {
  const start = new Date(date.getTime());
  start.setHours(0, 0, 0, 0);
  const dayOfWeek = start.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
};

const startOfMonth = (date: Date): Date => {
  const start = new Date(date.getTime());
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start;
};

const startOfToday = (today: Date): Date => {
  if (Number.isNaN(today.getTime())) {
    const fallback = new Date();
    fallback.setHours(0, 0, 0, 0);
    return fallback;
  }

  const result = new Date(today.getTime());
  result.setHours(0, 0, 0, 0);
  return result;
};

const isValidDateString = (dateString: string): boolean => parseLocalDate(dateString) !== null;

const formatDate = (date: Date): string => formatLocalDate(date);

const isInPeriod = (dateString: string, period: PeriodRange): boolean => {
  return (
    isValidDateString(dateString) &&
    isValidDateString(period.from) &&
    isValidDateString(period.to) &&
    period.from <= period.to &&
    dateString >= period.from &&
    dateString <= period.to
  );
};

const getEarliestDate = (dates: string[]): string | null => {
  const validDates = dates.filter(isValidDateString).sort();
  return validDates[0] || null;
};

/**
 * Resolve the inclusive local-date range used by an analytics view.
 * The optional earliest date is supplied by the caller for the All Time preset.
 */
export const resolvePeriod = (
  preset: PeriodPreset,
  custom: PeriodRange | null,
  today: Date,
  earliestDate?: string | null
): PeriodRange => {
  const todayDate = startOfToday(today);
  const todayString = formatDate(todayDate);

  switch (preset) {
    case 'this_week':
      return { from: formatDate(startOfIsoWeek(todayDate)), to: todayString };
    case 'last_4_weeks': {
      const from = startOfIsoWeek(todayDate);
      from.setDate(from.getDate() - 21);
      return { from: formatDate(from), to: todayString };
    }
    case 'last_8_weeks': {
      const from = startOfIsoWeek(todayDate);
      from.setDate(from.getDate() - 49);
      return { from: formatDate(from), to: todayString };
    }
    case 'last_3_months': {
      const from = startOfMonth(todayDate);
      from.setMonth(from.getMonth() - 2);
      return { from: formatDate(from), to: todayString };
    }
    case 'this_year':
      return { from: `${todayDate.getFullYear()}-01-01`, to: todayString };
    case 'all_time': {
      const earliest = earliestDate && isValidDateString(earliestDate)
        ? earliestDate
        : todayString;
      return { from: earliest <= todayString ? earliest : todayString, to: todayString };
    }
    case 'custom':
      if (
        custom &&
        isValidDateString(custom.from) &&
        isValidDateString(custom.to) &&
        custom.from <= custom.to
      ) {
        return { from: custom.from, to: custom.to };
      }
      return { from: todayString, to: todayString };
  }
};

export const bucketKey = (dateString: string, grain: Grain): string => {
  const date = parseLocalDate(dateString);
  if (!date) return '';

  if (grain === 'day') return formatDate(date);
  if (grain === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  return formatDate(startOfIsoWeek(date));
};

export const bucketLabel = (key: string, grain: Grain, language: Language): string => {
  const date = grain === 'month'
    ? parseLocalDate(`${key}-01`)
    : parseLocalDate(key);

  if (!date) return key;

  return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', grain === 'month'
    ? { month: 'short', year: 'numeric' }
    : { month: 'short', day: 'numeric' });
};

export const listBuckets = (period: PeriodRange, grain: Grain): string[] => {
  const from = parseLocalDate(period.from);
  const to = parseLocalDate(period.to);
  if (!from || !to || period.from > period.to) return [];

  const cursor = grain === 'week'
    ? startOfIsoWeek(from)
    : grain === 'month'
      ? startOfMonth(from)
      : from;
  const lastBucket = grain === 'week'
    ? startOfIsoWeek(to)
    : grain === 'month'
      ? startOfMonth(to)
      : to;
  const buckets: string[] = [];

  while (cursor <= lastBucket) {
    buckets.push(bucketKey(formatDate(cursor), grain));
    if (grain === 'week') {
      cursor.setDate(cursor.getDate() + 7);
    } else if (grain === 'month') {
      cursor.setMonth(cursor.getMonth() + 1);
    } else {
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  return buckets;
};

const emptyActivityBucket = (bucket: string): ActivityBucket => ({
  bucket,
  added: 0,
  applied: 0,
  rejected: 0,
  interviews: 0,
});

const countInterviewRounds = (rounds: InterviewRound[] | undefined, period: PeriodRange, series: Map<string, ActivityBucket>, grain: Grain) => {
  rounds?.forEach(round => {
    if (!isInPeriod(round.interviewDate, period)) return;
    const bucket = series.get(bucketKey(round.interviewDate, grain));
    if (bucket) bucket.interviews += 1;
  });
};

export const buildActivitySeries = (
  events: ApplicationEvent[],
  jobs: JobApplication[],
  period: PeriodRange,
  grain: Grain
): ActivityBucket[] => {
  const series = new Map(listBuckets(period, grain).map(bucket => [bucket, emptyActivityBucket(bucket)]));

  events.forEach(event => {
    if (!isInPeriod(event.occurredOn, period)) return;
    const bucket = series.get(bucketKey(event.occurredOn, grain));
    if (!bucket) return;

    if (event.fromStatus === null) bucket.added += 1;
    if (event.toStatus === ApplicationStatus.APPLIED) bucket.applied += 1;
    if (event.toStatus === ApplicationStatus.REJECTED) bucket.rejected += 1;
  });

  jobs.forEach(job => countInterviewRounds(job.interviewRounds, period, series, grain));

  return [...series.values()];
};

export const computeRejectionDepth = (
  events: ApplicationEvent[],
  jobs: JobApplication[],
  period: PeriodRange
): RejectionDepth => {
  const jobsById = new Map(jobs.map(job => [job.id, job]));
  const depth: RejectionDepth = { zero: 0, one: 0, two: 0, threePlus: 0 };

  events.forEach(event => {
    if (event.toStatus !== ApplicationStatus.REJECTED || !isInPeriod(event.occurredOn, period)) return;

    const roundsReached = jobsById.get(event.jobId)?.interviewRounds?.filter(round => {
      return isValidDateString(round.interviewDate) && round.interviewDate <= event.occurredOn;
    }).length || 0;

    if (roundsReached === 0) depth.zero += 1;
    else if (roundsReached === 1) depth.one += 1;
    else if (roundsReached === 2) depth.two += 1;
    else depth.threePlus += 1;
  });

  return depth;
};

export const findEarliestDataDate = (
  events: ApplicationEvent[],
  jobs: JobApplication[]
): string | null => {
  const eventDates = events.map(event => event.occurredOn);
  const roundDates = jobs.flatMap(job => job.interviewRounds?.map(round => round.interviewDate) || []);
  return getEarliestDate([...eventDates, ...roundDates]);
};
