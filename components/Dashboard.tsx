import React from 'react';
import { JobApplication, ApplicationStatus, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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

  // Data for Role Split
  const pmCount = jobs.filter(j => j.roleType === 'PM').length;
  const qaCount = jobs.filter(j => j.roleType === 'QA').length;
  const roleData = [
    { name: 'PM', value: pmCount },
    { name: 'QA', value: qaCount }
  ];
  const ROLE_COLORS = ['#6366f1', '#a855f7'];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{t.dashboard.total}</p>
            <h3 className="text-2xl font-bold text-gray-800">{totalApps}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-green-50 rounded-lg text-green-600">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{t.dashboard.active}</p>
            <h3 className="text-2xl font-bold text-gray-800">{active}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="p-3 bg-purple-50 rounded-lg text-purple-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">{t.dashboard.interviews}</p>
            <h3 className="text-2xl font-bold text-gray-800">{interviews}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[350px]">
          <h3 className="text-lg font-bold text-gray-800 mb-6">{t.dashboard.funnel}</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12}} />
              <Tooltip cursor={{fill: 'transparent'}} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-[350px]">
          <h3 className="text-lg font-bold text-gray-800 mb-6">{t.dashboard.distribution}</h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 text-sm text-gray-600 mt-[-20px]">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-indigo-500"></div> PM
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div> QA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};