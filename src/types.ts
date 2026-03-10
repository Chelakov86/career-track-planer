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
  notes: string;
  salary?: string;
  link?: string;
  interviewRounds?: InterviewRound[];
}

export type TimelineEventType = 'job_added' | 'job_applied' | 'status_changed' | 'interview_scheduled' | 'interview_completed' | 'interview_feedback';

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
