import type { VercelRequest, VercelResponse } from '@vercel/node';

interface GoogleCalendarListResponse {
  items?: Array<{
    id?: string;
    summary?: string;
    primary?: boolean;
    backgroundColor?: string;
  }>;
}

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
  if (!providerToken || typeof providerToken !== 'string') {
    return res.status(401).json({
      code: 'calendar_not_connected',
      error: 'Google Calendar is not connected'
    });
  }

  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers: {
        Authorization: `Bearer ${providerToken}`
      }
    });

    if (!response.ok) {
      return respondGoogleError(response, res);
    }

    const data = await response.json() as GoogleCalendarListResponse;
    const calendars = (data.items || [])
      .filter((calendar) => calendar.id && calendar.summary)
      .map((calendar) => ({
        id: calendar.id!,
        summary: calendar.summary!,
        primary: Boolean(calendar.primary),
        backgroundColor: calendar.backgroundColor
      }));

    return res.status(200).json({ calendars });
  } catch (error) {
    console.error('Error listing Google calendars:', error);
    return res.status(500).json({
      code: 'calendar_setup_required',
      error: 'Unable to list Google calendars'
    });
  }
}
