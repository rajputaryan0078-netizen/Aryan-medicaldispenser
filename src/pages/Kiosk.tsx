/**
 * Kiosk.tsx
 * NexDose Smart Medical Vending Machine — Customer Kiosk
 *
 * Screen flow:
 * HOME → SELECTION → CART → PAYMENT → DISPENSING → SUCCESS
 *
 * Payment screen generates a real UPI QR code (mock merchant) with a 5-min
 * countdown timer. "Simulate QR Scan" triggers the payment → Firebase → mock
 * Pi → Arduino sequence with live per-medicine progress bars.
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, RotateCcw, ArrowRight, Minus, Plus,
  ShieldAlert, Activity, QrCode,
  Pill, Check, Loader2, Lock, ArrowLeft,
  RefreshCw, Wifi, WifiOff, PackageOpen
} from 'lucide-react';
import { generateTransactionId, generateUpiQrDataUrl } from '../services/qrService';
import { useDispenseJob } from '../hooks/useDispenseJob';
import { subscribeMedicines, MedicineSlot } from '../services/firebaseService';
import { ref, set, onValue, off } from 'firebase/database';
import { rtdb } from '../firebase/config';
import type {
  PaymentSimStep,
  DispensingItemState
} from '../types/kioskTypes';

// ─── Constants ────────────────────────────────────────────────────────────────

// price is stored in ₹ directly in Firestore — no conversion needed.
const QR_TIMEOUT_SECS = 300; // 5 minutes

// ─── Screen Types ─────────────────────────────────────────────────────────────

type KioskScreen = 'HOME' | 'SELECTION' | 'CART' | 'PAYMENT' | 'DISPENSING' | 'SUCCESS';

// ─── Root Component ───────────────────────────────────────────────────────────

export const Kiosk: React.FC = () => {
  // ── Navigation state ────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<KioskScreen>('HOME');

  // ── Cart state ───────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<{ [id: string]: number }>({});

  // ── Payment state ────────────────────────────────────────────────────────────
  const [transactionId, setTransactionId] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSecondsLeft, setQrSecondsLeft] = useState(QR_TIMEOUT_SECS);
  const [paymentSimStep, setPaymentSimStep] = useState<PaymentSimStep>('idle');
  const [jobStarting, setJobStarting] = useState(false); // duplicate-call guard
  const qrTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Live Firestore medicines ─────────────────────────────────────────────────
  const [liveMedicines, setLiveMedicines] = useState<MedicineSlot[]>([]);

  useEffect(() => {
    const unsub = subscribeMedicines((slots) => setLiveMedicines(slots));
    return unsub;
  }, []);

  // ── Dispense job hook ────────────────────────────────────────────────────────
  const {
    startDispense,
    piEvents,
    itemStates,
    isComplete,
    piConnected
  } = useDispenseJob(cart, liveMedicines);

  // ── Hardware medicines (first 6 slots = 2 physical compartments) ─────────────
  const hardwareMedicines = liveMedicines.slice(0, 6);
  const compartmentA = hardwareMedicines.slice(0, 3); // Slots 1–3
  const compartmentB = hardwareMedicines.slice(3, 6); // Slots 4–6

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  const cartItemCount = Object.values(cart).reduce((s, q) => s + q, 0);
  const cartINRSubtotal = Object.entries(cart).reduce((s, [id, q]) => {
    const m = liveMedicines.find((m) => m.id === id);
    return s + (m ? Math.round(m.price) * q : 0);
  }, 0);

  // ── Cart operations ──────────────────────────────────────────────────────────
  const addToCart = (med: MedicineSlot) => {
    if (med.stock <= 0) return;
    setCart((p) => {
      const cur = p[med.id] || 0;
      if (cur >= med.stock) return p;
      return { ...p, [med.id]: cur + 1 };
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((p) => {
      const next = (p[id] || 0) + delta;
      if (next <= 0) { const c = { ...p }; delete c[id]; return c; }
      const m = liveMedicines.find((m) => m.id === id);
      if (m && next > m.stock) return p;
      return { ...p, [id]: next };
    });
  };

  const clearCart = () => setCart({});

  // ── Payment confirmation ──────────────────────────────────────────────────────
  // Called only when the user explicitly presses "YES — Payment Successful".
  // Guards against duplicate calls with jobStarting ref.

  const handleConfirmPayment = async () => {
    if (jobStarting || !rtdb || !transactionId) return;           // already in flight — ignore tap
    setJobStarting(true);
    try {
      await set(ref(rtdb, `payments/${transactionId}/status`), 'success');
    } catch (err) {
      console.error('[Kiosk] Local confirm payment failed:', err);
      setJobStarting(false);           // allow retry on error
    }
  };

  // ── QR generation ────────────────────────────────────────────────────────────

  const generateQr = async () => {
    const txnId = generateTransactionId();
    setTransactionId(txnId);
    setQrLoading(true);
    setQrDataUrl(null);
    setQrSecondsLeft(QR_TIMEOUT_SECS);
    setPaymentSimStep('idle');

    try {
      const url = await generateUpiQrDataUrl(cartINRSubtotal, txnId);
      setQrDataUrl(url);
      
      if (rtdb) {
        await set(ref(rtdb, `payments/${txnId}`), {
          status: 'pending',
          amount: cartINRSubtotal,
          timestamp: Date.now()
        });
      }
    } catch (err) {
      console.error('[Kiosk] QR generation failed:', err);
    } finally {
      setQrLoading(false);
    }
  };

  // Listen for payment success from RTDB (from user phone)
  useEffect(() => {
    if (screen !== 'PAYMENT' || !transactionId || !rtdb) return;

    const paymentStatusRef = ref(rtdb, `payments/${transactionId}/status`);
    let triggered = false;

    const unsubscribe = onValue(paymentStatusRef, async (snapshot) => {
      const val = snapshot.val();
      if (val === 'success' && !triggered) {
        triggered = true;
        setJobStarting(true);
        if (qrTimerRef.current) {
          clearInterval(qrTimerRef.current);
        }
        setPaymentSimStep('success');
        try {
          await startDispense(transactionId);
          setScreen('DISPENSING');
        } catch (err) {
          console.error('[Kiosk] Auto-dispense on payment success failed:', err);
          setJobStarting(false);
          setPaymentSimStep('idle');
          triggered = false; // allow retry on failure
        }
      }
    });

    return () => {
      off(paymentStatusRef, 'value', unsubscribe);
    };
  }, [screen, transactionId, startDispense]);

  // Generate QR whenever the PAYMENT screen appears
  useEffect(() => {
    if (screen === 'PAYMENT') {
      generateQr();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // ── QR countdown timer ────────────────────────────────────────────────────────

  useEffect(() => {
    if (screen !== 'PAYMENT' || paymentSimStep !== 'idle') return;

    qrTimerRef.current = setInterval(() => {
      setQrSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(qrTimerRef.current!);
          setPaymentSimStep('expired');
          return 0;
        }
        return s - 1;
      });
    }, 1000);

    return () => { if (qrTimerRef.current) clearInterval(qrTimerRef.current); };
  }, [screen, paymentSimStep]);

  // Reset job guard when leaving the payment screen
  useEffect(() => {
    if (screen !== 'PAYMENT') {
      setJobStarting(false);
    }
  }, [screen]);

  useEffect(() => {
    if (screen === 'DISPENSING' && isComplete) {
      setScreen('SUCCESS');
    }
  }, [screen, isComplete]);
  // ── Auto-redirect from SUCCESS screen ────────────────────────────────────────

  useEffect(() => {
    if (screen !== 'SUCCESS') return;
    const t = setTimeout(() => { clearCart(); setScreen('HOME'); }, 5000);
    return () => clearTimeout(t);
  }, [screen]);

  // ── Floating pill animation backgrounds ──────────────────────────────────────

  const floatingCapsules = [
    { id: 1, size: 'w-10 h-20', color: 'bg-blue-500/10', rotate: 45, x: '10%', y: '20%', dur: 15 },
    { id: 2, size: 'w-8 h-16', color: 'bg-emerald-500/10', rotate: -30, x: '82%', y: '12%', dur: 18 },
    { id: 3, size: 'w-12 h-24', color: 'bg-purple-500/10', rotate: 15, x: '12%', y: '68%', dur: 22 },
    { id: 4, size: 'w-9 h-18', color: 'bg-amber-500/10', rotate: 60, x: '88%', y: '70%', dur: 16 },
  ];

  // ─── JSX ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 overflow-hidden select-none font-sans">

      {/* 21.5-inch Landscape Touchscreen Chassis */}
      <div className="relative flex flex-col w-full max-w-[1240px] h-[780px] bg-slate-50 shadow-2xl rounded-[32px] overflow-hidden border-[12px] border-slate-900 shadow-slate-950/60">

        {/* Telemetry Status Strip */}
        <div className="h-9 bg-slate-900 flex items-center justify-between px-6 z-50 text-[10px] font-mono text-slate-400 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-200">NEXDOSE KIOSK · SYS-001</span>
            <span className="text-slate-500 text-[9px] ml-3 tracking-widest uppercase">ASHD Technologies</span>
          </div>
          <div className="flex items-center gap-6">
            <span>SYS TEMP: 37.1°C</span>
            <span>CHAMBER TEMP: 4.0°C</span>
            <span>SENSORS: ACTIVE</span>
            <span className="text-blue-400 font-bold">UPI · INR MODE</span>
          </div>
        </div>

        {/* Screen Area */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-50">
          <AnimatePresence mode="wait">

            {/* ════════════════════════════════════════════════════════════════
                1. HOME SCREEN
            ════════════════════════════════════════════════════════════════ */}
            {screen === 'HOME' && (
              <motion.div
                key="home"
                className="flex-1 flex flex-col items-center justify-between p-12 text-center h-full relative"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Floating capsule backgrounds */}
                {floatingCapsules.map((c) => (
                  <motion.div
                    key={c.id}
                    className={`absolute rounded-full border border-slate-200/50 ${c.size} ${c.color}`}
                    style={{ left: c.x, top: c.y }}
                    animate={{ y: [0, -35, 0], rotate: [c.rotate, c.rotate + 360] }}
                    transition={{ duration: c.dur, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ))}

                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:5rem_5rem] opacity-25 pointer-events-none -z-10" />

                {/* Header badges */}
                <div className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm">
                    <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Telemetry Monitoring</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3 py-1.5 shadow-sm">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    HOSPITAL NETWORK SECURE
                  </div>
                </div>

                {/* Logo */}
                <div className="flex flex-col items-center gap-4 mt-6">
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-blue-500 rounded-[28px] flex items-center justify-center shadow-xl shadow-blue-500/20 border border-blue-400/30"
                    initial={{ y: -30, scale: 0.8 }}
                    animate={{ y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  >
                    <Pill className="w-10 h-10 text-white" />
                  </motion.div>
                  <div>
                    <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">NexDose™ Smart Vending</h1>
                    <p className="text-xs text-blue-600 font-mono tracking-widest uppercase mt-1.5 font-bold">AUTOMATIC MEDICINE COMPARTMENT RELEASE</p>
                    <p className="text-[10px] text-slate-400 font-mono tracking-wider mt-1">by ASHD Technologies</p>
                  </div>
                </div>

                {/* Hardware compartment status */}
                <div className="flex gap-8 items-center justify-center my-4">
                  {['A', 'B'].map((comp) => (
                    <div key={comp} className="flex flex-col gap-1 text-left px-5 py-3.5 bg-white border border-slate-200 rounded-2xl shadow-sm min-w-[200px]">
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest">Compartment {comp}</span>
                      <span className="text-xs font-black text-slate-700">Slots {comp === 'A' ? '1–3' : '4–6'} ACTIVE</span>
                      <div className="flex gap-1.5 mt-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="w-full max-w-md mb-4">
                  <motion.button
                    onClick={() => setScreen('SELECTION')}
                    className="w-full py-6 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all cursor-pointer text-xl border border-blue-400/20"
                    whileTap={{ scale: 0.97 }}
                  >
                    Touch to Begin Dispense Order
                    <motion.span
                      animate={{ x: [0, 6, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    >➔</motion.span>
                  </motion.button>
                  <p className="text-[10px] text-slate-400 font-medium mt-3">By touching, you verify you are authorized to collect clinical OTC medicines.</p>
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                2. SELECTION SCREEN
            ════════════════════════════════════════════════════════════════ */}
            {screen === 'SELECTION' && (
              <motion.div
                key="selection"
                className="flex-1 flex flex-col h-full bg-slate-50"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Header */}
                <div className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => { clearCart(); setScreen('HOME'); }}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-800 rounded-xl transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <div>
                      <h2 className="text-base font-extrabold text-slate-800">Medication Dispatch Selection</h2>
                      <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest font-bold">Select items to actuate dispensing springs</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3 py-1.5">
                    <Lock className="w-3.5 h-3.5" /> SECURE LOCAL SYSTEM
                  </div>
                </div>

                {/* Split pane */}
                <div className="flex-1 flex overflow-hidden">

                  {/* Catalog */}
                  <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-6">
                    {[
                      { label: 'A', meds: compartmentA, range: '1–3' },
                      { label: 'B', meds: compartmentB, range: '4–6' },
                    ].map(({ label, meds, range }) => (
                      <div key={label} className="flex flex-col gap-3">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[8px] text-white font-mono ${label === 'A' ? 'bg-blue-500' : 'bg-emerald-500'}`}>{label}</span>
                            HARDWARE CHAMBER {label} ({label === 'A' ? 'UPPER' : 'LOWER'} LEVEL)
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Coils {range}</span>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          {meds.map((med: MedicineSlot) => {
                            const qty = cart[med.id] || 0;

                            return (
                              <MedicineCard
                                key={med.id}
                                med={med}
                                qty={qty}
                                onAdd={() => addToCart(med)}
                                onUpdate={(d) => updateQty(med.id, d)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cart sidebar */}
                  <div className="w-[340px] border-l border-slate-200/80 bg-white/70 backdrop-blur-md flex flex-col justify-between p-6">
                    <div>
                      <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                        <ShoppingBag className="w-5 h-5 text-blue-600" />
                        <h3 className="text-base font-extrabold text-slate-800">Dispatch Request</h3>
                      </div>

                      {cartItemCount === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 gap-2">
                          <Pill className="w-8 h-8 text-slate-300" />
                          <span className="text-xs font-bold mt-1">Dispenser Queue Empty</span>
                          <span className="text-[10px]">Select medications to actuate physical dispenser</span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[380px] pr-1">
                          {Object.entries(cart).map(([id, qty]) => {
                            const med = liveMedicines.find((m) => m.id === id);
                            if (!med) return null;
                            return (
                              <motion.div
                                key={id}
                                className="bg-white border border-slate-200/60 rounded-xl p-3 flex items-center justify-between shadow-sm"
                                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${med.pillColor} bg-opacity-10`}>
                                    <div className={`w-2.5 h-2.5 rounded-full ${med.pillColor}`} />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-extrabold text-slate-800">{med.name}</h4>
                                    <span className="text-[9px] text-slate-400 font-mono">Slot {med.slotNumber} · {qty} units</span>
                                  </div>
                                </div>
                                <span className="text-xs font-black text-slate-800">₹{Math.round(med.price) * qty}</span>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Checkout */}
                    <div className="border-t border-slate-100 pt-4 flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-xs text-slate-500 font-semibold">
                          <span>Queue</span>
                          <span className="font-mono">{cartItemCount} items</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-2 text-sm font-black text-slate-800">
                          <span>Total</span>
                          <span className="text-blue-600">₹{cartINRSubtotal}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => { if (cartItemCount > 0) setScreen('CART'); }}
                        disabled={cartItemCount === 0}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                      >
                        Review Dispense Request <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                3. CART REVIEW
            ════════════════════════════════════════════════════════════════ */}
            {screen === 'CART' && (
              <motion.div
                key="cart"
                className="flex-1 flex flex-col p-8 bg-slate-50 h-full justify-between"
                initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                    <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-blue-600" /> Confirm Dispenser Queue
                    </h2>
                    <button onClick={() => setScreen('SELECTION')}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer flex items-center gap-1">
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to dispenser
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-h-[320px] overflow-y-auto pr-1">
                    {Object.entries(cart).map(([id, qty]) => {
                      const med = liveMedicines.find((m) => m.id === id);
                      if (!med) return null;
                      return (
                        <div key={id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${med.pillColor} bg-opacity-10`}>
                              <div className={`w-3.5 h-3.5 rounded-full ${med.pillColor}`} />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-slate-800">{med.name}</h4>
                              <span className="text-[10px] text-slate-400 font-mono">Slot {med.slotNumber} · {med.dosage}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center bg-slate-100 border border-slate-200 rounded-xl overflow-hidden h-9">
                              <button onClick={() => updateQty(id, -1)} className="h-full px-2.5 hover:bg-slate-200 text-slate-400 hover:text-slate-800 cursor-pointer flex items-center">
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-mono font-black px-2 text-slate-700">{qty}</span>
                              <button onClick={() => updateQty(id, 1)} disabled={qty >= med.stock} className="h-full px-2.5 hover:bg-slate-200 text-slate-400 disabled:opacity-20 cursor-pointer flex items-center">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <span className="text-sm font-black text-slate-800 min-w-[70px] text-right">₹{Math.round(med.price) * qty}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-slate-200/80 pt-5 flex items-center justify-between">
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 flex gap-8 shadow-sm">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Subtotal</span>
                      <span className="text-xs font-bold text-slate-600 font-mono">₹{cartINRSubtotal}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Hospital Tax</span>
                      <span className="text-xs font-bold text-emerald-600">0% EXEMPT</span>
                    </div>
                    <div className="border-l border-slate-200 pl-8 flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 font-mono uppercase">Payable</span>
                      <span className="text-lg font-black text-blue-600 font-mono">₹{cartINRSubtotal}</span>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => setScreen('SELECTION')}
                      className="px-6 py-4 bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all cursor-pointer">
                      Back to Vending
                    </button>
                    <button onClick={() => setScreen('PAYMENT')}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/10 transition-all cursor-pointer">
                      Proceed to Pay <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                4. PAYMENT SCREEN
            ════════════════════════════════════════════════════════════════ */}
            {screen === 'PAYMENT' && (
              <motion.div
                key="payment"
                className="flex-1 flex p-8 bg-slate-50 h-full gap-6"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Left — QR Panel */}
                <div className="flex-1 flex flex-col">
                  <div className="mb-4">
                    <h2 className="text-xl font-extrabold text-slate-800">Secure UPI Payment Gateway</h2>
                    <p className="text-xs text-slate-400">Scan the QR code to complete payment — dispenser activates automatically</p>
                  </div>

                  {/* Payment confirmed banner — shown after button press */}
                  <AnimatePresence>
                    {paymentSimStep === 'success' && (
                      <motion.div
                        className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 mb-5 shadow-sm"
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="w-9 h-9 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Check className="w-5 h-5 text-white stroke-[3px]" />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-emerald-800">Payment Successful</p>
                          <p className="text-[10px] text-emerald-600 font-mono mt-0.5">Preparing dispenser… please wait.</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* QR Panel */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex-1 flex flex-col items-center justify-between">
                    {paymentSimStep === 'expired' ? (
                      /* ── QR Expired state ── */
                      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
                        <div className="w-16 h-16 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center text-red-500">
                          <QrCode className="w-8 h-8" />
                        </div>
                        <div>
                          <p className="text-sm font-extrabold text-slate-800">QR Code Expired</p>
                          <p className="text-[10px] text-slate-400 mt-1">The payment session timed out. Generate a new QR to continue.</p>
                        </div>
                        <button onClick={generateQr}
                          className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all">
                          <RefreshCw className="w-3.5 h-3.5" /> Generate New QR
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Countdown timer */}
                        <div className="self-stretch flex items-center justify-between mb-4">
                          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">UPI QR · NexDose Medical Kiosk</span>
                          <div className={`flex items-center gap-1 text-[10px] font-bold rounded-full px-2.5 py-1 border font-mono ${qrSecondsLeft < 60 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {formatCountdown(qrSecondsLeft)}
                          </div>
                        </div>

                        {/* QR Code or loading */}
                        <div className="relative">
                          {qrLoading || !qrDataUrl ? (
                            <div className="w-[220px] h-[220px] bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center">
                              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                            </div>
                          ) : (
                            <div className="relative">
                              <img
                                src={qrDataUrl}
                                alt="UPI QR Code"
                                className="w-[220px] h-[220px] rounded-2xl border border-slate-200 shadow-sm"
                              />
                              {/* Scanning laser — only while idle */}
                              {paymentSimStep === 'idle' && (
                                <motion.div
                                  className="absolute inset-x-3 h-0.5 bg-blue-500 shadow-md shadow-blue-500/70"
                                  animate={{ top: ['8px', '212px', '8px'] }}
                                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                                />
                              )}

                              {/* Payment success overlay on QR */}
                              <AnimatePresence>
                                {paymentSimStep === 'success' && (
                                  <motion.div
                                    className="absolute inset-0 rounded-2xl bg-emerald-50/95 flex flex-col items-center justify-center gap-3"
                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                  >
                                    <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                      <Check className="w-8 h-8 text-white stroke-[3px]" />
                                    </div>
                                    <p className="text-sm font-extrabold text-emerald-800">Payment Confirmed</p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>

                        {/* Transaction & merchant info */}
                        <div className="self-stretch mt-4 flex flex-col gap-1.5 text-[9px] font-mono text-slate-400 text-center">
                          <p>MERCHANT: <span className="text-slate-600 font-bold">NexDose Medical Kiosk · ASHD Technologies</span></p>
                          <p>UPI: <span className="text-slate-600">nexdose@upi</span></p>
                          <p>TXN REF: <span className="text-slate-600 font-bold">{transactionId}</span></p>
                        </div>
                      </>
                    )}
                  </div>

                  <button onClick={() => setScreen('SELECTION')}
                    className="mt-4 py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-500 font-bold rounded-2xl text-xs uppercase tracking-wider cursor-pointer">
                    Cancel Session
                  </button>
                </div>

                {/* Right — Bill Summary */}
                <div className="w-[340px] flex flex-col justify-between bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col gap-4">
                    <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-3">Bill Breakdown</h3>
                    <div className="flex flex-col gap-2.5 max-h-[200px] overflow-y-auto pr-1">
                      {Object.entries(cart).map(([id, qty]) => {
                        const med = liveMedicines.find((m) => m.id === id);
                        if (!med) return null;
                        return (
                          <div key={id} className="flex justify-between text-xs text-slate-600 font-medium">
                            <span className="line-clamp-1">{med.name} ×{qty}</span>
                            <span className="font-mono">₹{Math.round(med.price) * qty}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="border-t border-slate-100 pt-3 flex flex-col gap-2">
                      <div className="flex justify-between text-xs text-slate-400 font-bold">
                        <span>SUBTOTAL</span>
                        <span className="font-mono text-slate-600">₹{cartINRSubtotal}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 font-bold">
                        <span>HOSPITAL REBATE</span>
                        <span className="font-mono text-emerald-600 font-black">100% COVERED</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-100 pt-3 mt-1">
                        <span className="text-sm font-black text-slate-800">Total Payable</span>
                        <span className="text-xl font-black text-blue-600 font-mono">₹{cartINRSubtotal}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <motion.button
                      onClick={handleConfirmPayment}
                      disabled={jobStarting}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                      whileTap={{ scale: jobStarting ? 1 : 0.97 }}
                    >
                      {jobStarting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Starting Dispenser…
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[3px]" />
                          YES — Payment Successful
                        </>
                      )}
                    </motion.button>
                    <p className="text-[9px] text-slate-400 text-center leading-normal">
                      Press only after your UPI payment is confirmed.<br />
                      One press creates one dispense job.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                5. DISPENSING SCREEN
            ════════════════════════════════════════════════════════════════ */}
            {screen === 'DISPENSING' && (
              <motion.div
                key="dispensing"
                className="flex-1 flex p-8 bg-slate-50 h-full gap-8"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Left — Per-medicine progress */}
                <div className="flex-1 flex flex-col">
                  <div className="mb-5">
                    <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Dispensing Medicines</h2>
                    <p className="text-xs font-mono text-blue-600 uppercase tracking-widest mt-1 font-bold">Hardware coil sequence in progress — do not remove medicines</p>
                  </div>

                  <div className="flex flex-col gap-4 flex-1 overflow-y-auto">
                    {itemStates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-slate-400">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                        <span className="text-xs font-bold">Connecting to hardware...</span>
                      </div>
                    ) : (
                      itemStates.map((item) => (
                        <DispensingItemRow key={item.medicineId} item={item} />
                      ))
                    )}
                  </div>
                </div>

                {/* Right — Telemetry log console */}
                <div className="w-[420px] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl p-6 text-left font-mono overflow-hidden">
                  {/* Console header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      {piConnected
                        ? <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                        : <WifiOff className="w-3.5 h-3.5 text-slate-500 animate-pulse" />}
                      <span className="text-[10px] text-blue-400 tracking-wider uppercase font-bold">
                        {piConnected ? 'Raspberry Pi SYS-001 · Connected' : 'Connecting to SYS-001...'}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500">Serial: /dev/ttyUSB0</span>
                  </div>

                  {/* Scrolling log */}
                  <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
                    {piEvents.map((evt, i) => (
                      <div key={i} className="flex gap-2 text-[10px] leading-relaxed">
                        <span className="text-slate-600 flex-shrink-0">[{new Date(evt.timestamp).toLocaleTimeString()}]</span>
                        <span className={
                          evt.type === 'DISPENSE_COMPLETE' ? 'text-emerald-400 font-bold' :
                            evt.type === 'ITEM_DONE' ? 'text-emerald-400' :
                              evt.type === 'DISPENSING_ITEM' ? 'text-blue-300' :
                                evt.type === 'ERROR' ? 'text-red-400' :
                                  'text-slate-400'
                        }>
                          {evt.message}
                        </span>
                      </div>
                    ))}
                    {piEvents.length === 0 && (
                      <span className="text-slate-600 text-[10px] animate-pulse">Awaiting Pi handshake...</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════════════
                6. SUCCESS SCREEN
            ════════════════════════════════════════════════════════════════ */}
            {screen === 'SUCCESS' && (
              <motion.div
                key="success"
                className="flex-1 flex flex-col p-10 bg-gradient-to-b from-emerald-50/20 via-slate-50 to-slate-100 h-full justify-between text-center items-center"
                initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-4 py-1.5 uppercase tracking-widest font-extrabold shadow-sm mt-4">
                  DISPENSE COMPLETE
                </span>

                <div className="relative flex items-center justify-center">
                  <motion.div
                    className="absolute w-44 h-44 bg-emerald-100/60 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                  />
                  <div className="w-28 h-28 bg-gradient-to-tr from-emerald-600 to-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/25 border border-emerald-400/30">
                    <Check className="w-14 h-14 text-white stroke-[3px]" />
                  </div>
                </div>

                <div className="flex flex-col gap-3.5 max-w-sm">
                  <h2 className="text-2xl font-black text-slate-800">Medicines Dispensed Successfully</h2>
                  <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm text-left">
                    <div className="w-10 h-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0 text-emerald-600">
                      <PackageOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Please collect your medicines</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Check the lower safety collection bin of the dispenser unit.</p>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-xs mb-4">
                  <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-bold">Returning to Standby in 5 seconds</div>
                  <div className="w-28 h-1 bg-slate-200 rounded-full overflow-hidden mx-auto mt-2.5">
                    <motion.div
                      className="h-full bg-emerald-500"
                      initial={{ width: '100%' }} animate={{ width: '0%' }}
                      transition={{ duration: 5, ease: 'linear' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// ─── Medicine Card sub-component ──────────────────────────────────────────────

interface MedicineCardProps {
  med: MedicineSlot;
  qty: number;
  onAdd: () => void;
  onUpdate: (delta: number) => void;
}

const MedicineCard: React.FC<MedicineCardProps> = ({ med, qty, onAdd, onUpdate }) => {
  const soldOut = med.stock <= 0;
  return (
    <motion.div
      className={`bg-white border rounded-2xl p-5 flex flex-col justify-between min-h-[220px] shadow-sm relative overflow-hidden transition-all group ${qty > 0 ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}
      whileHover={{ y: -2, boxShadow: '0 12px 30px rgba(0,0,0,0.04)' }}
    >
      {/* Decorative spring coil SVG */}
      <svg className="absolute -right-4 -bottom-4 w-20 h-20 text-slate-200/50 transform rotate-12 transition-transform duration-700 group-hover:rotate-45 group-hover:scale-110" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="5">
        <path d="M 10,50 C 10,30 20,30 20,50 C 20,70 30,70 30,50 C 30,30 40,30 40,50 C 40,70 50,70 50,50 C 50,30 60,30 60,50 C 60,70 70,70 70,50 C 70,30 80,30 80,50" />
      </svg>

      <div className="flex justify-between items-start z-10">
        <div>
          <span className="text-[9px] font-mono font-bold bg-slate-100 text-slate-500 rounded px-2 py-0.5 uppercase">SLOT {med.slotNumber}</span>
          <h3 className="text-base font-extrabold text-slate-800 mt-2.5 leading-snug">{med.name}</h3>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{med.dosage}</p>
        </div>
      </div>

      <div className="my-3 z-10">
        <div className="flex justify-between text-[9px] text-slate-400 font-bold mb-1">
          <span>STOCK</span><span>{med.stock}/{med.capacity}</span>
        </div>
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
          <div className={`h-full ${soldOut ? 'bg-red-500' : med.stock <= 3 ? 'bg-amber-500' : 'bg-blue-600'}`}
            style={{ width: `${(med.stock / med.capacity) * 100}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between mt-1 z-10">
        <span className="text-base font-black text-slate-800">₹{Math.round(med.price)}</span>
        {soldOut ? (
          <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-xl">Sold Out</span>
        ) : qty === 0 ? (
          <motion.button onClick={onAdd}
            className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-600 border border-blue-200/60 hover:border-blue-600 text-blue-600 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
            whileTap={{ scale: 0.95 }}>
            <Plus className="w-3.5 h-3.5" /> ADD
          </motion.button>
        ) : (
          <div className="flex items-center bg-slate-900 text-white rounded-xl overflow-hidden shadow-inner h-8">
            <button onClick={() => onUpdate(-1)} className="px-2.5 hover:bg-slate-800 text-slate-400 hover:text-white h-full flex items-center cursor-pointer transition-colors">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-mono font-black px-2">{qty}</span>
            <button onClick={() => onUpdate(1)} disabled={qty >= med.stock} className="px-2.5 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 h-full flex items-center cursor-pointer">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Dispensing Item Row ──────────────────────────────────────────────────────

const DispensingItemRow: React.FC<{ item: DispensingItemState }> = ({ item }) => {
  const isDone = item.status === 'done';
  const isDispensing = item.status === 'dispensing';
  const isPending = item.status === 'pending';

  return (
    <motion.div
      className={`bg-white border rounded-2xl p-5 shadow-sm transition-all ${isDone ? 'border-emerald-200' :
        isDispensing ? 'border-blue-400 ring-2 ring-blue-400/20' :
          'border-slate-200 opacity-60'
        }`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isPending ? 0.6 : 1, y: 0 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-emerald-50 text-emerald-600' :
            isDispensing ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'
            }`}>
            {isDone
              ? <Check className="w-5 h-5 stroke-[2.5px]" />
              : isDispensing
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}><Loader2 className="w-5 h-5" /></motion.div>
                : <Pill className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-800 leading-tight">{item.medicineName}</h4>
            <span className="text-[10px] text-slate-400 font-mono">Slot {item.slot} · Qty {item.quantity}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isDone && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">Dispensed ✓</span>
          )}
          {isDispensing && (
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full animate-pulse">In Progress</span>
          )}
          {isPending && (
            <span className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">Queued</span>
          )}
          <span className="text-xs font-black text-slate-800 font-mono w-10 text-right">{item.progress}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isDone ? 'bg-emerald-500' : isDispensing ? 'bg-blue-500' : 'bg-slate-300'}`}
          animate={{ width: `${item.progress}%` }}
          transition={{ duration: 0.15, ease: 'linear' }}
        />
      </div>
    </motion.div>
  );
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default Kiosk;