import { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus, User } from '../types';
import { MOCK_JOBS } from '../constants';
import { supabase } from '../lib/supabase';
import { formatLocalDate } from '../lib/date';

export const useJobs = (user: User | null) => {
    const [jobs, setJobs] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(false);
    const [jobsRevision, setJobsRevision] = useState(0);
    const markJobsPersisted = () => setJobsRevision(revision => revision + 1);

    const fetchJobs = async (currentUser: User) => {
        setLoading(true);

        // Fetch jobs
        const { data: jobsData, error: jobsError } = await supabase
            .from('jobs')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('date_added', { ascending: false });

        if (jobsError) {
            console.error('Error fetching jobs:', jobsError);
            setLoading(false);
            return;
        }

        // Fetch all interview rounds for this user
        const { data: roundsData, error: roundsError } = await supabase
            .from('interview_rounds')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('interview_date', { ascending: true });

        if (roundsError) {
            console.error('Error fetching interview rounds:', roundsError);
        }

        if (jobsData) {
            // Map DB snake_case to JS camelCase
            const mappedJobs: JobApplication[] = jobsData.map((job: any) => {
                // Find interview rounds for this job
                const jobRounds = roundsData
                    ?.filter((round: any) => round.job_id === job.id)
                    .map((round: any) => ({
                        id: round.id,
                        jobId: round.job_id,
                        roundName: round.round_name,
                        interviewDate: round.interview_date,
                        startTime: round.start_time,
                        endTime: round.end_time,
                        status: round.status,
                        notes: round.notes,
                        meetingLink: round.meeting_link,
                        sourceProvider: round.source_provider,
                        sourceCalendarId: round.source_calendar_id,
                        sourceEventId: round.source_event_id,
                        sourceEventUrl: round.source_event_url,
                        createdAt: round.created_at,
                        updatedAt: round.updated_at
                    })) || [];

                return {
                    id: job.id,
                    company: job.company,
                    position: job.position,
                    location: job.location,
                    status: job.status as ApplicationStatus,
                    dateAdded: job.date_added,
                    lastUpdated: job.last_updated,
                    updatedAt: job.updated_at ?? undefined,
                    notes: job.notes,
                    salary: job.salary,
                    // Preserve link value - keep strings, convert null to undefined for consistency
                    link: job.link != null ? job.link : undefined,
                    interviewRounds: jobRounds
                };
            });
            setJobs(mappedJobs);
        }
        setLoading(false);
    };

    // Fetch jobs from Supabase with interview rounds
    useEffect(() => {
        if (!user) {
            setJobs([]);
            return;
        }

        fetchJobs(user);
    }, [user]);

    const refetchJobs = async () => {
        if (user) {
            await fetchJobs(user);
        }
    };

    const addJob = async (job: JobApplication) => {
        if (!user) return;

        // Optimistic update
        const tempId = crypto.randomUUID();
        const newJobWithTempId = { ...job, id: tempId };
        setJobs(prev => [newJobWithTempId, ...prev]);

        const dbJob = {
            user_id: user.id,
            company: job.company,
            position: job.position,
            location: job.location,
            status: job.status,
            date_added: job.dateAdded,
            last_updated: job.lastUpdated,
            notes: job.notes,
            salary: job.salary,
            link: job.link
        };

        const { data, error } = await supabase
            .from('jobs')
            .insert(dbJob)
            .select()
            .single();

        if (error) {
            console.error('Error adding job:', error);
            // Revert optimistic update
            setJobs(prev => prev.filter(j => j.id !== tempId));
            throw new Error(error.message);
        } else if (data) {
            // Replace temp ID with real ID
            setJobs(prev => prev.map(j => j.id === tempId ? {
                ...j,
                id: data.id,
                updatedAt: data.updated_at ?? undefined
            } : j));
            markJobsPersisted();
        }
    };

    const editJob = async (updatedJob: JobApplication) => {
        if (!user) return;

        const previousJobs = [...jobs];
        setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
        const existingJob = jobs.find(job => job.id === updatedJob.id);
        const statusChanged = existingJob ? existingJob.status !== updatedJob.status : false;
        const date = formatLocalDate();
        const timezoneOffsetMinutes = new Date().getTimezoneOffset();

        const dbUpdate = {
            company: updatedJob.company,
            position: updatedJob.position,
            location: updatedJob.location,
            status: updatedJob.status,
            last_updated: date,
            notes: updatedJob.notes,
            salary: updatedJob.salary,
            link: updatedJob.link,
            ...(statusChanged ? {
                status_changed_on: date,
                status_change_token: crypto.randomUUID(),
                status_timezone_offset_minutes: timezoneOffsetMinutes
            } : {})
        };

        const { data, error } = await supabase
            .from('jobs')
            .update(dbUpdate)
            .eq('id', updatedJob.id)
            .select('updated_at')
            .single();

        if (error) {
            console.error('Error updating job:', error);
            setJobs(previousJobs);
            throw new Error(error.message);
        } else {
            setJobs(prev => prev.map(j => j.id === updatedJob.id ? {
                ...j,
                updatedAt: data?.updated_at ?? undefined
            } : j));
            markJobsPersisted();
        }
    };

    const updateStatus = async (id: string, status: ApplicationStatus) => {
        if (!user) return;

        const previousJobs = [...jobs];
        const date = formatLocalDate();
        const timezoneOffsetMinutes = new Date().getTimezoneOffset();
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status, lastUpdated: date } : j));

        const { data, error } = await supabase
            .from('jobs')
            .update({
                status,
                last_updated: date,
                status_changed_on: date,
                status_change_token: crypto.randomUUID(),
                status_timezone_offset_minutes: timezoneOffsetMinutes
            })
            .eq('id', id)
            .select('updated_at')
            .single();

        if (error) {
            console.error('Error updating status:', error);
            setJobs(previousJobs);
            throw new Error(error.message);
        } else {
            setJobs(prev => prev.map(j => j.id === id ? {
                ...j,
                updatedAt: data?.updated_at ?? undefined
            } : j));
            markJobsPersisted();
        }
    };

    const deleteJob = async (id: string) => {
        if (!user) return;

        const previousJobs = [...jobs];
        setJobs(prev => prev.filter(j => j.id !== id));

        const { error } = await supabase
            .from('jobs')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting job:', error);
            setJobs(previousJobs); // Revert
            throw new Error(error.message);
        } else {
            markJobsPersisted();
        }
    };

    return {
        jobs,
        loading,
        jobsRevision,
        addJob,
        editJob,
        updateStatus,
        deleteJob,
        refetchJobs
    };
};
