import React, { useState, useEffect } from 'react';
import { ScheduleView } from './components/ScheduleView';
import { JobBoard } from './components/JobBoard';
import { Dashboard } from './components/Dashboard';
import { LoginPage } from './components/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { MOCK_JOBS, getSchedule, TRANSLATIONS } from './constants';
import { ScheduleBlock, JobApplication, RoleFocus, ApplicationStatus, Language } from './types';
import { Calendar, Layout, BarChart2, Menu, X, Settings, Globe, LogOut, Moon, Sun } from 'lucide-react';

const AppContent: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<'schedule' | 'board' | 'stats'>('schedule');
  const [language, setLanguage] = useState<Language>('de');
  const [userFocus, setUserFocus] = useState<RoleFocus>('PM');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [jobs, setJobs] = useState<JobApplication[]>([]);

  // Initialize data based on user login
  useEffect(() => {
    if (!user) {
      setJobs([]); 
      return;
    }

    const userKey = `career_track_jobs_${user.id}`;
    const saved = localStorage.getItem(userKey);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setJobs(parsed);
      } catch (e) {
        setJobs(MOCK_JOBS);
      }
    } else {
      const legacy = localStorage.getItem('career_track_jobs');
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          setJobs(parsed);
        } catch (e) {
          setJobs(MOCK_JOBS);
        }
      } else {
        setJobs(MOCK_JOBS);
      }
    }
  }, [user]);

  // Persist jobs when they change, scoped to user
  useEffect(() => {
    if (user && jobs.length > 0) {
      localStorage.setItem(`career_track_jobs_${user.id}`, JSON.stringify(jobs));
    }
  }, [jobs, user]);

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage language={language} setLanguage={setLanguage} />;
  }

  const NavItem = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button
      onClick={() => {
        setActiveTab(id);
        setMobileMenuOpen(false);
      }}
      className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all ${
        activeTab === id 
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
      }`}
    >
      <Icon className={`w-5 h-5 ${activeTab === id ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-200">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 p-4 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">CT</div>
          <span className="font-bold text-gray-800 dark:text-white">CareerTrack</span>
        </div>
        <div className="flex items-center gap-2">
           <button 
             onClick={toggleTheme}
             className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
           >
             {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
           </button>
           <button 
             onClick={() => setLanguage(language === 'en' ? 'de' : 'en')}
             className="text-xs font-semibold bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300 uppercase"
           >
             {language}
           </button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600 dark:text-gray-400">
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-10 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">CT</div>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white text-lg">CareerTrack</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t.nav.subtitle}</p>
          </div>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <NavItem id="schedule" label={t.nav.schedule} icon={Calendar} />
          <NavItem id="board" label={t.nav.board} icon={Layout} />
          <NavItem id="stats" label={t.nav.stats} icon={BarChart2} />
        </nav>

        <div className="p-4 space-y-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          
          {/* User Profile Section */}
          <div className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
             <img src={user.avatar} alt="User" className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700" />
             <div className="flex-1 min-w-0">
               <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
               <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
             </div>
             <button onClick={logout} className="text-gray-400 hover:text-red-500 transition-colors" title={t.nav.logout}>
               <LogOut className="w-4 h-4" />
             </button>
          </div>

          {/* Settings & Controls */}
          <div className="flex items-center justify-between gap-2">
             {/* Theme Toggle */}
             <button 
               onClick={toggleTheme}
               className="flex items-center justify-center p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"
               title="Toggle Dark Mode"
             >
               {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
             </button>

             {/* Language Switcher */}
             <div className="flex flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-0.5 shadow-sm">
               <button 
                 onClick={() => setLanguage('en')}
                 className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${language === 'en' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
               >
                 EN
               </button>
               <button 
                 onClick={() => setLanguage('de')}
                 className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${language === 'de' ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
               >
                 DE
               </button>
             </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-2">
              <Settings className="w-3 h-3" /> {t.nav.focus}
            </h4>
            <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-md">
              <button 
                onClick={() => setUserFocus('PM')}
                className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${userFocus === 'PM' ? 'bg-white dark:bg-gray-600 shadow text-indigo-700 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              >
                PM
              </button>
              <button 
                onClick={() => setUserFocus('QA')}
                className={`flex-1 text-xs py-1.5 rounded font-medium transition-colors ${userFocus === 'QA' ? 'bg-white dark:bg-gray-600 shadow text-purple-700 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
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
          className="fixed inset-0 bg-black/20 dark:bg-black/50 z-0 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;