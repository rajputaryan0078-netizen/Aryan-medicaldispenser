import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus, Pill } from "lucide-react";
import { Medicine } from '../data/medicines';

interface MedicineCardProps {
  medicine: Medicine;
  quantity: number;
  onAddToCart: (medicine: Medicine) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

export const MedicineCard: React.FC<MedicineCardProps> = ({
  medicine,
  quantity,
  onAddToCart,
  onUpdateQuantity,
}) => {
  const isOutOfStock = medicine.stock <= 0;
  const isLowStock = medicine.stock > 0 && medicine.stock <= 5;

  return (
    <motion.div
      className={`bg-white border ${quantity > 0 ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'
        } rounded-2xl p-3 flex flex-col justify-between h-[230px] shadow-sm relative overflow-hidden transition-all`}
      whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)' }}
    >
      {/* Decorative background grid elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-slate-50 rounded-full blur-xl -z-10" />

      {/* Stylized Medicine Image / Icon container */}
      <div className={`aspect-[4/3] w-full rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center relative overflow-hidden mb-2`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center relative ${medicine.pillColor} bg-opacity-10 border border-opacity-20`}>
          <Pill className={`w-6 h-6 text-slate-800`} />
        </div>

        {/* Badges */}
        <span className="absolute bottom-1 right-1 text-[8px] font-mono bg-slate-900/80 text-white px-1.5 py-0.5 rounded-md font-semibold">
          Slot {medicine.slotNumber}
        </span>
      </div>

      {/* Info Section */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-extrabold text-slate-800 line-clamp-1 leading-tight" title={medicine.name}>
            {medicine.name}
          </h3>
          <span className="text-[9px] font-mono text-slate-400 mt-0.5 block">{medicine.dosage}</span>
        </div>

        {/* Pricing, stock, and action */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-600">₹{medicine.price.toFixed(2)}</span>

            {/* Stock Badge */}
            {isOutOfStock ? (
              <span className="text-[8px] font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
                Sold Out
              </span>
            ) : isLowStock ? (
              <span className="text-[8px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md">
                Only {medicine.stock} left
              </span>
            ) : (
              <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                In Stock
              </span>
            )}
          </div>

          {/* Action button: ADD or Quantity Counter */}
          <div className="mt-1">
            <AnimatePresence mode="wait">
              {isOutOfStock ? (
                <button
                  disabled
                  className="w-full py-2 bg-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded-xl pointer-events-none"
                >
                  Unavailable
                </button>
              ) : quantity === 0 ? (
                <motion.button
                  key="add-btn"
                  onClick={() => onAddToCart(medicine)}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-600 border border-blue-200/60 text-blue-600 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-3.5 h-3.5" /> Add to Order
                </motion.button>
              ) : (
                <motion.div
                  key="qty-ctrl"
                  className="flex items-center justify-between bg-slate-900 text-white rounded-xl overflow-hidden shadow-inner h-8"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <button
                    onClick={() => onUpdateQuantity(medicine.id, -1)}
                    className="h-full px-2.5 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono font-black">{quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(medicine.id, 1)}
                    disabled={quantity >= medicine.stock}
                    className="h-full px-2.5 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-20 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </div>
    </motion.div>
  );
};

export default MedicineCard;