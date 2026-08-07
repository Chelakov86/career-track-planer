export type Language = 'en' | 'de';


export type InterviewRoundStatus = 'scheduled' | 'completed' | 'awaiting_feedback';

export enum ApplicationStatus {
  RESEARCH = 'RESEARCH',
  TO_APPLY = 'TO_APPLY',
  APPLIED = 'APPLIED',
  INTERVIEW = 'INTERVIEW',
  OFFER = 'OFFER',
  REJECTED = 'REJECTED'
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface InterviewRound {
  id: string;
  jobId: string;
  roundName: string;
  interviewDate: string;  // ISO YYYY-MM-DD
  startTime?: string;     // HH:MM
  endTime?: string;       // HH:MM
  status: InterviewRoundStatus;
  notes?: string;
  meetingLink?: string;
  sourceProvider?: 'google_calendar';
  sourceCalendarId?: string;
  sourceEventId?: string;
  sourceEventUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  location: string;
  status: ApplicationStatus;
  dateAdded: string;
  lastUpdated: string;
  updatedAt?: string | null;
  notes: string;
  salary?: string;
  link?: string;
  interviewRounds?: InterviewRound[];
}

export interface ApplicationEvent {
  id: string;
  jobId: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  occurredOn: string; // ISO YYYY-MM-DD
  backfilled: boolean;
}

export type Grain = 'day' | 'week' | 'month';

export type PeriodPreset =
  | 'this_week'
  | 'last_4_weeks'
  | 'last_8_weeks'
  | 'last_3_months'
  | 'this_year'
  | 'all_time'
  | 'custom';

export type TimelineEventType = 'job_added' | 'job_applied' | 'job_rejected' | 'status_changed' | 'interview_scheduled' | 'interview_completed' | 'interview_feedback';

export interface TimelineEvent {
  id: string;
  jobId: string;
  company: string;
  position: string;
  eventType: TimelineEventType;
  eventDate: string;
  description: string;
  metadata?: {
    oldStatus?: ApplicationStatus;
    newStatus?: ApplicationStatus;
    interviewRound?: InterviewRound;
  };
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
