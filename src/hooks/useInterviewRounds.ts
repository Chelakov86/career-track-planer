import { useState, useEffect } from 'react';
import { InterviewRound, InterviewRoundStatus } from '../types';
import { supabase } from '../lib/supabase';

interface DbInterviewRound {
  id: string;
  job_id: string;
  user_id: string;
  round_name: string;
  interview_date: string;
  status: InterviewRoundStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const mapDbToUi = (dbRound: DbInterviewRound): InterviewRound => ({
  id: dbRound.id,
  jobId: dbRound.job_id,
  roundName: dbRound.round_name,
  interviewDate: dbRound.interview_date,
  status: dbRound.status,
  notes: dbRound.notes,
  createdAt: dbRound.created_at,
  updatedAt: dbRound.updated_at
});

const mapUiToDb = (uiRound: Partial<InterviewRound>, userId: string, jobId?: string) => {
  const dbRound: any = {};

  if (jobId) dbRound.job_id = jobId;
  if (userId) dbRound.user_id = userId;
  if (uiRound.roundName !== undefined) dbRound.round_name = uiRound.roundName;
  if (uiRound.interviewDate !== undefined) dbRound.interview_date = uiRound.interviewDate;
  if (uiRound.status !== undefined) dbRound.status = uiRound.status;
  if (uiRound.notes !== undefined) dbRound.notes = uiRound.notes;

  return dbRound;
};

export const useInterviewRounds = (jobId: string | null, userId: string | null) => {
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch interview rounds for a specific job
  useEffect(() => {
    if (!jobId || !userId) {
      setRounds([]);
      return;
    }

    const fetchRounds = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('interview_rounds')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', userId)
        .order('interview_date', { ascending: true });

      if (error) {
        console.error('Error fetching interview rounds:', error);
      } else if (data) {
        const mappedRounds = data.map(mapDbToUi);
        setRounds(mappedRounds);
      }
      setLoading(false);
    };

    fetchRounds();
  }, [jobId, userId]);

  const addRound = async (round: Omit<InterviewRound, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!userId || !jobId) return;

    // Optimistic update
    const tempId = crypto.randomUUID();
    const now = new Date().toISOString();
    const newRound: InterviewRound = {
      ...round,
      id: tempId,
      createdAt: now,
      updatedAt: now
    };
    setRounds(prev => [...prev, newRound].sort((a, b) =>
      a.interviewDate.localeCompare(b.interviewDate)
    ));

    const dbRound = mapUiToDb(round, userId, jobId);

    const { data, error } = await supabase
      .from('interview_rounds')
      .insert(dbRound)
      .select()
      .single();

    if (error) {
      console.error('Error adding interview round:', error);
      // Revert optimistic update
      setRounds(prev => prev.filter(r => r.id !== tempId));
      alert('Failed to add interview round. Please try again.');
    } else if (data) {
      // Replace temp ID with real ID
      const mappedData = mapDbToUi(data);
      setRounds(prev => prev.map(r => r.id === tempId ? mappedData : r));
    }
  };

  const updateRound = async (roundId: string, updates: Partial<InterviewRound>) => {
    if (!userId) return;

    // Optimistic update
    const previousRounds = [...rounds];
    setRounds(prev => prev.map(r =>
      r.id === roundId ? { ...r, ...updates, updatedAt: new Date().toISOString() } : r
    ).sort((a, b) => a.interviewDate.localeCompare(b.interviewDate)));

    const dbUpdates = mapUiToDb(updates, userId);
    dbUpdates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('interview_rounds')
      .update(dbUpdates)
      .eq('id', roundId);

    if (error) {
      console.error('Error updating interview round:', error);
      // Revert optimistic update
      setRounds(previousRounds);
      alert('Failed to update interview round. Please try again.');
    }
  };

  const deleteRound = async (roundId: string) => {
    if (!userId) return;

    // Optimistic update
    const previousRounds = [...rounds];
    setRounds(prev => prev.filter(r => r.id !== roundId));

    const { error } = await supabase
      .from('interview_rounds')
      .delete()
      .eq('id', roundId);

    if (error) {
      console.error('Error deleting interview round:', error);
      // Revert optimistic update
      setRounds(previousRounds);
      alert('Failed to delete interview round. Please try again.');
    }
  };

  return {
    rounds,
    loading,
    addRound,
    updateRound,
    deleteRound
  };
};
