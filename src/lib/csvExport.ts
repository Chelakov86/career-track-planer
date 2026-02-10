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
 * Generates a CSV string from a list of job applications.
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
    t.board.labels.notes
  ];

  const csvContent = [
    headers.join(','),
    ...jobs.map(job => [
      escapeCsv(job.company),
      escapeCsv(job.position),
      escapeCsv(t.board.status[job.status]),
      escapeCsv(job.location),
      escapeCsv(job.salary),
      escapeCsv(job.link),
      escapeCsv(job.dateAdded),
      escapeCsv(job.lastUpdated),
      escapeCsv(job.notes?.replace(/\n/g, ' '))
    ].join(','))
  ].join('\n');

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
