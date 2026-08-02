import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ApplicationEvent, ApplicationStatus, Grain, JobApplication, Language, PeriodPreset } from '../types';
import { TRANSLATIONS } from '../constants';
import {
  buildActivitySeries,
  bucketLabel,
  computeRejectionDepth,
  findEarliestDataDate,
  listJobActivities,
  listRejectionDepthJobs,
  RejectionDepthBucketKey,
  PeriodRange,
  resolvePeriod,
} from '../lib/analytics';
import { getMillisecondsUntilNextLocalMidnight } from '../lib/date';
import { useTheme } from '../contexts/ThemeContext';
import { AnalyticsJobList, ActivityType } from './AnalyticsJobList';
import { JobModal } from './JobModal';

interface DashboardProps {
  jobs: JobApplication[];
  events: ApplicationEvent[];
  eventsLoading: boolean;
  eventsError: string | null;
  language: Language;
}

const PERIOD_PRESETS: PeriodPreset[] = [
  'this_week',
  'last_4_weeks',
  'last_8_weeks',
  'last_3_months',
  'this_year',
  'all_time',
  'custom',
];

const GRAINS: Grain[] = ['day', 'week', 'month'];

const getInitialCustomRange = (): PeriodRange => resolvePeriod('last_8_weeks', null, new Date());

interface ActivityTotals {
  added: number;
  applied: number;
  rejected: number;
  interviews: number;
}

