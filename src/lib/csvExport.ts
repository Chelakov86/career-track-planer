import { JobApplication, Language } from '../types';
import { TRANSLATIONS } from '../constants';

/**
 * Escapes a string for CSV format.
 */
const escapeCsv = (str: string | undefined): string => {
  if (!str) return '""';
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * Generates a CSV string from a list of job applications,
 * including interview round data as flattened rows.
 */
export const generateJobsCSV = (jobs: JobApplication[], language: Language): string => {
  const t = TRANSLATIONS[language];
  const BOM = "\uFEFF";
  const headers = [
    t.board.placeholders.company,
    t.board.placeholders.position,
    t.board.labels.status,
    t.board.labels.location,
    t.board.labels.salary,
    t.board.labels.link,
    t.board.labels.dateAdded,
    t.board.labels.lastUpdated,
    t.board.labels.notes,
    t.board.labels.interviewRound,
    t.board.labels.interviewDate,
    t.board.labels.interviewStart,
    t.board.labels.interviewEnd,
    t.board.labels.interviewStatus,
    t.board.labels.interviewNotes,
    t.board.labels.interviewMeetingLink
  ];

  const emptyInterviewCols = Array(7).fill('""').join(',');

  const rows: string[] = [];
  for (const job of jobs) {
    const baseCols = [
      escapeCsv(job.company),
      escapeCsv(job.position),
      escapeCsv(t.board.status[job.status]),
      escapeCsv(job.location),
      escapeCsv(job.salary),
      escapeCsv(job.link),
      escapeCsv(job.dateAdded),
      escapeCsv(job.lastUpdated),
      escapeCsv(job.notes?.replace(/\n/g, ' '))
    ].join(',');

    if (job.interviewRounds && job.interviewRounds.length > 0) {
      for (const round of job.interviewRounds) {
        const interviewCols = [
          escapeCsv(round.roundName),
          escapeCsv(round.interviewDate),
          escapeCsv(round.startTime),
          escapeCsv(round.endTime),
          escapeCsv(t.interviewRound.statuses[round.status]),
          escapeCsv(round.notes?.replace(/\n/g, ' ')),
          escapeCsv(round.meetingLink)
        ].join(',');
        rows.push(`${baseCols},${interviewCols}`);
      }
    } else {
      rows.push(`${baseCols},${emptyInterviewCols}`);
    }
  }

  const csvContent = [headers.join(','), ...rows].join('\n');
  return BOM + csvContent;
};

/**
 * Triggers a download of a file in the browser.
 */
export const downloadFile = (content: string, filename: string, contentType: string): void => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
