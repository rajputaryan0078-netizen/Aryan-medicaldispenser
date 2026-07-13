/**
 * kioskTypes.ts
 * Shared TypeScript types for the NexDose Kiosk payment-to-dispensing workflow.
 */

// ─── Dispense Job (written to Firebase RTDB) ─────────────────────────────────

export interface DispenseJobItem {
  medicineId: string;
  medicineName: string;
  slot: number;          // Physical slot number (1–6)
  quantity: number;
  priceINR: number;
  compartment: 'A' | 'B'; // A = slots 1-3, B = slots 4-6
}

export type DispenseJobStatus =
  | 'pending'     // Job submitted, Pi not yet picked up
  | 'processing'  // Pi is running dispense sequence
  | 'complete'    // All items dispensed successfully
  | 'error';      // Something went wrong

export interface DispenseJob {
  jobId: string;
  status: DispenseJobStatus;
  paymentStatus: 'success';
  timestamp: number;
  totalINR: number;
  transactionId: string;
  items: DispenseJobItem[];
}

// ─── Raspberry Pi Event Stream ────────────────────────────────────────────────

export type PiEventType =
  | 'CONNECTING'          // Connecting to Pi over Firebase
  | 'CONNECTED'           // Pi acknowledged the job
  | 'SERIAL_OPEN'         // Pi opened serial port to Arduino
  | 'PREPARING'           // Pi building serial command queue
  | 'DISPENSING_ITEM'     // Currently dispensing this medicine
  | 'ITEM_DONE'           // One medicine done (Arduino replied DONE_MEDx)
  | 'DISPENSE_COMPLETE'   // Arduino replied DISPENSE_COMPLETE
  | 'ERROR';              // Pi or Arduino error

export interface PiEvent {
  type: PiEventType;
  timestamp: number;
  medicineId?: string;
  medicineName?: string;
  message: string;
  slot?: number;
}

// ─── Per-medicine dispensing UI state ────────────────────────────────────────

export type ItemDispenseStatus = 'pending' | 'dispensing' | 'done' | 'error';

export interface DispensingItemState {
  medicineId: string;
  medicineName: string;
  quantity: number;
  slot: number;
  status: ItemDispenseStatus;
  progress: number; // 0–100
}

// ─── Payment simulation state ─────────────────────────────────────────────────

export type PaymentSimStep =
  | 'idle'
  | 'detected'
  | 'processing'
  | 'success'
  | 'expired';
