-- Add start_time and end_time columns to interview_rounds table
ALTER TABLE interview_rounds
ADD COLUMN start_time TIME,
ADD COLUMN end_time TIME;

-- Add index for time-based queries
CREATE INDEX idx_interview_rounds_start_time ON interview_rounds(start_time);
