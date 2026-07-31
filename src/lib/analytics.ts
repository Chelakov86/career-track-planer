import { ApplicationEvent } from '../types';
import { formatLocalDate } from './date';

export interface AddedApplicationEventBucket {
  bucket: string;
  added: number;
}

const DEFAULT_WEEK_COUNT = 8;

const parseLocalDate = (dateString: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);
  if (!match) return null;

  const [, yearString, monthString, dayString] = match;
  const year = Number(yearString);
  const month = Number(monthString);
  const day = Number(dayString);
  const date = new Date(year, month - 1, day);

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
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayOfWeek = start.getDay();
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
};

export const buildRecentAddedEventSeries = (
  events: ApplicationEvent[],
  today: Date = new Date(),
  weekCount: number = DEFAULT_WEEK_COUNT
): AddedApplicationEventBucket[] => {
  if (!Number.isInteger(weekCount) || weekCount < 1) {
    return [];
  }

  const currentWeek = startOfIsoWeek(today);
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const firstWeek = new Date(currentWeek);
  firstWeek.setDate(firstWeek.getDate() - (weekCount - 1) * 7);

  const buckets = Array.from({ length: weekCount }, (_, index) => {
    const bucketDate = new Date(firstWeek);
    bucketDate.setDate(bucketDate.getDate() + index * 7);
    return {
      bucket: formatLocalDate(bucketDate),
      added: 0,
    };
  });

  const bucketIndexByKey = new Map(buckets.map((bucket, index) => [bucket.bucket, index]));

  events.forEach(event => {
    if (event.fromStatus !== null) return;

    const occurredOn = parseLocalDate(event.occurredOn);
    if (!occurredOn) return;
    if (occurredOn > todayDate) return;

    const bucketKey = formatLocalDate(startOfIsoWeek(occurredOn));
    const bucketIndex = bucketIndexByKey.get(bucketKey);
    if (bucketIndex !== undefined) {
      buckets[bucketIndex].added += 1;
    }
  });

  return buckets;
};
