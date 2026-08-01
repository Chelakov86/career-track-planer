import React from 'react';
import { JobActivity } from '../lib/analytics';
import { JobApplication, Language } from '../types';
import { TRANSLATIONS } from '../constants';

export type ActivityType = 'added' | 'applied' | 'rejected' | 'interviews';

interface AnalyticsJobListProps {
  items: JobActivity[];
  activeFilter: ActivityType | null;
  onSelectJob: (job: JobApplication) => void;
  language: Language;
}

interface BadgeStyle {
  label: string;
  classes: string;
}

export const AnalyticsJobList: React.FC<AnalyticsJobListProps> = ({
  items,
  activeFilter,
  onSelectJob,
  language,
}) => {
  const t = TRANSLATIONS[language];

  const badgeStyles: Record<ActivityType, BadgeStyle> = {
    added: { label: t.dashboard.added, classes: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
    applied: { label: t.dashboard.applied, classes: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' },
    rejected: { label: t.dashboard.rejected, classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
    interviews: { label: t.dashboard.interviewsSeries, classes: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  };

  const visibleItems = activeFilter
    ? items.filter(item => item[activeFilter] > 0)
    : items;

  if (visibleItems.length === 0) {
    return (
      <p
        className="text-sm text-gray-400 dark:text-gray-500"
        data-testid="analytics-job-list-empty"
      >
        {t.dashboard.noApplicationDataInPeriod}
      </p>
    );
  }

  return (
    <ul className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar" data-testid="analytics-job-list">
      {visibleItems.map(item => {
        const allBadges: { type: ActivityType; count: number }[] = [
          { type: 'added', count: item.added },
          { type: 'applied', count: item.applied },
          { type: 'rejected', count: item.rejected },
          { type: 'interviews', count: item.interviews },
        ];
        const badges = allBadges.filter(badge => badge.count > 0);

        return (
          <li key={item.job.id}>
            <button
              type="button"
              data-testid="analytics-job-row"
              onClick={() => onSelectJob(item.job)}
              className="w-full flex items-center gap-3 text-left p-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40 hover:border-primary/40 dark:hover:border-primary/40 hover:bg-white dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {item.job.position}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {item.job.company}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1 justify-end">
                {badges.map(badge => (
                  <span
                    key={badge.type}
                    data-testid={`analytics-badge-${badge.type}`}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${badgeStyles[badge.type].classes}`}
                  >
                    {badgeStyles[badge.type].label}{badge.count > 1 ? ` ×${badge.count}` : ''}
                  </span>
                ))}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                {item.lastActivity}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
};
