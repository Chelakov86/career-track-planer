import { useEffect, useState } from 'react';
import { ApplicationEvent, ApplicationStatus, JobApplication, User } from '../types';
import { supabase } from '../lib/supabase';

interface DbApplicationEvent {
  id: string;
  job_id: string;
  user_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  occurred_on: string;
  backfilled: boolean;
}

const mapDbToUi = (event: DbApplicationEvent): ApplicationEvent => ({
  id: event.id,
  jobId: event.job_id,
  fromStatus: event.from_status,
  toStatus: event.to_status,
  occurredOn: event.occurred_on,
  backfilled: event.backfilled,
});

export const useApplicationEvents = (
  user: User | null,
  jobs: JobApplication[],
  jobsRevision: number
) => {
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('application_events')
        .select('id, job_id, user_id, from_status, to_status, occurred_on, backfilled')
        .eq('user_id', user.id)
        .order('occurred_on', { ascending: true });

      if (cancelled) return;

      if (fetchError) {
        console.error('Error fetching application events:', fetchError);
        setEvents([]);
        setError(fetchError.message);
      } else {
        setEvents((data as DbApplicationEvent[] | null)?.map(mapDbToUi) || []);
      }

      setLoading(false);
    };

    void fetchEvents();

    // A job trigger writes the event in the same transaction, but a fresh
    // page can briefly read before the committed row is visible through the
    // API. One short retry keeps the dashboard fresh without a polling loop.
    const retryTimeout = window.setTimeout(() => {
      if (!cancelled) void fetchEvents();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(retryTimeout);
    };
  }, [user, jobs, jobsRevision]);

  return { events, loading, error };
};
