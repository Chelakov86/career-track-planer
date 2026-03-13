import { test, expect } from '@playwright/test';
import { generateJobsCSV } from '../src/lib/csvExport';
import { ApplicationStatus, JobApplication, InterviewRound } from '../src/types';

const makeJob = (overrides: Partial<JobApplication> = {}): JobApplication => ({
  id: 'j1',
  company: 'Acme Corp',
  position: 'Engineer',
  location: 'Berlin',
  status: ApplicationStatus.APPLIED,
  dateAdded: '2025-01-10',
  lastUpdated: '2025-01-15',
  notes: 'Good fit',
  salary: '70k',
  link: 'https://example.com',
  ...overrides,
});

const makeRound = (overrides: Partial<InterviewRound> = {}): InterviewRound => ({
  id: 'r1',
  jobId: 'j1',
  roundName: 'Phone Screen',
  interviewDate: '2025-02-01',
  startTime: '10:00',
  endTime: '11:00',
  status: 'scheduled',
  notes: 'Prep algorithms',
  meetingLink: 'https://zoom.us/123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

/** Strip BOM for easier assertions */
const stripBom = (csv: string) => csv.replace(/^\uFEFF/, '');

test.describe('generateJobsCSV with Interview Rounds', () => {
  test('should include interview column headers', () => {
    const csv = stripBom(generateJobsCSV([], 'en'));
    const headers = csv.split('\n')[0];
    expect(headers).toContain('Interview Round');
    expect(headers).toContain('Interview Date');
    expect(headers).toContain('Start Time');
    expect(headers).toContain('End Time');
    expect(headers).toContain('Interview Status');
    expect(headers).toContain('Interview Notes');
    expect(headers).toContain('Meeting Link');
  });

  test('should include DE interview column headers', () => {
    const csv = stripBom(generateJobsCSV([], 'de'));
    const headers = csv.split('\n')[0];
    expect(headers).toContain('Interview-Runde');
    expect(headers).toContain('Interview-Datum');
    expect(headers).toContain('Interview-Status');
    expect(headers).toContain('Meeting-Link');
  });

  test('job with no interview rounds produces 1 row with empty interview cols', () => {
    const csv = stripBom(generateJobsCSV([makeJob()], 'en'));
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2); // header + 1 data row
    const dataCols = lines[1].match(/"[^"]*"/g) || [];
    // 9 base + 7 interview = 16 columns
    expect(dataCols).toHaveLength(16);
    // Last 7 should be empty strings
    for (let i = 9; i < 16; i++) {
      expect(dataCols[i]).toBe('""');
    }
  });

  test('job with 2 interview rounds produces 2 rows', () => {
    const rounds: InterviewRound[] = [
      makeRound({ id: 'r1', roundName: 'Phone Screen' }),
      makeRound({ id: 'r2', roundName: 'On-site', interviewDate: '2025-02-10', status: 'completed' }),
    ];
    const csv = stripBom(generateJobsCSV([makeJob({ interviewRounds: rounds })], 'en'));
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // header + 2 data rows
    expect(lines[1]).toContain('"Phone Screen"');
    expect(lines[2]).toContain('"On-site"');
  });

  test('interview status is localized', () => {
    const rounds = [makeRound({ status: 'completed' })];
    const csvEn = stripBom(generateJobsCSV([makeJob({ interviewRounds: rounds })], 'en'));
    expect(csvEn).toContain('"Completed"');

    const csvDe = stripBom(generateJobsCSV([makeJob({ interviewRounds: rounds })], 'de'));
    expect(csvDe).toContain('"Abgeschlossen"');
  });

  test('special characters in interview notes are escaped', () => {
    const rounds = [makeRound({ notes: 'He said "hello", then left' })];
    const csv = stripBom(generateJobsCSV([makeJob({ interviewRounds: rounds })], 'en'));
    // CSV escaping doubles the quotes
    expect(csv).toContain('"He said ""hello"", then left"');
  });

  test('mixed jobs with and without rounds produce correct row count', () => {
    const jobWithRounds = makeJob({
      id: 'j1',
      interviewRounds: [makeRound(), makeRound({ id: 'r2', roundName: 'Final' })],
    });
    const jobWithoutRounds = makeJob({ id: 'j2', company: 'Beta Inc' });
    const csv = stripBom(generateJobsCSV([jobWithRounds, jobWithoutRounds], 'en'));
    const lines = csv.split('\n');
    expect(lines).toHaveLength(4); // header + 2 rows for j1 + 1 row for j2
  });

  test('job base data is repeated for each interview round', () => {
    const rounds = [
      makeRound({ id: 'r1', roundName: 'Round 1' }),
      makeRound({ id: 'r2', roundName: 'Round 2' }),
    ];
    const csv = stripBom(generateJobsCSV([makeJob({ interviewRounds: rounds })], 'en'));
    const lines = csv.split('\n');
    // Both data rows should start with the same company
    expect(lines[1]).toMatch(/^"Acme Corp"/);
    expect(lines[2]).toMatch(/^"Acme Corp"/);
  });

  test('interview meeting link and times are included', () => {
    const rounds = [makeRound({ startTime: '14:30', endTime: '15:30', meetingLink: 'https://meet.google.com/abc' })];
    const csv = stripBom(generateJobsCSV([makeJob({ interviewRounds: rounds })], 'en'));
    expect(csv).toContain('"14:30"');
    expect(csv).toContain('"15:30"');
    expect(csv).toContain('"https://meet.google.com/abc"');
  });
});
