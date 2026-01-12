-- Migration: Add link column to jobs table
-- Run this in your Supabase SQL Editor

ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS link TEXT;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN jobs.link IS 'URL link to the job posting';
