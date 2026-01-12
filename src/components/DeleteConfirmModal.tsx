import React from 'react';
import { Trash2 } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface DeleteConfirmModalProps {
    language: Language;
    onConfirm: () => void;
    onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    language,
    onConfirm,
    onCancel
}) => {
    const t = TRANSLATIONS[language];

    return (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 max-w-sm w-full p-6"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex flex-col items-center text-center gap-4">
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-full">
                        <Trash2 className="w-8 h-8 text-red-500 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {t.board.deleteTitle}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 leading-relaxed">
                            {t.board.deleteMessage}
                        </p>
                    </div>
                    <div className="flex gap-3 w-full mt-2">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
