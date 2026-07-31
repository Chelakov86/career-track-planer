-- Validate browser local-date metadata before using it for an event.
-- Invalid, stale, or out-of-band updates use the database's current UTC date.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS status_timezone_offset_minutes INTEGER;

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
    event_occurred_on := CASE
      WHEN NEW.status_changed_on IS NOT NULL
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
