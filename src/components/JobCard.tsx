import React, { useRef, useState } from 'react';
import { Pencil, Trash2, Calendar, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { JobApplication, ApplicationStatus, Language } from '../types';
import { TRANSLATIONS } from '../constants';

const AVATAR_PALETTES = [
    'bg-blue-500 border-blue-400',
    'bg-emerald-500 border-emerald-400',
    'bg-purple-500 border-purple-400',
    'bg-orange-500 border-orange-400',
    'bg-pink-500 border-pink-400',
    'bg-teal-500 border-teal-400',
    'bg-cyan-500 border-cyan-400',
    'bg-rose-500 border-rose-400',
];

const getAvatarClasses = (name: string) => {
    return AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];
};

interface JobCardProps {
    job: JobApplication;
    language: Language;
    isGhost?: boolean;
    draggedItemId?: string | null;

    onView?: (job: JobApplication) => void;
    onEdit: (job: JobApplication) => void;
    onDelete: (job: JobApplication) => void;
    onNextStatus?: (job: JobApplication) => void;
    nextStatusLabel?: string;

    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragEnd: () => void;

    onTouchStart: (e: React.TouchEvent, job: JobApplication) => void;
    onTouchMove?: (e: React.TouchEvent) => void;
    onTouchEnd?: () => void;
}

