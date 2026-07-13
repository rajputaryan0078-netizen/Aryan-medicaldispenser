import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, PackageOpen } from 'lucide-react';

interface SuccessProps {
  onComplete: () => void;
}

export const Success: React.FC<SuccessProps> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 5000); // 5 seconds return

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      className="flex-1 flex flex-col p-6 bg-gradient-to-b from-emerald-50/40 via-slate-50 to-slate-100 h-full justify-between text-center items-center"
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="mt-8">
        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full px-3 py-1 uppercase tracking-widest font-extrabold shadow-sm">
          Dispensed Successfully
        </span>
      </div>

      {/* Large check animation */}
      <div className="relative my-8 flex items-center justify-center">
        <motion.div
          className="absolute w-40 h-40 bg-emerald-100/50 rounded-full"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        />
        <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 border border-emerald-400/20">
          <Check className="w-12 h-12 text-white stroke-[3px]" />
        </div>
      </div>

      {/* Success Messages */}
      <div className="flex flex-col gap-3 max-w-[280px]">
        <h2 className="text-2xl font-black text-slate-800">Dispensation Complete</h2>
        <p className="text-xs text-slate-500 leading-normal flex items-center justify-center gap-1.5 bg-white border border-slate-200/60 rounded-2xl p-3 shadow-sm">
          <PackageOpen className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          Please collect your items from the safety chamber below.
        </p>
      </div>

      {/* Redirect Progress Timer */}
      <div className="w-full mb-6">
        <div className="text-[10px] font-mono text-slate-400">
          Returning to Home menu in 5 seconds...
        </div>
        <div className="w-24 h-1 bg-slate-200 rounded-full overflow-hidden mx-auto mt-2">
          <motion.div
            className="h-full bg-emerald-500"
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: 5, ease: 'linear' }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Success;
