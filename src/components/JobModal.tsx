import React, { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { JobApplication, ApplicationStatus, Language, InterviewRound } from '../types';
import { TRANSLATIONS } from '../constants';
import { useInterviewRounds } from '../hooks/useInterviewRounds';
import { InterviewRoundItem } from './InterviewRoundItem';
import { useAuth } from '../contexts/AuthContext';

interface JobModalProps {
    initialData: Partial<JobApplication>;
    language: Language;
    mode?: 'view' | 'edit';
    onSave: (data: Partial<JobApplication>) => void;
    onCancel: () => void;
    onEdit?: () => void;
}

export const JobModal: React.FC<JobModalProps> = ({
    initialData,
    language,
    mode = 'edit',
    onSave,
    onCancel,
    onEdit
}) => {
    const { user } = useAuth();
    const [showInterviews, setShowInterviews] = useState(false);

    const ensureAbsoluteUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    };

    // Initialize formData with proper handling of null/undefined link
    const initializeFormData = (data: Partial<JobApplication>) => ({
        ...data,
        // Preserve string values, convert null/undefined to empty string for display
        link: (data.link && typeof data.link === 'string') ? data.link : ''
    });

    const [formData, setFormData] = useState<Partial<JobApplication>>(() => initializeFormData(initialData));
    const isInitialMount = useRef(true);
    const t = TRANSLATIONS[language];
    const columns = Object.values(ApplicationStatus);

    // Interview rounds hook (only active for existing jobs)
    const { rounds, addRound, updateRound, deleteRound } = useInterviewRounds(
        formData.id || null,
        user?.id || null
    );

    // Update formData when initialData changes, but only on initial mount or when job ID changes
    // This ensures fresh data is loaded after page reload while preventing resets during editing
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            // Initial mount - formData already initialized via useState initializer
            return;
        }
        
        // If job ID changed, update formData (different job being edited)
        // The key on JobModal handles remounting, but this is a safety net
        const currentId = initialData.id;
        const prevId = formData.id;
        if (currentId !== prevId) {
            setFormData(initializeFormData(initialData));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialData.id]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onCancel();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onCancel]);

    const handleSave = () => {
        if (!formData.company || !formData.position) return;
        onSave(formData);
    };

    const renderField = (label: string, value: string | undefined, placeholder?: string) => {
        if (mode === 'view') {
            return (
                <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                    <div className="w-full p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-800 dark:text-gray-200 min-h-[36px] flex items-center">
                        {value || <span className="text-gray-400 dark:text-gray-500 italic">{placeholder}</span>}
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderInput = (label: string, value: string, onChange: (value: string) => void, placeholder: string, required = false, fullWidth = false) => {
        if (mode === 'edit') {
            return (
                <div className={fullWidth ? "col-span-2" : ""}>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}{required ? '*' : ''}</label>
                    <input
                        placeholder={placeholder}
                        className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                    />
                </div>
            );
        }
        return null;
    };

    const renderSelect = (label: string, value: string, onChange: (value: string) => void, options: { value: string; label: string }[]) => {
        if (mode === 'view') {
            const selectedOption = options.find(opt => opt.value === value);
            return (
                <div>
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                    <div className="w-full p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-800 dark:text-gray-200 min-h-[36px] flex items-center">
                        {selectedOption?.label || value}
                    </div>
                </div>
            );
        }
        return (
            <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                <select
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
        );
    };

    const renderTextarea = (label: string, value: string, onChange: (value: string) => void, placeholder: string) => {
        if (mode === 'view') {
            return (
                <div className="col-span-2">
                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                    <div className="w-full p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-800 dark:text-gray-200 min-h-[80px] whitespace-pre-wrap">
                        {value || <span className="text-gray-400 dark:text-gray-500 italic">{placeholder}</span>}
                    </div>
                </div>
            );
        }
        return (
            <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{label}</label>
                <textarea
                    placeholder={placeholder}
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all min-h-[80px]"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                />
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-850">
                    <h3 className="font-bold text-gray-800 dark:text-white">
                        {mode === 'view' ? t.board.viewJob : (formData.id ? t.board.editJob : t.board.newOpp)}
                    </h3>
                    <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        {mode === 'view' ? (
                            <>
                                {renderField(t.board.placeholders.company, formData.company)}
                                {renderField(t.board.placeholders.position, formData.position)}
                                {renderSelect(t.board.labels.status, formData.status || ApplicationStatus.RESEARCH, () => {}, columns.map(status => ({ value: status, label: t.board.status[status] })))}
                                {renderField(t.board.labels.location, formData.location)}
                                {renderField(t.board.labels.salary, formData.salary)}
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.board.labels.link}</label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-800 dark:text-gray-200 min-h-[36px] flex items-center">
                                            {formData.link || <span className="text-gray-400 dark:text-gray-500 italic">{t.board.placeholders.link}</span>}
                                        </div>
                                        {formData.link && (
                                            <a href={ensureAbsoluteUrl(formData.link)} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 border border-gray-200 dark:border-gray-600">
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                {renderTextarea(t.board.labels.notes, formData.notes || '', () => {}, t.board.placeholders.notes)}
                                {formData.dateAdded && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.board.labels.dateAdded}</label>
                                        <div className="w-full p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-800 dark:text-gray-200 min-h-[36px] flex items-center">
                                            {formData.dateAdded}
                                        </div>
                                    </div>
                                )}
                                {formData.lastUpdated && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">{t.board.labels.lastUpdated}</label>
                                        <div className="w-full p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-800 dark:text-gray-200 min-h-[36px] flex items-center">
                                            {formData.lastUpdated}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                {renderInput(t.board.placeholders.company, formData.company || '', (val) => setFormData({ ...formData, company: val }), t.board.placeholders.company, true, true)}
                                {renderInput(t.board.placeholders.position, formData.position || '', (val) => setFormData({ ...formData, position: val }), t.board.placeholders.position, true, true)}
                                {renderSelect(t.board.labels.status, formData.status || ApplicationStatus.RESEARCH, (val) => setFormData({ ...formData, status: val as ApplicationStatus }), columns.map(status => ({ value: status, label: t.board.status[status] })))}
                                {renderInput(t.board.labels.location, formData.location || '', (val) => setFormData({ ...formData, location: val }), t.board.placeholders.location)}
                                {renderInput(t.board.labels.salary, formData.salary || '', (val) => setFormData({ ...formData, salary: val }), t.board.placeholders.salary)}
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
                                            <a href={ensureAbsoluteUrl(formData.link)} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900 border border-gray-200 dark:border-gray-600">
                                                <ExternalLink className="w-5 h-5" />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                {renderTextarea(t.board.labels.notes, formData.notes || '', (val) => setFormData({ ...formData, notes: val }), t.board.placeholders.notes)}

                                {/* Interview Rounds Section - Only in edit mode for existing jobs */}
                                {formData.id && mode === 'edit' && (
                                    <div className="col-span-2 mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowInterviews(!showInterviews)}
                                            className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 mb-3"
                                        >
                                            {showInterviews ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                            {t.modal.interviews} ({rounds.length})
                                        </button>

                                        {showInterviews && (
                                            <div className="space-y-3">
                                                {rounds.map(round => (
                                                    <InterviewRoundItem
                                                        key={round.id}
                                                        round={round}
                                                        language={language}
                                                        onUpdate={updateRound}
                                                        onDelete={deleteRound}
                                                    />
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => addRound({
                                                        jobId: formData.id!,
                                                        roundName: '',
                                                        interviewDate: new Date().toISOString().split('T')[0],
                                                        status: 'scheduled'
                                                    })}
                                                    className="w-full px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                                >
                                                    + {t.modal.addInterview}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-850 flex justify-end gap-3">
                    {mode === 'view' ? (
                        <>
                            <button
                                onClick={onCancel}
                                className="px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-white dark:hover:bg-gray-700 hover:border-gray-300 transition-colors"
                            >
                                {t.board.close}
                            </button>
                            {onEdit && (
                                <button
                                    onClick={onEdit}
                                    className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm"
                                >
                                    {t.board.edit}
                                </button>
                            )}
                        </>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};
