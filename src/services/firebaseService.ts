import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  getDocs,
  doc,
  serverTimestamp,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { ref, set, onValue, off } from 'firebase/database';
import { db, rtdb, isConfigured } from '../firebase/config';

// ─── Types ───────────────────────────────────────────────────────────

export interface MedicineSlot {
  id: string; // Firestore document ID
  slotNumber: number;
  name: string;
  dosage: string;
  stock: number;
  capacity: number;
  status: 'nominal' | 'warning' | 'critical';
  /** Price in USD (converted to INR at display time). Defaults to 0 if not set in Firestore. */
  price: number;
  /** Tailwind background colour class for the pill indicator (e.g. 'bg-blue-500'). Defaults to 'bg-slate-400'. */
  pillColor: string;
}

export interface DispenseLog {
  id: string;
  timestamp: string;
  patientName: string;
  medicineName: string;
  slot: number;
  dosage: string;
  dose?: string;
  physician: string;
  status: 'Success' | 'Failure' | 'Pending';
  createdAt?: Timestamp;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  prescription: string;
  targetSlot: number;
  dosage: string;
}

// ─── Collection names ────────────────────────────────────────────────

const COLLECTIONS = {
  devices: 'devices',
  medicines: 'medicines',
  patients: 'patients',
  prescriptions: 'prescriptions',
  logs: 'logs',
} as const;

/**
 * Parse a Firestore slot value to a 1-indexed integer.
 * Firestore stores slotId as 1-indexed (1 = first slot).
 * Older documents may have used slotNumber with the same convention.
 * Returns 1 as the safe default when the value is missing or unparseable.
 */
export const normalizeSlot = (val: any): number => {
  if (val === undefined || val === null) return 1;
  const n = typeof val === 'number' ? val : parseInt(val);
  if (isNaN(n) || n < 1) return 1;
  return n;
};

// ─── Real-time listeners (onSnapshot) ────────────────────────────────

/**
 * Subscribe to real-time medicine/slot updates from Firestore.
 * Returns an unsubscribe function.
 */
export function subscribeMedicines(
  callback: (slots: MedicineSlot[]) => void
): Unsubscribe {
  if (!db) {
    console.warn('[FirebaseService] Firestore not initialized – medicines listener skipped.');
    callback([]);
    return () => {};
  }

  const q = query(collection(db, COLLECTIONS.medicines), orderBy('slotId', 'asc'));
  console.log('[FirebaseService] onSnapshot listener attached: medicines');

  return onSnapshot(q, (snapshot) => {
    const slots: MedicineSlot[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const stock = data.stock ?? 0;
      const capacity = data.capacity ?? 50;
      const pct = capacity > 0 ? stock / capacity : 0;
      let status: MedicineSlot['status'] = 'nominal';
      if (stock === 0) status = 'critical';
      else if (pct <= 0.2) status = 'warning';

      return {
        id: docSnap.id,
        // slotId is the canonical 1-indexed field. Fall back to slotNumber for
        // documents created before the schema was standardised.
        slotNumber: normalizeSlot(data.slotId ?? data.slotNumber),
        name: data.name ?? '',
        dosage: data.dosage ?? '',
        stock,
        capacity,
        status,
        price: typeof data.price === 'number' ? data.price : 0,
        pillColor: typeof data.pillColor === 'string' && data.pillColor ? data.pillColor : 'bg-slate-400',
      };
    });
    callback(slots);
  }, (error) => {
    console.error('[FirebaseService] medicines listener error:', error);
    callback([]);
  });
}

/**
 * Subscribe to real-time dispensation logs from Firestore.
 */
