import React, { useState } from 'react';
import { ScheduleBlock, Language } from '../types';
import { generateTaskAdvice } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';
import { Briefcase, Zap, Coffee, BookOpen, Share2, Clock, Sparkles, Download, CalendarPlus } from 'lucide-react';

interface ScheduleViewProps {
  schedule: ScheduleBlock[];
  language: Language;
}

const CategoryIcon = ({ category }: { category: string }) => {
  switch (category) {
    case 'Research': return <Briefcase className="w-5 h-5 text-primary dark:text-primary" />;
    case 'Deep Work': return <Zap className="w-5 h-5 text-orange-500 dark:text-orange-400" />;
    case 'Break': return <Coffee className="w-5 h-5 text-green-500 dark:text-green-400" />;
    case 'Learning': return <BookOpen className="w-5 h-5 text-blue-500 dark:text-blue-400" />;
    case 'Network': return <Share2 className="w-5 h-5 text-purple-500 dark:text-purple-400" />;
    default: return <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
  }
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule, language }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [advice, setAdvice] = useState<Record<string, string>>({});
  const t = TRANSLATIONS[language];

  const handleGetAdvice = async (block: ScheduleBlock) => {
    setLoadingId(block.id);
    const result = await generateTaskAdvice(block, language);
    setAdvice(prev => ({ ...prev, [block.id]: result }));
    setLoadingId(null);
  };

  const handleGoogleCalendar = (block: ScheduleBlock) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    const start = `${year}${month}${day}T${block.startTime.replace(':', '')}00`;
    const end = `${year}${month}${day}T${block.endTime.replace(':', '')}00`;
    
    const url = new URL('https://calendar.google.com/calendar/render');
    url.searchParams.append('action', 'TEMPLATE');
    url.searchParams.append('text', `CareerTrack: ${block.title}`);
    url.searchParams.append('details', `${block.description}\n\nCategory: ${t.categories[block.category]}`);
    url.searchParams.append('dates', `${start}/${end}`);
    
    window.open(url.toString(), '_blank');
  };

  const handleExportCalendar = () => {
    let icsContent = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//CareerTrack//Scheduler//${language.toUpperCase()}\n`;
    
    const now = new Date();
    const today = now.toISOString().split('T')[0].replace(/-/g, '');
    
    schedule.forEach(block => {
      const start = `${today}T${block.startTime.replace(':', '')}00`;
      const end = `${today}T${block.endTime.replace(':', '')}00`;
      
      icsContent += "BEGIN:VEVENT\n";
      icsContent += `SUMMARY:CareerTrack: ${block.title}\n`;
      icsContent += `DTSTART:${start}\n`;
      icsContent += `DTEND:${end}\n`;
      icsContent += `DESCRIPTION:${block.description} (${t.categories[block.category]})\n`;
      icsContent += "END:VEVENT\n";
    });
    
    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `career_track_${new Date().toISOString().split('T')[0]}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.schedule.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t.schedule.subtitle}</p>
        </div>
        <button
          onClick={handleExportCalendar}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:border-primary/50 dark:hover:border-primary/50 transition-colors text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          {t.schedule.export}
        </button>
      </div>

      {/* Schedule cards */}
      <div className="space-y-3">
        {schedule.map((block) => (
          <div key={block.id} className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-5 hover:shadow-sm transition-shadow">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                    {block.startTime} - {block.endTime}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                      block.category === 'Break' ? 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300' :
                      block.category === 'Deep Work' ? 'bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300' :
                      'bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/30 text-primary dark:text-primary'
                    }`}>
                    {t.categories[block.category]}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 flex items-center gap-2">
                  <CategoryIcon category={block.category} />
                  {block.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{block.description}</p>

                {advice[block.id] && (
                  <div className="mt-4 p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20 dark:border-primary/30 animate-fadeIn">
                    <h4 className="text-sm font-bold text-primary dark:text-primary mb-2 flex items-center gap-2">
                      <Sparkles className="w-3 h-3" /> {t.schedule.coachAdvice}
                    </h4>
                    <div className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {advice[block.id]}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-row md:flex-col gap-2 shrink-0 md:self-start mt-2 md:mt-0">
                <button
                  onClick={() => handleGoogleCalendar(block)}
                  className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 rounded-md text-sm font-medium hover:text-primary dark:hover:text-primary hover:border-primary/30 dark:hover:border-primary transition-colors w-full md:w-auto"
                  title={t.schedule.addToCal}
                >
                  <CalendarPlus className="w-4 h-4" />
                  <span className="md:hidden lg:inline">{t.schedule.addToCal}</span>
                </button>

                {block.category !== 'Break' && (
                  <button
                    onClick={() => handleGetAdvice(block)}
                    disabled={loadingId === block.id}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-primary dark:bg-primary text-white rounded-md text-sm font-medium hover:bg-blue-700 dark:hover:bg-blue-700 transition-colors disabled:opacity-50 w-full md:w-auto"
                  >
                    {loadingId === block.id ? (
                      <span className="animate-pulse">{t.schedule.thinking}</span>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span className="md:hidden lg:inline">{t.schedule.getFocus}</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};