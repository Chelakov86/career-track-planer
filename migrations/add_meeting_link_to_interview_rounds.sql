-- Migration: Add meeting_link column to interview_rounds table
-- Run this in your Supabase SQL Editor

ALTER TABLE interview_rounds
ADD COLUMN IF NOT EXISTS meeting_link TEXT;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN interview_rounds.meeting_link IS 'URL link for the interview meeting (Teams, Zoom, etc.)';
