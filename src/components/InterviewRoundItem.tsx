import React, { useState } from 'react';
import { InterviewRound, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { getGoogleCalendarUrl } from '../lib/calendar';

interface InterviewRoundItemProps {
  round: InterviewRound;
  language: Language;
  onUpdate: (roundId: string, updates: Partial<InterviewRound>) => void | Promise<void>;
  onDelete: (roundId: string) => void | Promise<void>;
}

export const InterviewRoundItem: React.FC<InterviewRoundItemProps> = ({ round, language, onUpdate, onDelete }) => {
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

  const addToCalendar = () => {
    const url = getGoogleCalendarUrl(round);
    window.open(url, '_blank');
  };

  return (
    <div className="border border-gray-200 dark:border-slate-700 rounded-lg p-3 bg-gray-50 dark:bg-slate-800">
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
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/50 focus:border-transparent"
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
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/50 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.interviewRound.status}
            </label>
            <select
              value={round.status}
              onChange={(e) => onUpdate(round.id, { status: e.target.value as any })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/50 focus:border-transparent"
            >
              <option value="scheduled">{t.interviewRound.statuses.scheduled}</option>
              <option value="completed">{t.interviewRound.statuses.completed}</option>
              <option value="awaiting_feedback">{t.interviewRound.statuses.awaiting_feedback}</option>
            </select>
          </div>
        </div>

        {/* Time Row */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.interviewRound.startTime}
            </label>
            <input
              type="time"
              value={round.startTime || ''}
              onChange={(e) => onUpdate(round.id, { startTime: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/50 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.interviewRound.endTime}
            </label>
            <input
              type="time"
              value={round.endTime || ''}
              onChange={(e) => onUpdate(round.id, { endTime: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/50 focus:border-transparent"
            />
          </div>
        </div>

        {/* Meeting Link */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t.interviewRound.meetingLink}
          </label>
          <input
            type="url"
            value={round.meetingLink || ''}
            onChange={(e) => onUpdate(round.id, { meetingLink: e.target.value })}
            placeholder="https://teams.microsoft.com/..."
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/50 focus:border-transparent"
          />
        </div>

        {/* Actions Row */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={addToCalendar}
              className="flex items-center gap-1 text-xs px-2 py-1 bg-primary text-white rounded hover:bg-blue-700 transition-colors"
            >
              <span className="w-3 h-3">📅</span>
              {t.interviewRound.addToCalendar}
            </button>
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="text-xs text-primary dark:text-primary hover:text-primary dark:hover:text-primary"
            >
              {showNotes ? '▼' : '▶'} {t.interviewRound.notes}
            </button>
          </div>

          <button
            type="button"
            onClick={handleDelete}
            className={`text-xs px-2 py-1 rounded transition-colors ${showDeleteConfirm
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
          >
            {showDeleteConfirm ? t.interviewRound.deleteConfirm : t.interviewRound.delete}
          </button>
        </div>

        {/* Notes Textarea */}
        {showNotes && (
          <textarea
            value={round.notes || ''}
            onChange={(e) => onUpdate(round.id, { notes: e.target.value })}
            placeholder={t.interviewRound.notes}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 dark:focus:ring-primary/50 focus:border-transparent"
          />
        )}
      </div>
    </div>
  );
};
