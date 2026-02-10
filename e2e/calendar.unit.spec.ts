import { test, expect } from '@playwright/test';
import { getGoogleCalendarUrl } from '../src/lib/calendar';
import { InterviewRound } from '../src/types';

test.describe('getGoogleCalendarUrl Unit Tests', () => {
  const baseRound: InterviewRound = {
    id: '1',
    jobId: 'job1',
    roundName: 'Initial Screen',
    interviewDate: '2025-05-20',
    startTime: '09:30',
    endTime: '10:30',
    status: 'scheduled',
    notes: 'Some notes',
    meetingLink: 'https://zoom.us/j/123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  test('should generate correct URL with all fields', () => {
    const url = getGoogleCalendarUrl(baseRound);
    expect(url).toContain('text=Interview%3A%20Initial%20Screen');
    expect(url).toContain('dates=20250520T093000%2F20250520T103000');
    expect(url).toContain('details=Some%20notes%0A%0AMeeting%20Link%3A%20https%3A%2F%2Fzoom.us%2Fj%2F123');
    expect(url).toContain('location=https%3A%2F%2Fzoom.us%2Fj%2F123');
  });

  test('should handle missing startTime and endTime with defaults', () => {
    const round = { ...baseRound, startTime: undefined, endTime: undefined };
    const url = getGoogleCalendarUrl(round);
    expect(url).toContain('dates=20250520T090000%2F20250520T100000');
  });

  test('should handle missing notes and meetingLink', () => {
    const round = { ...baseRound, notes: undefined, meetingLink: undefined };
    const url = getGoogleCalendarUrl(round);
    const urlObj = new URL(url);
    expect(urlObj.searchParams.get('details')).toBe('');
    expect(urlObj.searchParams.get('location')).toBe('');
  });

  test('should encode special characters correctly', () => {
    const round = {
      ...baseRound,
      roundName: 'Coffee & Chat',
      notes: 'Cost: $10 = cheap?',
      meetingLink: 'https://example.com/?q=1&b=2'
    };
    const url = getGoogleCalendarUrl(round);
    expect(url).toContain('text=Interview%3A%20Coffee%20%26%20Chat');
    const urlObj = new URL(url);
    expect(urlObj.searchParams.get('details')).toBe('Cost: $10 = cheap?\n\nMeeting Link: https://example.com/?q=1&b=2');
  });

  test('should handle HH:MM:SS time format correctly', () => {
    const round = {
      ...baseRound,
      startTime: '09:30:15',
      endTime: '10:30:45'
    };
    const url = getGoogleCalendarUrl(round);
    expect(url).toContain('dates=20250520T093015%2F20250520T103045');
  });

  test('should handle missing interviewDate with a fallback', () => {
    // @ts-ignore - testing runtime fallback for missing date
    const round = { ...baseRound, interviewDate: '' };
    const url = getGoogleCalendarUrl(round);
    const datesParam = new URL(url).searchParams.get('dates');
    expect(datesParam).toMatch(/^\d{8}T\d{6}\/\d{8}T\d{6}$/);
  });

  test('should handle empty strings for optional fields', () => {
    const round = { ...baseRound, startTime: '', endTime: '', notes: '', meetingLink: '' };
    const url = getGoogleCalendarUrl(round);
    expect(url).toContain('dates=20250520T090000%2F20250520T100000');
    const urlObj = new URL(url);
    expect(urlObj.searchParams.get('details')).toBe('');
  });
});
