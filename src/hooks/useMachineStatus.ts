/**
 * useMachineStatus.ts
 * Reusable React hook that listens to the Raspberry Pi's current dispense job
 * status via Firebase Realtime Database.
 *
 * Observes:  dispensers/SYS-001/queue/currentJob
 *
 * Returns:
 *   status  – current job status ('pending' | 'processing' | 'complete' | 'error')
 *   job     – full job snapshot from RTDB (or null)
 *   loading – true while waiting for the first RTDB snapshot
 *   error   – error message string (or null)
 */

import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { RTDB_PATH } from '../config/device';
import type { MachineStatusValue } from '../types/machine';
import type { DispenseJob } from '../types/kioskTypes';

interface UseMachineStatusResult {
  status: MachineStatusValue | null;
  job: DispenseJob | null;
  loading: boolean;
  error: string | null;
}

export function useMachineStatus(): UseMachineStatusResult {
  const [status, setStatus] = useState<MachineStatusValue | null>(null);
  const [job, setJob] = useState<DispenseJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rtdb) {
      setError('Firebase Realtime Database is not initialised.');
      setLoading(false);
      return;
    }

    const jobRef = ref(rtdb, RTDB_PATH);

    const listener = onValue(
      jobRef,
      (snapshot) => {
        const data = snapshot.val() as DispenseJob | null;
        setJob(data);
        setStatus(data?.status ?? null);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useMachineStatus] RTDB listener error:', err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => {
      off(jobRef, 'value', listener);
    };
  }, []);

  return { status, job, loading, error };
}
