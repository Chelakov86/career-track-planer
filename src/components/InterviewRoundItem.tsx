import { useState } from 'react';
import { InterviewRound, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface InterviewRoundItemProps {
  round: InterviewRound;
  language: Language;
  onUpdate: (roundId: string, updates: Partial<InterviewRound>) => void;
  onDelete: (roundId: string) => void;
}

export const InterviewRoundItem = ({ round, language, onUpdate, onDelete }: InterviewRoundItemProps) => {
  const t = TRANSLATIONS[language];
  const [showNotes, setShowNotes] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(round.id);
    } else {
      setShowDeleteConfirm(true);
      setTimeout(() => setShowDeleteConfirm(false), 3000);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
      <div className="space-y-3">
        {/* Round Name */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t.interviewRound.roundName}
          </label>
          <input
            type="text"
            value={round.roundName}
            onChange={(e) => onUpdate(round.id, { roundName: e.target.value })}
            placeholder={t.interviewRound.roundNamePlaceholder}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
          />
        </div>

        {/* Date and Status Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.interviewRound.interviewDate}
            </label>
            <input
              type="date"
              value={round.interviewDate}
              onChange={(e) => onUpdate(round.id, { interviewDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.interviewRound.status}
            </label>
            <select
              value={round.status}
              onChange={(e) => onUpdate(round.id, { status: e.target.value as any })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
            >
              <option value="scheduled">{t.interviewRound.statuses.scheduled}</option>
              <option value="completed">{t.interviewRound.statuses.completed}</option>
              <option value="awaiting_feedback">{t.interviewRound.statuses.awaiting_feedback}</option>
            </select>
          </div>
        </div>

        {/* Notes Toggle */}
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
        >
          {showNotes ? '▼' : '▶'} {t.interviewRound.notes}
        </button>

        {/* Notes Textarea */}
        {showNotes && (
          <textarea
            value={round.notes || ''}
            onChange={(e) => onUpdate(round.id, { notes: e.target.value })}
            placeholder={t.interviewRound.notes}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
          />
        )}

        {/* Delete Button */}
        <button
          type="button"
          onClick={handleDelete}
          className={`text-xs px-3 py-1 rounded ${
            showDeleteConfirm
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
          }`}
        >
          {showDeleteConfirm ? t.interviewRound.deleteConfirm : t.interviewRound.delete}
        </button>
      </div>
    </div>
  );
};
