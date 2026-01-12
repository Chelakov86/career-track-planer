export type RoleFocus = 'PM' | 'QA' | 'General';

export type Language = 'en' | 'de';

export enum ApplicationStatus {
  RESEARCH = 'RESEARCH',
  TO_APPLY = 'TO_APPLY',
  APPLIED = 'APPLIED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED'
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  roleType: RoleFocus;
  dateAdded: string;
  lastUpdated: string;
  notes: string;
  salary?: string;
  link?: string;
}

export interface ScheduleBlock {
  id: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  title: string;
  description: string;
  category: 'Research' | 'Deep Work' | 'Break' | 'Learning' | 'Network' | 'Admin';
  isFixed: boolean;
}

export interface DailyStat {
  date: string;
  applicationsSent: number;
  studyHours: number;
}