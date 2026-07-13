/**
 * machine.ts
 * Shared interfaces for the NexDose machine status and dispense job lifecycle.
 *
 * Re-exports the canonical DispenseJob / DispenseJobItem types from kioskTypes
 * so consumers can import from either location without duplication.
 */

// Re-export canonical types from kioskTypes (single source of truth)
export type { DispenseJob, DispenseJobItem, DispenseJobStatus } from './kioskTypes';

// ─── Machine status (observed from Firebase RTDB) ─────────────────────────────

export type MachineStatusValue = 'pending' | 'processing' | 'complete' | 'error';

export interface MachineStatus {
  /** Current status of the dispense job on the Raspberry Pi */
  status: MachineStatusValue;
  /** Unix timestamp (ms) of the last status change */
  timestamp: number;
}
