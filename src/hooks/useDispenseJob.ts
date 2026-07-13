/**
 * useDispenseJob.ts
 * React hook managing the full lifecycle of a dispense job:
 * 1. Build the job from cart items
 * 2. Submit it to Firebase
 * 3. Start the real Pi listener (Firebase RTDB)
 * 4. Accumulate Pi events and per-item progress state
 *
 * Usage:
 * const { startDispense, piEvents, itemStates, isComplete } = useDispenseJob(cart, medicines);
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import type { MedicineSlot } from '../services/firebaseService';
import { DEVICE_ID } from '../config/device';

import { submitDispenseJob, startPiListener } from '../services/piService';
import type {
  DispenseJob,
  DispenseJobItem,
  DispensingItemState,
  PiEvent,
} from '../types/kioskTypes';

// ─── Constants ────────────────────────────────────────────────────────────────

// price is stored in ₹ directly in Firestore — no conversion needed.

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseDispenseJobResult {
  /** Kick off the full payment → dispense pipeline */
  startDispense: (transactionId: string) => Promise<void>;
  /** Ordered stream of Pi events (for telemetry log) */
  piEvents: PiEvent[];
  /** Per-medicine progress states */
  itemStates: DispensingItemState[];
  /** True when DISPENSE_COMPLETE received */
  isComplete: boolean;
  /** True when Pi listener has connected */
  piConnected: boolean;
  /** The generated job ID */
  jobId: string;
}

export function useDispenseJob(
  cart: { [id: string]: number },
  medicines: MedicineSlot[]
): UseDispenseJobResult {
  const [piEvents, setPiEvents] = useState<PiEvent[]>([]);
  const [itemStates, setItemStates] = useState<DispensingItemState[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [piConnected, setPiConnected] = useState(false);
  const [jobId, setJobId] = useState('');

  // Keep cleanup reference to avoid double-mount issues
  const cleanupRef = useRef<(() => void) | null>(null);
  // Progress animation interval ref
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Cleanup RTDB listener and progress interval on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, []);

  const startDispense = useCallback(
    async (transactionId: string) => {
      // Cancel any previous listener and progress interval
      cleanupRef.current?.();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // ── Build job items from cart ────────────────────────────────────────────
      const items: DispenseJobItem[] = Object.entries(cart)
        .map(([id, quantity]) => {
          const med = medicines.find((m) => m.id === id);
          if (!med) return null;
          return {
            medicineId: med.id,
            medicineName: med.name,
            slot: med.slotNumber,
            quantity,
            priceINR: Math.round(med.price) * quantity,
            compartment: (med.slotNumber <= 3 ? 'A' : 'B') as 'A' | 'B',
          };
        })
        .filter(Boolean) as DispenseJobItem[];

      const totalINR = items.reduce((s, i) => s + i.priceINR, 0);
      const newJobId = `JOB-${Date.now()}`;
      setJobId(newJobId);

      // ── Initialise per-item UI state ─────────────────────────────────────────
      const initialStates: DispensingItemState[] = items.map((item) => ({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity: item.quantity,
        slot: item.slot,
        status: 'pending',
        progress: 0,
      }));
      setItemStates(initialStates);
      setPiEvents([]);
      setIsComplete(false);
      setPiConnected(false);

      // ── Build Firebase job payload ────────────────────────────────────────────
      const job: DispenseJob = {
        jobId: newJobId,
        status: 'pending',
        paymentStatus: 'success',
        timestamp: Date.now(),
        totalINR,
        transactionId,
        items,
      };

      // ── Save transaction & dispense job to Firestore ─────────────────────────
      try {
        if (db) {
          // Transaction with createdAt and updatedAt
          await addDoc(collection(db, "transactions"), {
            transactionId,
            jobId: newJobId,
            amount: totalINR,
            paymentMethod: "UPI",
            status: "SUCCESS",
            customer: "Guest",
            items,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          // One dispense job per medicine with deviceId, createdAt, and updatedAt
          for (const item of items) {
            await addDoc(collection(db, "dispenseJobs"), {
              jobId: newJobId,
              transactionId,
              medicineId: item.medicineId,
              medicineName: item.medicineName,
              slot: item.slot,
              quantity: item.quantity,
              status: "PENDING",
              deviceId: DEVICE_ID,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        }
      } catch (error) {
        // Core dispensing flow safely continues even if analytics logging fails
        console.error("[Firestore] Failed to save transaction logs:", error);
      }

      // ── Write to Firebase RTDB ────────────────────────────────────────────────
      await submitDispenseJob(job);

      // ── Start real Pi listener (Firebase RTDB) ────────────────────────────────
      const unsubscribe = startPiListener(job, (event) => {
        setPiEvents((prev) => [...prev, event]);

        switch (event.type) {
          case 'CONNECTING':
            // Job is pending — Pi has not picked it up yet
            setItemStates((prev) =>
              prev.map((s) => ({ ...s, status: 'pending', progress: 0 }))
            );
            break;

          case 'CONNECTED':
            setPiConnected(true);
            // Pi is processing — mark all items as dispensing at 20%
            setItemStates((prev) =>
              prev.map((s) =>
                s.status !== 'done'
                  ? { ...s, status: 'dispensing', progress: 20 }
                  : s
              )
            );
            // Start gradual progress animation (20 → 90) while Pi is working
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
            progressIntervalRef.current = setInterval(() => {
              setItemStates((prev) => {
                const allAbove90 = prev.every((s) => s.status !== 'dispensing' || s.progress >= 90);
                if (allAbove90 && progressIntervalRef.current) {
                  clearInterval(progressIntervalRef.current);
                  progressIntervalRef.current = null;
                  return prev;
                }
                return prev.map((s) =>
                  s.status === 'dispensing' && s.progress < 90
                    ? { ...s, progress: Math.min(s.progress + 2, 90) }
                    : s
                );
              });
            }, 500);
            break;

          case 'DISPENSE_COMPLETE':
            // Stop progress animation
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            setIsComplete(true);
            setItemStates((prev) =>
              prev.map((s) => ({ ...s, status: 'done', progress: 100 }))
            );
            break;

          case 'ERROR':
            // Stop progress animation on error
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
            }
            setItemStates((prev) =>
              prev.map((s) =>
                s.status !== 'done' ? { ...s, status: 'error' } : s
              )
            );
            break;
        }
      });

      cleanupRef.current = unsubscribe;
    },
    [cart, medicines]
  );

  return { startDispense, piEvents, itemStates, isComplete, piConnected, jobId };
}
