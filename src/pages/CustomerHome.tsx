import React from 'react';
import { motion } from 'framer-motion';
import { Pill, Shield, Activity, HelpCircle } from "lucide-react";
interface CustomerHomeProps {
  onStart: () => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({ onStart }) => {
  return (
    <motion.div
      className="flex-1 flex flex-col items-center justify-between p-8 text-center bg-gradient-to-b from-white via-slate-50 to-slate-100 h-full relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Decorative Grid Layer */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none -z-10" />

      {/* Brand Header */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <motion.div
          className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/20"
          initial={{ y: -20, scale: 0.9 }}
          animate={{ y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <Pill className="w-8 h-8 text-white" />
        </motion.div>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">NexDose Kiosk</h1>
          <p className="text-[10px] text-blue-600 font-mono tracking-widest uppercase mt-1">Automatic OTC Medication Hub</p>
        </div>
      </div>

      {/* Main Interactive Capsule Illustration */}
      <div className="relative flex items-center justify-center py-6 w-full">
        {/* Soft Radial Gradients */}
        <div className="absolute w-72 h-72 bg-blue-500/5 rounded-full blur-3xl" />

        {/* Orbit Rings */}
        <motion.div
          className="absolute w-60 h-60 border border-slate-200 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 30, ease: 'linear' }}
        />
        <motion.div
          className="absolute w-44 h-44 border border-blue-500/10 border-dashed rounded-full"
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
        />

        {/* Premium Vending Capsule */}
        <motion.div
          className="relative w-36 h-48 bg-white border border-slate-200/80 rounded-[32px] shadow-2xl flex flex-col items-center justify-between p-5"
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        >
          {/* Machine screen simulator */}
          <div className="w-full h-9 bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800">
            <span className="text-[9px] font-mono text-emerald-400 tracking-wide animate-pulse">STANDBY</span>
          </div>

          <div className="flex gap-2">
            <Activity className="w-4 h-4 text-blue-500" />
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>

          {/* Machine Dispenser Notch */}
          <div className="w-full h-10 border border-slate-100 bg-slate-50 rounded-xl flex items-center justify-center">
            <div className="w-10 h-2.5 bg-slate-300 rounded-full shadow-inner" />
          </div>
        </motion.div>
      </div>

      {/* Touch To Begin Controls */}
      <div className="w-full mb-6 flex flex-col items-center gap-6">
        <motion.button
          onClick={onStart}
          className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 transition-all cursor-pointer text-lg"
          whileTap={{ scale: 0.98 }}
        >
          Touch to Begin Order
          <motion.span
            animate={{ x: [0, 5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
          >
            ➔
          </motion.span>
        </motion.button>

        {/* Feature Icons Row */}
        <div className="grid grid-cols-3 gap-6 w-full max-w-[360px] border-t border-slate-200/60 pt-6">
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Shield className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] text-slate-500 font-semibold leading-tight">Verified Products</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <Activity className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] text-slate-500 font-semibold leading-tight">Instant Dispense</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <HelpCircle className="w-5 h-5 text-slate-400" />
            <span className="text-[10px] text-slate-500 font-semibold leading-tight">Touch Guided</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CustomerHome;