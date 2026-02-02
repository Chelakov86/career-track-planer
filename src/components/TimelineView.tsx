import { useState, useMemo } from 'react';
import { Clock, Briefcase, Calendar, CheckCircle, MessageCircle, Filter, Search } from 'lucide-react';
import { JobApplication, Language, TimelineEvent, TimelineEventType } from '../types';
import { TRANSLATIONS } from '../constants';

interface TimelineViewProps {
  jobs: JobApplication[];
  language: Language;
}

export const TimelineView = ({ jobs, language }: TimelineViewProps) => {
  const t = TRANSLATIONS[language];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventTypes, setSelectedEventTypes] = useState<TimelineEventType[]>([]);
  const [showFilters, setShowFilters] = useState(false);

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

    // Sort by date (newest first)
    return filtered.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
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
      case 'interview_scheduled':
        return <Calendar className="w-4 h-4" />;
      case 'interview_completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'interview_feedback':
        return <MessageCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: TimelineEventType) => {
    switch (type) {
      case 'job_added':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      case 'interview_scheduled':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700';
      case 'interview_completed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-700';
      case 'interview_feedback':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700';
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

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t.timeline.title}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {filteredEvents.length} {t.timeline.allEvents.toLowerCase()}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.board.filters.searchPlaceholder}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <Filter className="w-4 h-4" />
            {t.timeline.filters}
            {selectedEventTypes.length > 0 && (
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs">
                {selectedEventTypes.length}
              </span>
            )}
          </button>

          {/* Event Type Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              {eventTypeOptions.map(option => (
                <button
                  key={option.type}
                  onClick={() => toggleEventType(option.type)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedEventTypes.includes(option.type)
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              {selectedEventTypes.length > 0 && (
                <button
                  onClick={() => setSelectedEventTypes([])}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50"
                >
                  {t.board.filters.clearAll}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Timeline */}
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">{t.timeline.noEvents}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.keys(groupedEvents).map(date => (
              <div key={date} className="relative">
                {/* Date Header */}
                <div className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 py-2 mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {formatDate(date)}
                  </h3>
                </div>

                {/* Events for this date */}
                <div className="space-y-3 ml-6 border-l-2 border-gray-200 dark:border-gray-700 pl-6">
                  {groupedEvents[date].map(event => (
                    <div
                      key={event.id}
                      className={`relative p-4 rounded-lg border-2 ${getEventColor(event.eventType)}`}
                    >
                      {/* Timeline dot */}
                      <div className="absolute -left-[33px] top-4 w-4 h-4 rounded-full bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600" />

                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getEventIcon(event.eventType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm mb-1">{event.description}</p>
                          <p className="text-xs opacity-90">
                            {event.eventType === 'job_added' ? t.timeline.eventTypes.jobAdded : ''}
                            {event.eventType === 'interview_scheduled' ? t.timeline.eventTypes.interviewScheduled : ''}
                            {event.eventType === 'interview_completed' ? t.timeline.eventTypes.interviewCompleted : ''}
                            {event.eventType === 'interview_feedback' ? t.timeline.eventTypes.awaitingFeedback : ''}
                          </p>
                          {event.metadata?.interviewRound?.notes && (
                            <p className="text-xs mt-2 opacity-75 italic">
                              {event.metadata.interviewRound.notes}
                            </p>
                          )}
                        </div>
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
