import { InterviewRound } from '../types';

export const getGoogleCalendarUrl = (round: InterviewRound) => {
    const title = encodeURIComponent(`Interview: ${round.roundName}`);

    // GCal dates format: YYYYMMDDTHHMMSSZ
    // We have interviewDate (YYYY-MM-DD), startTime (HH:MM), endTime (HH:MM)
    const dateStr = round.interviewDate.replace(/-/g, '');
    const startStr = round.startTime ? round.startTime.replace(/:/g, '') + '00' : '090000';
    const endStr = round.endTime ? round.endTime.replace(/:/g, '') + '00' : '100000';

    const dates = `${dateStr}T${startStr}/${dateStr}T${endStr}`;
    const details = encodeURIComponent(`${round.notes || ''}${round.meetingLink ? `\n\nMeeting Link: ${round.meetingLink}` : ''}`);
    const location = encodeURIComponent(round.meetingLink || '');

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
};
