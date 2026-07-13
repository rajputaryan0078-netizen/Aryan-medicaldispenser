/**
 * slotHelper.ts
 *
 * MedicineSlot.slotNumber is 1-indexed (matches Firestore slotId).
 * These helpers format it for display without any arithmetic.
 */

/** e.g. slotNumber=1 → "Slot 1" */
export const displaySlot = (n: number): string => `Slot ${n}`;

/** e.g. slotNumber=1 → "Compartment 1" */
export const displayCompartment = (n: number): string => `Compartment ${n}`;
