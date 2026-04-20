import { useState, useMemo } from 'react';
import { Clock, Briefcase, Calendar, CheckCircle, MessageCircle, Search, Send, XCircle } from 'lucide-react';
import { JobApplication, Language, TimelineEvent, TimelineEventType, ApplicationStatus } from '../types';
import { TRANSLATIONS } from '../constants';
import { getGoogleCalendarUrl } from '../lib/calendar';

interface TimelineViewProps {
  jobs: JobApplication[];
  language: Language;
}

export const TimelineView = ({ jobs, language }: TimelineViewProps) => {
  const t = TRANSLATIONS[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventTypes, setSelectedEventTypes] = useState<TimelineEventType[]>([]);

  // Build timeline events from jobs data
  const timelineEvents = useMemo(() => {
    const events: TimelineEvent[] = [];

    jobs.forEach(job => {
      // Job added event
      events.push({
        id: `job-${job.id}-added`,
        jobId: job.id,
        company: job.company,
        position: job.position,
        eventType: 'job_added',
        eventDate: job.dateAdded,
        description: `${job.position} at ${job.company}`,
        metadata: {}
      });

      // Job applied event
      if (
        job.status === ApplicationStatus.APPLIED ||
        job.status === ApplicationStatus.INTERVIEW ||
        job.status === ApplicationStatus.OFFER ||
        job.status === ApplicationStatus.REJECTED
      ) {
        const appliedDate = job.status === ApplicationStatus.APPLIED ? job.lastUpdated : job.dateAdded;
        events.push({
          id: `job-${job.id}-applied`,
          jobId: job.id,
          company: job.company,
          position: job.position,
          eventType: 'job_applied',
          eventDate: appliedDate,
          description: `${job.position} at ${job.company}`,
          metadata: { newStatus: ApplicationStatus.APPLIED }
        });
      }

      // Job rejected event
      if (job.status === ApplicationStatus.REJECTED) {
        events.push({
          id: `job-${job.id}-rejected`,
          jobId: job.id,
          company: job.company,
          position: job.position,
          eventType: 'job_rejected',
          eventDate: job.lastUpdated,
          description: `${job.position} at ${job.company}`,
          metadata: { newStatus: ApplicationStatus.REJECTED }
        });
      }

      // Interview events
      if (job.interviewRounds && job.interviewRounds.length > 0) {
        job.interviewRounds.forEach(round => {
          let eventType: TimelineEventType;
          if (round.status === 'scheduled') {
            eventType = 'interview_scheduled';
          } else if (round.status === 'completed') {
            eventType = 'interview_completed';
          } else {
            eventType = 'interview_feedback';
          }

          events.push({
            id: `interview-${round.id}`,
            jobId: job.id,
            company: job.company,
            position: job.position,
            eventType,
            eventDate: round.interviewDate,
            description: `${round.roundName} - ${job.company}`,
            metadata: { interviewRound: round }
          });
        });
      }
    });

    return events;
  }, [jobs]);

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let filtered = timelineEvents;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.company.toLowerCase().includes(query) ||
        event.position.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query)
      );
    }

    // Filter by event types
    if (selectedEventTypes.length > 0) {
      filtered = filtered.filter(event => selectedEventTypes.includes(event.eventType));
    }

    // Sort by date (newest first), then by time (earliest first within same day)
    return filtered.sort((a, b) => {
      // First sort by date (newest first)
      const dateCompare = b.eventDate.localeCompare(a.eventDate);
      if (dateCompare !== 0) return dateCompare;

      // If same date, sort by start time (earliest first)
      const aTime = a.metadata?.interviewRound?.startTime || '99:99';
      const bTime = b.metadata?.interviewRound?.startTime || '99:99';
      return aTime.localeCompare(bTime);
    });
  }, [timelineEvents, searchQuery, selectedEventTypes]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: { [date: string]: TimelineEvent[] } = {};
    filteredEvents.forEach(event => {
      if (!groups[event.eventDate]) {
        groups[event.eventDate] = [];
      }
      groups[event.eventDate].push(event);
    });
    return groups;
  }, [filteredEvents]);

  const eventTypeOptions: { type: TimelineEventType; label: string }[] = [
    { type: 'job_added', label: t.timeline.eventTypes.jobAdded },
    { type: 'job_applied', label: t.timeline.eventTypes.jobApplied },
    { type: 'job_rejected', label: t.timeline.eventTypes.jobRejected },
    { type: 'interview_scheduled', label: t.timeline.eventTypes.interviewScheduled },
    { type: 'interview_completed', label: t.timeline.eventTypes.interviewCompleted },
    { type: 'interview_feedback', label: t.timeline.eventTypes.awaitingFeedback }
  ];

  const toggleEventType = (type: TimelineEventType) => {
    setSelectedEventTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'job_added':
        return <Briefcase className="w-4 h-4" />;
      case 'job_applied':
        return <Send className="w-4 h-4" />;
      case 'interview_scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'interview_completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'interview_feedback':
        return <MessageCircle className="w-4 h-4" />;
      case 'job_rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getIconColor = (type: TimelineEventType) => {
    switch (type) {
      case 'job_added': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'job_applied': return 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400';
      case 'interview_scheduled': return 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'interview_completed': return 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'interview_feedback': return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
      case 'job_rejected': return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      default: return 'bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-gray-400';
    }
  };

  const getEventPillColor = (type: TimelineEventType) => {
    switch (type) {
      case 'job_added': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'job_applied': return 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300';
      case 'interview_scheduled': return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
      case 'interview_completed': return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'interview_feedback': return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'job_rejected': return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getEventLabel = (type: TimelineEventType) => {
    switch (type) {
      case 'job_added': return t.timeline.eventTypes.jobAdded;
      case 'job_applied': return t.timeline.eventTypes.jobApplied;
      case 'interview_scheduled': return t.timeline.eventTypes.interviewScheduled;
      case 'interview_completed': return t.timeline.eventTypes.interviewCompleted;
      case 'interview_feedback': return t.timeline.eventTypes.awaitingFeedback;
      case 'job_rejected': return t.timeline.eventTypes.jobRejected;
      default: return '';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    // Remove seconds from time (e.g., "11:30:00" -> "11:30")
    return timeStr.substring(0, 5);
  };

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t.timeline.title}</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {filteredEvents.length} {t.timeline.allEvents.toLowerCase()}
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.board.filters.searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-primary/50 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {eventTypeOptions.map(option => (
            <button
              key={option.type}
              onClick={() => toggleEventType(option.type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                selectedEventTypes.includes(option.type)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 hover:border-primary/50'
              }`}
            >
              {option.label}
            </button>
          ))}
          {selectedEventTypes.length > 0 && (
            <button
              onClick={() => setSelectedEventTypes([])}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              {t.board.filters.clearAll}
            </button>
          )}
        </div>

        {/* Timeline */}
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-10 h-10 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{t.timeline.noEvents}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedEvents).map(date => (
              <div key={date}>
                {/* Date Header */}
                <div className="sticky top-0 z-10 bg-background-light dark:bg-background-dark py-2 mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {formatDate(date)}
                  </h3>
                </div>

                {/* Events for this date */}
                <div className="space-y-3">
                  {groupedEvents[date].map(event => (
                    <div
                      key={event.id}
                      className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon badge */}
                        <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${getIconColor(event.eventType)}`}>
                          {getEventIcon(event.eventType)}
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{event.description}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getEventPillColor(event.eventType)}`}>
                              {getEventLabel(event.eventType)}
                            </span>
                          </div>

                          {/* Time Range */}
                          {event.metadata?.interviewRound?.startTime && event.metadata?.interviewRound?.endTime && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {formatTime(event.metadata.interviewRound.startTime)} - {formatTime(event.metadata.interviewRound.endTime)}
                            </p>
                          )}

                          {/* Notes */}
                          {event.metadata?.interviewRound?.notes && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">
                              {event.metadata.interviewRound.notes}
                            </p>
                          )}
                        </div>

                        {/* Calendar button for scheduled interviews */}
                        {event.eventType === 'interview_scheduled' && event.metadata?.interviewRound && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const url = getGoogleCalendarUrl(event.metadata!.interviewRound!);
                              window.open(url, '_blank');
                            }}
                            className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            {t.interviewRound.addToCalendar}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
