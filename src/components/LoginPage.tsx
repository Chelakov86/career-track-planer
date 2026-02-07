import React from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ language, setLanguage }) => {
  const { loginWithEmail, isLoading } = useAuth();
  const t = TRANSLATIONS[language];
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await loginWithEmail(email);
      setSent(true);
    } catch (error) {
      alert(t.login.errorSendingLink);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 animate-fadeIn transition-colors">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4">
            CT
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.login.title}</h1>
          <p className="text-gray-500 dark:text-gray-400">{t.login.subtitle}</p>
        </div>

        {sent ? (
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-900">
            <h3 className="text-green-800 dark:text-green-200 font-semibold mb-2">{t.login.checkEmail}</h3>
            <p className="text-sm text-green-700 dark:text-green-300">
              {t.login.checkEmailMessage} <strong>{email}</strong>. {t.login.checkEmailAction}
            </p>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="flex flex-col gap-4 w-full">
            <div>
              <input
                type="email"
                placeholder={t.login.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl transition-all shadow-md font-medium disabled:opacity-50"
            >
              {isLoading ? t.login.sending : t.login.sendMagicLink}
            </button>
            <p className="text-xs text-center text-gray-400">
              {t.login.securedBy}
            </p>
          </form>
        )}

        <div className="mt-8 flex items-center justify-center gap-2">
          <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">LANGUAGE</div>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${language === 'en' ? 'bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('de')}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${language === 'de' ? 'bg-white dark:bg-gray-600 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
            >
              DE
            </button>
          </div>
        </div>

        <div className="mt-8 text-center border-t border-gray-100 dark:border-gray-700 pt-6">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {t.login.footer}
          </p>
        </div>
      </div>
    </div>
  );
};