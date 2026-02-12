import React from 'react';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface HeaderProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
    language,
    setLanguage,
    mobileMenuOpen,
    setMobileMenuOpen
}) => {
    const { theme, toggleTheme } = useTheme();
    const t = TRANSLATIONS[language];

    return (
        <div className="md:hidden bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 p-4 flex justify-between items-center sticky top-0 z-[35]">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">CT</div>
                <span className="font-bold text-gray-800 dark:text-white">CareerTrack</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={toggleTheme}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                    title={t.toggleTheme}
                    aria-label={t.toggleTheme}
                >
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button
                    onClick={() => setLanguage(language === 'en' ? 'de' : 'en')}
                    className="text-xs font-semibold bg-gray-100 dark:bg-slate-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300 uppercase"
                >
                    {language}
                </button>
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-600 dark:text-gray-400">
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>
            </div>
        </div>
    );
};
