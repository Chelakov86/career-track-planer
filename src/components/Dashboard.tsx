import React, { useMemo } from 'react';
import { ApplicationEvent, JobApplication, ApplicationStatus, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { buildRecentAddedEventSeries } from '../lib/analytics';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Target, TrendingUp } from 'lucide-react';

interface DashboardProps {
  jobs: JobApplication[];
  events: ApplicationEvent[];
  eventsLoading: boolean;
  eventsError: string | null;
  language: Language;
}

const formatWeekLabel = (bucket: string, language: Language) => {
  const [year, month, day] = bucket.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const Dashboard: React.FC<DashboardProps> = ({
  jobs,
  events,
  eventsLoading,
  eventsError,
  language,
}) => {
  const t = TRANSLATIONS[language];

  // Compute stats
  const totalApps = jobs.length;
  const interviews = jobs.filter(j => j.status === ApplicationStatus.INTERVIEW).length;
  const active = jobs.filter(j => [ApplicationStatus.TO_APPLY, ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW].includes(j.status)).length;

  const thisWeekCount = jobs.filter(j => {
    const added = new Date(j.dateAdded);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return added >= weekAgo;
  }).length;

  // Data for Funnel Chart
  const funnelData = Object.values(ApplicationStatus).map(status => ({
    name: t.board.status[status],
    count: jobs.filter(j => j.status === status).length
  })).filter(d => d.count > 0);

  const addedEventSeries = useMemo(() => (
    buildRecentAddedEventSeries(events).map(bucket => ({
      week: formatWeekLabel(bucket.bucket, language),
      added: bucket.added,
    }))
  ), [events, language]);
  const addedEventCount = addedEventSeries.reduce((total, bucket) => total + bucket.added, 0);

  // Recent activity feed
  const recentActivity = useMemo(() => {
    const recentEvents: { id: string; description: string; date: string; type: string }[] = [];

    jobs.forEach(job => {
      recentEvents.push({
        id: `job-${job.id}`,
        description: `${job.position} at ${job.company}`,
        date: job.dateAdded,
        type: 'job_added'
      });

      if (job.interviewRounds) {
        job.interviewRounds.forEach(round => {
          recentEvents.push({
            id: `interview-${round.id}`,
            description: `${round.roundName} - ${job.company}`,
            date: round.interviewDate,
            type: round.status === 'completed' ? 'interview_completed' : 'interview_scheduled'
          });
        });
      }
    });

    return recentEvents.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  }, [jobs]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.dashboard.title}</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{t.dashboard.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center gap-4 transition-colors">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t.dashboard.total}</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{totalApps}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{thisWeekCount} {t.dashboard.thisWeek}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center gap-4 transition-colors">
          <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t.dashboard.active}</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{active}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{thisWeekCount} {t.dashboard.thisWeek}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-gray-200 dark:border-slate-700 flex items-center gap-4 transition-colors">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t.dashboard.interviews}</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{interviews}</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{thisWeekCount} {t.dashboard.thisWeek}</p>
          </div>
        </div>
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

        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-gray-200 dark:border-slate-700 min-h-[280px] md:min-h-[350px] transition-colors">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">{t.dashboard.applicationsAddedOverTime}</h3>
          {eventsLoading ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400 dark:text-gray-500" role="status">
              {t.dashboard.loadingAnalytics}
            </div>
          ) : eventsError ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-red-500 dark:text-red-400" role="alert">
              {t.dashboard.analyticsError}
            </div>
          ) : events.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              {t.dashboard.noApplicationEvents}
            </div>
          ) : (
            <div
              className="h-[220px]"
              data-testid="added-event-chart"
              data-added-count={addedEventCount}
              role="img"
              aria-label={`${t.dashboard.applicationsAddedOverTime}: ${addedEventCount} ${t.dashboard.added}`}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={addedEventSeries} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Bar dataKey="added" name={t.dashboard.added} fill="#135bec" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div />
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
    </div>
  );
};
