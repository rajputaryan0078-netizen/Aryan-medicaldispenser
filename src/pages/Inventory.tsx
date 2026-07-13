import React, { useState, useEffect } from 'react';
import { displayCompartment } from '../utils/slotHelper';
import { motion, AnimatePresence } from 'framer-motion';
import {
  subscribeMedicines,
  updateMedicineSlot,
  addDispenseLog,
  MedicineSlot,
} from '../services/firebaseService';

const Inventory: React.FC = () => {
  const [slots, setSlots] = useState<MedicineSlot[]>([]);
  const [restockAlert, setRestockAlert] = useState('');
  const [loading, setLoading] = useState(true);
  const [restockingId, setRestockingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeMedicines((data) => {
      setSlots(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleRestock = async (slot: MedicineSlot) => {
    setRestockingId(slot.id);

    // Log restock action to Firestore
    await addDispenseLog({
      patientName: 'Cabinet Restock',
      medicineName: slot.name,
      slot: slot.slotNumber,
      dosage: `+${slot.capacity - slot.stock} units`,
      physician: 'System Inventory Manager',
      status: 'Success',
    });

    // Update stock to full capacity in Firestore
    await updateMedicineSlot(slot.id, {
      stock: slot.capacity,
    });

    setRestockingId(null);
    setRestockAlert(`${displayCompartment(slot.slotNumber)} refilled to maximum capacity.`);
    setTimeout(() => setRestockAlert(''), 2500);
  };

  const criticalCount = slots.filter(s => s.status === 'critical').length;
  const warningCount = slots.filter(s => s.status === 'warning').length;

  if (loading) {
    return (
      <div className="min-h-screen pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
          <span className="text-xs font-mono text-[#64748B]">Loading inventory...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen pb-16"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Cabinet Inventory</h1>
        <p className="text-xs text-[#64748B] mt-1">Real-time stock level monitoring, capacity gauges, and quick refill control.</p>
      </div>

      {/* Top Banner Alert Bar */}
      <AnimatePresence>
        {restockAlert && (
          <motion.div 
            className="bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs rounded-xl p-3.5 mb-6 flex items-center justify-between"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <span>✨ {restockAlert}</span>
            <button onClick={() => setRestockAlert('')} className="text-[10px] uppercase font-mono tracking-wider opacity-60 hover:opacity-100 cursor-pointer">Dismiss</button>
          </motion.div>
        )}
      </AnimatePresence>

      {slots.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center text-[#94A3B8]">
          <span className="text-3xl mb-3">📦</span>
          <span className="text-sm font-semibold text-[#64748B] mb-1">No Inventory Data</span>
          <span className="text-xs">No medicine slots found in Firestore. Add medicines to the 'medicines' collection to begin tracking.</span>
        </div>
      ) : (
        <>
          {/* Inventory Health Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Empty Slots</span>
                <div className={`text-2xl font-bold mt-1 ${criticalCount > 0 ? 'text-[#DC2626]' : 'text-[#0F172A]'}`}>{criticalCount}</div>
              </div>
              <span className="text-2xl">🚨</span>
            </div>
            
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Low Stock Slots</span>
                <div className={`text-2xl font-bold mt-1 ${warningCount > 0 ? 'text-[#D97706]' : 'text-[#0F172A]'}`}>{warningCount}</div>
              </div>
              <span className="text-2xl">⚠️</span>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Healthy Slots</span>
                <div className="text-2xl font-bold mt-1 text-[#16A34A]">
                  {slots.length - criticalCount - warningCount}
                </div>
              </div>
              <span className="text-2xl">✅</span>
            </div>
          </div>

          {/* Stock Cylinder Gauges Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {slots.map(s => {
              const pct = s.capacity > 0 ? (s.stock / s.capacity) * 100 : 0;
              const isCritical = s.status === 'critical';
              const isWarning = s.status === 'warning';
              const fillBg = isCritical ? 'bg-[#DC2626]' : isWarning ? 'bg-[#D97706]' : 'bg-[#16A34A]';
              const badgeClass = isCritical ? 'text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA]' : isWarning ? 'text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A]' : 'text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0]';
              
              return (
                <motion.div 
                  key={s.id} 
                  whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-widest">{displayCompartment(s.slotNumber)}</span>
                        <h3 className="text-lg font-bold text-[#0F172A] mt-1">{s.name || 'Prescription Free'}</h3>
                      </div>
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-wider rounded px-2.5 py-0.5 border ${badgeClass}`}>
                        {s.status === 'nominal' ? 'Optimal' : isWarning ? 'Restock Warning' : 'Empty Depleted'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 my-6 items-center">
                      {/* Gauge cylinder representation */}
                      <div className="col-span-1 h-32 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl flex flex-col justify-end overflow-hidden p-1 relative">
                        <motion.div 
                          className={`w-full rounded-xl ${fillBg}`}
                          initial={{ height: 0 }}
                          animate={{ height: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center font-mono text-sm font-bold text-[#0F172A]">
                          {pct.toFixed(0)}%
                        </div>
                      </div>

                      {/* Stock metrics */}
                      <div className="col-span-2 flex flex-col gap-2">
                        <div className="flex justify-between border-b border-[#F1F5F9] pb-1">
                          <span className="text-xs text-[#64748B]">Current Units:</span>
                          <span className="text-xs font-mono font-bold text-[#0F172A]">{s.stock}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#F1F5F9] pb-1">
                          <span className="text-xs text-[#64748B]">Max Capacity:</span>
                          <span className="text-xs font-mono text-[#0F172A]">{s.capacity}</span>
                        </div>
                        <div className="flex justify-between border-b border-[#F1F5F9] pb-1">
                          <span className="text-xs text-[#64748B]">Dosage Mass:</span>
                          <span className="text-xs font-mono text-[#0F172A]">{s.dosage || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => handleRestock(s)}
                      disabled={s.stock === s.capacity || restockingId === s.id}
                      className="w-full py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none cursor-pointer uppercase tracking-wider"
                    >
                      {restockingId === s.id ? 'Restocking...' : `Restock to Maximum (${s.capacity}u)`}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default Inventory;
