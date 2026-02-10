import { InterviewRound } from '../types';

export const getGoogleCalendarUrl = (round: InterviewRound) => {
    const title = encodeURIComponent(`Interview: ${round.roundName}`);

    // Helper to format time to HHMMSS
    const formatTime = (timeStr: string | undefined | null, defaultTime: string) => {
        if (!timeStr) return defaultTime;

        // Remove colons
        const cleanTime = timeStr.replace(/:/g, '');

        // HH:MM -> HHMMSS (add 00)
        if (cleanTime.length === 4) {
            return cleanTime + '00';
        }

        // HH:MM:SS -> HHMMSS (keep as is)
        if (cleanTime.length === 6) {
            return cleanTime;
        }

        // Fallback: pad with zeros or return default if malformed
        return cleanTime.padEnd(6, '0').slice(0, 6);
    };

    // GCal dates format: YYYYMMDDTHHMMSSZ
    // We have interviewDate (YYYY-MM-DD), startTime (HH:MM or HH:MM:SS), endTime (HH:MM or HH:MM:SS)
    const dateStr = round.interviewDate ? round.interviewDate.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');
    const startStr = formatTime(round.startTime, '090000');
    const endStr = formatTime(round.endTime, '100000');

    const dates = encodeURIComponent(`${dateStr}T${startStr}/${dateStr}T${endStr}`);
    const details = encodeURIComponent(`${round.notes || ''}${round.meetingLink ? `${round.notes ? '\n\n' : '' }Meeting Link: ${round.meetingLink}` : ''}`);
    const location = encodeURIComponent(round.meetingLink || '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
};