export function subscribeLogs(
  callback: (logs: DispenseLog[]) => void
): Unsubscribe {
  if (!db) {
    console.warn('[FirebaseService] Firestore not initialized – logs listener skipped.');
    callback([]);
    return () => {};
  }

  const q = query(collection(db, COLLECTIONS.logs), orderBy('timestamp', 'desc'));
  console.log('[FirebaseService] onSnapshot listener attached: logs');

  return onSnapshot(q, (snapshot) => {
    const logs: DispenseLog[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      let timestamp = '';
      const firestoreTimestamp = data.timestamp ?? data.createdAt;
      if (firestoreTimestamp) {
        if (typeof firestoreTimestamp.toDate === 'function') {
          timestamp = firestoreTimestamp.toDate().toISOString().replace('T', ' ').substring(0, 19);
        } else if (typeof firestoreTimestamp === 'string') {
          timestamp = firestoreTimestamp;
        } else if (firestoreTimestamp.seconds) {
          timestamp = new Date(firestoreTimestamp.seconds * 1000).toISOString().replace('T', ' ').substring(0, 19);
        }
      }

      return {
        id: docSnap.id,
        timestamp,
        patientName: data.patient ?? data.patientName ?? '',
        medicineName: data.medicine ?? data.medicineName ?? '',
        slot: normalizeSlot(data.slot),
        dosage: data.dosage ?? data.dose ?? '—',
        dose: data.dose,
        physician: data.physician ?? '',
        status: data.action ?? data.status ?? 'Pending',
        createdAt: data.timestamp ?? data.createdAt,
      };
    });
    callback(logs);
  }, (error) => {
    console.error('[FirebaseService] logs listener error:', error);
    callback([]);
  });
}

/**
 * Subscribe to real-time patient list from Firestore.
 */
export function subscribePatients(
  callback: (patients: Patient[]) => void
): Unsubscribe {
  if (!db) {
    console.warn('[FirebaseService] Firestore not initialized – patients listener skipped.');
    callback([]);
    return () => {};
  }

  const q = query(collection(db, COLLECTIONS.patients));
  console.log('[FirebaseService] onSnapshot listener attached: patients');

  return onSnapshot(q, (snapshot) => {
    const patients: Patient[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        name: data.name ?? '',
        dob: data.dob ?? '',
        prescription: data.prescription ?? '',
        targetSlot: normalizeSlot(data.targetSlot),
        dosage: data.dosage ?? '',
      };
    });
    callback(patients);
  }, (error) => {
    console.error('[FirebaseService] patients listener error:', error);
    callback([]);
  });
}

// ─── Write operations ────────────────────────────────────────────────

/**
 * Add a new dispense log entry to Firestore.
 */
export async function addDispenseLog(log: Omit<DispenseLog, 'id' | 'timestamp'>): Promise<string | null> {
  if (!db) {
    console.error('[FirebaseService] Cannot add log – Firestore not initialized.');
    return null;
  }

  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.logs), {
      patient: log.patientName,
      medicine: log.medicineName,
      action: log.status,
      slot: log.slot,   // already 1-indexed
      dosage: log.dosage,
      physician: log.physician,
      timestamp: serverTimestamp(),
    });
    console.log('[FirebaseService] Log written:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[FirebaseService] Error adding log:', error);
    return null;
  }
}

/**
 * Update a medicine slot document in Firestore (e.g. restock, edit).
 */
export async function updateMedicineSlot(
  docId: string,
  updates: Partial<Omit<MedicineSlot, 'id' | 'status'>>
): Promise<boolean> {
  if (!db) {
    console.error('[FirebaseService] Cannot update medicine – Firestore not initialized.');
    return false;
  }

  try {
    const ref = doc(db, COLLECTIONS.medicines, docId);
    const writeUpdates: Record<string, any> = { ...updates };
    // slotNumber in MedicineSlot is the in-memory representation of slotId.
    // If a caller passes slotNumber, persist it as slotId (1-indexed, no conversion).
    if (writeUpdates.slotNumber !== undefined) {
      writeUpdates.slotId = writeUpdates.slotNumber;
      delete writeUpdates.slotNumber;
    }
    await updateDoc(ref, {
      ...writeUpdates,
      updatedAt: serverTimestamp(),
    });
    console.log('[FirebaseService] Medicine updated:', docId);
    return true;
  } catch (error) {
    console.error('[FirebaseService] Error updating medicine:', error);
    return false;
  }
}

/**
 * Add a new patient to Firestore.
 */
