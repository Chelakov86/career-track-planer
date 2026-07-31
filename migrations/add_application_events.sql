-- Application Events are the append-only record of Job Application status transitions.
-- Before applying this migration, verify that public.jobs.status is TEXT with the
-- values below and inspect existing triggers on public.jobs.

ALTER TABLE public.jobs
  ADD COLUMN status_changed_on DATE;

ALTER TABLE public.jobs
  ADD COLUMN status_change_token UUID;

ALTER TABLE public.jobs
  ADD COLUMN status_timezone_offset_minutes INTEGER;

CREATE TABLE application_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  from_status TEXT CHECK (from_status IN ('RESEARCH', 'TO_APPLY', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED')),
  to_status TEXT NOT NULL CHECK (to_status IN ('RESEARCH', 'TO_APPLY', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED')),
  occurred_on DATE NOT NULL,
  backfilled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_application_events_user_occurred
  ON application_events(user_id, occurred_on);

CREATE INDEX idx_application_events_job_id
  ON application_events(job_id);

ALTER TABLE application_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own application events"
  ON application_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.log_application_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_from_status TEXT;
  event_to_status TEXT;
  event_occurred_on DATE;
BEGIN
  IF TG_OP = 'INSERT' THEN
    event_from_status := NULL;
    event_to_status := NEW.status;
    event_occurred_on := NEW.date_added;
  ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    event_from_status := OLD.status;
    event_to_status := NEW.status;
    -- The browser supplies a fresh plain local date for status changes. Do
    -- not reuse a persisted transport value for out-of-band updates.
    event_occurred_on := CASE
      WHEN NEW.status_changed_on IS NOT NULL
        AND NEW.status_change_token IS NOT NULL
        AND NEW.status_change_token IS DISTINCT FROM OLD.status_change_token
        AND NEW.status_timezone_offset_minutes BETWEEN -840 AND 840
        AND NEW.status_changed_on = (
          (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')
          - make_interval(mins => NEW.status_timezone_offset_minutes)
        )::DATE
        THEN NEW.status_changed_on
      ELSE (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::DATE
    END;
  ELSE
    RETURN NEW;
  END IF;

  INSERT INTO public.application_events (
    job_id,
    user_id,
    from_status,
    to_status,
    occurred_on
  )
  VALUES (
    NEW.id,
    NEW.user_id,
    event_from_status,
    event_to_status,
    event_occurred_on
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER log_application_event_on_insert
  AFTER INSERT ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.log_application_event();

CREATE TRIGGER log_application_event_on_status_change
  AFTER UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.log_application_event();

-- Existing Job Applications have no trustworthy transition history. These rows
-- are best-effort approximations and remain distinguishable via backfilled.
INSERT INTO application_events (
  job_id,
  user_id,
  from_status,
  to_status,
  occurred_on,
  backfilled
)
SELECT
  id,
  user_id,
  NULL,
  'RESEARCH',
  date_added,
  TRUE
FROM jobs;

INSERT INTO application_events (
  job_id,
  user_id,
  from_status,
  to_status,
  occurred_on,
  backfilled
)
SELECT
  id,
  user_id,
  'RESEARCH',
  'APPLIED',
  CASE WHEN status = 'APPLIED' THEN last_updated ELSE date_added END,
  TRUE
FROM jobs
WHERE status IN ('APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED');

INSERT INTO application_events (
  job_id,
  user_id,
  from_status,
  to_status,
  occurred_on,
  backfilled
)
SELECT
  id,
  user_id,
  'APPLIED',
  'REJECTED',
  last_updated,
  TRUE
FROM jobs
WHERE status = 'REJECTED';
