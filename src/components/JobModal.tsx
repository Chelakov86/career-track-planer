import React, { useState, useEffect } from 'react';
import { X, ExternalLink } from 'lucide-react';
import { JobApplication, ApplicationStatus, RoleFocus, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface JobModalProps {
    initialData: Partial<JobApplication>;
    language: Language;
    onSave: (data: Partial<JobApplication>) => void;
    onCancel: () => void;
}

export const JobModal: React.FC<JobModalProps> = ({
    initialData,
    language,
    onSave,
    onCancel
}) => {
    const [formData, setFormData] = useState<Partial<JobApplication>>(initialData);
    const t = TRANSLATIONS[language];
    const columns = Object.values(ApplicationStatus);

    useEffect(() => {
        // When initialData changes, update formData completely
        // Explicitly include link field to ensure it's preserved (even if undefined/null)
        setFormData({
            ...initialData,
            link: initialData.link !== undefined ? initialData.link : ''
        });
    }, [initialData]);

    const handleSave = () => {
        if (!formData.company || !formData.position) return;
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-850">
                    <h3 className="font-bold text-gray-800 dark:text-white">
                        {formData.id ? t.board.editJob : t.board.newOpp}
                    </h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.board.placeholders.company}*</label>
                            <input
                                placeholder={t.board.placeholders.company}
                                className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                value={formData.company || ''}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.board.placeholders.position}*</label>
                            <input
                                placeholder={t.board.placeholders.position}
                                className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                value={formData.position || ''}
                                onChange={e => setFormData({ ...formData, position: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.board.labels.status}</label>
                            <select
                                className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                value={formData.status || ApplicationStatus.RESEARCH}
                                onChange={e => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
                            >
                                {columns.map(status => (
                                    <option key={status} value={status}>{t.board.status[status]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.board.labels.role}</label>
                            <select
                                className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                                value={formData.roleType || 'PM'}
                                onChange={e => setFormData({ ...formData, roleType: e.target.value as RoleFocus })}
                            >
                                <option value="PM">PM</option>
                                <option value="QA">QA</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.board.labels.location}</label>
                            <input
                                placeholder={t.board.placeholders.location}
                                className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                value={formData.location || ''}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.board.labels.salary}</label>
                            <input
                                placeholder={t.board.placeholders.salary}
                                className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                value={formData.salary || ''}
                                onChange={e => setFormData({ ...formData, salary: e.target.value })}
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.board.labels.link}</label>
                            <div className="flex gap-2">
                                <input
                                    placeholder={t.board.placeholders.link}
                                    className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                                    value={formData.link || ''}
                                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                                />
                                {formData.link && (
                                    <a href={formData.link} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 border border-gray-200 dark:border-gray-600">
                                        <ExternalLink className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.board.labels.notes}</label>
                            <textarea
                                placeholder={t.board.placeholders.notes}
                                className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[80px]"
                                value={formData.notes || ''}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-gray-700 hover:border-gray-300 transition-colors"
                    >
                        {t.board.cancel}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!formData.company || !formData.position}
                        className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {t.board.save}
                    </button>
                </div>
            </div>
        </div>
    );
};
