import { test, expect } from '@playwright/test';
import { extractMeetingLink, normalizeGoogleCalendarEvent, stripHtmlToText } from '../api/utils/googleCalendar';

test.describe('Google Calendar normalization', () => {
  test('maps a timed event into import fields', () => {
    const event = normalizeGoogleCalendarEvent({
      id: 'event-1',
      summary: 'Technical Interview - Acme',
      description: '<p>Bring portfolio</p>',
      htmlLink: 'https://calendar.google.com/event',
      start: { dateTime: '2026-06-04T14:00:00+02:00' },
      end: { dateTime: '2026-06-04T15:00:00+02:00' }
    }, 'primary', 'Vlad', { company: 'Acme', position: 'Frontend Engineer' });

    expect(event).toMatchObject({
      id: 'event-1',
      calendarId: 'primary',
      calendarSummary: 'Vlad',
      summary: 'Technical Interview - Acme',
      description: 'Bring portfolio',
      interviewDate: '2026-06-04',
      startTime: '14:00',
      endTime: '15:00',
      isInterviewLike: true,
      isJobMatch: true
    });
  });

  test('excludes all-day events', () => {
    const event = normalizeGoogleCalendarEvent({
      id: 'all-day',
      summary: 'Out of office',
      start: { date: '2026-06-04' },
      end: { date: '2026-06-05' }
    }, 'primary', 'Vlad');

    expect(event).toBeNull();
  });

  test('strips HTML and decodes common entities', () => {
    expect(stripHtmlToText('<p>Interview&nbsp;with <b>R&amp;D</b></p><br>Bring CV')).toBe('Interview with R&D Bring CV');
  });

  test('extracts meeting links by priority', () => {
    const conference = extractMeetingLink({
      hangoutLink: 'https://meet.google.com/hangout',
      location: 'https://zoom.us/location',
      conferenceData: {
        entryPoints: [{ uri: 'https://meet.google.com/conference' }]
      }
    });

    const location = extractMeetingLink({
      location: 'Join https://zoom.us/j/123'
    });

    expect(conference).toBe('https://meet.google.com/conference');
    expect(location).toBe('https://zoom.us/j/123');
  });

  test('matches German interview keywords and job position', () => {
    const event = normalizeGoogleCalendarEvent({
      id: 'event-2',
      summary: 'Vorstellungsgespräch Senior PM',
      start: { dateTime: '2026-06-04T09:00:00+02:00' },
      end: { dateTime: '2026-06-04T10:00:00+02:00' }
    }, 'primary', 'Vlad', { position: 'Senior PM' });

    expect(event?.isInterviewLike).toBe(true);
    expect(event?.isJobMatch).toBe(true);
  });
});
