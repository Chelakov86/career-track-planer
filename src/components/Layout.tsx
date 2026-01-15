import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Language, RoleFocus } from '../types';

interface LayoutProps {
    language: Language;
    setLanguage: (lang: Language) => void;
    userFocus: RoleFocus;
    setUserFocus: (focus: RoleFocus) => void;
}

export const Layout: React.FC<LayoutProps> = ({
    language,
    setLanguage,
    userFocus,
    setUserFocus
}) => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] dark:bg-gray-950 transition-colors duration-200">
            <Header
                language={language}
                setLanguage={setLanguage}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />

            <Sidebar
                language={language}
                setLanguage={setLanguage}
                userFocus={userFocus}
                setUserFocus={setUserFocus}
                mobileMenuOpen={mobileMenuOpen}
                closeMobileMenu={() => setMobileMenuOpen(false)}
            />

            <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen p-4 md:p-6 lg:p-8">
                <div className="max-w-[1920px] mx-auto h-full">
                    <Outlet />
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
