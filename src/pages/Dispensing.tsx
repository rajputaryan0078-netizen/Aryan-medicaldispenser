import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Pill, ArrowDown } from "lucide-react";
import { useMachineStatus } from '../hooks/useMachineStatus';

interface DispensingProps {
  onDispenseComplete: () => void;
  medName: string;
  slotNumber: number;
}

export const Dispensing: React.FC<DispensingProps> = ({
  onDispenseComplete,
  medName,
  slotNumber,
}) => {
  const { status, error } = useMachineStatus();
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Waiting for Raspberry Pi...');

  // ── Drive progress and status text from Firebase RTDB status ────────────────
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    switch (status) {
      case 'pending':
        setProgress(10);
        setStatusText('Waiting for Raspberry Pi...');
        break;
      case 'processing':
        setProgress(20);
        setStatusText('Arduino Dispensing...');
        interval = setInterval(() => {
          setProgress((prev) => Math.min(prev + 3, 90));
        }, 400);
        break;
      case 'complete':
        setProgress(100);
        setStatusText('Medicine Dispensed');
        onDispenseComplete();
        break;
      case 'error':
        setStatusText(error ?? 'An error occurred during dispensing.');
        break;
      default:
        // status is null (no data yet) — keep initial state
        break;
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, error, onDispenseComplete]);

  return (
    <motion.div
      className="flex-1 flex flex-col p-6 bg-slate-50 h-full justify-between text-center items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mt-8 flex flex-col items-center gap-2">
        <h2 className="text-xl font-black text-slate-800">Releasing Medication</h2>
        <p className="text-xs text-blue-600 font-mono">Mechanical operations in progress. Please wait.</p>
      </div>

      {/* Advanced Mechanical Release Animation */}
      <div className="relative my-8 w-full flex flex-col items-center justify-center">
        {/* Soft back glows */}
        <div className="absolute w-52 h-52 bg-blue-500/5 rounded-full blur-3xl" />

        {/* Outer Circular Track */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="absolute w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="84"
              stroke="#E2E8F0"
              strokeWidth="6"
              fill="transparent"
            />
            <motion.circle
              cx="96"
              cy="96"
              r="84"
              stroke="#2563EB"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={527}
              strokeDashoffset={527 - (527 * progress) / 100}
              transition={{ ease: 'linear' }}
            />
          </svg>

          {/* Falling Box Animation inside Circle */}
          <div className="absolute flex flex-col items-center justify-center">
            {progress < 60 ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
                className="text-blue-600"
              >
                <Loader2 className="w-10 h-10 animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: -30, opacity: 0, scale: 0.8 }}
                animate={{ y: 20, opacity: [0, 1, 1, 0], scale: 1 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeIn' }}
                className="flex flex-col items-center text-emerald-600"
              >
                <Pill className="w-10 h-10" />
                <ArrowDown className="w-4 h-4 mt-1 animate-bounce" />
              </motion.div>
            )}
            <span className="text-lg font-black text-slate-800 font-mono mt-3">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Active operations log box */}
      <div className="w-full mb-12">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Release Log</span>
            <span className="text-[10px] text-slate-500 font-mono">Slot {slotNumber}</span>
          </div>
          <span className="text-xs text-slate-700 leading-normal font-mono animate-pulse">
            ➔ {statusText}
          </span>
        </div>

        <div className="mt-4 text-xs font-semibold text-slate-400">
          Dispensing: <span className="text-slate-700">{medName}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default Dispensing;