export const Dashboard: React.FC<DashboardProps> = ({
  jobs,
  events,
  eventsLoading,
  eventsError,
  language,
}) => {
  const t = TRANSLATIONS[language];
  const { theme } = useTheme();
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('last_8_weeks');
  const [grain, setGrain] = useState<Grain>('week');
  const [customRange, setCustomRange] = useState<PeriodRange>(getInitialCustomRange);
  const [today, setToday] = useState(() => new Date());
  const [activityFilter, setActivityFilter] = useState<ActivityType | null>(null);
  const [rejectionDepthFilter, setRejectionDepthFilter] = useState<RejectionDepthBucketKey | null>(null);
  const [viewingJob, setViewingJob] = useState<JobApplication | null>(null);

  useEffect(() => {
    const now = new Date();
    const timeout = window.setTimeout(
      () => setToday(new Date()),
      getMillisecondsUntilNextLocalMidnight(now)
    );

    return () => window.clearTimeout(timeout);
  }, [today]);

  // Data for Funnel Chart
  const funnelData = Object.values(ApplicationStatus).map(status => ({
    name: t.board.status[status],
    count: jobs.filter(j => j.status === status).length,
  })).filter(d => d.count > 0);

  const earliestDataDate = useMemo(
    () => findEarliestDataDate(events, jobs),
    [events, jobs]
  );
  const selectedPeriod = useMemo(
    () => resolvePeriod(
      periodPreset,
      periodPreset === 'custom' ? customRange : null,
      today,
      earliestDataDate
    ),
    [periodPreset, customRange, today, earliestDataDate]
  );
  const customRangeIsInvalid = periodPreset === 'custom' && (
    !customRange.from ||
    !customRange.to ||
    customRange.from > customRange.to
  );
  const analyticsPeriod = customRangeIsInvalid
    ? { from: '', to: '' }
    : selectedPeriod;

  const activitySeries = useMemo(
    () => buildActivitySeries(events, jobs, analyticsPeriod, grain),
    [events, jobs, analyticsPeriod.from, analyticsPeriod.to, grain]
  );
  const chartData = useMemo(
    () => activitySeries.map(bucket => ({
      ...bucket,
      label: bucketLabel(bucket.bucket, grain, language),
    })),
    [activitySeries, grain, language]
  );
  const activityTotals = useMemo<ActivityTotals>(() => activitySeries.reduce<ActivityTotals>((totals, bucket) => ({
    added: totals.added + bucket.added,
    applied: totals.applied + bucket.applied,
    rejected: totals.rejected + bucket.rejected,
    interviews: totals.interviews + bucket.interviews,
  }), { added: 0, applied: 0, rejected: 0, interviews: 0 }), [activitySeries]);
  const rejectionDepth = useMemo(
    () => computeRejectionDepth(events, jobs, analyticsPeriod),
    [events, jobs, analyticsPeriod.from, analyticsPeriod.to]
  );
  const rejectionTotal = rejectionDepth.zero + rejectionDepth.one + rejectionDepth.two + rejectionDepth.threePlus;
  const jobActivities = useMemo(
    () => listJobActivities(events, jobs, analyticsPeriod),
    [events, jobs, analyticsPeriod.from, analyticsPeriod.to]
  );
  const filteredRejectionJobs = useMemo(
    () => rejectionDepthFilter
      ? listRejectionDepthJobs(events, jobs, analyticsPeriod, rejectionDepthFilter)
      : [],
    [events, jobs, analyticsPeriod.from, analyticsPeriod.to, rejectionDepthFilter]
  );
  const chartTextColor = theme === 'dark' ? '#94a3b8' : '#6b7280';
  const chartGridColor = theme === 'dark' ? '#334155' : '#e5e7eb';
  const chartTooltipStyle = {
    borderRadius: '8px',
    border: `1px solid ${theme === 'dark' ? '#475569' : '#e5e7eb'}`,
    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
    color: theme === 'dark' ? '#f8fafc' : '#111827',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  // Recent activity feed
  const recentActivity = useMemo(() => {
    const recentEvents: { id: string; description: string; date: string; type: string }[] = [];

    jobs.forEach(job => {
      recentEvents.push({
        id: `job-${job.id}`,
        description: `${job.position} at ${job.company}`,
        date: job.dateAdded,
        type: 'job_added',
      });

      if (job.interviewRounds) {
        job.interviewRounds.forEach(round => {
          recentEvents.push({
            id: `interview-${round.id}`,
            description: `${round.roundName} - ${job.company}`,
            date: round.interviewDate,
            type: round.status === 'completed' ? 'interview_completed' : 'interview_scheduled',
          });
        });
      }
    });

    return recentEvents.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [jobs]);

  const periodPresetLabels: Record<PeriodPreset, string> = {
    this_week: t.dashboard.periodPresets.thisWeek,
    last_4_weeks: t.dashboard.periodPresets.last4Weeks,
    last_8_weeks: t.dashboard.periodPresets.last8Weeks,
    last_3_months: t.dashboard.periodPresets.last3Months,
    this_year: t.dashboard.periodPresets.thisYear,
    all_time: t.dashboard.periodPresets.allTime,
    custom: t.dashboard.periodPresets.custom,
  };
  const grainLabels: Record<Grain, string> = {
    day: t.dashboard.day,
    week: t.dashboard.week,
    month: t.dashboard.month,
  };

  const updateCustomRange = (part: keyof PeriodRange, value: string) => {
    setCustomRange(previous => ({ ...previous, [part]: value }));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.dashboard.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-gray-200 dark:border-slate-700 h-[280px] md:h-[350px] transition-colors">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 md:mb-6">{t.dashboard.funnel}</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 11, fill: '#6b7280'}} className="dark:fill-gray-400" />
              <Tooltip
                cursor={{fill: 'transparent'}}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="count" fill="#135bec" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <section
          className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-gray-200 dark:border-slate-700 min-h-[350px] transition-colors"
          aria-labelledby="activity-title"
        >
          <div className="flex flex-col gap-4" data-testid="analytics-controls">
            <div className="flex flex-col xl:flex-row xl:items-end gap-3">
              <label className="flex-1 min-w-0">
                <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">{t.dashboard.period}</span>
                <select
                  aria-label={t.dashboard.period}
                  data-testid="analytics-period"
                  value={periodPreset}
                  onChange={event => setPeriodPreset(event.target.value as PeriodPreset)}
                  className="w-full p-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none"
                >
                  {PERIOD_PRESETS.map(preset => (
                    <option key={preset} value={preset}>{periodPresetLabels[preset]}</option>
                  ))}
                </select>
              </label>

              {periodPreset === 'custom' && (
                <div className="grid grid-cols-2 gap-2 flex-1">
                  <label>
                    <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.dashboard.from}</span>
                    <input
                      aria-label={t.dashboard.from}
                      type="date"
                      value={customRange.from}
                      onChange={event => updateCustomRange('from', event.target.value)}
                      className="w-full p-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none"
                    />
                  </label>
                  <label>
                    <span className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.dashboard.to}</span>
                    <input
                      aria-label={t.dashboard.to}
                      type="date"
                      value={customRange.to}
                      onChange={event => updateCustomRange('to', event.target.value)}
                      className="w-full p-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent outline-none"
                    />
                  </label>
                </div>
              )}

              <div role="group" aria-label={t.dashboard.grain} className="flex rounded-lg border border-gray-200 dark:border-slate-600 p-1 self-start xl:self-end">
                {GRAINS.map(option => (
                  <button
                    key={option}
                    type="button"
                    data-testid={`analytics-grain-${option}`}
                    aria-pressed={grain === option}
                    onClick={() => setGrain(option)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${grain === option
                      ? 'bg-primary text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                  >
                    {grainLabels[option]}
                  </button>
                ))}
              </div>
            </div>

            {customRangeIsInvalid && (
              <p className="text-sm text-red-500 dark:text-red-400" role="alert">{t.dashboard.invalidDateRange}</p>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">{t.dashboard.periodTotals}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" aria-label={t.dashboard.periodTotals}>
                {([
                  { key: 'added', label: t.dashboard.added, value: activityTotals.added, color: 'text-blue-600 dark:text-blue-400' },
                  { key: 'applied', label: t.dashboard.applied, value: activityTotals.applied, color: 'text-indigo-600 dark:text-indigo-400' },
                  { key: 'rejected', label: t.dashboard.rejected, value: activityTotals.rejected, color: 'text-red-600 dark:text-red-400' },
                  { key: 'interviews', label: t.dashboard.interviewsSeries, value: activityTotals.interviews, color: 'text-purple-600 dark:text-purple-400' },
                ] as { key: ActivityType; label: string; value: number; color: string }[]).map(total => {
                  const isActive = activityFilter === total.key;
                  return (
                    <button
                      key={total.key}
                      type="button"
                      data-testid={`analytics-total-${total.key}`}
                      aria-pressed={isActive}
                      onClick={() => setActivityFilter(isActive ? null : total.key)}
                      className={`rounded-lg border px-3 py-2 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                        isActive
                          ? 'border-primary dark:border-primary bg-primary/10 dark:bg-primary/20 ring-1 ring-primary'
                          : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40 hover:bg-gray-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{total.label}</p>
                      <p className={`text-xl font-bold ${total.color}`}>{total.value}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-gray-100 dark:border-slate-700 pt-4">
            <h3 id="activity-title" className="text-lg font-bold text-gray-800 dark:text-white">{t.dashboard.analyticsTitle}</h3>
            {eventsLoading && (
              <div className="h-[245px] flex items-center justify-center text-sm text-gray-400 dark:text-gray-500" role="status">
                {t.dashboard.loadingAnalytics}
              </div>
            )}
            {!eventsLoading && eventsError && (
              <div className="mt-3 text-sm text-red-500 dark:text-red-400" role="alert">{t.dashboard.analyticsError}</div>
            )}
            {!eventsLoading && (
              <>
                <div
                  className="h-[245px] mt-2"
                  data-testid="activity-chart"
                  data-added-count={activityTotals.added}
                  data-applied-count={activityTotals.applied}
                  data-rejected-count={activityTotals.rejected}
                  data-interviews-count={activityTotals.interviews}
                  role="img"
                  aria-label={`${t.dashboard.analyticsTitle}: ${activityTotals.added} ${t.dashboard.added}, ${activityTotals.applied} ${t.dashboard.applied}, ${activityTotals.rejected} ${t.dashboard.rejected}, ${activityTotals.interviews} ${t.dashboard.interviewsSeries}`}
                >
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 8, right: 10, left: -15, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: chartTextColor }} interval="preserveStartEnd" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: chartTextColor }} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Legend wrapperStyle={{ color: chartTextColor, fontSize: '12px' }} />
                        <Bar dataKey="added" name={t.dashboard.added} fill="#135bec" radius={[4, 4, 0, 0]} maxBarSize={18} />
                        <Bar dataKey="applied" name={t.dashboard.applied} fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={18} />
                        <Bar dataKey="rejected" name={t.dashboard.rejected} fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={18} />
                        <Bar dataKey="interviews" name={t.dashboard.interviewsSeries} fill="#a855f7" radius={[4, 4, 0, 0]} maxBarSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                      {t.dashboard.noApplicationDataInPeriod}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {activityFilter && (
            <div className="mt-5 border-t border-gray-100 dark:border-slate-700 pt-4" data-testid="analytics-jobs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{t.dashboard.jobsInPeriod}</h4>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {jobActivities.filter(item => item[activityFilter] > 0).length}
                </span>
              </div>
              <AnalyticsJobList
                items={jobActivities}
                activeFilter={activityFilter}
                onSelectJob={setViewingJob}
                language={language}
              />
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-gray-200 dark:border-slate-700 min-h-[220px] transition-colors" data-testid="rejection-depth">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t.dashboard.rejectionDepth}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { key: 'zero', label: t.dashboard.zeroRounds, value: rejectionDepth.zero, color: 'text-slate-600 dark:text-slate-300' },
              { key: 'one', label: t.dashboard.oneRound, value: rejectionDepth.one, color: 'text-indigo-600 dark:text-indigo-400' },
              { key: 'two', label: t.dashboard.twoRounds, value: rejectionDepth.two, color: 'text-purple-600 dark:text-purple-400' },
              { key: 'threePlus', label: t.dashboard.threePlusRounds, value: rejectionDepth.threePlus, color: 'text-red-600 dark:text-red-400' },
            ].map(bucket => {
              const key = bucket.key as RejectionDepthBucketKey;
              const isActive = rejectionDepthFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  data-testid={`rejection-depth-total-${key}`}
                  aria-pressed={isActive}
                  onClick={() => setRejectionDepthFilter(isActive ? null : key)}
                  className={`rounded-lg border p-3 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${
                    isActive
                      ? 'border-primary dark:border-primary bg-primary/10 dark:bg-primary/20 ring-1 ring-primary'
                      : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/40 hover:bg-gray-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <p className="text-xs text-gray-500 dark:text-gray-400">{bucket.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${bucket.color}`}>{bucket.value}</p>
                </button>
              );
            })}
          </div>
          {rejectionTotal === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-4" data-testid="rejection-depth-empty">
              {t.dashboard.noRejectionsInPeriod}
            </p>
          )}

          {rejectionDepthFilter && (
            <div className="mt-5 border-t border-gray-100 dark:border-slate-700 pt-4" data-testid="rejection-depth-jobs">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {t.dashboard.jobsInPeriod}
                </h4>
                <span className="text-xs text-gray-400 dark:text-gray-500">{filteredRejectionJobs.length}</span>
              </div>
              {filteredRejectionJobs.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500" data-testid="rejection-depth-jobs-empty">
                  {t.dashboard.noApplicationDataInPeriod}
                </p>
              ) : (
                <ul className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar" data-testid="rejection-depth-job-list">
                  {filteredRejectionJobs.map(item => (
                    <li key={`${item.job.id}-${item.rejectionDate}`}>
                      <button
                        type="button"
                        data-testid="rejection-depth-job-row"
                        onClick={() => setViewingJob(item.job)}
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
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                          {item.rejectionDate}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t.dashboard.recentActivity}</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-gray-500">{t.dashboard.noActivity}</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map(event => (
                <div key={event.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    event.type === 'job_added' ? 'bg-blue-500' :
                      event.type === 'interview_scheduled' ? 'bg-purple-500' :
                        'bg-green-500'
                    }`} />
                  <p className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{event.description}</p>
                  <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{event.date}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {viewingJob && (
        <JobModal
          key={viewingJob.id}
          initialData={viewingJob}
          language={language}
          mode="view"
          onSave={() => {}}
          onCancel={() => setViewingJob(null)}
        />
      )}
    </div>
  );
};
