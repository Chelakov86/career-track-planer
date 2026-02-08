import React, { useRef, useState } from 'react';
import { Pencil, Trash2, MapPin, Euro, ChevronRight, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { JobApplication, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface JobCardProps {
    job: JobApplication;
    language: Language;
    isGhost?: boolean;
    draggedItemId?: string | null;

    onView?: (job: JobApplication) => void;
    onEdit: (job: JobApplication) => void;
    onDelete: (id: string) => void;
    onNextStatus?: () => void;

    onDragStart: (e: React.DragEvent, id: string) => void;
    onDragEnd: () => void;

    onTouchStart: (e: React.TouchEvent, job: JobApplication) => void;
    onTouchMove?: (e: React.TouchEvent) => void;
    onTouchEnd?: () => void;
}

export const JobCard: React.FC<JobCardProps> = ({
    job,
    language,
    isGhost = false,
    draggedItemId,
    onView,
    onEdit,
    onDelete,
    onNextStatus,
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
        const threshold = 5; // pixels
        if (deltaX > threshold || deltaY > threshold) {
            hasDragged.current = true;
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        if (isGhost || !onView) return;
        // Don't trigger view if clicking on buttons, links, or if drag occurred
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
        // Reset after a short delay to allow click event to check
        setTimeout(() => {
            hasDragged.current = false;
            mouseDownPos.current = null;
        }, 100);
    };

    return (
        <div
            className={`bg-white dark:bg-gray-800 p-3 2xl:p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all relative ${isGhost ? 'shadow-2xl ring-2 ring-indigo-500 rotate-3 z-50 opacity-90' :
                draggedItemId === job.id && !isGhost ? 'opacity-30 grayscale' :
                    'hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-200 dark:hover:border-indigo-900'
                } ${!isGhost ? 'cursor-grab active:cursor-grabbing group' : ''}`}
            draggable={!isGhost}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onClick={handleClick}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}

            // Touch Events
            onTouchStart={(e) => !isGhost && onTouchStart(e, job)}
            onTouchMove={!isGhost ? onTouchMove : undefined}
            onTouchEnd={!isGhost ? onTouchEnd : undefined}
        >
            <div className="flex justify-end items-start mb-2">
                {!isGhost && (
                    <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 2xl:opacity-100 transition-opacity">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(job);
                            }}
                            className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                            title={t.board.editJob}
                            aria-label={t.board.editJob}
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(job.id);
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                            title="Delete"
                            aria-label={t.board.confirmDelete || 'Delete'}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </button>
                    </div>
                )}
            </div>

            {job.link ? (
                <a
                    href={ensureAbsoluteUrl(job.link)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-gray-800 dark:text-white text-sm 2xl:text-base truncate 2xl:whitespace-normal 2xl:line-clamp-2 pr-4 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors block"
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
                <h4 className="font-semibold text-gray-800 dark:text-white text-sm 2xl:text-base truncate 2xl:whitespace-normal 2xl:line-clamp-2 pr-4">{job.position}</h4>
            )}
            <div className="flex items-center gap-2 mb-2">
                <p className="text-gray-500 dark:text-gray-400 text-xs 2xl:text-sm font-medium">{job.company}</p>
            </div>

            <div className="flex flex-col gap-1 mb-3">
                {job.location && (
                    <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs">
                        <MapPin className="w-3 h-3" /> {job.location}
                    </div>
                )}
                {job.salary && (
                    <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-xs">
                        <Euro className="w-3 h-3" /> {job.salary}
                    </div>
                )}
            </div>

            {/* Notes preview - visible on large screens */}
            {job.notes && (
                <div className="hidden 2xl:block mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 italic">
                        {job.notes}
                    </p>
                </div>
            )}

            {/* Interview Rounds Section */}
            {job.interviewRounds && job.interviewRounds.length > 0 && !isGhost && (
                <div className="mb-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowInterviews(!showInterviews);
                        }}
                        className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors w-full"
                    >
                        <Calendar className="w-3 h-3" />
                        <span>
                            {job.interviewRounds.length} {job.interviewRounds.length === 1 ? t.board.interview : t.board.interviews}
                        </span>
                        {showInterviews ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>

                    {showInterviews && (
                        <div className="mt-2 space-y-1 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                            {job.interviewRounds.map(round => {
                                const statusColors = {
                                    scheduled: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                                    completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                                    awaiting_feedback: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                };

                                return (
                                    <div key={round.id} className="text-xs py-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-gray-700 dark:text-gray-300 font-medium truncate">{round.roundName}</span>
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${statusColors[round.status]}`}>
                                                {t.interviewRound.statuses[round.status]}
                                            </span>
                                        </div>
                                        <div className="text-gray-500 dark:text-gray-500 text-[10px] mt-0.5">
                                            {round.interviewDate}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-gray-50 dark:border-gray-700">
                <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    {t.board.labels.lastUpdated}: {job.lastUpdated}
                </span>

                {!isGhost && onNextStatus && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onNextStatus();
                        }}
                        className="p-1 rounded-full hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};
