import { useState, useEffect } from 'react';
import { JobApplication, ApplicationStatus, User } from '../types';
import { MOCK_JOBS } from '../constants';

export const useJobs = (user: User | null) => {
    const [jobs, setJobs] = useState<JobApplication[]>([]);

    // Initialize data based on user login
    useEffect(() => {
        if (!user) {
            setJobs([]);
            return;
        }

        const userKey = `career_track_jobs_${user.id}`;
        const saved = localStorage.getItem(userKey);

        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setJobs(parsed);
            } catch (e) {
                setJobs(MOCK_JOBS);
            }
        } else {
            const legacy = localStorage.getItem('career_track_jobs');
            if (legacy) {
                try {
                    const parsed = JSON.parse(legacy);
                    setJobs(parsed);
                } catch (e) {
                    setJobs(MOCK_JOBS);
                }
            } else {
                setJobs(MOCK_JOBS);
            }
        }
    }, [user]);

    // Persist jobs when they change, scoped to user
    useEffect(() => {
        if (user && jobs.length > 0) {
            localStorage.setItem(`career_track_jobs_${user.id}`, JSON.stringify(jobs));
        }
    }, [jobs, user]);

    const addJob = (job: JobApplication) => {
        setJobs(prev => [...prev, job]);
    };

    const editJob = (updatedJob: JobApplication) => {
        setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
    };

    const updateStatus = (id: string, status: ApplicationStatus) => {
        setJobs(prev => prev.map(j => j.id === id ? { ...j, status, lastUpdated: new Date().toISOString().split('T')[0] } : j));
    };

    const deleteJob = (id: string) => {
        setJobs(prev => prev.filter(j => j.id !== id));
    };

    return {
        jobs,
        addJob,
        editJob,
        updateStatus,
        deleteJob
    };
};
