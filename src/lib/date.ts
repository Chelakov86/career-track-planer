import type { Language } from '../types';
import { RELATIVE_TIME_LABELS } from '../constants';

export const formatLocalDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const formatLocalizedDateOnly = (
  dateOnly: string | null | undefined,
  language: Language
): string | null => {
  if (!dateOnly) return null;

  const date = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

export const formatLocalizedDateTime = (
  timestamp: string | null | undefined,
  language: Language
): string | null => {
  if (!timestamp) return null;

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(language === 'de' ? 'de-DE' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatUpdatedAt = (
  updatedAt: string | null | undefined,
  fallbackDate: string,
  language: Language
): string => {
  return formatLocalizedDateTime(updatedAt, language)
    || formatLocalizedDateOnly(fallbackDate, language)
    || fallbackDate;
};

export const getLastUpdatedTimestamp = (
  updatedAt: string | null | undefined,
  fallbackDate: string
): number => {
  if (updatedAt) {
    const preciseTimestamp = Date.parse(updatedAt);
    if (!Number.isNaN(preciseTimestamp)) return preciseTimestamp;
  }

  const fallbackTimestamp = Date.parse(`${fallbackDate}T00:00:00`);
  return Number.isNaN(fallbackTimestamp) ? 0 : fallbackTimestamp;
};

export const formatRelativeTime = (
  updatedAt: string | null | undefined,
  fallbackDate: string,
  language: Language,
  now: Date = new Date()
): string => {
  const updatedDate = updatedAt ? new Date(updatedAt) : null;
  if (!updatedDate || Number.isNaN(updatedDate.getTime())) {
    return formatLocalizedDateOnly(fallbackDate, language) || fallbackDate;
  }

  const labels = RELATIVE_TIME_LABELS[language];
  const elapsedMilliseconds = Math.max(0, now.getTime() - updatedDate.getTime());
  const elapsedMinutes = Math.floor(elapsedMilliseconds / (60 * 1000));

  if (elapsedMinutes < 1) return labels.justNow;
  if (elapsedMinutes < 60) return labels.minutes(elapsedMinutes);

  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfUpdatedDay = new Date(updatedDate);
  startOfUpdatedDay.setHours(0, 0, 0, 0);
  const calendarDays = Math.floor(
    (startOfToday.getTime() - startOfUpdatedDay.getTime()) / (24 * 60 * 60 * 1000)
  );

  if (calendarDays === 0 && elapsedHours < 24) return labels.hours(elapsedHours);
  if (calendarDays === 1) return labels.yesterday;

  return formatLocalizedDateOnly(formatLocalDate(updatedDate), language) || fallbackDate;
};

export const getMillisecondsUntilNextLocalMidnight = (date: Date = new Date()): number => {
  const nextMidnight = new Date(date);
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.getTime() - date.getTime();
};
