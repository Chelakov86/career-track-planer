import React from 'react';
import { Filter, MoreHorizontal, ArrowUp } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

type TranslationType = typeof TRANSLATIONS['de'];

interface MobileStageDockProps {
  searchField: React.ReactNode;
  showFilters: boolean;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  showMobileActions: boolean;
  showBackToTop: boolean;
  t: TranslationType;
  toggleFilters: () => void;
  toggleMobileActions: () => void;
  scrollToTop: () => void;
  clearFilters: () => void;
}

export const MobileStageDock: React.FC<MobileStageDockProps> = ({
  searchField,
  showFilters,
  hasActiveFilters,
  activeFilterCount,
  showMobileActions,
  showBackToTop,
  t,
  toggleFilters,
  toggleMobileActions,
  scrollToTop,
  clearFilters,
}) => {
  return (
    <div className="sm:hidden sticky top-0 z-20 -mx-4 px-4 py-3 bg-background-light dark:bg-background-dark border-y border-gray-200 dark:border-slate-700 shadow-sm">
      {searchField}
      <div className={`grid gap-2 mt-2 ${showBackToTop ? 'grid-cols-3' : 'grid-cols-2'}`}>
        <button
          type="button"
          onClick={toggleFilters}
          className={`min-h-[44px] w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            showFilters || hasActiveFilters
              ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border-primary/30 dark:border-primary/30'
              : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
          title={t.board.filters.status}
          aria-expanded={showFilters}
        >
          <Filter className="w-4 h-4" />
          <span>{t.board.filters.status}</span>
          {activeFilterCount > 0 && (
            <span className="bg-primary dark:bg-primary text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={toggleMobileActions}
          className={`min-h-[44px] w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
            showMobileActions
              ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border-primary/30 dark:border-primary/30'
              : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-gray-600'
          }`}
          title={t.board.filters.moreActionsTitle}
          aria-expanded={showMobileActions}
        >
          <MoreHorizontal className="w-4 h-4" />
          <span>{t.board.filters.moreActions}</span>
        </button>
        {showBackToTop && (
          <button
            type="button"
            onClick={scrollToTop}
            className="min-h-[44px] w-full flex items-center justify-center rounded-lg transition-colors text-sm font-medium border bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            aria-label={t.board.filters.backToTop}
            title={t.board.filters.backToTop}
          >
            <ArrowUp className="w-4 h-4" />
            <span className="sr-only">{t.board.filters.backToTop}</span>
          </button>
        )}
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="w-full mt-2 py-1 text-xs text-primary dark:text-primary font-medium hover:underline text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          {t.board.filters.clearAll}
        </button>
      )}
    </div>
  );
};
