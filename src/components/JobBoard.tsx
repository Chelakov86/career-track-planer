import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { JobApplication, ApplicationStatus, Language } from '../types';
import { TRANSLATIONS, STATUS_COLORS, STATUS_COUNT_COLORS } from '../constants';
import { Plus, Download, Filter, ChevronDown, ChevronUp, ArrowUpDown, Search, X, Calendar, SearchX, Inbox, Check, MoreHorizontal, ArrowUp } from 'lucide-react';
import { JobCard } from './JobCard';
import { JobModal } from './JobModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { MobileStageDock } from './MobileStageDock';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { generateJobsCSV, downloadFile } from '../lib/csvExport';
import { clearPendingCalendarImport, readPendingCalendarImport } from '../lib/googleCalendarAuth';
import { formatLocalDate, getLastUpdatedTimestamp } from '../lib/date';

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

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 639px)').matches);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

const BOARD_STATE_KEY = 'careertrack.boardState';
const MOBILE_PAGE_SIZE = 8;

interface BoardPersistState {
  statusFilter: ApplicationStatus[] | 'ALL';
  searchQuery: string;
  dateAddedFrom: string;
  dateAddedTo: string;
  lastUpdatedFrom: string;
  lastUpdatedTo: string;
  sortField: 'dateAdded' | 'lastUpdated' | 'company' | 'position';
  sortDirection: 'asc' | 'desc';
  mobileOpenStatuses: ApplicationStatus[];
}

const readBoardState = (): Partial<BoardPersistState> => {
  try {
    const raw = sessionStorage.getItem(BOARD_STATE_KEY);
    return raw ? JSON.parse(raw) as Partial<BoardPersistState> : {};
  } catch {
    return {};
  }
};

interface JobBoardProps {
  jobs: JobApplication[];
  onAddJob: (job: JobApplication) => Promise<void>;
  onEditJob: (job: JobApplication) => Promise<void>;
  onUpdateStatus: (id: string, status: ApplicationStatus) => Promise<void>;
  onDeleteJob: (id: string) => Promise<void>;
  onRefetchJobs?: () => void | Promise<void>;
  language: Language;
  loading?: boolean;
}

