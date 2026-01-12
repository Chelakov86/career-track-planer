import React, { useState, useEffect } from 'react';
import { ScheduleView } from './components/ScheduleView';
import { JobBoard } from './components/JobBoard';
import { Dashboard } from './components/Dashboard';
import { MOCK_JOBS, getSchedule, TRANSLATIONS } from './constants';
import { ScheduleBlock, JobApplication, RoleFocus, ApplicationStatus, Language } from './types';
import { Calendar, Layout, BarChart2, Briefcase, Menu, X, Settings, Globe } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'board' | 'stats'>('schedule');
  const [language, setLanguage] = useState<Language>('de');
  
  // Use getSchedule to get the correct initial schedule based on language
  // Note: changing language dynamically updates the view, but we keep schedule in state if user edits (not implemented yet), 
  // for now we just switch the view based on lang.
  
  const [jobs, setJobs] = useState<JobApplication[]>(() => {
    const saved = localStorage.getItem('career_track_jobs');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Basic recovery if stored data used old localized strings as Enum values
      if (parsed.length > 0 && !Object.values(ApplicationStatus).includes(parsed[0].status)) {
         return MOCK_JOBS;
      }
      return parsed;
    }
    return MOCK_JOBS;
  });
  
  const [userFocus, setUserFocus] = useState<RoleFocus>('PM');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('career_track_jobs', JSON.stringify(jobs));
  }, [jobs]);

  const handleAddJob = (job: JobApplication) => {
    setJobs([...jobs, job]);
  };

  const handleEditJob = (updatedJob: JobApplication) => {
    setJobs(jobs.map(j => j.id === updatedJob.id ? updatedJob : j));
  };

  const handleUpdateStatus = (id: string, status: ApplicationStatus) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, status, lastUpdated: new Date().toISOString().split('T')[0] } : j));
  };

  const handleDeleteJob = (id: string) => {
    setJobs(jobs.filter(j => j.id !== id));
  };

  const t = TRANSLATIONS[language];
  const currentSchedule = getSchedule(language);

  const NavItem = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all ${
        activeTab === id 
          ? 'bg-indigo-50 text-indigo-700' 
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className={`w-5 h-5 ${activeTab === id ? 'text-indigo-600' : 'text-gray-400'}`} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc]">
      {/* Mobile Header */}
      <div className="md:hidden bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">CT</div>
          <span className="font-bold text-gray-800">CareerTrack</span>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setLanguage(language === 'en' ? 'de' : 'en')}
             className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600 uppercase"
           >
             {language}
           </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">CT</div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">CareerTrack</h1>
            <p className="text-xs text-gray-500">{t.nav.subtitle}</p>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          <NavItem id="schedule" label={t.nav.schedule} icon={Calendar} />
          <NavItem id="board" label={t.nav.board} icon={Layout} />
          <NavItem id="stats" label={t.nav.stats} icon={BarChart2} />
        </nav>

        <div className="absolute bottom-0 w-full p-4 space-y-4 border-t border-gray-100 bg-gray-50">
          
          {/* Language Switcher */}
          <div className="flex items-center justify-between px-2">
             <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
               <Globe className="w-4 h-4" />
               Language
             </div>
             <div className="flex bg-white border border-gray-200 rounded-md p-0.5">
               <button 
                 onClick={() => setLanguage('en')}
                 className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${language === 'en' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 EN
               </button>
               <button 
                 onClick={() => setLanguage('de')}
                 className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${language === 'de' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 DE
               </button>
             </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <Settings className="w-3 h-3" /> {t.nav.focus}
            </h4>
            <div className="flex bg-gray-100 p-1 rounded-md">
              <button 
                onClick={() => setUserFocus('PM')}
                className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${userFocus === 'PM' ? 'bg-white shadow text-indigo-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                PM
              </button>
              <button 
                onClick={() => setUserFocus('QA')}
                className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${userFocus === 'QA' ? 'bg-white shadow text-purple-700' : 'text-gray-500 hover:text-gray-700'}`}
              >
                QA
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen p-4 md:p-8">
        <div className="max-w-7xl mx-auto h-full">
          {activeTab === 'schedule' && (
            <ScheduleView schedule={currentSchedule} userFocus={userFocus} language={language} />
          )}
          {activeTab === 'board' && (
            <JobBoard 
              jobs={jobs} 
              onAddJob={handleAddJob} 
              onEditJob={handleEditJob}
              onUpdateStatus={handleUpdateStatus} 
              onDeleteJob={handleDeleteJob}
              language={language}
            />
          )}
          {activeTab === 'stats' && (
            <Dashboard jobs={jobs} language={language} />
          )}
        </div>
      </main>
      
      {/* Overlay for mobile menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-0 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default App;