-- Fix interview_rounds update timestamp trigger.
-- Some deployed databases may have an interview_rounds trigger attached to a
-- jobs timestamp function that writes NEW.last_updated. interview_rounds uses
-- updated_at instead.

DO $$
DECLARE
  trigger_record RECORD;
BEGIN
  FOR trigger_record IN
    SELECT trigger_instance.tgname AS trigger_name
    FROM pg_trigger AS trigger_instance
    JOIN pg_proc AS trigger_function
      ON trigger_function.oid = trigger_instance.tgfoid
    WHERE trigger_instance.tgrelid = 'public.interview_rounds'::regclass
      AND NOT trigger_instance.tgisinternal
      AND (trigger_instance.tgtype & 16) = 16
      AND trigger_function.prosrc ILIKE '%last_updated%'
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS %I ON public.interview_rounds',
      trigger_record.trigger_name
    );
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS set_interview_rounds_updated_at ON public.interview_rounds;

CREATE OR REPLACE FUNCTION public.set_interview_rounds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_interview_rounds_updated_at
  BEFORE UPDATE ON public.interview_rounds
  FOR EACH ROW
  EXECUTE FUNCTION public.set_interview_rounds_updated_at();
