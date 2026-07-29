import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, Check, ExternalLink, Link as LinkIcon, RefreshCw } from 'lucide-react';
import { InterviewRound, JobApplication, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { savePendingCalendarImport, SELECTED_CALENDAR_IDS_KEY } from '../lib/googleCalendarAuth';

interface GoogleCalendar {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

interface GoogleCalendarEvent {
  id: string;
  calendarId: string;
  calendarSummary: string;
  summary: string;
  description: string;
  start: string;
  end: string;
  interviewDate: string;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  htmlLink?: string;
  isInterviewLike: boolean;
  isJobMatch: boolean;
}

interface GoogleCalendarImportPickerProps {
  job: Partial<JobApplication>;
  rounds: InterviewRound[];
  language: Language;
  onImport: (round: Omit<InterviewRound, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

const loadSelectedCalendarIds = () => {
  try {
    const raw = localStorage.getItem(SELECTED_CALENDAR_IDS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
};

const saveSelectedCalendarIds = (ids: string[]) => {
  localStorage.setItem(SELECTED_CALENDAR_IDS_KEY, JSON.stringify(ids));
};

const getErrorKey = (code?: string) => {
  if (code === 'calendar_reconnect_required' || code === 'calendar_not_connected') return 'calendarAccessExpired';
  if (code === 'calendar_setup_required') return 'calendarSetupRequired';
  return 'importFailed';
};

export const GoogleCalendarImportPicker: React.FC<GoogleCalendarImportPickerProps> = ({
  job,
  rounds,
  language,
  onImport
}) => {
  const { getGoogleCalendarProviderToken, requestGoogleCalendarAccess } = useAuth();
  const t = TRANSLATIONS[language].calendarImport;
  const [providerToken, setProviderToken] = useState<string | null>(null);
  const [calendars, setCalendars] = useState<GoogleCalendar[]>([]);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([]);
  const [events, setEvents] = useState<GoogleCalendarEvent[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loadingCalendars, setLoadingCalendars] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [importingEventId, setImportingEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const importedEventKeys = useMemo(() => new Set(
    rounds
      .filter((round) => round.sourceProvider === 'google_calendar' && round.sourceCalendarId && round.sourceEventId)
      .map((round) => `${round.sourceCalendarId}:${round.sourceEventId}`)
  ), [rounds]);

  const visibleEvents = useMemo(() => (
    showAll ? events : events.filter((event) => event.isInterviewLike || event.isJobMatch)
  ), [events, showAll]);

  useEffect(() => {
    getGoogleCalendarProviderToken().then(setProviderToken);
  }, [getGoogleCalendarProviderToken]);

  useEffect(() => {
    if (!providerToken) return;

    const fetchCalendars = async () => {
      setLoadingCalendars(true);
      setError(null);

      try {
        const response = await fetch('/api/calendar/calendars', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ providerToken })
        });
        const data = await response.json();

        if (!response.ok) {
          setError(t[getErrorKey(data.code)]);
          return;
        }

        const nextCalendars = data.calendars as GoogleCalendar[];
        setCalendars(nextCalendars);

        const savedIds = loadSelectedCalendarIds().filter((id) => nextCalendars.some((calendar) => calendar.id === id));
        const defaultIds = nextCalendars.find((calendar) => calendar.primary)?.id
          ? [nextCalendars.find((calendar) => calendar.primary)!.id]
          : nextCalendars.slice(0, 1).map((calendar) => calendar.id);
        const nextSelectedIds = savedIds.length > 0 ? savedIds : defaultIds;
        setSelectedCalendarIds(nextSelectedIds);
        saveSelectedCalendarIds(nextSelectedIds);
      } catch (fetchError) {
        console.error('Error fetching calendars:', fetchError);
        setError(t.importFailed);
      } finally {
        setLoadingCalendars(false);
      }
    };

    fetchCalendars();
  }, [providerToken, t]);

  useEffect(() => {
    if (!providerToken || selectedCalendarIds.length === 0) {
      setEvents([]);
      return;
    }

    const fetchEvents = async () => {
      setLoadingEvents(true);
      setError(null);

      try {
        const response = await fetch('/api/calendar/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerToken,
            calendarIds: selectedCalendarIds,
            job: {
              company: job.company,
              position: job.position
            }
          })
        });
        const data = await response.json();

        if (!response.ok) {
          setError(t[getErrorKey(data.code)]);
          return;
        }

        setEvents(data.events as GoogleCalendarEvent[]);
      } catch (fetchError) {
        console.error('Error fetching calendar events:', fetchError);
        setError(t.importFailed);
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [providerToken, selectedCalendarIds, job.company, job.position, t]);

  const handleConnect = async () => {
    if (!job.id) return;

    setConnecting(true);
    setError(null);
    savePendingCalendarImport(job.id);

    try {
      await requestGoogleCalendarAccess();
    } catch (connectError) {
      console.error('Error connecting Google Calendar:', connectError);
      setConnecting(false);
      setError(t.calendarSetupRequired);
    }
  };

  const toggleCalendar = (calendarId: string) => {
    const nextIds = selectedCalendarIds.includes(calendarId)
      ? selectedCalendarIds.filter((id) => id !== calendarId)
      : [...selectedCalendarIds, calendarId];

    setSelectedCalendarIds(nextIds);
    saveSelectedCalendarIds(nextIds);
  };

  const handleImport = async (event: GoogleCalendarEvent) => {
    if (!job.id || importedEventKeys.has(`${event.calendarId}:${event.id}`)) return;

    setImportingEventId(event.id);
    setError(null);

    try {
      await onImport({
        jobId: job.id,
        roundName: event.summary,
        interviewDate: event.interviewDate,
        startTime: event.startTime,
        endTime: event.endTime,
        status: 'scheduled',
        notes: event.description,
        meetingLink: event.meetingLink,
        sourceProvider: 'google_calendar',
        sourceCalendarId: event.calendarId,
        sourceEventId: event.id,
        sourceEventUrl: event.htmlLink
      });
    } catch (importError) {
      console.error('Error importing Google Calendar event:', importError);
      setError(t.importFailed);
    } finally {
      setImportingEventId(null);
    }
  };

  if (!providerToken) {
    return (
      <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 p-3">
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Calendar className="w-4 h-4" />
          {connecting ? t.loadingCalendars : t.connectGoogleCalendar}
        </button>
        {error && <p className="mt-2 text-xs text-red-700 dark:text-red-300">{error}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/40 p-3 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100">{t.selectCalendars}</h4>
        <button
          type="button"
          onClick={handleConnect}
          disabled={connecting}
          className="inline-flex items-center justify-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-slate-600 rounded-lg text-xs text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t.reconnectGoogleCalendar}
        </button>
      </div>

      {loadingCalendars ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.loadingCalendars}</p>
      ) : (
        <div className="space-y-2">
          {calendars.map((calendar) => (
            <label key={calendar.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={selectedCalendarIds.includes(calendar.id)}
                onChange={() => toggleCalendar(calendar.id)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: calendar.backgroundColor || '#4285f4' }}
              />
              <span>{calendar.summary}</span>
            </label>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-medium text-primary dark:text-primary hover:underline"
        >
          {showAll ? t.showMatchingEvents : t.showAllEvents}
        </button>
        {loadingEvents && <span className="text-xs text-gray-500 dark:text-gray-400">{t.loadingEvents}</span>}
      </div>

      {error && <p className="text-xs text-red-700 dark:text-red-300">{error}</p>}

      {!loadingEvents && visibleEvents.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{t.noCalendarEventsFound}</p>
      )}

      <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
        {visibleEvents.map((event) => {
          const imported = importedEventKeys.has(`${event.calendarId}:${event.id}`);

          return (
            <div
              key={`${event.calendarId}:${event.id}`}
              className={`rounded-lg border p-3 bg-white dark:bg-slate-800 ${imported ? 'border-green-200 dark:border-green-900 opacity-70' : 'border-gray-200 dark:border-slate-700'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {event.interviewDate} {event.startTime}-{event.endTime}
                  </div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{event.summary}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{event.calendarSummary}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleImport(event)}
                  disabled={imported || importingEventId === event.id}
                  className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:text-gray-600 dark:disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {imported ? <Check className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                  {imported ? t.alreadyImported : t.importEvent}
                </button>
              </div>

              {event.description && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{event.description}</p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                {event.isJobMatch && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                    {t.matchedJob}
                  </span>
                )}
                {event.meetingLink && (
                  <a href={event.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                    <LinkIcon className="w-3 h-3" />
                    {t.meetingLink}
                  </a>
                )}
                {event.htmlLink && (
                  <a href={event.htmlLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary hover:underline">
                    <ExternalLink className="w-3 h-3" />
                    {t.openInCalendar}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