export async function addPatient(patient: Omit<Patient, 'id'>): Promise<string | null> {
  if (!db) {
    console.error('[FirebaseService] Cannot add patient – Firestore not initialized.');
    return null;
  }

  try {
    const docRef = await addDoc(collection(db, COLLECTIONS.patients), {
      ...patient,
      targetSlot: patient.targetSlot, // already 1-indexed — store as-is
      createdAt: serverTimestamp(),
    });
    console.log('[FirebaseService] Patient added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[FirebaseService] Error adding patient:', error);
    return null;
  }
}

/**
 * Utility: check Firestore readiness.
 */
export function getFirestoreStatus() {
  return {
    isConfigured,
    dbInitialized: db !== null,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || null,
  };
}

/**
 * Write a dispense command to Firebase Realtime Database.
 */
export async function sendDispenseCommand(
  orderId: string,
  slot: number,
  quantity: number
): Promise<void> {
  if (!rtdb) {
    console.error('[FirebaseService] Realtime Database not initialized.');
    throw new Error('Realtime Database not initialized.');
  }

  const path = `dispensers/dispenser001/queue/${orderId}`;
  const payload = {
    orderId,
    slot,
    compartmentSlot: slot, // Include compartmentSlot for physical ESP32 compatibility
    quantity,
    status: 'pending',
    timestamp: Date.now(),
  };

  try {
    await set(ref(rtdb, path), payload);
    console.log('[FirebaseService] Dispense command written to RTDB:', path);
  } catch (error) {
    console.error('[FirebaseService] Error writing dispense command to RTDB:', error);
    throw error;
  }
}

/**
 * Listen to dispense command status updates on Realtime Database.
 * Returns an unsubscribe function.
 */
export function listenToDispenseStatus(
  orderId: string,
  onUpdate: (status: string) => void
): () => void {
  if (!rtdb) {
    console.warn('[FirebaseService] RTDB not initialized - status listener skipped.');
    onUpdate('error');
    return () => {};
  }

  const path = `dispensers/dispenser001/queue/${orderId}/status`;
  const statusRef = ref(rtdb, path);

  const listener = onValue(statusRef, (snapshot) => {
    const val = snapshot.val();
    if (val) {
      onUpdate(val);
    }
  }, (error) => {
    console.error('[FirebaseService] RTDB status listener error:', error);
  });

  return () => {
    off(statusRef, 'value', listener);
  };
}

// ─── Price seeding ───────────────────────────────────────────────────

/**
 * Realistic Indian pharmacy prices (₹) keyed by lowercase medicine name.
 * Used by seedMedicinePrices() for exact matches first, then keyword fallbacks.
 */
const PRICE_TABLE: Record<string, number> = {
  // Pain relief & fever
  'paracetamol':            15,
  'acetaminophen':          18,
  'ibuprofen':              22,
  'aspirin':                12,
  'naproxen':               35,
  'diclofenac':             28,
  'ketorolac':              45,
  'tramadol':               55,
  'codeine':                60,

  // Allergy & cold
  'cetirizine':             20,
  'loratadine':             25,
  'fexofenadine':           40,
  'diphenhydramine':        18,
  'chlorpheniramine':       10,
  'pseudoephedrine':        30,
  'montelukast':            65,
  'levocetirizine':         28,

  // GI / stomach
  'omeprazole':             38,
  'pantoprazole':           32,
  'ranitidine':             22,
  'famotidine':             30,
  'domperidone':            25,
  'metoclopramide':         18,
  'loperamide':             20,
  'simethicone':            15,
  'ondansetron':            50,
  'lactulose':              42,

  // Vitamins & supplements
  'vitamin c':              35,
  'vitamin d':              45,
  'vitamin d3':             45,
  'vitamin b12':            55,
  'vitamin b complex':      40,
  'zinc':                   30,
  'calcium':                38,
  'iron':                   25,
  'iron supplement':        25,
  'folic acid':             18,
  'melatonin':              80,
  'magnesium':              45,
  'omega 3':                90,
  'fish oil':               90,
  'multivitamin':           120,

  // Cardiovascular & diabetes
  'metformin':              22,
  'glibenclamide':          18,
  'glimepiride':            35,
  'insulin':                180,
  'atorvastatin':           55,
  'rosuvastatin':           65,
  'simvastatin':            40,
  'amlodipine':             28,
  'lisinopril':             32,
  'losartan':               45,
  'telmisartan':            55,
  'metoprolol':             30,
  'metoprolol succinate':   38,
  'atenolol':               18,
  'ramipril':               40,
  'clopidogrel':            65,
  'warfarin':               22,

  // Antibiotics
  'amoxicillin':            55,
  'azithromycin':           90,
  'ciprofloxacin':          65,
  'doxycycline':            45,
  'metronidazole':          30,
  'clindamycin':            75,
  'trimethoprim':           35,

  // Respiratory
  'salbutamol':             48,
  'albuterol':              48,
  'budesonide':             120,
  'fluticasone':            140,
  'theophylline':           35,
  'montelukast sodium':     65,

  // Skin / topical
  'hydrocortisone':         38,
  'hydrocortisone cream':   38,
  'clotrimazole':           45,
  'mupirocin':              60,
  'neosporin':              55,
  'neosporin ointment':     55,
  'calamine':               28,

  // First aid / misc
  'band-aid':               25,
  'band-aid strips':        25,
  'antiseptic wipes':       20,
  'saline nasal spray':     55,
  'saline':                 30,

  // Thyroid / hormones
  'levothyroxine':          35,
  'thyroxine':              35,

  // Neurological / mental health
  'sertraline':             55,
  'fluoxetine':             40,
  'alprazolam':             25,
  'diazepam':               18,
  'gabapentin':             65,
  'pregabalin':             80,
};

