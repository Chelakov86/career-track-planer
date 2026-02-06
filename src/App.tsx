import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ScheduleView } from './components/ScheduleView';
import { JobBoard } from './components/JobBoard';
import { Dashboard } from './components/Dashboard';
import { TimelineView } from './components/TimelineView';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { useJobs } from './hooks/useJobs';
import { getSchedule } from './constants';
import { Language } from './types';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [language, setLanguage] = useState<Language>('de');

  const { jobs, addJob, editJob, updateStatus, deleteJob, refetchJobs } = useJobs(user);

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

  return (
    <Routes>
      <Route
        element={
          <Layout
            language={language}
            setLanguage={setLanguage}
          />
        }
      >
        <Route
          path="/"
          element={
            <ScheduleView
              schedule={currentSchedule}
              language={language}
            />
          }
        />
        <Route
          path="/board"
          element={
            <JobBoard
              jobs={jobs}
              onAddJob={addJob}
              onEditJob={editJob}
              onUpdateStatus={updateStatus}
              onDeleteJob={deleteJob}
              onRefetchJobs={refetchJobs}
              language={language}
            />
          }
        />
        <Route
          path="/timeline"
          element={
            <TimelineView
              jobs={jobs}
              language={language}
            />
          }
        />
        <Route
          path="/stats"
          element={
            <Dashboard
              jobs={jobs}
              language={language}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
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