import { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus, User } from '../types';
import { MOCK_JOBS } from '../constants';
import { supabase } from '../lib/supabase';

export const useJobs = (user: User | null) => {
    const [jobs, setJobs] = useState<JobApplication[]>([]);
    const [loading, setLoading] = useState(false);

    // Fetch jobs from Supabase
    useEffect(() => {
        if (!user) {
            setJobs([]);
            return;
        }

        const fetchJobs = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('user_id', user.id)
                .order('date_added', { ascending: false });

            if (error) {
                console.error('Error fetching jobs:', error);
            } else if (data) {
                // Map DB snake_case to JS camelCase
                const mappedJobs: JobApplication[] = data.map((job: any) => ({
                    id: job.id,
                    company: job.company,
                    position: job.position,
                    location: job.location,
                    status: job.status as ApplicationStatus,
                    roleType: job.role_type,
                    dateAdded: job.date_added,
                    lastUpdated: job.last_updated,
                    notes: job.notes,
                    salary: job.salary,
                    link: job.link
                }));
                setJobs(mappedJobs);
            }
            setLoading(false);
        };

        fetchJobs();
    }, [user]);

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
            role_type: job.roleType,
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
            alert('Failed to save job. Please try again.');
        } else if (data) {
            // Replace temp ID with real ID
            setJobs(prev => prev.map(j => j.id === tempId ? { ...j, id: data.id } : j));
        }
    };

    const editJob = async (updatedJob: JobApplication) => {
        if (!user) return;

        setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));

        const dbUpdate = {
            company: updatedJob.company,
            position: updatedJob.position,
            location: updatedJob.location,
            status: updatedJob.status,
            role_type: updatedJob.roleType,
            last_updated: new Date().toISOString().split('T')[0],
            notes: updatedJob.notes,
            salary: updatedJob.salary,
            link: updatedJob.link
        };

        const { error } = await supabase
            .from('jobs')
            .update(dbUpdate)
            .eq('id', updatedJob.id);

        if (error) {
            console.error('Error updating job:', error);
            // We could revert here, but for now just logging
        }
    };

    const updateStatus = async (id: string, status: ApplicationStatus) => {
        if (!user) return;

        const date = new Date().toISOString().split('T')[0];
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status, lastUpdated: date } : j));

        const { error } = await supabase
            .from('jobs')
            .update({ status, last_updated: date })
            .eq('id', id);

        if (error) {
            console.error('Error updating status:', error);
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
        }
    };

    return {
        jobs,
        loading,
        addJob,
        editJob,
        updateStatus,
        deleteJob
    };
};
