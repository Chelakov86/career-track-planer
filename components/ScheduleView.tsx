import React, { useState } from 'react';
import { ScheduleBlock, RoleFocus, Language } from '../types';
import { generateTaskAdvice } from '../services/geminiService';
import { TRANSLATIONS } from '../constants';
import { Calendar, Clock, Briefcase, Zap, Coffee, BookOpen, Share2, Sparkles, Download, CalendarPlus } from 'lucide-react';

interface ScheduleViewProps {
  schedule: ScheduleBlock[];
  userFocus: RoleFocus;
  language: Language;
}

const CategoryIcon = ({ category }: { category: string }) => {
  // Map category to icon regardless of language logic (assuming categories in blocks are keys)
  switch (category) {
    case 'Research': return <Briefcase className="w-5 h-5 text-indigo-500" />;
    case 'Deep Work': return <Zap className="w-5 h-5 text-orange-500" />;
    case 'Break': return <Coffee className="w-5 h-5 text-green-500" />;
    case 'Learning': return <BookOpen className="w-5 h-5 text-blue-500" />;
    case 'Network': return <Share2 className="w-5 h-5 text-purple-500" />;
    default: return <Clock className="w-5 h-5 text-gray-500" />;
  }
};

export const ScheduleView: React.FC<ScheduleViewProps> = ({ schedule, userFocus, language }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [advice, setAdvice] = useState<Record<string, string>>({});
  const t = TRANSLATIONS[language];

  const handleGetAdvice = async (block: ScheduleBlock) => {
    setLoadingId(block.id);
    const result = await generateTaskAdvice(block, userFocus, language);
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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-600" />
            {t.schedule.title}
          </h2>
          <p className="text-gray-500 mt-1">{t.schedule.subtitle}</p>
        </div>
        <button 
          onClick={handleExportCalendar}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          {t.schedule.export}
        </button>
      </div>

      <div className="relative border-l-2 border-indigo-100 ml-3 sm:ml-6 space-y-8 pb-8">
        {schedule.map((block) => (
          <div key={block.id} className="relative pl-6 sm:pl-8">
            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 border-indigo-500 box-content"></div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow group">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded font-mono">
                      {block.startTime} - {block.endTime}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${
                        block.category === 'Break' ? 'bg-green-50 border-green-200 text-green-700' :
                        block.category === 'Deep Work' ? 'bg-orange-50 border-orange-200 text-orange-700' :
                        'bg-indigo-50 border-indigo-200 text-indigo-700'
                      }`}>
                      {t.categories[block.category]}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2">
                    <CategoryIcon category={block.category} />
                    {block.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{block.description}</p>

                  {advice[block.id] && (
                    <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100 animate-fadeIn">
                      <h4 className="text-sm font-bold text-indigo-800 mb-2 flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> {t.schedule.coachAdvice}
                      </h4>
                      <div className="text-sm text-indigo-800 whitespace-pre-wrap leading-relaxed">
                        {advice[block.id]}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col gap-2 shrink-0 md:self-start mt-2 md:mt-0">
                  <button
                    onClick={() => handleGoogleCalendar(block)}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-md text-sm font-medium hover:text-indigo-600 hover:border-indigo-200 transition-colors w-full md:w-auto"
                    title={t.schedule.addToCal}
                  >
                    <CalendarPlus className="w-4 h-4" />
                    <span className="md:hidden lg:inline">{t.schedule.addToCal}</span>
                  </button>

                  {block.category !== 'Break' && (
                    <button
                      onClick={() => handleGetAdvice(block)}
                      disabled={loadingId === block.id}
                      className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 w-full md:w-auto"
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
          </div>
        ))}
      </div>
    </div>
  );
};