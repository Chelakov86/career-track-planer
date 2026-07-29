ALTER TABLE interview_rounds
ADD COLUMN source_provider TEXT,
ADD COLUMN source_calendar_id TEXT,
ADD COLUMN source_event_id TEXT,
ADD COLUMN source_event_url TEXT;

CREATE UNIQUE INDEX idx_interview_rounds_google_event_per_job
ON interview_rounds(job_id, source_provider, source_calendar_id, source_event_id)
WHERE source_provider = 'google_calendar';
