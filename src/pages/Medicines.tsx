import React, { useState, useEffect } from 'react';
import { displaySlot, displayCompartment } from '../utils/slotHelper';
import { motion, AnimatePresence } from 'framer-motion';
import {
  subscribeMedicines,
  updateMedicineSlot,
  MedicineSlot,
} from '../services/firebaseService';

const Medicines: React.FC = () => {
  const [slots, setSlots] = useState<MedicineSlot[]>([]);
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form edit states
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [stock, setStock] = useState(0);
  const [capacity, setCapacity] = useState(50);
  const [price, setPrice] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeMedicines((data) => {
      setSlots(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const startEdit = (slot: MedicineSlot) => {
    setEditingSlotId(slot.id);
    setName(slot.name);
    setDosage(slot.dosage);
    setStock(slot.stock);
    setCapacity(slot.capacity);
    setPrice(slot.price);
    setError('');
    setSuccess('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !dosage) {
      setError('Medicine name and dosage are required.');
      return;
    }
    if (stock < 0 || stock > capacity) {
      setError(`Stock must be between 0 and max capacity (${capacity}).`);
      return;
    }
    if (price < 0) {
      setError('Price cannot be negative.');
      return;
    }

    if (!editingSlotId) return;

    setSaving(true);
    try {
      const result = await updateMedicineSlot(editingSlotId, {
        name,
        dosage,
        stock,
        capacity,
        price,
      });

      if (result) {
        setSuccess(`Slot updated successfully.`);
        setTimeout(() => {
          setEditingSlotId(null);
        }, 1200);
      } else {
        setError('Failed to update slot. Check Firestore connection.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
          <span className="text-xs font-mono text-[#64748B]">Loading prescriptions...</span>
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
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Prescription Registry</h1>
        <p className="text-xs text-[#64748B] mt-1">Configure loaded medicines and dosage rules for each physical slot.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Slots Grid */}
        <div className="lg:col-span-2">
          {slots.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center text-[#94A3B8]">
              <span className="text-3xl mb-3">💊</span>
              <span className="text-sm font-semibold text-[#64748B] mb-1">No Medicines Configured</span>
              <span className="text-xs">Add medicine documents to the 'medicines' collection in Firestore to begin.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {slots.map((slot) => {
                const pct = slot.capacity > 0 ? (slot.stock / slot.capacity) * 100 : 0;
                const statusBorder = slot.status === 'nominal' ? 'border-[#BBF7D0]' : slot.status === 'warning' ? 'border-[#FDE68A]' : 'border-[#FECACA]';
                const statusText = slot.status === 'nominal' ? 'Optimal' : slot.status === 'warning' ? 'Low Stock' : 'Empty';
                const badgeColor = slot.status === 'nominal' ? 'text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0]' : slot.status === 'warning' ? 'text-[#D97706] bg-[#FFFBEB] border border-[#FDE68A]' : 'text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA]';
                const barColor = slot.status === 'nominal' ? 'bg-[#16A34A]' : slot.status === 'warning' ? 'bg-[#D97706]' : 'bg-[#DC2626]';

                return (
                  <motion.div 
                    key={slot.id}
                    className={`bg-white border ${statusBorder} rounded-2xl p-5 shadow-sm flex flex-col justify-between`}
                    whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                    transition={{ duration: 0.2 }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider bg-[#F1F5F9] border border-[#E2E8F0] rounded px-2.5 py-1">
                          {displayCompartment(slot.slotNumber)}
                        </span>
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-wider rounded px-2 py-0.5 border ${badgeColor}`}>
                          {statusText}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-[#0F172A] mb-0.5">{slot.name || 'Empty Slot'}</h3>
                      <p className="text-xs text-[#64748B] font-mono">Dosage: {slot.dosage || 'N/A'}</p>
                      <p className="text-xs text-[#64748B] font-mono mt-0.5">
                        Price: <span className="font-bold text-[#0F172A]">₹{slot.price > 0 ? slot.price.toFixed(2) : '—'}</span>
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#F1F5F9]">
                      <div className="flex justify-between text-xs text-[#64748B] mb-1.5">
                        <span>Stock Levels</span>
                        <span className="font-mono text-[#0F172A]">{slot.stock} / {slot.capacity} units</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden mb-4">
                        <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                      <button 
                        onClick={() => startEdit(slot)}
                        className="w-full py-2 bg-[#F8FAFC] hover:bg-[#EFF6FF] hover:text-[#2563EB] text-[#64748B] border border-[#E2E8F0] hover:border-[#BFDBFE] rounded-xl text-xs transition-all duration-200 cursor-pointer"
                      >
                        Edit Prescription
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Edit Form Sidebar */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm self-start">
          <h2 className="text-base font-bold text-[#0F172A] mb-1">Prescription Editor</h2>
          <p className="text-xs text-[#64748B] mb-6">Modify slot assignment details.</p>

          <AnimatePresence mode="wait">
            {editingSlotId !== null ? (
              <motion.form 
                onSubmit={handleSave} 
                className="flex flex-col gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {/* Alerts */}
                {error && <div className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3">{error}</div>}
                {success && <div className="text-xs text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3">{success}</div>}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Editing Compartment</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm text-[#94A3B8] outline-none"
                    value={editingSlotId ? displaySlot(slots.find(s => s.id === editingSlotId)?.slotNumber ?? 1) : ''} 
                    disabled 
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Medicine Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Metformin"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Standard Dosage</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 10mg"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Price (₹ INR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 25.00"
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
                    value={price}
                    onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Current Stock</label>
                    <input 
                      type="number" 
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
                      value={stock}
                      onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Max Capacity</label>
                    <input 
                      type="number" 
                      className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 mt-4">
                  <button 
                    type="button" 
                    onClick={() => setEditingSlotId(null)}
                    className="flex-1 py-2.5 bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#64748B] transition-colors duration-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-blue-200 transition-all duration-200 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Slot'}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.div 
                className="text-center py-10 border border-dashed border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center text-[#94A3B8]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <span className="text-2xl mb-2">📋</span>
                <span className="text-xs">Select a prescription compartment card to configure.</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default Medicines;
