/**
 * piService.ts
 * Raspberry Pi service for NexDose.
 *
 * Architecture (production):
 *   1. Frontend calls `submitDispenseJob()` → writes job to Firebase RTDB
 *   2. Real Raspberry Pi watches Firebase RTDB for pending jobs
 *   3. Pi sends serial commands to Arduino Nano
 *   4. Arduino rotates SG90 servo, replies DISPENSE_COMPLETE
 *   5. Pi updates Firebase RTDB status
 *   6. `startPiListener()` observes status changes and emits PiEvents to the UI
 */

import { ref, set, onValue, off } from 'firebase/database';
import { rtdb } from '../firebase/config';
import { DEVICE_ID, RTDB_PATH } from '../config/device';
import type { DispenseJob, PiEvent } from '../types/kioskTypes';

// ─── Write job to Firebase ────────────────────────────────────────────────────

/**
 * Submit a dispense job to Firebase RTDB.
 * The real Raspberry Pi will pick this up and start dispensing.
 */
export async function submitDispenseJob(job: DispenseJob): Promise<void> {
  if (!rtdb) {
    console.warn('[PiService] RTDB not available — cannot submit job.');
    return;
  }
  const jobRef = ref(rtdb, RTDB_PATH);
  await set(jobRef, job);
  console.log('[PiService] Job written to Firebase:', job.jobId);
}



// ─── Real Pi listener (production) ────────────────────────────────────────────

export type PiEventCallback = (event: PiEvent) => void;

/**
 * Start the real Raspberry Pi listener.
 *
 * Observes the Firebase RTDB path for status changes written by the
 * physical Raspberry Pi and emits corresponding PiEvents to the UI.
 *
 * Status mapping:
 *   pending    → CONNECTING
 *   processing → CONNECTED
 *   complete   → DISPENSE_COMPLETE
 *   error      → ERROR
 *
 * Returns an unsubscribe function.
 */
export function startPiListener(
  _job: DispenseJob,
  onEvent: PiEventCallback
): () => void {
  if (!rtdb) {
    console.warn('[PiService] RTDB not available — Pi listener not started.');
    onEvent({
      type: 'ERROR',
      timestamp: Date.now(),
      message: 'Firebase Realtime Database is not initialised.',
    });
    return () => {};
  }

  const statusRef = ref(rtdb, RTDB_PATH + '/status');

  const listener = onValue(
    statusRef,
    (snapshot) => {
      const status = snapshot.val() as string | null;
      if (!status) return;

      switch (status) {
        case 'pending':
          onEvent({
            type: 'CONNECTING',
            timestamp: Date.now(),
            message: `Waiting for Raspberry Pi ${DEVICE_ID} to pick up the job...`,
          });
          break;

        case 'processing':
          onEvent({
            type: 'CONNECTED',
            timestamp: Date.now(),
            message: `Raspberry Pi ${DEVICE_ID} acknowledged — Arduino dispensing in progress.`,
          });
          break;

        case 'complete':
          onEvent({
            type: 'DISPENSE_COMPLETE',
            timestamp: Date.now(),
            message: 'Arduino ACK: DISPENSE_COMPLETE — all medicines released.',
          });
          break;

        case 'error':
          onEvent({
            type: 'ERROR',
            timestamp: Date.now(),
            message: `Raspberry Pi ${DEVICE_ID} reported an error during dispensing.`,
          });
          break;

        default:
          console.warn('[PiService] Unknown RTDB status:', status);
      }
    },
    (error) => {
      console.error('[PiService] RTDB listener error:', error);
      onEvent({
        type: 'ERROR',
        timestamp: Date.now(),
        message: `Firebase listener error: ${error.message}`,
      });
    },
  );

  // Return cleanup function
  return () => {
    off(statusRef, 'value', listener);
  };
}
