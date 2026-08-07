-- Record precise application changes without changing the existing date-only field.
ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

ALTER TABLE public.jobs
  ALTER COLUMN updated_at SET DEFAULT NOW();

CREATE OR REPLACE FUNCTION public.set_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_jobs_updated_at ON public.jobs;

CREATE TRIGGER set_jobs_updated_at
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_jobs_updated_at();

CREATE OR REPLACE FUNCTION public.touch_job_updated_at_from_interview_round()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_job_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.job_id IS DISTINCT FROM NEW.job_id THEN
    UPDATE public.jobs
    SET updated_at = NOW()
    WHERE id = OLD.job_id;
  END IF;

  affected_job_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.job_id ELSE NEW.job_id END;

  IF affected_job_id IS NOT NULL THEN
    UPDATE public.jobs
    SET updated_at = NOW()
    WHERE id = affected_job_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_job_updated_at_from_interview_round ON public.interview_rounds;

CREATE TRIGGER touch_job_updated_at_from_interview_round
  AFTER INSERT OR UPDATE OR DELETE ON public.interview_rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_job_updated_at_from_interview_round();
