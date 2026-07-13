import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface BottomCartProps {
  itemCount: number;
  totalAmount: number;
  onProceed: () => void;
}

export const BottomCart: React.FC<BottomCartProps> = ({
  itemCount,
  totalAmount,
  onProceed,
}) => {
  if (itemCount === 0) return null;

  return (
    <motion.div
      className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-5 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-40"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex items-center gap-4">
        {/* Animated basket icon */}
        <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 relative">
          <ShoppingBag className="w-5 h-5" />
          <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white">
            {itemCount}
          </span>
        </div>

        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block leading-none">
            Checkout Cart
          </span>
          <span className="text-xl font-black text-slate-800 mt-1 block">
            ${totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <motion.button
        onClick={onProceed}
        className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer"
        whileTap={{ scale: 0.97 }}
      >
        Review & Pay
        <ArrowRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
};

export default BottomCart;
