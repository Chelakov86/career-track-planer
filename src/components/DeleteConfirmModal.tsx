import React, { useEffect, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface DeleteConfirmModalProps {
    language: Language;
    jobName: { company: string; position: string };
    hasRounds?: boolean;
    roundsCount?: number;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    language,
    jobName,
    hasRounds = false,
    roundsCount = 0,
    onConfirm,
    onCancel
}) => {
    const t = TRANSLATIONS[language];
    const dialogRef = useRef<HTMLDivElement>(null);
    useFocusTrap(dialogRef, true);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onCancel]);

    return (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-modal-title"
                className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-800 max-w-sm w-full p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full">
                        <Trash2 className="w-8 h-8 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 id="delete-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
                            {t.board.deleteTitle}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 leading-relaxed">
                            {t.board.deleteMessage.split('{position}')[0]}
                            <strong className="text-gray-700 dark:text-gray-300">{jobName.position}</strong>
                            {t.board.deleteMessage.split('{position}')[1].split('{company}')[0]}
                            <strong className="text-gray-700 dark:text-gray-300">{jobName.company}</strong>
                            {t.board.deleteMessage.split('{company}')[1]}
                        </p>
                        {hasRounds && (
                            <div className="mt-3 flex items-start gap-2.5 w-full text-left rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 px-3 py-2.5">
                                <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
                                    {t.board.deleteRoundsWarningCount.replace('{count}', String(roundsCount))}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            {t.board.cancel}
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-700 dark:hover:bg-red-600 transition-colors shadow-sm"
                        >
                            {t.board.confirmDelete}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
