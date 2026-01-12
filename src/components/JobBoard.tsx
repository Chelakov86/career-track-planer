import React, { useState, useRef, useEffect } from 'react';
import { JobApplication, ApplicationStatus, RoleFocus, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, Download } from 'lucide-react';
import { JobCard } from './JobCard';
import { JobModal } from './JobModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface JobBoardProps {
  jobs: JobApplication[];
  onAddJob: (job: JobApplication) => void;
  onEditJob: (job: JobApplication) => void;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onDeleteJob: (id: string) => void;
  language: Language;
}

export const JobBoard: React.FC<JobBoardProps> = ({ jobs, onAddJob, onEditJob, onUpdateStatus, onDeleteJob, language }) => {
  const [filter, setFilter] = useState<RoleFocus | 'All'>('All');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<JobApplication>>({});

  // Drag and Drop State (Mouse & Touch)
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Auto-scroll Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ x: number, y: number } | null>(null);

  // Touch specific state
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [touchPos, setTouchPos] = useState<{ x: number, y: number } | null>(null);
  const dragItemTimer = useRef<any>(null);

  const t = TRANSLATIONS[language];
  const columns = Object.values(ApplicationStatus);

  // Auto-scroll logic for drag & drop
  useEffect(() => {
    if (!draggedItemId) {
      pointerRef.current = null;
      return;
    }

    let animationFrameId: number;
    const container = scrollContainerRef.current;

    const scrollLoop = () => {
      if (!container || !pointerRef.current) {
        animationFrameId = requestAnimationFrame(scrollLoop);
        return;
      }

      const { left, right } = container.getBoundingClientRect();
      const { x } = pointerRef.current;
      const zone = 100; // Activation zone in pixels from edge
      const maxSpeed = 15; // Max pixels per frame

      let change = 0;

      // Calculate scroll speed based on distance from edge
      if (x < left + zone) {
        // Scroll Left
        const intensity = Math.max(0, (left + zone - x) / zone);
        change = -Math.pow(intensity, 2) * maxSpeed;
      } else if (x > right - zone) {
        // Scroll Right
        const intensity = Math.max(0, (x - (right - zone)) / zone);
        change = Math.pow(intensity, 2) * maxSpeed;
      }

      if (change !== 0) {
        container.scrollLeft += change;
      }

      animationFrameId = requestAnimationFrame(scrollLoop);
    };

    animationFrameId = requestAnimationFrame(scrollLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [draggedItemId]);

  const openAddModal = () => {
    setFormData({
      company: '',
      position: '',
      location: '',
      salary: '',
      link: '',
      notes: '',
      status: ApplicationStatus.RESEARCH,
      roleType: 'PM'
    });
    setShowModal(true);
  };

  const openEditModal = (job: JobApplication) => {
    setFormData({ ...job });
    setShowModal(true);
  };

  const handleSaveJob = (data: Partial<JobApplication>) => {
    if (data.id) {
      // Edit existing
      onEditJob({
        ...data,
        lastUpdated: new Date().toISOString().split('T')[0],
        // Preserve link field - convert empty string to undefined for optional field
        link: data.link && data.link.trim() ? data.link.trim() : undefined
      } as JobApplication);
    } else {
      // Create new
      const job: JobApplication = {
        id: Math.random().toString(36).substr(2, 9),
        company: data.company!,
        position: data.position!,
        location: data.location || 'Remote',
        status: data.status || ApplicationStatus.RESEARCH,
        roleType: data.roleType || 'PM',
        dateAdded: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString().split('T')[0],
        notes: data.notes || '',
        salary: data.salary,
        // Preserve link field - convert empty string to undefined for optional field
        link: data.link && data.link.trim() ? data.link.trim() : undefined
      };
      onAddJob(job);
    }
    setShowModal(false);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteJob(deleteId);
      setDeleteId(null);
    }
  };

  const handleExportCSV = () => {
    const BOM = "\uFEFF";
    const headers = [
      t.board.placeholders.company,
      t.board.placeholders.position,
      t.board.labels.status,
      t.board.labels.role,
      t.board.labels.location,
      t.board.labels.salary,
      t.board.labels.link,
      t.board.labels.dateAdded,
      t.board.labels.lastUpdated,
      t.board.labels.notes
    ];

    const escapeCsv = (str: string | undefined) => {
      if (!str) return '""';
      return `"${str.replace(/"/g, '""')}"`;
    };

    const csvContent = [
      headers.join(','),
      ...jobs.map(job => [
        escapeCsv(job.company),
        escapeCsv(job.position),
        escapeCsv(t.board.status[job.status]),
        escapeCsv(job.roleType),
        escapeCsv(job.location),
        escapeCsv(job.salary),
        escapeCsv(job.link),
        escapeCsv(job.dateAdded),
        escapeCsv(job.lastUpdated),
        escapeCsv(job.notes?.replace(/\n/g, ' '))
      ].join(','))
    ].join('\n');

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `career_track_jobs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Mouse Drag Handlers ---
  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    setDraggedItemId(jobId);
    e.dataTransfer.setData('jobId', jobId);
    e.dataTransfer.effectAllowed = 'move';
    // Set transparent image to avoid default ghost blocking view
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragEnd = () => {
    setDraggedItemId(null);
    setDragOverColumn(null);
    pointerRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    // Update pointer position for auto-scroll
    pointerRef.current = { x: e.clientX, y: e.clientY };

    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    pointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const currentTarget = e.currentTarget;
    const relatedTarget = e.relatedTarget as Node;
    if (currentTarget.contains(relatedTarget)) return;
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: ApplicationStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    setDraggedItemId(null);
    pointerRef.current = null;
    const jobId = e.dataTransfer.getData('jobId');
    if (jobId) {
      const job = jobs.find(j => j.id === jobId);
      if (job && job.status !== status) {
        onUpdateStatus(jobId, status);
      }
    }
  };

  // --- Touch Drag Handlers ---
  const handleTouchStart = (e: React.TouchEvent, job: JobApplication) => {
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;

    // Start a timer for long press
    dragItemTimer.current = setTimeout(() => {
      setDraggedItemId(job.id);
      setIsTouchDragging(true);
      setTouchPos({ x, y });
      pointerRef.current = { x, y }; // Init pointer ref for scroll
      document.body.style.overflow = 'hidden'; // Lock scroll
      // Try to vibrate for feedback
      if (navigator.vibrate) navigator.vibrate(50);
    }, 300); // 300ms long press to activate drag
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isTouchDragging) {
      // If we move before the timer fires, it's a scroll, not a drag. Cancel timer.
      if (dragItemTimer.current) {
        clearTimeout(dragItemTimer.current);
        dragItemTimer.current = null;
      }
      return;
    }

    // If dragging, prevent default processing (scrolling)
    if (e.cancelable) e.preventDefault();

    const touch = e.touches[0];
    setTouchPos({ x: touch.clientX, y: touch.clientY });
    pointerRef.current = { x: touch.clientX, y: touch.clientY }; // Update pointer ref

    // Identify which column is under the finger
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const column = element?.closest('[data-column-id]');

    if (column) {
      const status = column.getAttribute('data-column-id') as ApplicationStatus;
      if (dragOverColumn !== status) setDragOverColumn(status);
    } else {
      setDragOverColumn(null);
    }
  };

  const handleTouchEnd = () => {
    // Clear timer if it's pending
    if (dragItemTimer.current) {
      clearTimeout(dragItemTimer.current);
      dragItemTimer.current = null;
    }

    if (isTouchDragging) {
      if (draggedItemId && dragOverColumn) {
        onUpdateStatus(draggedItemId, dragOverColumn);
      }
      // Reset
      document.body.style.overflow = '';
      setIsTouchDragging(false);
      setTouchPos(null);
      setDraggedItemId(null);
      setDragOverColumn(null);
      pointerRef.current = null;
    }
  };

  const getNextStatus = (current: ApplicationStatus): ApplicationStatus | null => {
    const idx = columns.indexOf(current);
    if (idx < columns.length - 1) return columns[idx + 1];
    return null;
  };

  const filteredJobs = jobs.filter(j => filter === 'All' || j.roleType === filter);

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col relative">

      {/* Ghost Element for both Mouse (via state if needed, but using browser default for now) and Touch Drag */}
      {isTouchDragging && touchPos && draggedItemId && (
        <div
          style={{
            position: 'fixed',
            left: touchPos.x,
            top: touchPos.y,
            width: '280px',
            pointerEvents: 'none',
            zIndex: 9999,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {(() => {
            const job = jobs.find(j => j.id === draggedItemId);
            return job ? (
              <JobCard
                job={job}
                language={language}
                isGhost={true}
                onEdit={() => { }}
                onDelete={() => { }}
                onDragStart={() => { }}
                onDragEnd={() => { }}
                onTouchStart={() => { }}
              />
            ) : null;
          })()}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <DeleteConfirmModal
          language={language}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {/* Add/Edit Job Modal */}
      {showModal && (
        <JobModal
          key={formData.id || 'new'} // Force remount when editing different job
          initialData={formData}
          language={language}
          onSave={handleSaveJob}
          onCancel={() => setShowModal(false)}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 shrink-0 transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.board.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t.board.subtitle}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium shadow-sm"
            title={t.board.exportCSV}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t.board.exportCSV}</span>
          </button>

          <div className="flex items-center bg-gray-50 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
            {['All', 'PM', 'QA'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === f ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t.board.addJob}
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-x-auto overflow-y-hidden pb-2"
        ref={scrollContainerRef}
        onDragOver={handleContainerDragOver} // Track drag over globally in container
      >
        <div className="flex gap-4 min-w-[1200px] h-full">
          {columns.map(status => (
            <div
              key={status}
              data-column-id={status}
              onDragOver={(e) => handleDragOver(e, status)}
              onDrop={(e) => handleDrop(e, status)}
              onDragLeave={handleDragLeave}
              className={`flex-1 flex flex-col rounded-xl border-2 transition-all duration-200 min-w-[280px] ${dragOverColumn === status
                  ? 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-400 border-dashed shadow-inner scale-[1.01]'
                  : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 border-solid'
                }`}
            >
              <div className={`p-3 border-b border-gray-200 dark:border-gray-700 rounded-t-xl font-semibold text-sm flex justify-between items-center transition-colors ${dragOverColumn === status ? 'bg-indigo-100/50 dark:bg-indigo-900/50' :
                  status === ApplicationStatus.REJECTED ? 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                    status === ApplicationStatus.OFFER ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                }`}>
                {t.board.status[status]}
                <span className="bg-white dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs border dark:border-gray-600 shadow-sm">
                  {filteredJobs.filter(j => j.status === status).length}
                </span>
              </div>

              <div className="p-2 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                {filteredJobs.filter(j => j.status === status).map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    language={language}
                    draggedItemId={draggedItemId}
                    onEdit={openEditModal}
                    onDelete={setDeleteId}
                    onNextStatus={(() => {
                      const next = getNextStatus(job.status);
                      return next ? () => onUpdateStatus(job.id, next) : undefined;
                    })()}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                  />
                ))}
                {/* Visual Placeholder for drop zone */}
                {dragOverColumn === status && (
                  <div className="h-24 rounded-lg border-2 border-dashed border-indigo-200 dark:border-indigo-700 bg-indigo-50/30 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-300 dark:text-indigo-400 text-xs font-medium animate-pulse">
                    Drop Here
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};