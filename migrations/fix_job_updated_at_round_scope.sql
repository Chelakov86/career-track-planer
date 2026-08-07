-- Harden the parent timestamp touch added in add_job_updated_at.sql:
-- scope the update to the interview round owner's job.
-- Apply AFTER add_job_updated_at.sql; replaces the unscoped function body.
CREATE OR REPLACE FUNCTION public.touch_job_updated_at_from_interview_round()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_job_id UUID;
  affected_user_id UUID;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.job_id IS DISTINCT FROM NEW.job_id THEN
    UPDATE public.jobs
    SET updated_at = NOW()
    WHERE id = OLD.job_id
      AND user_id = OLD.user_id;
  END IF;

  affected_job_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.job_id ELSE NEW.job_id END;
  affected_user_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END;

  IF affected_job_id IS NOT NULL THEN
    UPDATE public.jobs
    SET updated_at = NOW()
    WHERE id = affected_job_id
      AND user_id = affected_user_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$;
