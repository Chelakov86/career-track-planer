import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleCalendarApiEvent, normalizeGoogleCalendarEvent } from '../utils/googleCalendar';

interface GoogleEventsResponse {
  items?: GoogleCalendarApiEvent[];
}

interface CalendarSummary {
  id: string;
  summary: string;
}

const isValidCalendarIds = (value: unknown): value is string[] => (
  Array.isArray(value) && value.length > 0 && value.every((id) => typeof id === 'string' && id.trim().length > 0)
);

const getRange = () => {
  const now = new Date();
  const timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const timeMax = new Date(timeMin);
  timeMax.setDate(timeMax.getDate() + 90);
  timeMax.setHours(23, 59, 59, 999);

  return {
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString()
  };
};

const fetchCalendarSummaries = async (providerToken: string): Promise<Map<string, string>> => {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: {
      Authorization: `Bearer ${providerToken}`
    }
  });

  if (!response.ok) return new Map();

  const data = await response.json() as { items?: CalendarSummary[] };
  return new Map((data.items || []).filter((calendar) => calendar.id).map((calendar) => [calendar.id, calendar.summary]));
};

const respondGoogleError = async (response: Response, res: VercelResponse) => {
  const body = await response.json().catch(() => ({}));
  const message = body?.error?.message || 'Google Calendar request failed';

  if (response.status === 401 || response.status === 403) {
    return res.status(response.status).json({
      code: 'calendar_reconnect_required',
      error: message
    });
  }

  return res.status(response.status).json({
    code: 'calendar_setup_required',
    error: message
  });
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const providerToken = req.body?.providerToken;
  const calendarIds = req.body?.calendarIds;
  const job = req.body?.job;

  if (!providerToken || typeof providerToken !== 'string') {
    return res.status(401).json({
      code: 'calendar_not_connected',
      error: 'Google Calendar is not connected'
    });
  }

  if (!isValidCalendarIds(calendarIds)) {
    return res.status(400).json({
      code: 'invalid_calendar_ids',
      error: 'calendarIds must be a non-empty string array'
    });
  }

  if (job && (typeof job !== 'object' || Array.isArray(job))) {
    return res.status(400).json({
      code: 'invalid_job',
      error: 'job must be an object'
    });
  }

  try {
    const { timeMin, timeMax } = getRange();
    const calendarSummaries = await fetchCalendarSummaries(providerToken);
    const events = [];

    for (const calendarId of calendarIds) {
      const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`);
      url.searchParams.set('timeMin', timeMin);
      url.searchParams.set('timeMax', timeMax);
      url.searchParams.set('singleEvents', 'true');
      url.searchParams.set('orderBy', 'startTime');
      url.searchParams.set('showDeleted', 'false');
      url.searchParams.set('conferenceDataVersion', '1');

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${providerToken}`
        }
      });

      if (!response.ok) {
        return respondGoogleError(response, res);
      }

      const data = await response.json() as GoogleEventsResponse;
      const calendarSummary = calendarSummaries.get(calendarId) || calendarId;
      for (const event of data.items || []) {
        const normalized = normalizeGoogleCalendarEvent(event, calendarId, calendarSummary, {
          company: typeof job?.company === 'string' ? job.company : undefined,
          position: typeof job?.position === 'string' ? job.position : undefined
        });

        if (normalized) {
          events.push(normalized);
        }
      }
    }

    events.sort((a, b) => a.start.localeCompare(b.start));
    return res.status(200).json({ events });
  } catch (error) {
    console.error('Error listing Google Calendar events:', error);
    return res.status(500).json({
      code: 'calendar_setup_required',
      error: 'Unable to list Google Calendar events'
    });
  }
}
