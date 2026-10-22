import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, Monitor, Moon, Sun } from 'lucide-react';
import { ThemePreference, useTheme } from '../contexts/ThemeContext';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

const options: ThemePreference[] = ['light', 'dark', 'system'];
const icons = { light: Sun, dark: Moon, system: Monitor };

export const ThemeSelector: React.FC<{ language: Language; placement?: 'top' | 'bottom' }> = ({ language, placement = 'bottom' }) => {
    const { preference, setPreference } = useTheme();
    const [open, setOpen] = useState(false);
    const container = useRef<HTMLDivElement>(null);
    const trigger = useRef<HTMLButtonElement>(null);
    const items = useRef<(HTMLButtonElement | null)[]>([]);
    const id = useId();
    const t = TRANSLATIONS[language];
    const Icon = icons[preference];

    const close = (restoreFocus = false) => {
        setOpen(false);
        if (restoreFocus) trigger.current?.focus();
    };

    useEffect(() => {
        if (!open) return;
        items.current[options.indexOf(preference)]?.focus();
        const outside = (event: PointerEvent) => {
            if (!container.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener('pointerdown', outside);
        return () => document.removeEventListener('pointerdown', outside);
    }, [open, preference]);

    return <div ref={container} className="relative shrink-0" onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) close();
    }}>
        <button ref={trigger} type="button" title={t.toggleTheme} aria-label={t.toggleTheme}
            aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined}
            onClick={() => setOpen(value => !value)}
            onKeyDown={event => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                    event.preventDefault();
                    setOpen(true);
                }
            }}
            className="flex items-center justify-center p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-gray-500 dark:text-gray-400 hover:text-primary shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Icon className="w-4 h-4" />
        </button>
        {open && <div id={id} role="menu" aria-label={t.toggleTheme}
            className={`absolute z-50 min-w-36 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1 shadow-lg ${placement === 'top' ? 'bottom-full left-0 mb-2' : 'top-full right-0 mt-2'}`}
            onKeyDown={event => {
                const index = items.current.indexOf(document.activeElement as HTMLButtonElement);
                let next: number | undefined;
                if (event.key === 'ArrowDown') next = (index + 1) % options.length;
                if (event.key === 'ArrowUp') next = (index - 1 + options.length) % options.length;
                if (event.key === 'Home') next = 0;
                if (event.key === 'End') next = options.length - 1;
                if (next !== undefined) { event.preventDefault(); items.current[next]?.focus(); }
                if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
                if (event.key === 'Tab') close();
            }}>
            {options.map((option, index) => {
                const OptionIcon = icons[option];
                return <button key={option} ref={node => { items.current[index] = node; }} type="button"
                    role="menuitemradio" aria-checked={preference === option} tabIndex={-1}
                    onClick={() => { setPreference(option); close(true); }}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 focus:bg-gray-100 dark:focus:bg-slate-700 focus:outline-none">
                    <OptionIcon aria-hidden="true" className="w-4 h-4" /><span>{t.themeOptions[option]}</span>
                    {preference === option && <Check aria-hidden="true" className="ml-auto w-4 h-4" />}
                </button>;
            })}
        </div>}
    </div>;
};
