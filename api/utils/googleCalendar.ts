export interface GoogleCalendarApiEvent {
  id?: string;
  summary?: string;
  description?: string;
  location?: string;
  htmlLink?: string;
  hangoutLink?: string;
  start?: {
    date?: string;
    dateTime?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
  };
  conferenceData?: {
    entryPoints?: Array<{
      uri?: string;
      entryPointType?: string;
    }>;
  };
}

export interface NormalizedGoogleCalendarEvent {
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

const INTERVIEW_TERMS = [
  'interview',
  'screen',
  'technical',
  'recruiter',
  'hiring',
  'hr',
  'onsite',
  'on-site',
  'final',
  'coding',
  'assessment',
  'vorstellung',
  'vorstellungsgespräch',
  'gespräch',
  'bewerbung',
  'bewerbungsgespräch',
  'kennenlernen'
];

const ENTITY_MAP: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' '
};

const URL_PATTERN = /https?:\/\/[^\s<>"')]+/i;

export const stripHtmlToText = (value?: string) => {
  if (!value) return '';

  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITY_MAP[entity] || entity)
    .replace(/\s+/g, ' ')
    .trim();
};

export const extractMeetingLink = (event: GoogleCalendarApiEvent, plainDescription = stripHtmlToText(event.description)) => {
  const conferenceUri = event.conferenceData?.entryPoints?.find((entryPoint) => entryPoint.uri)?.uri;
  if (conferenceUri) return conferenceUri;

  if (event.hangoutLink) return event.hangoutLink;

  const locationMatch = event.location?.match(URL_PATTERN);
  if (locationMatch) return locationMatch[0];

  const descriptionMatch = plainDescription.match(URL_PATTERN);
  return descriptionMatch?.[0];
};

const getDatePart = (dateTime: string) => dateTime.slice(0, 10);

const getTimePart = (dateTime: string) => {
  const match = dateTime.match(/T(\d{2}:\d{2})/);
  return match?.[1] || '';
};

const includesTerm = (source: string, term: string) => {
  const normalized = source.toLocaleLowerCase();
  const normalizedTerm = term.toLocaleLowerCase();
  return normalized.includes(normalizedTerm);
};

export const normalizeGoogleCalendarEvent = (
  event: GoogleCalendarApiEvent,
  calendarId: string,
  calendarSummary: string,
  job?: { company?: string; position?: string }
): NormalizedGoogleCalendarEvent | null => {
  if (!event.id || !event.start?.dateTime || !event.end?.dateTime) {
    return null;
  }

  const description = stripHtmlToText(event.description);
  const summary = event.summary || 'Untitled event';
  const searchableText = `${summary} ${description} ${event.location || ''}`;
  const jobTerms = [job?.company, job?.position].filter((term): term is string => Boolean(term?.trim()));

  return {
    id: event.id,
    calendarId,
    calendarSummary,
    summary,
    description,
    start: event.start.dateTime,
    end: event.end.dateTime,
    interviewDate: getDatePart(event.start.dateTime),
    startTime: getTimePart(event.start.dateTime),
    endTime: getTimePart(event.end.dateTime),
    meetingLink: extractMeetingLink(event, description),
    htmlLink: event.htmlLink,
    isInterviewLike: INTERVIEW_TERMS.some((term) => includesTerm(searchableText, term)),
    isJobMatch: jobTerms.some((term) => includesTerm(searchableText, term))
  };
};
