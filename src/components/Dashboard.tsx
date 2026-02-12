import React from 'react';
import { JobApplication, ApplicationStatus, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Target, TrendingUp } from 'lucide-react';

interface DashboardProps {
  jobs: JobApplication[];
  language: Language;
}

export const Dashboard: React.FC<DashboardProps> = ({ jobs, language }) => {
  const t = TRANSLATIONS[language];
  
  // Compute stats
  const totalApps = jobs.length;
  const interviews = jobs.filter(j => j.status === ApplicationStatus.INTERVIEW).length;
  const active = jobs.filter(j => [ApplicationStatus.TO_APPLY, ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEW].includes(j.status)).length;
  
  // Data for Funnel Chart
  const funnelData = Object.values(ApplicationStatus).map(status => ({
    name: t.board.status[status],
    count: jobs.filter(j => j.status === status).length
  })).filter(d => d.count > 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 transition-colors">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t.dashboard.total}</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{totalApps}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 transition-colors">
          <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t.dashboard.active}</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{active}</h3>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4 transition-colors">
          <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{t.dashboard.interviews}</p>
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{interviews}</h3>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 h-[280px] md:h-[350px] transition-colors">
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
            <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};