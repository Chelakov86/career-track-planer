import React from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Layout, Clock, BarChart2, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ThemeSelector } from './ThemeSelector';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface SidebarProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    mobileMenuOpen: boolean;
    closeMobileMenu: () => void;
    collapsed: boolean;
    toggleCollapsed: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
    language,
    setLanguage,
    mobileMenuOpen,
    closeMobileMenu,
    collapsed,
    toggleCollapsed
}) => {
    const { user, logout } = useAuth();
    const t = TRANSLATIONS[language];
    const navigation = [
        { to: '/', label: t.nav.board, Icon: Layout },
        { to: '/timeline', label: t.nav.timeline, Icon: Clock },
        { to: '/schedule', label: t.nav.schedule, Icon: Calendar },
        { to: '/stats', label: t.nav.stats, Icon: BarChart2 },
    ];
    const toggleLabel = collapsed ? t.nav.expandSidebar : t.nav.collapseSidebar;

    if (!user) return null;

    return (
        <aside id="app-sidebar" className={`
            fixed inset-y-0 left-0 z-[30] w-64 shrink-0 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 transform transition-[width,transform] duration-300 ease-in-out motion-reduce:transition-none md:translate-x-0 md:static md:h-screen flex flex-col
            ${collapsed ? 'md:w-20' : 'md:w-64'}
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
            <div className={`p-6 md:p-3 border-b border-gray-100 dark:border-slate-800 flex items-center gap-3 md:gap-2 ${collapsed ? 'md:flex-col' : ''}`}>
                <img src="/favicon.svg?v=2" alt="" width={32} height={32} className="w-8 h-8 shrink-0 rounded-lg shadow-sm" />
                <div className={`min-w-0 flex-1 ${collapsed ? 'md:hidden' : ''}`}>
                    <div className="font-bold text-gray-900 dark:text-white text-lg">CareerTrack</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t.nav.subtitle}</p>
                </div>
                <button
                    type="button"
                    onClick={toggleCollapsed}
                    aria-label={toggleLabel}
                    title={toggleLabel}
                    aria-expanded={!collapsed}
                    aria-controls="app-sidebar"
                    className="hidden md:flex shrink-0 items-center justify-center w-11 h-11 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                    {collapsed ? <ChevronRight aria-hidden="true" className="w-5 h-5" /> : <ChevronLeft aria-hidden="true" className="w-5 h-5" />}
                </button>
            </div>

            <nav className="p-4 space-y-2 flex-1">
                {navigation.map(({ to, label, Icon }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={to === '/'}
                        onClick={closeMobileMenu}
                        aria-label={label}
                        className={({ isActive }) => `group relative flex items-center gap-3 w-full min-h-11 px-4 py-3 text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 ${collapsed ? 'md:justify-center md:px-0' : ''} ${isActive
                            ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary'
                            : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-slate-800'
                        }`}
                    >
                        <Icon aria-hidden="true" className="w-5 h-5 shrink-0" />
                        <span className={collapsed ? 'md:sr-only' : ''}>{label}</span>
                        {collapsed && (
                            <span role="tooltip" className="hidden md:block invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100 pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap rounded-md bg-gray-900 dark:bg-slate-700 text-white px-3 py-2 text-sm shadow-lg">
                                {label}
                            </span>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 space-y-4 border-t border-gray-100 dark:border-slate-800">
                <div className={`flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-slate-800 ${collapsed ? 'md:justify-center' : ''}`}>
                    <div className={`flex-1 min-w-0 ${collapsed ? 'md:hidden' : ''}`}>
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                    </div>
                    <button onClick={logout} aria-label={t.nav.logout} className="flex items-center justify-center w-11 h-11 shrink-0 text-gray-400 hover:text-red-500 transition-colors -m-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900" title={t.nav.logout}>
                        <LogOut aria-hidden="true" className="w-4 h-4" />
                    </button>
                </div>

                <div className={`flex items-center justify-between gap-2 ${collapsed ? 'md:flex-col' : ''}`}>
                    <ThemeSelector language={language} placement="top" />
                    <div className={`flex flex-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md p-0.5 shadow-sm ${collapsed ? 'md:flex-col md:w-full md:flex-none' : ''}`}>
                        {(['en', 'de'] as const).map(lang => (
                            <button
                                key={lang}
                                onClick={() => setLanguage(lang)}
                                aria-pressed={language === lang}
                                className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${language === lang ? 'bg-primary/10 dark:bg-primary/20 text-primary' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            >
                                {lang.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </aside>
    );
};
