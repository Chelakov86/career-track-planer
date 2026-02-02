import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { JobApplication, ApplicationStatus, Language } from '../types';
import { TRANSLATIONS, STATUS_COLORS } from '../constants';
import { Plus, Download, Filter, ChevronDown, ChevronUp, ArrowUpDown, Search, X, Calendar, SearchX } from 'lucide-react';
import { JobCard } from './JobCard';
import { JobModal } from './JobModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface JobBoardProps {
  jobs: JobApplication[];
  onAddJob: (job: JobApplication) => void;
  onEditJob: (job: JobApplication) => void;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onDeleteJob: (id: string) => void;
  language: Language;
}

export const JobBoard: React.FC<JobBoardProps> = ({ jobs, onAddJob, onEditJob, onUpdateStatus, onDeleteJob, language }) => {
  // Filters & sorting
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus[] | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [dateAddedFrom, setDateAddedFrom] = useState<string>('');
  const [dateAddedTo, setDateAddedTo] = useState<string>('');
  const [lastUpdatedFrom, setLastUpdatedFrom] = useState<string>('');
  const [lastUpdatedTo, setLastUpdatedTo] = useState<string>('');
  const [sortField, setSortField] = useState<'dateAdded' | 'lastUpdated' | 'company' | 'position' | 'status'>('dateAdded');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [jobToDelete, setJobToDelete] = useState<JobApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<JobApplication>>({});
  const [viewJobId, setViewJobId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('edit');
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

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
  const sortRef = useRef<HTMLDivElement>(null);

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

      const rect = container.getBoundingClientRect();
      const speed = 15;
      const threshold = 100;

      if (x < rect.left + threshold) {
        container.scrollLeft -= speed;
      } else if (x > rect.right - threshold) {
        container.scrollLeft += speed;
      }

      animationFrameId = requestAnimationFrame(scrollLoop);
    };

    animationFrameId = requestAnimationFrame(scrollLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [draggedItemId]);

  // Handle outside clicks for sort dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setShowSort(false);
      }
    };
    if (showSort) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSort]);

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
    setModalMode('edit');
    setShowModal(true);
  };

  const openViewModal = (job: JobApplication) => {
    setFormData({ ...job });
    setViewJobId(job.id);
    setModalMode('view');
    setShowModal(true);
  };

  const openEditModal = (job: JobApplication) => {
    setFormData({ ...job });
    setModalMode('edit');
    setShowModal(true);
  };

  const switchToEditMode = () => {
    setModalMode('edit');
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
    if (jobToDelete) {
      onDeleteJob(jobToDelete.id);
      setJobToDelete(null);
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
  const visibleJobs = useMemo(() => {
    let result = [...jobs];

    // Status filter
    if (statusFilter !== 'ALL') {
      result = result.filter(j => statusFilter.includes(j.status));
    }

    // Text search (company, position, notes, location) - using debounced value
    const q = debouncedSearchQuery.trim().toLowerCase();
    if (q) {
      result = result.filter(j => {
        return (
          j.company.toLowerCase().includes(q) ||
          j.position.toLowerCase().includes(q) ||
          (j.location && j.location.toLowerCase().includes(q)) ||
          (j.notes && j.notes.toLowerCase().includes(q))
        );
      });
    }

    // Date range filters (dateAdded)
    if (dateAddedFrom) {
      result = result.filter(j => j.dateAdded >= dateAddedFrom);
    }
    if (dateAddedTo) {
      result = result.filter(j => j.dateAdded <= dateAddedTo);
    }

    // Date range filters (lastUpdated)
    if (lastUpdatedFrom) {
      result = result.filter(j => j.lastUpdated >= lastUpdatedFrom);
    }
    if (lastUpdatedTo) {
      result = result.filter(j => j.lastUpdated <= lastUpdatedTo);
    }

    // Sorting
    const statusOrder = columns;
    result.sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      let cmp = 0;

      switch (sortField) {
        case 'company':
          cmp = a.company.localeCompare(b.company);
          break;
        case 'position':
          cmp = a.position.localeCompare(b.position);
          break;
        case 'status':
          cmp = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
          break;
        case 'lastUpdated':
          if (a.lastUpdated === b.lastUpdated) cmp = 0;
          else cmp = a.lastUpdated < b.lastUpdated ? -1 : 1;
          break;
        case 'dateAdded':
        default:
          if (a.dateAdded === b.dateAdded) cmp = 0;
          else cmp = a.dateAdded < b.dateAdded ? -1 : 1;
          break;
      }

      return cmp * dir;
    });

    return result;
  }, [jobs, statusFilter, debouncedSearchQuery, dateAddedFrom, dateAddedTo, lastUpdatedFrom, lastUpdatedTo, sortField, sortDirection, columns]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'ALL') count++;
    if (debouncedSearchQuery.trim()) count++;
    if (dateAddedFrom || dateAddedTo) count++;
    if (lastUpdatedFrom || lastUpdatedTo) count++;
    return count;
  }, [statusFilter, debouncedSearchQuery, dateAddedFrom, dateAddedTo, lastUpdatedFrom, lastUpdatedTo]);

  // Check if any filters are active
  const hasActiveFilters = activeFilterCount > 0;

  const toggleStatusInFilter = (status: ApplicationStatus) => {
    if (statusFilter === 'ALL') {
      setStatusFilter([status]);
      return;
    }
    if (statusFilter.includes(status)) {
      const next = statusFilter.filter(s => s !== status);
      setStatusFilter(next.length === 0 ? 'ALL' : next);
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  // Date preset helpers
  const setDatePreset = useCallback((preset: 'last7' | 'last30' | 'thisMonth', field: 'dateAdded' | 'lastUpdated') => {
    const today = new Date();
    let fromDate: Date;

    switch (preset) {
      case 'last7':
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 7);
        break;
      case 'last30':
        fromDate = new Date(today);
        fromDate.setDate(today.getDate() - 30);
        break;
      case 'thisMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
    }

    const fromStr = fromDate.toISOString().split('T')[0];
    const toStr = today.toISOString().split('T')[0];

    if (field === 'dateAdded') {
      setDateAddedFrom(fromStr);
      setDateAddedTo(toStr);
    } else {
      setLastUpdatedFrom(fromStr);
      setLastUpdatedTo(toStr);
    }
  }, []);

  const clearDateFilter = useCallback((field: 'dateAdded' | 'lastUpdated') => {
    if (field === 'dateAdded') {
      setDateAddedFrom('');
      setDateAddedTo('');
    } else {
      setLastUpdatedFrom('');
      setLastUpdatedTo('');
    }
  }, []);

  const resetFilters = () => {
    setStatusFilter('ALL');
    setSearchQuery('');
    setDateAddedFrom('');
    setDateAddedTo('');
    setLastUpdatedFrom('');
    setLastUpdatedTo('');
    setSortField('dateAdded');
    setSortDirection('desc');
  };

  // Remove individual filter chip
  const removeFilter = useCallback((filterType: string) => {
    switch (filterType) {
      case 'status':
        setStatusFilter('ALL');
        break;
      case 'search':
        setSearchQuery('');
        break;
      case 'dateAdded':
        setDateAddedFrom('');
        setDateAddedTo('');
        break;
      case 'lastUpdated':
        setLastUpdatedFrom('');
        setLastUpdatedTo('');
        break;
    }
  }, []);

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
      {jobToDelete && (
        <DeleteConfirmModal
          language={language}
          jobName={{ company: jobToDelete.company, position: jobToDelete.position }}
          onConfirm={confirmDelete}
          onCancel={() => setJobToDelete(null)}
        />
      )}

      {/* Add/Edit/View Job Modal */}
      {showModal && (
        <JobModal
          key={formData.id || 'new'} // Force remount when editing different job
          initialData={formData}
          language={language}
          mode={modalMode}
          onSave={handleSaveJob}
          onCancel={() => {
            setShowModal(false);
            setViewJobId(null);
          }}
          onEdit={modalMode === 'view' ? switchToEditMode : undefined}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 shrink-0 transition-colors">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.board.title}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{t.board.subtitle}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              setShowFilters(!showFilters);
              if (!showFilters) setShowSort(false);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm border ${showFilters || hasActiveFilters
              ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800'
              : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            title={t.board.filters?.status || 'Filters'}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden sm:inline">{t.board.filters?.status || 'Filters'}</span>
            {activeFilterCount > 0 && (
              <span className="bg-indigo-600 dark:bg-indigo-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="relative" ref={sortRef}>
            <button
              onClick={() => {
                setShowSort(!showSort);
                if (!showSort) setShowFilters(false);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm border ${showSort
                ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 border-indigo-200 dark:border-indigo-800'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              title={t.board.filters?.sortBy || 'Sort'}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span className="hidden sm:inline">{t.board.filters?.sortBy || 'Sort'}</span>
              {showSort ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSort && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 py-2 animate-in fade-in zoom-in duration-200">
                {[
                  { value: 'dateAdded_desc', label: t.board.filters?.sortOptions?.dateAddedDesc || 'Date added (newest)' },
                  { value: 'dateAdded_asc', label: t.board.filters?.sortOptions?.dateAddedAsc || 'Date added (oldest)' },
                  { value: 'lastUpdated_desc', label: t.board.filters?.sortOptions?.lastUpdatedDesc || 'Last updated (newest)' },
                  { value: 'lastUpdated_asc', label: t.board.filters?.sortOptions?.lastUpdatedAsc || 'Last updated (oldest)' },
                  { value: 'company_asc', label: t.board.filters?.sortOptions?.companyAsc || 'Company (A–Z)' },
                  { value: 'company_desc', label: t.board.filters?.sortOptions?.companyDesc || 'Company (Z–A)' },
                  { value: 'position_asc', label: t.board.filters?.sortOptions?.positionAsc || 'Position (A–Z)' },
                  { value: 'position_desc', label: t.board.filters?.sortOptions?.positionDesc || 'Position (Z–A)' },
                  { value: 'status_asc', label: t.board.filters?.sortOptions?.statusAsc || 'Status' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      const [field, dir] = opt.value.split('_') as [typeof sortField, typeof sortDirection];
                      setSortField(field);
                      setSortDirection(dir);
                      setShowSort(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${`${sortField}_${sortDirection}` === opt.value
                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    {opt.label}
                    {`${sortField}_${sortDirection}` === opt.value && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium shadow-sm"
            title={t.board.exportCSV}
          >
            <Download className="w-4 h-4" />
            <span className="hidden lg:inline">{t.board.exportCSV}</span>
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-medium shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t.board.addJob}</span>
            <span className="sm:hidden">{t.board.addJob.split(' ')[0]}</span>
          </button>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t.board.filters?.activeFilters || 'Active filters:'}
          </span>
          {statusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-700">
              {t.board.labels.status}: {statusFilter.map(s => t.board.status[s]).join(', ')}
              <button onClick={() => removeFilter('status')} className="hover:text-indigo-900 dark:hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {debouncedSearchQuery.trim() && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
              {t.board.filters?.search || 'Search'}: "{debouncedSearchQuery}"
              <button onClick={() => removeFilter('search')} className="hover:text-blue-900 dark:hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(dateAddedFrom || dateAddedTo) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-200 border border-green-200 dark:border-green-700">
              {t.board.labels.dateAdded}: {dateAddedFrom || '...'} - {dateAddedTo || '...'}
              <button onClick={() => removeFilter('dateAdded')} className="hover:text-green-900 dark:hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(lastUpdatedFrom || lastUpdatedTo) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-50 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-700">
              {t.board.labels.lastUpdated}: {lastUpdatedFrom || '...'} - {lastUpdatedTo || '...'}
              <button onClick={() => removeFilter('lastUpdated')} className="hover:text-yellow-900 dark:hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={resetFilters}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:underline"
          >
            {t.board.filters?.clearAll || 'Clear all'}
          </button>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 shrink-0">
        <span>
          {t.board.filters?.showing || 'Showing'} <span className="font-semibold text-gray-700 dark:text-gray-200">{visibleJobs.length}</span> {t.board.filters?.of || 'of'} <span className="font-semibold text-gray-700 dark:text-gray-200">{jobs.length}</span> {t.board.filters?.applications || 'applications'}
        </span>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs"
          >
            {t.board.filters?.clearAll || 'Clear all filters'}
          </button>
        )}
      </div>

      {/* Collapsible Panels */}
      <div className="flex flex-col gap-3 shrink-0">
        {/* Filters bar */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden transition-all duration-300 ${showFilters ? 'p-4 opacity-100' : 'h-0 p-0 opacity-0 border-none'
          }`}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {t.board.filters?.search || 'Search'}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.board.filters?.searchPlaceholder || 'Search company, position, location, notes...'}
                    className="w-full px-3 py-2 pr-8 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status filters with colored chips */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    {t.board.labels.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('ALL')}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    {t.board.filters?.allStatuses || 'All'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {columns.map(status => {
                    const isSelected = statusFilter === 'ALL' || statusFilter.includes(status);
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => toggleStatusInFilter(status)}
                        className={`px-2 py-1 text-[10px] rounded-full border transition-colors ${
                          isSelected
                            ? STATUS_COLORS[status]
                            : 'bg-gray-50 dark:bg-gray-900/50 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-800 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                      >
                        {t.board.status[status]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Date filters with presets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t.board.labels.dateAdded}
                  </label>
                  {(dateAddedFrom || dateAddedTo) && (
                    <button
                      onClick={() => clearDateFilter('dateAdded')}
                      className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={dateAddedFrom}
                    onChange={(e) => setDateAddedFrom(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  />
                  <span className="text-gray-400 text-xs">→</span>
                  <input
                    type="date"
                    value={dateAddedTo}
                    onChange={(e) => setDateAddedTo(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setDatePreset('last7', 'dateAdded')}
                    className="px-2 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t.board.filters?.last7Days || 'Last 7 days'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset('last30', 'dateAdded')}
                    className="px-2 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t.board.filters?.last30Days || 'Last 30 days'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset('thisMonth', 'dateAdded')}
                    className="px-2 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t.board.filters?.thisMonth || 'This month'}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {t.board.labels.lastUpdated}
                  </label>
                  {(lastUpdatedFrom || lastUpdatedTo) && (
                    <button
                      onClick={() => clearDateFilter('lastUpdated')}
                      className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="date"
                    value={lastUpdatedFrom}
                    onChange={(e) => setLastUpdatedFrom(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  />
                  <span className="text-gray-400 text-xs">→</span>
                  <input
                    type="date"
                    value={lastUpdatedTo}
                    onChange={(e) => setLastUpdatedTo(e.target.value)}
                    className="flex-1 px-2 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100"
                  />
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setDatePreset('last7', 'lastUpdated')}
                    className="px-2 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t.board.filters?.last7Days || 'Last 7 days'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset('last30', 'lastUpdated')}
                    className="px-2 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t.board.filters?.last30Days || 'Last 30 days'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDatePreset('thisMonth', 'lastUpdated')}
                    className="px-2 py-0.5 text-[10px] rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {t.board.filters?.thisMonth || 'This month'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:underline"
              >
                {t.board.filters?.reset || 'Reset all filters'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Empty state when filters return no results */}
      {visibleJobs.length === 0 && hasActiveFilters && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-8 text-center max-w-md">
            <SearchX className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t.board.filters?.noResults || 'No applications found'}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t.board.filters?.noResultsMessage || 'Try adjusting your filters or search terms to find what you\'re looking for.'}
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors text-sm font-medium"
            >
              <X className="w-4 h-4" />
              {t.board.filters?.clearAll || 'Clear all filters'}
            </button>
          </div>
        </div>
      )}

      <div
        className={`flex-1 overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 ${visibleJobs.length === 0 && hasActiveFilters ? 'hidden' : ''}`}
        ref={scrollContainerRef}
        onDragOver={handleContainerDragOver} // Track drag over globally in container
      >
        <div className="flex gap-4 min-w-max 2xl:min-w-0 h-full pb-2">
          {columns.map(status => (
            <div
              key={status}
              data-column-id={status}
              onDragOver={(e) => handleDragOver(e, status)}
              onDrop={(e) => handleDrop(e, status)}
              onDragLeave={handleDragLeave}
              className={`flex-1 flex flex-col rounded-xl border-2 transition-all duration-200 min-w-[280px] 2xl:min-w-0 ${dragOverColumn === status
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
                  {visibleJobs.filter(j => j.status === status).length}
                </span>
              </div>

              <div className="p-2 space-y-3 overflow-y-auto flex-1 custom-scrollbar">
                {visibleJobs.filter(j => j.status === status).map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    language={language}
                    draggedItemId={draggedItemId}
                    onView={openViewModal}
                    onEdit={openEditModal}
                    onDelete={(id) => {
                      const job = jobs.find(j => j.id === id);
                      if (job) setJobToDelete(job);
                    }}
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
    </div >
  );
};