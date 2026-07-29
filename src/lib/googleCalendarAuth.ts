import { supabase } from './supabase';
import { User } from '../types';

export const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
export const PENDING_CALENDAR_IMPORT_KEY = 'career_track_pending_calendar_import';
export const SELECTED_CALENDAR_IDS_KEY = 'career_track_google_calendar_ids';

export interface PendingCalendarImport {
  jobId: string;
  resumeImport: true;
}

export const getGoogleCalendarProviderToken = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error reading Supabase session:', error);
    return null;
  }

  return data.session?.provider_token || null;
};

export const requestGoogleCalendarAccess = async (user: User | null) => {
  const redirectTo = import.meta.env.VITE_SITE_URL || window.location.origin;
  const { data } = await supabase.auth.getSession();
  const providers = data.session?.user?.app_metadata?.providers;
  const isGoogleUser = Array.isArray(providers) && providers.includes('google');

  if (user && !isGoogleUser) {
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo,
        scopes: GOOGLE_CALENDAR_SCOPE,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent'
        }
      }
    });

    if (error) throw error;
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      scopes: GOOGLE_CALENDAR_SCOPE,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent'
      }
    }
  });

  if (error) throw error;
};

export const savePendingCalendarImport = (jobId: string) => {
  const pendingImport: PendingCalendarImport = {
    jobId,
    resumeImport: true
  };

  sessionStorage.setItem(PENDING_CALENDAR_IMPORT_KEY, JSON.stringify(pendingImport));
};

export const readPendingCalendarImport = (): PendingCalendarImport | null => {
  const raw = sessionStorage.getItem(PENDING_CALENDAR_IMPORT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (parsed?.jobId && parsed.resumeImport === true) {
      return parsed;
    }
  } catch (error) {
    console.error('Error reading pending calendar import:', error);
  }

  return null;
};

export const clearPendingCalendarImport = () => {
  sessionStorage.removeItem(PENDING_CALENDAR_IMPORT_KEY);
};
