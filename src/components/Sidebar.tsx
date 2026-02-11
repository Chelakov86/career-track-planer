import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Layout, Clock, BarChart2, LogOut, Moon, Sun, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface SidebarProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    mobileMenuOpen: boolean;
    closeMobileMenu: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    language,
    setLanguage,
    mobileMenuOpen,
    closeMobileMenu
}) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const t = TRANSLATIONS[language];

    if (!user) return null;

    return (
        <aside className={`
      fixed inset-y-0 left-0 z-[30] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen flex flex-col
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
                <NavLink
                    to="/"
                    onClick={closeMobileMenu}
                    className={({ isActive }) => `flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                    end
                >
                    <Layout className="w-5 h-5" />
                    {t.nav.board}
                </NavLink>
                <NavLink
                    to="/timeline"
                    onClick={closeMobileMenu}
                    className={({ isActive }) => `flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                >
                    <Clock className="w-5 h-5" />
                    {t.nav.timeline}
                </NavLink>
                <NavLink
                    to="/schedule"
                    onClick={closeMobileMenu}
                    className={({ isActive }) => `flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                >
                    <Calendar className="w-5 h-5" />
                    {t.nav.schedule}
                </NavLink>
                <NavLink
                    to="/stats"
                    onClick={closeMobileMenu}
                    className={({ isActive }) => `flex items-center gap-3 w-full px-4 py-3 text-sm font-medium rounded-lg transition-all ${isActive
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                        : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
                        }`}
                >
                    <BarChart2 className="w-5 h-5" />
                    {t.nav.stats}
                </NavLink>
            </nav>

            <div className="p-4 space-y-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">

                {/* User Profile Section */}
                <div className="flex items-center gap-3 p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
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
                        title={t.toggleTheme}
                        aria-label={t.toggleTheme}
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
            </div>
        </aside>
    );
};