/** Keyword → price fallback when an exact match is not found */
const KEYWORD_PRICES: Array<[string, number]> = [
  ['insulin',        180],
  ['antibiotic',     70],
  ['statin',         55],
  ['vitamin',        40],
  ['supplement',     35],
  ['cream',          40],
  ['spray',          50],
  ['ointment',       45],
  ['antidiabetic',   45],
  ['cholesterol',    55],
  ['cardiac',        60],
  ['pressure',       40],
  ['allerg',         30],
  ['antihista',      25],
  ['acid',           32],
  ['pain',           20],
  ['fever',          15],
  ['sleep',          70],
  ['iron',           25],
  ['calcium',        38],
  ['zinc',           30],
];

/**
 * Derive a realistic ₹ price for a medicine name.
 * Exact table match → keyword scan → safe default of ₹30.
 */
function derivePrice(name: string): number {
  const lower = name.toLowerCase().trim();

  // 1. Exact match
  if (PRICE_TABLE[lower] !== undefined) return PRICE_TABLE[lower];

  // 2. Partial match in table keys
  for (const [key, price] of Object.entries(PRICE_TABLE)) {
    if (lower.includes(key) || key.includes(lower)) return price;
  }

  // 3. Keyword scan
  for (const [keyword, price] of KEYWORD_PRICES) {
    if (lower.includes(keyword)) return price;
  }

  // 4. Safe default
  return 30;
}

/**
 * One-time idempotent migration: reads every document in the `medicines`
 * collection and writes a realistic ₹ price for any document where the
 * `price` field is missing, null, or 0.
 *
 * Safe to call on every app start — it is a no-op for documents that
 * already have a price > 0.
 */
export async function seedMedicinePrices(): Promise<void> {
  if (!db) {
    console.warn('[seedMedicinePrices] Firestore not initialized – skipping.');
    return;
  }

  try {
    const snapshot = await getDocs(collection(db, 'medicines'));
    const writes: Promise<void>[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const existingPrice = data.price;

      // Skip documents that already have a valid price
      if (typeof existingPrice === 'number' && existingPrice > 0) return;

      const name: string = data.name ?? '';
      if (!name) return; // Skip unnamed slots

      const price = derivePrice(name);
      const docRef = doc(db!, 'medicines', docSnap.id);

      console.log(`[seedMedicinePrices] Setting ₹${price} for "${name}" (${docSnap.id})`);
      writes.push(
        updateDoc(docRef, { price, updatedAt: serverTimestamp() })
      );
    });

    await Promise.all(writes);
    console.log(`[seedMedicinePrices] Done. Updated ${writes.length} document(s).`);
  } catch (error) {
    // Non-fatal — log and continue. The app works without this.
    console.error('[seedMedicinePrices] Error:', error);
  }
}
