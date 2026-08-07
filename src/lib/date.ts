import type { Language } from '../types';

export const formatLocalDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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

export const getMillisecondsUntilNextLocalMidnight = (date: Date = new Date()): number => {
  const nextMidnight = new Date(date);
  nextMidnight.setHours(24, 0, 0, 0);
  return nextMidnight.getTime() - date.getTime();
};