export const JobCard: React.FC<JobCardProps> = React.memo(({
    job,
    language,
    isGhost = false,
    draggedItemId,
    onView,
    onEdit,
    onDelete,
    onNextStatus,
    nextStatusLabel,
    onDragStart,
    onDragEnd,
    onTouchStart,
    onTouchMove,
    onTouchEnd
}) => {
    const t = TRANSLATIONS[language];
    const mouseDownPos = useRef<{ x: number; y: number } | null>(null);
    const hasDragged = useRef(false);
    const [showInterviews, setShowInterviews] = useState(false);

    const ensureAbsoluteUrl = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (isGhost) return;
        mouseDownPos.current = { x: e.clientX, y: e.clientY };
        hasDragged.current = false;
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isGhost || !mouseDownPos.current) return;
        const deltaX = Math.abs(e.clientX - mouseDownPos.current.x);
        const deltaY = Math.abs(e.clientY - mouseDownPos.current.y);
        const threshold = 5;
        if (deltaX > threshold || deltaY > threshold) {
            hasDragged.current = true;
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isGhost || !onView) return;
        const target = e.target as HTMLElement;
        if (
            target.closest('button') ||
            target.closest('a') ||
            hasDragged.current
        ) {
            return;
        }
        onView(job);
    };

    const handleDragStart = (e: React.DragEvent) => {
        if (!isGhost) {
            hasDragged.current = true;
            onDragStart(e, job.id);
        }
    };

    const handleDragEnd = () => {
        if (!isGhost) {
            onDragEnd();
        }
        setTimeout(() => {
            hasDragged.current = false;
            mouseDownPos.current = null;
        }, 100);
    };

    const accentBorder =
        job.status === ApplicationStatus.APPLIED ? 'border-l-4 !border-l-primary' :
            job.status === ApplicationStatus.INTERVIEW ? 'border-l-4 !border-l-amber-400' :
                job.status === ApplicationStatus.OFFER ? 'border-l-4 !border-l-emerald-500' : '';

    return (
        <div
            className={`bg-white dark:bg-slate-800 p-3 2xl:p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all ${accentBorder} ${isGhost ? 'shadow-2xl ring-2 ring-primary rotate-3 z-50 opacity-90' :
                    draggedItemId === job.id && !isGhost ? 'opacity-30 grayscale' :
                        'hover:shadow-md dark:hover:border-slate-700'
                } ${!isGhost ? 'cursor-grab active:cursor-grabbing group' : ''}`}
            draggable={!isGhost}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTouchStart={(e) => !isGhost && onTouchStart(e, job)}
            onTouchMove={!isGhost ? onTouchMove : undefined}
            onTouchEnd={!isGhost ? onTouchEnd : undefined}
        >
            {/* Top row: Avatar + Actions */}
            <div className="flex justify-between items-start mb-2 2xl:mb-3">
                <div className={`w-8 h-8 2xl:w-10 2xl:h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0 border ${getAvatarClasses(job.company)}`}>
                    {job.company.charAt(0).toUpperCase()}
                </div>
                {!isGhost && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(job);
                            }}
                            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none text-slate-400 hover:text-primary p-1 rounded transition-all"
                            title={t.board.editJob}
                            aria-label={t.board.editJob}
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(job);
                            }}
                            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none text-slate-400 hover:text-red-500 p-1 rounded transition-all"
                            title={t.board.confirmDelete || 'Delete'}
                            aria-label={t.board.confirmDelete || 'Delete'}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {/* Title */}
            {job.link ? (
                <a
                    href={ensureAbsoluteUrl(job.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-slate-900 dark:text-white mb-1 text-sm truncate hover:text-primary dark:hover:text-primary transition-colors block"
                    draggable={false}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        window.open(ensureAbsoluteUrl(job.link!), '_blank', 'noopener,noreferrer');
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onDragStart={(e) => e.preventDefault()}
                    title={t.board.openLink}
                >
                    {job.position}
                </a>
            ) : (
                <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm truncate">{job.position}</h3>
            )}

            {/* Company + Location */}
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 2xl:mb-3">
                {job.company}{job.location ? ` · ${job.location}` : ''}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-2 2xl:mb-3">
                {job.salary && (
                    <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded">
                        {job.salary}
                    </span>
                )}
                {job.location && job.location.toLowerCase().includes('remote') && (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded dark:border dark:border-primary/20">
                        Remote
                    </span>
                )}
            </div>

            {/* Notes preview - visible on large screens */}
            {job.notes && (
                <div className="hidden 2xl:block mb-2 2xl:mb-3">
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                        {job.notes}
                    </p>
                </div>
            )}

            {/* Interview Rounds Section */}
            {job.interviewRounds && job.interviewRounds.length > 0 && !isGhost && (
                <div className="mb-2 2xl:mb-3">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowInterviews(!showInterviews);
                        }}
                        aria-expanded={showInterviews}
                        className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors w-full"
                    >
                        <Calendar className="w-3 h-3" />
                        <span>
                            {job.interviewRounds.length} {job.interviewRounds.length === 1 ? t.board.interview : t.board.interviews}
                        </span>
                        {showInterviews ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {showInterviews && (
                        <div className="mt-2 space-y-1 pl-4 border-l-2 border-slate-200 dark:border-slate-700">
                            {job.interviewRounds.map(round => {
                                const statusColors = {
                                    scheduled: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                                    completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                                    awaiting_feedback: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                };

                                return (
                                    <div key={round.id} className="text-xs py-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-slate-700 dark:text-slate-300 font-medium truncate">{round.roundName}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${statusColors[round.status]}`}>
                                                {t.interviewRound.statuses[round.status]}
                                            </span>
                                        </div>
                                        <div className="text-slate-500 dark:text-slate-500 text-[10px] mt-0.5">
                                            {round.interviewDate}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* View Details Button */}
            {!isGhost && onView && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onView(job);
                    }}
                    className="w-full py-1.5 2xl:py-2 text-xs 2xl:text-sm bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-primary hover:text-white transition-all mb-2 2xl:mb-3"
                >
                    {t.board.viewDetails}
                </button>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-700">
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    {t.board.labels.lastUpdated}: {job.lastUpdated}
                </span>

                {!isGhost && onNextStatus && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onNextStatus(job);
                        }}
                        className="p-1 rounded-full hover:bg-primary/10 dark:hover:bg-slate-700 text-slate-400 dark:text-slate-500 hover:text-primary dark:hover:text-primary transition-colors"
                        title={nextStatusLabel ? `→ ${nextStatusLabel}` : undefined}
                        aria-label={nextStatusLabel ? `→ ${nextStatusLabel}` : undefined}
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
});
