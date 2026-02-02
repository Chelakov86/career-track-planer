-- Create interview_rounds table for tracking multiple interview rounds per job
CREATE TABLE interview_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  round_name TEXT NOT NULL,
  interview_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'awaiting_feedback')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_interview_rounds_job_id ON interview_rounds(job_id);
CREATE INDEX idx_interview_rounds_user_id ON interview_rounds(user_id);
CREATE INDEX idx_interview_rounds_date ON interview_rounds(interview_date DESC);

-- Enable Row Level Security
ALTER TABLE interview_rounds ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own interview rounds
CREATE POLICY "Users can view their own interview rounds"
  ON interview_rounds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview rounds"
  ON interview_rounds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview rounds"
  ON interview_rounds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interview rounds"
  ON interview_rounds FOR DELETE
  USING (auth.uid() = user_id);
