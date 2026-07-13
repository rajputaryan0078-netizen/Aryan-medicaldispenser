import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { displaySlot, displayCompartment } from '../utils/slotHelper';
import {
  subscribePatients,
  subscribeMedicines,
  addPatient,
  MedicineSlot,
  Patient,
} from '../services/firebaseService';

const Dispense: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [slots, setSlots] = useState<MedicineSlot[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New patient registration form state
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [targetSlot, setTargetSlot] = useState(0); // 0 = uninitialised sentinel
  const [dosage, setDosage] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubPatients = subscribePatients((data) => {
      setPatients(data);
      setLoading(false);
    });

    const unsubMeds = subscribeMedicines((data) => {
      setSlots(data);
      // Only set the default slot once — when targetSlot is still the
      // uninitialised sentinel (0). Subsequent snapshots must not reset
      // a slot the user has already chosen.
      if (data.length > 0) {
        setTargetSlot((prev) => prev === 0 ? data[0].slotNumber : prev);
      }
    });

    return () => {
      unsubPatients();
      unsubMeds();
    };
  }, []);

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!name || !dob || !dosage) {
      setError('Patient Name, Date of Birth, and Dosage are required.');
      return;
    }

    if (targetSlot === 0) {
      setError('Please select a dispensing slot.');
      return;
    }

    const matchedSlot = slots.find(s => s.slotNumber === targetSlot);
    if (!matchedSlot) {
      setError('Selected slot not found.');
      return;
    }

    setSubmitting(true);
    try {
      const docId = await addPatient({
        name,
        dob,
        prescription: matchedSlot.name,
        targetSlot,
        dosage,
      });

      if (docId) {
        setSuccess(`Patient ${name} registered under prescription ${matchedSlot.name}.`);
        // Reset form
        setName('');
        setDob('');
        setDosage('');
      } else {
        setError('Failed to register patient. Check Firestore connection.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register patient.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
          <span className="text-xs font-mono text-[#64748B]">Loading patient data...</span>
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
        <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Patient Prescriptions</h1>
        <p className="text-xs text-[#64748B] mt-1">Enroll new patient profiles and configure their clinical dispenser slot mapping.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrolled Patients List */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <h2 className="text-base font-bold text-[#0F172A] mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#2563EB]" /> Registered Patient Profiles
          </h2>

          {patients.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center text-[#94A3B8]">
              <span className="text-3xl mb-3">👥</span>
              <span className="text-sm font-semibold text-[#64748B] mb-1">No Patients Registered</span>
              <span className="text-xs">Enroll a patient using the form to get started.</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {patients.map(p => (
                <motion.div 
                  key={p.id} 
                  whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                  transition={{ duration: 0.2 }}
                  className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider bg-[#F1F5F9] border border-[#E2E8F0] rounded px-2.5 py-1">
                      {p.id.substring(0, 12)}...
                    </span>
                    <span className="text-[9px] font-mono font-bold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded px-2 py-0.5 uppercase">
                      Active Prescription
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] mb-1">{p.name}</h3>
                  <div className="flex flex-col gap-1 text-xs text-[#64748B] mt-3 pt-3 border-t border-[#F1F5F9]">
                    <div className="flex justify-between">
                      <span>Date of Birth:</span>
                      <span className="font-mono text-[#0F172A]">{p.dob}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Assigned Medication:</span>
                      <span className="text-[#0F172A] font-semibold">{p.prescription}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dispensing Slot:</span>
                      <span className="font-mono text-[#0F172A]">{displayCompartment(p.targetSlot)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dosage Rule:</span>
                      <span className="font-mono text-[#0F172A]">{p.dosage}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Enrollment Form */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm self-start">
          <h2 className="text-base font-bold text-[#0F172A] mb-1">Enroll Patient</h2>
          <p className="text-xs text-[#64748B] mb-6">Create a clinical chart profile.</p>

          <form onSubmit={handleRegisterPatient} className="flex flex-col gap-4">
            {error && <div className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3">{error}</div>}
            {success && <div className="text-xs text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3">{success}</div>}

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Patient Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. John Smith"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Date of Birth</label>
              <input 
                type="date" 
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Map to Compartment Slot</label>
              {slots.length === 0 ? (
                <div className="text-xs text-[#94A3B8] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5">
                  No medicine slots available in Firestore.
                </div>
              ) : (
                <select 
                  className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
                  value={targetSlot}
                  onChange={(e) => setTargetSlot(parseInt(e.target.value))}
                >
                  {slots.map(s => (
                    <option key={s.id} value={s.slotNumber}>{displaySlot(s.slotNumber)} — {s.name} ({s.dosage})</option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Dosage Amount</label>
              <input 
                type="text" 
                placeholder="e.g. 1 pill, twice daily"
                className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting || slots.length === 0}
              className="w-full mt-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl text-xs transition-all duration-200 cursor-pointer shadow-md shadow-blue-200 disabled:opacity-50 disabled:pointer-events-none active:scale-95"
            >
              {submitting ? 'Registering...' : 'Enroll Patient Profile'}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default Dispense;