export const JobBoard: React.FC<JobBoardProps> = ({ jobs, onAddJob, onEditJob, onUpdateStatus, onDeleteJob, onRefetchJobs, language, loading }) => {
  const restoredBoardState = useRef(readBoardState());
  const hasRestoredMobileOpen = useRef((restoredBoardState.current.mobileOpenStatuses?.length ?? 0) > 0);

  // Filters & sorting
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus[] | 'ALL'>(restoredBoardState.current.statusFilter ?? 'ALL');
  const [searchQuery, setSearchQuery] = useState(restoredBoardState.current.searchQuery ?? '');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [dateAddedFrom, setDateAddedFrom] = useState<string>(restoredBoardState.current.dateAddedFrom ?? '');
  const [dateAddedTo, setDateAddedTo] = useState<string>(restoredBoardState.current.dateAddedTo ?? '');
  const [lastUpdatedFrom, setLastUpdatedFrom] = useState<string>(restoredBoardState.current.lastUpdatedFrom ?? '');
  const [lastUpdatedTo, setLastUpdatedTo] = useState<string>(restoredBoardState.current.lastUpdatedTo ?? '');
  const [sortField, setSortField] = useState<'dateAdded' | 'lastUpdated' | 'company' | 'position'>(restoredBoardState.current.sortField ?? 'dateAdded');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(restoredBoardState.current.sortDirection ?? 'desc');
  const [jobToDelete, setJobToDelete] = useState<JobApplication | null>(null);
  const [moveToJob, setMoveToJob] = useState<JobApplication | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<JobApplication>>({});
  const [viewJobId, setViewJobId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('edit');
  const [resumeCalendarImport, setResumeCalendarImport] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);
  const [showEmptyColumns, setShowEmptyColumns] = useState(true);
  const [mobileOpenStatuses, setMobileOpenStatuses] = useState<ApplicationStatus[]>(
    hasRestoredMobileOpen.current ? restoredBoardState.current.mobileOpenStatuses! : []
  );
  const [mobileVisibleCounts, setMobileVisibleCounts] = useState<Partial<Record<ApplicationStatus, number>>>({});
  const [showBackToTop, setShowBackToTop] = useState(false);
  const isMobile = useIsMobile();
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const filterSheetRef = useRef<HTMLDivElement>(null);
  const moveSheetRef = useRef<HTMLDivElement>(null);
  const mobileActionsRef = useRef<HTMLDivElement>(null);
  const mobileSortSheetRef = useRef<HTMLDivElement>(null);
  useFocusTrap(filterSheetRef, showFilters);
  useFocusTrap(moveSheetRef, Boolean(moveToJob));
  useFocusTrap(mobileActionsRef, showMobileActions);
  useFocusTrap(mobileSortSheetRef, showMobileSort);

  useEffect(() => {
    const refreshCurrentTime = () => {
      if (!document.hidden) setCurrentTime(new Date());
    };
    const timer = window.setInterval(refreshCurrentTime, 60 * 1000);
    document.addEventListener('visibilitychange', refreshCurrentTime);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshCurrentTime);
    };
  }, []);

  // Drag and Drop State (Mouse & Touch)
  const [dragOverColumn, setDragOverColumn] = useState<ApplicationStatus | null>(null);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

  // Toast + undo for status moves
  const [toast, setToast] = useState<{
    kind: 'info' | 'error';
    text: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Persist board view state across navigation (filters, sort, accordion)
  useEffect(() => {
    const state: BoardPersistState = {
      statusFilter,
      searchQuery,
      dateAddedFrom,
      dateAddedTo,
      lastUpdatedFrom,
      lastUpdatedTo,
      sortField,
      sortDirection,
      mobileOpenStatuses,
    };
    sessionStorage.setItem(BOARD_STATE_KEY, JSON.stringify(state));
  }, [statusFilter, searchQuery, dateAddedFrom, dateAddedTo, lastUpdatedFrom, lastUpdatedTo, sortField, sortDirection, mobileOpenStatuses]);

  // Auto-scroll Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ x: number, y: number } | null>(null);

  // Touch specific state
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [touchPos, setTouchPos] = useState<{ x: number, y: number } | null>(null);
  const dragItemTimer = useRef<any>(null);
  const sortRef = useRef<HTMLDivElement>(null);
  const didInitMobileOpen = useRef(false);

  // Horizontal scroll affordance (edge fades)
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  const updateScrollFades = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 4);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const getScrollOwner = useCallback(() => (
    scrollContainerRef.current?.closest('main') ?? document.querySelector('main')
  ), []);

  const getPageScrollTop = useCallback(() => {
    const main = getScrollOwner();
    const mainScrollTop = main instanceof HTMLElement ? main.scrollTop : 0;
    return Math.max(mainScrollTop, window.scrollY);
  }, [getScrollOwner]);

  const updateBackToTop = useCallback(() => {
    setShowBackToTop(getPageScrollTop() > window.innerHeight * 0.75);
  }, [getPageScrollTop]);

  const t = TRANSLATIONS[language];
  const columns = useMemo(() => Object.values(ApplicationStatus), []);

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

  // Handle Escape key to dismiss board overlays.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showSort) setShowSort(false);
        if (showFilters) setShowFilters(false);
        if (showMobileActions) setShowMobileActions(false);
        if (showMobileSort) setShowMobileSort(false);
        if (moveToJob) setMoveToJob(null);
      }
    };
    if (showSort || showFilters || showMobileActions || showMobileSort || moveToJob) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSort, showFilters, showMobileActions, showMobileSort, moveToJob]);

  const openAddModal = () => {
    setResumeCalendarImport(false);
    setFormData({
      company: '',
      position: '',
      location: '',
      salary: '',
      link: '',
      notes: '',
      status: ApplicationStatus.RESEARCH,
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const openViewModal = useCallback((job: JobApplication) => {
    setResumeCalendarImport(false);
    setFormData({ ...job });
    setViewJobId(job.id);
    setModalMode('view');
    setShowModal(true);
  }, []);

  const openEditModal = useCallback((job: JobApplication) => {
    setResumeCalendarImport(false);
    setFormData({ ...job });
    setModalMode('edit');
    setShowModal(true);
  }, []);

  const switchToEditMode = () => {
    setResumeCalendarImport(false);
    setModalMode('edit');
  };

  useEffect(() => {
    const pendingImport = readPendingCalendarImport();
    if (!pendingImport || jobs.length === 0) return;

    const job = jobs.find((candidate) => candidate.id === pendingImport.jobId);
    if (!job) return;

    setFormData({ ...job });
    setViewJobId(null);
    setModalMode('edit');
    setResumeCalendarImport(true);
    setShowModal(true);
    clearPendingCalendarImport();
  }, [jobs]);

  const toggleMobileStatus = (status: ApplicationStatus) => {
    setMobileOpenStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const handleSaveJob = async (data: Partial<JobApplication>) => {
    const today = formatLocalDate();

    try {
      if (data.id) {
        // Edit existing
        await onEditJob({
          ...data,
          lastUpdated: today,
          // Preserve link field - convert empty string to undefined for optional field
          link: data.link && data.link.trim() ? data.link.trim() : undefined
        } as JobApplication);
        await onRefetchJobs?.();
      } else {
        // Create new
        const job: JobApplication = {
          id: Math.random().toString(36).substr(2, 9),
          company: data.company!,
          position: data.position!,
          location: data.location?.trim() || '',
          status: data.status || ApplicationStatus.RESEARCH,
          dateAdded: today,
          lastUpdated: today,
          notes: data.notes || '',
          salary: data.salary,
          // Preserve link field - convert empty string to undefined for optional field
          link: data.link && data.link.trim() ? data.link.trim() : undefined
        };
        await onAddJob(job);
        await onRefetchJobs?.();
      }
      setShowModal(false);
    } catch {
      setToast({ kind: 'error', text: t.board.errorSave });
    }
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;
    const where = jobToDelete.company
      ? `${jobToDelete.company}: ${t.board.deleted}`
      : t.board.deleted;
    try {
      await onDeleteJob(jobToDelete.id);
      setJobToDelete(null);
      setToast({ kind: 'info', text: where });
    } catch {
      setToast({ kind: 'error', text: t.board.errorDelete });
    }
  };

  const undoLastMove = useCallback((move: { jobId: string; from: ApplicationStatus }) => {
    setToast(null);
    onUpdateStatus(move.jobId, move.from).catch(() => {
      setToast({ kind: 'error', text: t.board.errorStatusUpdate });
    });
  }, [onUpdateStatus, t]);

  const recordMove = useCallback(async (jobId: string, to: ApplicationStatus) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job || job.status === to) return;
    try {
      await onUpdateStatus(jobId, to);
      const move = { jobId, from: job.status, to, company: job.company };
      setToast({
        kind: 'info',
        text: `${job.company} → ${t.board.status[to]}`,
        actionLabel: t.board.undo,
        onAction: () => undoLastMove(move)
      });
    } catch {
      setToast({ kind: 'error', text: t.board.errorStatusUpdate });
    }
  }, [jobs, onUpdateStatus, t, undoLastMove]);

  const handleExportCSV = () => {
    const csvContent = generateJobsCSV(jobs, language);
    const filename = `career_track_jobs_${new Date().toISOString().split('T')[0]}.csv`;
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
  };

  // --- Mouse Drag Handlers ---
  const handleDragStart = useCallback((e: React.DragEvent, jobId: string) => {
    setDraggedItemId(jobId);
    e.dataTransfer.setData('jobId', jobId);
    e.dataTransfer.effectAllowed = 'move';
    // Set transparent image to avoid default ghost blocking view
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItemId(null);
    setDragOverColumn(null);
    pointerRef.current = null;
  }, []);

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
        recordMove(jobId, status);
      }
    }
  };

  // --- Touch Drag Handlers ---
  const handleTouchStart = useCallback((e: React.TouchEvent, job: JobApplication) => {
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
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
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
  }, [isTouchDragging, dragOverColumn]);

  const handleTouchEnd = useCallback(() => {
    // Clear timer if it's pending
    if (dragItemTimer.current) {
      clearTimeout(dragItemTimer.current);
      dragItemTimer.current = null;
    }

    if (isTouchDragging) {
      if (draggedItemId && dragOverColumn) {
        recordMove(draggedItemId, dragOverColumn);
      }
      // Reset
      document.body.style.overflow = '';
      setIsTouchDragging(false);
      setTouchPos(null);
      setDraggedItemId(null);
      setDragOverColumn(null);
      pointerRef.current = null;
    }
  }, [isTouchDragging, draggedItemId, dragOverColumn, recordMove]);

  const getNextStatus = useCallback((current: ApplicationStatus): ApplicationStatus | null => {
    const idx = columns.indexOf(current);
    if (idx < columns.length - 1) return columns[idx + 1];
    return null;
  }, [columns]);

  const handleDeleteRequest = useCallback((job: JobApplication) => {
    setJobToDelete(job);
  }, []);

  const handleNextStatus = useCallback((job: JobApplication) => {
    const next = getNextStatus(job.status);
    if (next) {
      recordMove(job.id, next);
    }
  }, [getNextStatus, recordMove]);
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
        case 'lastUpdated':
          cmp = getLastUpdatedTimestamp(a.updatedAt, a.lastUpdated)
            - getLastUpdatedTimestamp(b.updatedAt, b.lastUpdated);
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

  const { statusCounts, jobsByStatus } = useMemo(() => {
    const counts = {} as Record<ApplicationStatus, number>;
    const byStatus = {} as Record<ApplicationStatus, JobApplication[]>;

    columns.forEach((status) => {
      counts[status] = 0;
      byStatus[status] = [];
    });

    visibleJobs.forEach((job) => {
      if (byStatus[job.status]) {
        counts[job.status]++;
        byStatus[job.status].push(job);
      }
    });

    return { statusCounts: counts, jobsByStatus: byStatus };
  }, [columns, visibleJobs]);

  const showNextMobileJobs = useCallback((status: ApplicationStatus, total: number) => {
    setMobileVisibleCounts((prev) => ({
      ...prev,
      [status]: Math.min((prev[status] ?? MOBILE_PAGE_SIZE) + MOBILE_PAGE_SIZE, total),
    }));
  }, []);

  const showLessMobileJobs = useCallback((status: ApplicationStatus) => {
    setMobileVisibleCounts((prev) => {
      const next = { ...prev };
      delete next[status];
      return next;
    });
    const section = document.querySelector(`[data-column-id="${status}"]`);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const hasEmptyColumns = columns.some((status) => statusCounts[status] === 0);
  const columnsForDesktop = useMemo(() => {
    if (showEmptyColumns || visibleJobs.length === 0) return columns;
    return columns.filter((status) => statusCounts[status] > 0);
  }, [columns, showEmptyColumns, statusCounts, visibleJobs.length]);

  // Re-measure scroll affordance whenever the board layout changes
  useEffect(() => {
    updateScrollFades();
    window.addEventListener('resize', updateScrollFades);
    return () => window.removeEventListener('resize', updateScrollFades);
  }, [updateScrollFades, visibleJobs, columnsForDesktop]);

  useEffect(() => {
    const main = getScrollOwner();
    window.addEventListener('scroll', updateBackToTop, { passive: true });
    main?.addEventListener('scroll', updateBackToTop, { passive: true });
    window.addEventListener('resize', updateBackToTop);
    updateBackToTop();

    return () => {
      window.removeEventListener('scroll', updateBackToTop);
      main?.removeEventListener('scroll', updateBackToTop);
      window.removeEventListener('resize', updateBackToTop);
    };
  }, [getScrollOwner, updateBackToTop, visibleJobs.length]);

  useEffect(() => {
    if (didInitMobileOpen.current) return;
    if (hasRestoredMobileOpen.current) return;
    if (visibleJobs.length === 0) return;
    const firstWithJobs = columns.find((status) => statusCounts[status] > 0) || columns[0];
    if (!firstWithJobs) return;
    didInitMobileOpen.current = true;
    setMobileOpenStatuses([firstWithJobs]);
  }, [columns, statusCounts, visibleJobs.length]);

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
  const setDatePreset = useCallback((preset: 'last7Days' | 'last30Days' | 'thisMonth', field: 'dateAdded' | 'lastUpdated') => {
    const today = new Date();
    let fromDate: Date = new Date(today);

    switch (preset) {
      case 'last7Days':
        fromDate.setDate(today.getDate() - 7);
        break;
      case 'last30Days':
        fromDate.setDate(today.getDate() - 30);
        break;
      case 'thisMonth':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
    }

    const fromStr = formatLocalDate(fromDate);
    const toStr = formatLocalDate(today);

    if (field === 'dateAdded') {
      setDateAddedFrom(fromStr);
      setDateAddedTo(toStr);
    } else {
      setLastUpdatedFrom(fromStr);
      setLastUpdatedTo(toStr);
    }
  }, []);

  const clampDateBound = useCallback((
    setFrom: React.Dispatch<React.SetStateAction<string>>,
    setTo: React.Dispatch<React.SetStateAction<string>>,
    bound: 'from' | 'to',
    value: string,
    other: string
  ) => {
    if (bound === 'from') {
      setFrom(value);
      if (value && other && value > other) setTo(value);
    } else {
      setTo(value);
      if (value && other && value < other) setFrom(value);
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

  const toggleFilters = () => {
    const nextOpen = !showFilters;
    setShowFilters(nextOpen);
    if (nextOpen) {
      setShowSort(false);
      setShowMobileActions(false);
      setShowMobileSort(false);
    }
  };

  const toggleMobileActions = () => {
    const nextOpen = !showMobileActions;
    setShowMobileActions(nextOpen);
    if (nextOpen) {
      setShowFilters(false);
      setShowMobileSort(false);
    }
  };

  const openMobileSort = () => {
    setShowMobileActions(false);
    setShowMobileSort(true);
  };

  const scrollToTop = useCallback(() => {
    const main = getScrollOwner();
    if (main instanceof HTMLElement && main.scrollTop > 0) {
      main.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [getScrollOwner]);

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

  const sortGroups = [
    {
      label: t.board.labels.dateAdded,
      options: [
        { value: 'dateAdded_desc', label: t.board.filters.sortOptions.dateAddedDesc },
        { value: 'dateAdded_asc', label: t.board.filters.sortOptions.dateAddedAsc }
      ]
    },
    {
      label: t.board.labels.lastUpdated,
      options: [
        { value: 'lastUpdated_desc', label: t.board.filters.sortOptions.lastUpdatedDesc },
        { value: 'lastUpdated_asc', label: t.board.filters.sortOptions.lastUpdatedAsc }
      ]
    },
    {
      label: t.board.filters.sortGroupCompany,
      options: [
        { value: 'company_asc', label: t.board.filters.sortOptions.companyAsc },
        { value: 'company_desc', label: t.board.filters.sortOptions.companyDesc }
      ]
    },
    {
      label: t.board.filters.sortGroupPosition,
      options: [
        { value: 'position_asc', label: t.board.filters.sortOptions.positionAsc },
        { value: 'position_desc', label: t.board.filters.sortOptions.positionDesc }
      ]
    }
  ];

  const filtersPanelContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
        {/* Status filters with colored chips */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {t.board.labels.status}
            </span>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className="min-h-[44px] px-2 -mr-2 text-xs text-primary dark:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg sm:min-h-0 sm:py-1"
            >
              {t.board.filters.allStatuses}
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
                  aria-pressed={isSelected}
                  className={`min-h-[44px] px-3 py-2 text-xs rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-h-0 sm:px-2.5 sm:py-1 ${isSelected
                    ? STATUS_COLORS[status]
                    : 'bg-gray-50 dark:bg-slate-900/50 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-slate-800 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                >
                  {t.board.status[status]}
                </button>
              );
            })}
          </div>
        </div>

      {/* Date filters with presets */}
        {/* Date Added */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {t.board.labels.dateAdded}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="date"
              value={dateAddedFrom}
              max={dateAddedTo || undefined}
              aria-label={`${t.board.labels.dateAdded} ${t.board.filters.from}`}
              onChange={(e) => clampDateBound(setDateAddedFrom, setDateAddedTo, 'from', e.target.value, dateAddedTo)}
              className="flex-1 min-h-[44px] px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:min-h-0 sm:px-2 sm:py-1 sm:text-xs"
            />
            <span className="text-gray-400 text-xs">→</span>
            <input
              type="date"
              value={dateAddedTo}
              min={dateAddedFrom || undefined}
              aria-label={`${t.board.labels.dateAdded} ${t.board.filters.to}`}
              onChange={(e) => clampDateBound(setDateAddedFrom, setDateAddedTo, 'to', e.target.value, dateAddedFrom)}
              className="flex-1 min-h-[44px] px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:min-h-0 sm:px-2 sm:py-1 sm:text-xs"
            />
            {(dateAddedFrom || dateAddedTo) && (
              <button
                type="button"
                onClick={() => clearDateFilter('dateAdded')}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg sm:min-w-0 sm:min-h-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDatePreset('last7Days', 'dateAdded')}
              className="flex-1 min-h-[44px] px-2 py-2 text-xs rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-h-0 sm:flex-none sm:py-1"
            >
              {t.board.filters.last7Days}
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('last30Days', 'dateAdded')}
              className="flex-1 min-h-[44px] px-2 py-2 text-xs rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-h-0 sm:flex-none sm:py-1"
            >
              {t.board.filters.last30Days}
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('thisMonth', 'dateAdded')}
              className="flex-1 min-h-[44px] px-2 py-2 text-xs rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-h-0 sm:flex-none sm:py-1"
            >
              {t.board.filters.thisMonth}
            </button>
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {t.board.labels.lastUpdated}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="date"
              value={lastUpdatedFrom}
              max={lastUpdatedTo || undefined}
              aria-label={`${t.board.labels.lastUpdated} ${t.board.filters.from}`}
              onChange={(e) => clampDateBound(setLastUpdatedFrom, setLastUpdatedTo, 'from', e.target.value, lastUpdatedTo)}
              className="flex-1 min-h-[44px] px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:min-h-0 sm:px-2 sm:py-1 sm:text-xs"
            />
            <span className="text-gray-400 text-xs">→</span>
            <input
              type="date"
              value={lastUpdatedTo}
              min={lastUpdatedFrom || undefined}
              aria-label={`${t.board.labels.lastUpdated} ${t.board.filters.to}`}
              onChange={(e) => clampDateBound(setLastUpdatedFrom, setLastUpdatedTo, 'to', e.target.value, lastUpdatedFrom)}
              className="flex-1 min-h-[44px] px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 sm:min-h-0 sm:px-2 sm:py-1 sm:text-xs"
            />
            {(lastUpdatedFrom || lastUpdatedTo) && (
              <button
                type="button"
                onClick={() => clearDateFilter('lastUpdated')}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-lg sm:min-w-0 sm:min-h-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDatePreset('last7Days', 'lastUpdated')}
              className="flex-1 min-h-[44px] px-2 py-2 text-xs rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-h-0 sm:flex-none sm:py-1"
            >
              {t.board.filters.last7Days}
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('last30Days', 'lastUpdated')}
              className="flex-1 min-h-[44px] px-2 py-2 text-xs rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-h-0 sm:flex-none sm:py-1"
            >
              {t.board.filters.last30Days}
            </button>
            <button
              type="button"
              onClick={() => setDatePreset('thisMonth', 'lastUpdated')}
              className="flex-1 min-h-[44px] px-2 py-2 text-xs rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-h-0 sm:flex-none sm:py-1"
            >
              {t.board.filters.thisMonth}
            </button>
          </div>
        </div>

      <div className="flex justify-end col-span-1 md:col-span-2 lg:col-span-4 pt-2 border-t border-gray-100 dark:border-slate-700">
        <button
          type="button"
          onClick={resetFilters}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:underline"
        >
          {t.board.filters.reset}
        </button>
      </div>
    </div>
  );

  const searchField = (
    <div className="relative w-full sm:w-56">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t.board.filters.searchPlaceholder}
        className="w-full pl-10 pr-12 py-3 text-base rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-700 focus:border-transparent sm:py-2 sm:pl-9 sm:pr-8 sm:text-sm"
        aria-label={t.board.filters.search}
      />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-w-8 sm:min-h-8"
          aria-label={t.board.filters.searchClear}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6 min-h-full sm:min-h-0 sm:h-[calc(100vh-140px)] flex flex-col relative">

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
                currentTime={currentTime}
                isGhost={true}
                onEdit={openEditModal}
                onDelete={handleDeleteRequest}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onTouchStart={handleTouchStart}
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
          hasRounds={(jobToDelete.interviewRounds?.length ?? 0) > 0}
          roundsCount={jobToDelete.interviewRounds?.length ?? 0}
          onConfirm={confirmDelete}
          onCancel={() => setJobToDelete(null)}
        />
      )}

      {/* Move to... status sheet */}
      {moveToJob && (
        <div
          className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4"
          onClick={() => setMoveToJob(null)}
        >
          <div
            ref={moveSheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="move-to-title"
            className="w-full sm:max-w-sm bg-white dark:bg-slate-800 rounded-t-xl sm:rounded-2xl shadow-xl p-4 sm:p-5 sm:border border-gray-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 id="move-to-title" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {t.board.moveTo} <span className="font-normal text-gray-400">{moveToJob.company}</span>
              </h3>
              <button
                type="button"
                onClick={() => setMoveToJob(null)}
                aria-label={t.board.close}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {columns.map(status => {
                const isCurrent = moveToJob.status === status;
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={isCurrent}
                    onClick={() => {
                      const job = moveToJob;
                      setMoveToJob(null);
                      recordMove(job.id, status);
                    }}
                    className={`w-full min-h-[44px] flex items-center justify-between px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${isCurrent
                      ? 'bg-gray-50 dark:bg-slate-700/50 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-slate-600 cursor-default'
                      : `${STATUS_COLORS[status]} hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`
                      }`}
                  >
                    <span>{t.board.status[status]}</span>
                    {isCurrent && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showMobileActions && (
        <div
          className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50 backdrop-blur-sm sm:hidden"
          onClick={() => setShowMobileActions(false)}
        >
          <div
            ref={mobileActionsRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-actions-title"
            className="absolute inset-x-0 bottom-0 bg-white dark:bg-slate-800 rounded-t-xl border-t border-gray-200 dark:border-slate-700 p-4 shadow-xl"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 id="mobile-actions-title" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {t.board.filters.moreActionsTitle}
              </h3>
              <button
                type="button"
                onClick={() => setShowMobileActions(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                aria-label={t.board.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid gap-2">
              <button
                type="button"
                onClick={openMobileSort}
                className="w-full min-h-[52px] flex items-center gap-3 px-3 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>{t.board.filters.sortBy}</span>
              </button>
              {showBackToTop && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileActions(false);
                    openAddModal();
                  }}
                  className="w-full min-h-[52px] flex items-center gap-3 px-3 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t.board.addJob}</span>
                </button>
              )}
              {/* Add stays in the overflow only while the FAB is out of the way. */}
              <button
                type="button"
                onClick={() => {
                  setShowMobileActions(false);
                  handleExportCSV();
                }}
                className="w-full min-h-[52px] flex items-center gap-3 px-3 rounded-lg border border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span>{t.board.exportCSV}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showMobileSort && (
        <div
          className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50 backdrop-blur-sm sm:hidden"
          onClick={() => setShowMobileSort(false)}
        >
          <div
            ref={mobileSortSheetRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-sort-title"
            className="absolute inset-x-0 bottom-0 bg-white dark:bg-slate-800 rounded-t-xl border-t border-gray-200 dark:border-slate-700 p-4 max-h-[85vh] overflow-y-auto shadow-xl"
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 id="mobile-sort-title" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {t.board.filters.sortBy}
              </h3>
              <button
                type="button"
                onClick={() => setShowMobileSort(false)}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                aria-label={t.board.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid gap-3">
              {sortGroups.map((group) => (
                <div key={group.label}>
                  <div className="px-1 pb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                    {group.label}
                  </div>
                  <div className="grid gap-1">
                    {group.options.map((opt) => {
                      const isSelected = `${sortField}_${sortDirection}` === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const [field, dir] = opt.value.split('_') as [typeof sortField, typeof sortDirection];
                            setSortField(field);
                            setSortDirection(dir);
                            setShowMobileSort(false);
                          }}
                          className={`w-full min-h-[44px] text-left px-3 text-sm transition-colors flex items-center justify-between rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${isSelected
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                            }`}
                        >
                          {opt.label}
                          {isSelected && <Check className="w-4 h-4" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toast (status moves, undo, errors) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-6 z-[60] flex items-center gap-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl px-4 py-3 max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
          <span className="text-sm text-gray-700 dark:text-gray-200 truncate">{toast.text}</span>
          {toast.kind === 'info' && toast.onAction && (
            <button
              onClick={toast.onAction}
              className="text-sm font-medium text-primary dark:text-primary hover:underline shrink-0"
            >
              {toast.actionLabel}
            </button>
          )}
          <button
            onClick={() => setToast(null)}
            aria-label={t.board.close}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shrink-0 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
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
            setResumeCalendarImport(false);
            onRefetchJobs?.();
          }}
          onEdit={modalMode === 'view' ? switchToEditMode : undefined}
          onDataChanged={onRefetchJobs}
          initialShowInterviews={resumeCalendarImport}
          initialOpenCalendarImport={resumeCalendarImport}
        />
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-3 shrink-0">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t.board.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">{t.board.subtitle}</p>
        </div>

        <div className="hidden sm:flex sm:flex-wrap gap-2 w-full sm:w-auto">
          {searchField}
          <button
            type="button"
            onClick={toggleFilters}
            className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium shadow-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-h-0 sm:w-auto sm:justify-start sm:py-2 ${showFilters || hasActiveFilters
              ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border-primary/30 dark:border-primary/30'
              : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-gray-600'
              }`}
            title={t.board.filters.status}
          >
            <Filter className="w-4 h-4" />
            <span>{t.board.filters.status}</span>
            {activeFilterCount > 0 && (
              <span className="bg-primary dark:bg-primary text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {activeFilterCount}
              </span>
            )}
            {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="relative" ref={sortRef}>
            <button
              type="button"
              onClick={() => {
                setShowSort(!showSort);
                if (!showSort) setShowFilters(false);
              }}
              className={`min-h-[44px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium shadow-sm border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 sm:min-h-0 sm:w-auto sm:justify-start sm:py-2 ${showSort
                ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border-primary/30 dark:border-primary/30'
                : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              title={t.board.filters.sortBy}
            >
              <ArrowUpDown className="w-4 h-4" />
              <span>{t.board.filters.sortBy}</span>
              {showSort ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showSort && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-50 py-2">
                {sortGroups.map((group) => (
                  <div key={group.label}>
                    <div className="px-4 pt-2 pb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
                      {group.label}
                    </div>
                    {group.options.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          const [field, dir] = opt.value.split('_') as [typeof sortField, typeof sortDirection];
                          setSortField(field);
                          setSortDirection(dir);
                          setShowSort(false);
                        }}
                        className={`w-full text-left px-4 py-1.5 text-sm transition-colors flex items-center justify-between ${`${sortField}_${sortDirection}` === opt.value
                          ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                          }`}
                      >
                        {opt.label}
                        {`${sortField}_${sortDirection}` === opt.value && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleExportCSV}
            className="col-span-2 sm:col-span-1 min-h-[44px] w-full sm:w-auto flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 px-3 py-2.5 sm:py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            title={t.board.exportCSV}
          >
            <Download className="w-4 h-4" />
            <span className="sm:hidden">{t.board.exportCSV}</span>
            <span className="hidden lg:inline">{t.board.exportCSV}</span>
          </button>
          <button
            type="button"
            onClick={openAddModal}
            className="hidden sm:flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900"
          >
            <Plus className="w-4 h-4" />
            {t.board.addJob}
          </button>
        </div>
      </div>

      <MobileStageDock
        searchField={searchField}
        showFilters={showFilters}
        hasActiveFilters={hasActiveFilters}
        activeFilterCount={activeFilterCount}
        showMobileActions={showMobileActions}
        showBackToTop={showBackToTop}
        t={t}
        toggleFilters={toggleFilters}
        toggleMobileActions={toggleMobileActions}
        scrollToTop={scrollToTop}
        clearFilters={resetFilters}
      />


      {/* Active Filter Chips */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {t.board.filters.activeFilters}
          </span>
          {statusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/30 dark:border-primary/30">
              {t.board.labels.status}: {statusFilter.map(s => t.board.status[s]).join(', ')}
              <button
                type="button"
                onClick={() => removeFilter('status')}
                aria-label={`${t.board.filters.removeFilter}: ${t.board.labels.status}`}
                className="min-w-7 min-h-7 inline-flex items-center justify-center hover:text-primary dark:hover:text-white rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {debouncedSearchQuery.trim() && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/30 dark:border-primary/30">
              {t.board.filters.search}: "{debouncedSearchQuery}"
              <button type="button" onClick={() => removeFilter('search')} aria-label={`${t.board.filters.search} ${t.board.filters.searchClear}`} className="hover:text-primary dark:hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(dateAddedFrom || dateAddedTo) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/30 dark:border-primary/30">
              {t.board.labels.dateAdded}: {dateAddedFrom || '...'} - {dateAddedTo || '...'}
              <button
                type="button"
                onClick={() => removeFilter('dateAdded')}
                aria-label={`${t.board.filters.removeFilter}: ${t.board.labels.dateAdded}`}
                className="min-w-7 min-h-7 inline-flex items-center justify-center hover:text-primary dark:hover:text-white rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(lastUpdatedFrom || lastUpdatedTo) && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary border border-primary/30 dark:border-primary/30">
              {t.board.labels.lastUpdated}: {lastUpdatedFrom || '...'} - {lastUpdatedTo || '...'}
              <button
                type="button"
                onClick={() => removeFilter('lastUpdated')}
                aria-label={`${t.board.filters.removeFilter}: ${t.board.labels.lastUpdated}`}
                className="min-w-7 min-h-7 inline-flex items-center justify-center hover:text-primary dark:hover:text-white rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:underline"
          >
            {t.board.filters.reset}
          </button>
        </div>
      )}

      {/* Results count */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-400 shrink-0">
        <span>
          {t.board.filters.showing} <span className="font-semibold text-gray-700 dark:text-gray-200">{visibleJobs.length}</span> {t.board.filters.of} <span className="font-semibold text-gray-700 dark:text-gray-200">{jobs.length}</span> {t.board.filters.applications}
        </span>
        <div className="flex items-center gap-3">
          {hasEmptyColumns && (
            <button
              onClick={() => setShowEmptyColumns(!showEmptyColumns)}
              className="hidden sm:inline text-xs text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:underline"
            >
              {showEmptyColumns ? t.board.filters.hideEmptyColumns : t.board.filters.showEmptyColumns}
            </button>
          )}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-primary dark:text-primary hover:underline text-xs"
            >
              {t.board.filters.clearAll}
            </button>
          )}
        </div>
      </div>

      {/* Mobile stage navigation is provided by the accordion headers below. */}

      {/* Collapsible Panels */}
      <div className="flex flex-col gap-3 shrink-0">
        {/* Mobile Filters Sheet */}
        {showFilters && (
          <div
            className="fixed inset-0 z-50 bg-black/30 dark:bg-black/50 backdrop-blur-sm sm:hidden"
            onClick={() => setShowFilters(false)}
          >
            <div
              ref={filterSheetRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="filter-sheet-title"
              className="absolute inset-x-0 bottom-0 bg-white dark:bg-slate-800 rounded-t-xl border-t border-gray-200 dark:border-slate-700 p-4 max-h-[85vh] overflow-y-auto shadow-xl"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 id="filter-sheet-title" className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {t.board.filters.status}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowFilters(false)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-label={t.board.close}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {filtersPanelContent}
            </div>
          </div>
        )}

        {/* Filters bar (desktop) */}
        <div
          className={`hidden sm:flex rounded-xl border flex-col overflow-hidden transition-all duration-300 ${showFilters
            ? 'p-4 bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 shadow-sm opacity-100'
            : 'h-0 opacity-0 border-transparent bg-transparent'
            }`}
        >
          {filtersPanelContent}
        </div>
      </div>

      {/* Empty state when filters return no results */}
      {visibleJobs.length === 0 && hasActiveFilters && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
          <div className="bg-gray-50 dark:bg-slate-800/50 rounded-2xl p-8 text-center max-w-md">
            <SearchX className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t.board.filters.noResults}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t.board.filters.noResultsMessage}
            </p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary dark:bg-primary text-white rounded-lg hover:bg-blue-700 dark:hover:bg-primary transition-colors text-sm font-medium"
            >
              <X className="w-4 h-4" />
              {t.board.filters.reset}
            </button>
          </div>
        </div>
      )}

      {/* Unified board (horizontal columns on desktop, stacked accordion on mobile) */}
      {loading && jobs.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4" data-testid="job-board-loading">
          <div className="w-10 h-10 border-4 border-primary/30 dark:border-primary/20 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t.board.loading}</p>
        </div>
      ) : (
      <div
        className={`relative flex-1 min-h-0 flex flex-col ${visibleJobs.length === 0 && hasActiveFilters ? 'hidden' : ''}`}
      >
        <div
          data-testid="job-board"
          className="flex-1 min-h-0 sm:overflow-x-auto sm:overflow-y-hidden pb-32 sm:px-2 sm:pb-4"
          ref={scrollContainerRef}
          onScroll={updateScrollFades}
          onDragOver={handleContainerDragOver} // Track drag over globally in container
        >
          <div className="flex flex-col sm:flex-row gap-4 min-w-full pb-32 sm:h-full sm:pb-2">
          {columnsForDesktop.map(status => {
            const isOpen = mobileOpenStatuses.includes(status);
            const mobileVisibleCount = Math.min(mobileVisibleCounts[status] ?? MOBILE_PAGE_SIZE, jobsByStatus[status].length);
            const jobsToRender = isMobile
              ? jobsByStatus[status].slice(0, mobileVisibleCount)
              : jobsByStatus[status];
            const remainingMobileCount = jobsByStatus[status].length - mobileVisibleCount;
            return (
              <section
                key={status}
                data-column-id={status}
                onDragOver={(e) => handleDragOver(e, status)}
                onDrop={(e) => handleDrop(e, status)}
                onDragLeave={handleDragLeave}
                className={`flex-1 flex flex-col min-w-0 sm:min-w-[220px] md:min-w-[240px] 2xl:min-w-[250px] transition-all duration-200 ${dragOverColumn === status
                  ? 'bg-primary/5 dark:bg-primary/10 rounded-xl border-2 border-dashed border-primary/40 sm:scale-[1.01]'
                  : ''}`}
              >
                {/* Mobile accordion header */}
                <button
                  type="button"
                  onClick={() => toggleMobileStatus(status)}
                  className="column-accordion-button sm:hidden w-full min-h-[52px] flex items-center justify-between px-3.5 py-3 text-sm font-semibold rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-primary/40 dark:hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                  aria-expanded={isOpen}
                  aria-controls={`column-${status}`}
                >
                  <span className="text-slate-700 dark:text-slate-200">{t.board.status[status]}</span>
                  <span className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COUNT_COLORS[status]}`}>
                      {statusCounts[status]}
                    </span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </span>
                </button>

                {/* Desktop column header */}
                <div className="hidden sm:flex items-center justify-between mb-4 sticky top-0 bg-background-light/80 dark:bg-background-dark/90 backdrop-blur-sm py-2 px-2 z-10">
                  <h2 className="font-bold text-lg flex items-center gap-2 text-slate-900 dark:text-slate-100">
                    {t.board.status[status]}
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COUNT_COLORS[status]}`}>
                      {statusCounts[status]}
                    </span>
                  </h2>
                </div>

                <div id={`column-${status}`} className={`p-1 pt-2 space-y-3 sm:p-2 sm:space-y-4 sm:flex-1 sm:overflow-y-auto sm:pr-2 ${isOpen ? 'block' : 'hidden'} sm:block min-w-0 w-full`}>
                  {jobsByStatus[status].length === 0 && !dragOverColumn ? (
                    <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
                      <div className="w-16 h-16 bg-slate-200 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4 dark:border dark:border-slate-800">
                        <Inbox className="w-8 h-8 text-slate-400 dark:text-slate-600" />
                      </div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400 text-center">{t.board.emptyColumns[status]}</p>
                    </div>
                  ) : (
                    <>
                      {jobsToRender.map(job => (
                        <JobCard
                          key={job.id}
                          job={job}
                          language={language}
                          currentTime={currentTime}
                          draggedItemId={draggedItemId}
                          onView={openViewModal}
                          onEdit={openEditModal}
                          onDelete={handleDeleteRequest}
                          onNextStatus={getNextStatus(job.status) ? handleNextStatus : undefined}
                          nextStatusLabel={(() => {
                            const next = getNextStatus(job.status);
                            return next ? t.board.status[next] : undefined;
                          })()}
                          onMoveTo={() => setMoveToJob(job)}
                          onDragStart={handleDragStart}
                          onDragEnd={handleDragEnd}
                          onTouchStart={handleTouchStart}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                        />
                      ))}
                      {isMobile && jobsByStatus[status].length > MOBILE_PAGE_SIZE && (
                        <div className="space-y-2 pt-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {t.board.filters.showingCount
                              .replace('{shown}', String(mobileVisibleCount))
                              .replace('{total}', String(jobsByStatus[status].length))}
                          </p>
                          <div className="flex gap-2">
                            {remainingMobileCount > 0 && (
                              <button
                                type="button"
                                onClick={() => showNextMobileJobs(status, jobsByStatus[status].length)}
                                className="flex-1 min-h-[44px] px-3 text-xs font-semibold text-primary dark:text-primary border border-primary/30 dark:border-primary/30 rounded-lg bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                              >
                                {t.board.filters.showNext.replace('{count}', String(Math.min(MOBILE_PAGE_SIZE, remainingMobileCount)))}
                              </button>
                            )}
                            {mobileVisibleCount > MOBILE_PAGE_SIZE && (
                              <button
                                type="button"
                                onClick={() => showLessMobileJobs(status)}
                                className="flex-1 min-h-[44px] px-3 text-xs font-semibold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                              >
                                {t.board.filters.showLess}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Visual Placeholder for drop zone */}
          {dragOverColumn === status && (
            <div className="h-20 sm:h-24 rounded-lg border-2 border-dashed border-primary/30 dark:border-primary/30 bg-primary/5 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-primary text-xs font-medium animate-pulse">
              {t.board.dropHere}
            </div>
          )}
                    </>
                  )}
                </div>
              </section>
            );
          })}
          </div>
        </div>

        {/* Edge fades signal horizontal scrollability — pinned outside the scroll
            container so they stay at the board's viewport edges while scrolling */}
        <div
          data-testid="job-board-fade-left"
          className={`hidden sm:block absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none bg-gradient-to-r from-background-light dark:from-background-dark to-transparent transition-opacity duration-200 ${showLeftFade ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden="true"
        />
        <div
          data-testid="job-board-fade-right"
          className={`hidden sm:block absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none bg-gradient-to-r from-transparent to-background-light dark:to-background-dark transition-opacity duration-200 ${showRightFade ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden="true"
        />
      </div>
      )}
      {/* Floating Action Button */}
      <button
        type="button"
        onClick={openAddModal}
        className="glass-fab fixed right-4 w-14 h-14 text-white flex items-center justify-center rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-transform z-30 group sm:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background-light dark:focus-visible:ring-offset-background-dark"
        style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        aria-label={t.board.addJob}
        title={t.board.addJob}
      >
        <div className="w-8 h-8 bg-white/20 p-1 rounded-full group-hover:bg-white/30 transition-colors flex items-center justify-center">
          <Plus className="w-6 h-6" />
        </div>
      </button>
    </div>
  );
};
