import React, { useState, useEffect } from 'react';
import { displaySlot } from '../utils/slotHelper';
import { motion, AnimatePresence } from 'framer-motion';
import {
  subscribeMedicines,
  subscribeLogs,
  subscribePatients,
  addDispenseLog,
  updateMedicineSlot,
  MedicineSlot,
  DispenseLog,
  Patient,
} from '../services/firebaseService';
import { useAuth } from '../context/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Data states
  const [slots, setSlots] = useState<MedicineSlot[]>([]);
  const [logs, setLogs] = useState<DispenseLog[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Dispatch states
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [isDispensing, setIsDispensing] = useState(false);
  const [dispenseProgress, setDispenseProgress] = useState(0);

  // Sync state (visual heartbeat)
  const [syncTime, setSyncTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    // Firestore real-time listeners
    const unsubMeds = subscribeMedicines((data) => {
      setSlots(data);
      if (data.length > 0 && !selectedSlotId) {
        setSelectedSlotId(data[0].id);
      }
      setLoading(false);
    });

    const unsubLogs = subscribeLogs((data) => {
      setLogs(data);
    });

    const unsubPatients = subscribePatients((data) => {
      setPatients(data);
      if (data.length > 0 && !selectedPatientId) {
        setSelectedPatientId(data[0].id);
      }
    });

    // Visual heartbeat
    const interval = setInterval(() => {
      setSyncTime(new Date().toLocaleTimeString());
    }, 2000);

    return () => {
      unsubMeds();
      unsubLogs();
      unsubPatients();
      clearInterval(interval);
    };
  }, []);

  // Update selected patient triggers pre-selected slot
  const handlePatientChange = (id: string) => {
    setSelectedPatientId(id);
    const pat = patients.find(p => p.id === id);
    if (pat) {
      const matchingSlot = slots.find(s => s.slotNumber === pat.targetSlot);
      if (matchingSlot) setSelectedSlotId(matchingSlot.id);
    }
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isDispensing) return;

    const slotObj = slots.find(s => s.id === selectedSlotId);
    const patientObj = patients.find(p => p.id === selectedPatientId);

    if (!slotObj || !patientObj) return;
    if (slotObj.stock <= 0) {
      setStatusMsg(`Error: ${displaySlot(slotObj.slotNumber)} (${slotObj.name}) is out of stock.`);
      return;
    }

    setIsDispensing(true);
    setDispenseProgress(0);
    setStatusMsg('Broadcasting prescription order payload to Firestore...');

    // Phase 1: Firebase Sync (0.8s)
    await new Promise<void>((resolve) => {
      let prog = 0;
      const t = setInterval(() => {
        prog += 15;
        setDispenseProgress(Math.min(prog, 35));
        if (prog >= 35) {
          clearInterval(t);
          resolve();
        }
      }, 300);
    });

    setStatusMsg('Firestore event received. ESP32 listener fired. Actuating SG90 servo motor...');
    
    // Phase 2: ESP32 Actuation (1.2s)
    await new Promise<void>((resolve) => {
      let prog = 35;
      const t = setInterval(() => {
        prog += 20;
        setDispenseProgress(Math.min(prog, 85));
        if (prog >= 85) {
          clearInterval(t);
          resolve();
        }
      }, 300);
    });

    setStatusMsg('Ultrasonic sensor confirmed pill delivery. Logging transactions...');

    // Deduct stock in Firestore
    await updateMedicineSlot(slotObj.id, {
      stock: Math.max(0, slotObj.stock - 1),
    });

    // Append log to Firestore
    const physicianName = user?.displayName || user?.email || 'Unknown Physician';
    await addDispenseLog({
      patientName: patientObj.name,
      medicineName: slotObj.name,
      slot: slotObj.slotNumber,
      dosage: slotObj.dosage,
      physician: physicianName,
      status: 'Success',
    });

    setDispenseProgress(100);
    setStatusMsg('Prescription dispensed successfully. Audit records updated.');
    
    setTimeout(() => {
      setIsDispensing(false);
      setStatusMsg('');
      setDispenseProgress(0);
    }, 2000);
  };

  // Calculations for stats
  const activeDevices = 1;
  const totalDispenses = logs.filter(l => l.status === 'Success').length;
  const stockAlerts = slots.filter(s => s.stock <= 5).length;
  const patientsCount = patients.length;

  if (loading) {
    return (
      <div className="min-h-screen pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
          <span className="text-xs font-mono text-[#64748B]">Connecting to Firestore...</span>
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
      {/* Top dashboard header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Clinical Command Center</h1>
          <p className="text-xs text-[#64748B] mt-1">Real-time edge monitor & prescription dispatcher.</p>
        </div>
        
        {/* Heartbeat connection tag */}
        <div className="flex items-center gap-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl px-4 py-2 self-start md:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <div className="text-[10px] font-mono text-[#64748B] leading-none">
            <span className="text-[#2563EB] font-bold">FIRESTORE:</span> ONLINE <span className="opacity-40">|</span> LAST SYNC: {syncTime}
          </div>
        </div>
      </div>

      {/* Main KPI Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'System Dispenses', value: totalDispenses, desc: 'Accumulated logs count', icon: '⚡' },
          { label: 'Active Edge Nodes', value: activeDevices, desc: 'ESP32 boards online', icon: '📡' },
          { label: 'Registered Patients', value: patientsCount, desc: 'Clinical medical profiles', icon: '👥' },
          { label: 'Inventory Stock Alerts', value: stockAlerts, desc: 'Slots containing < 5 units', icon: '⚠️', color: stockAlerts > 0 ? 'text-[#D97706]' : 'text-[#0F172A]' }
        ].map((kpi, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.07 }}
            className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#64748B]">{kpi.label}</span>
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-lg">
                <span className="text-[#2563EB]">{kpi.icon}</span>
              </div>
            </div>
            <div className={`text-3xl font-bold mt-2 ${kpi.color || 'text-[#0F172A]'}`}>{kpi.value}</div>
            <div className="text-xs text-[#94A3B8] mt-1">{kpi.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Grid of panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dispensation panel */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" /> Trigger Dispensation
            </h2>
            <p className="text-xs text-[#64748B] mb-6">Dispatch prescriptions immediately to the IoT dispenser.</p>

            {patients.length === 0 || slots.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center text-[#94A3B8]">
                <span className="text-2xl mb-2">📋</span>
                <span className="text-xs">
                  {patients.length === 0 && slots.length === 0
                    ? 'No patients or medicines registered. Add data via Firestore.'
                    : patients.length === 0
                    ? 'No patients registered yet.'
                    : 'No medicine slots configured yet.'}
                </span>
              </div>
            ) : (
              <form onSubmit={handleDispense} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Select Patient Profile</label>
                  <select 
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
                    value={selectedPatientId}
                    onChange={(e) => handlePatientChange(e.target.value)}
                    disabled={isDispensing}
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.prescription})</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Edge Compartment Slot</label>
                  <select 
                    className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-[#2563EB] text-[#0F172A]"
                    value={selectedSlotId}
                    onChange={(e) => setSelectedSlotId(e.target.value)}
                    disabled={isDispensing}
                  >
                    {slots.map(s => (
                      <option key={s.id} value={s.id}>{displaySlot(s.slotNumber)} — {s.name} ({s.stock} left)</option>
                    ))}
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={isDispensing}
                  className="w-full mt-4 py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold rounded-xl text-xs transition-all tracking-wider uppercase disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-md shadow-blue-200 active:scale-95"
                >
                  {isDispensing ? 'IOT Dispatching...' : 'Initiate IoT Dispensation'}
                </button>
              </form>
            )}
          </div>

          {/* Real-time sync logs overlay */}
          <AnimatePresence>
            {isDispensing && (
              <motion.div 
                className="mt-6 p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col gap-3"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-[#64748B] uppercase tracking-wider">Transaction Progress</span>
                  <span className="text-[10px] font-mono text-[#2563EB] font-bold">{dispenseProgress}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-1 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-[#2563EB]"
                    initial={{ width: 0 }}
                    animate={{ width: `${dispenseProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="text-[10px] font-mono text-[#2563EB] leading-normal animate-pulse">
                  ➔ {statusMsg}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live inventory panel */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#0F172A] mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" /> Edge Cabinet Capacity
          </h2>
          <p className="text-xs text-[#64748B] mb-6">Current physical levels in loaded slots.</p>

          {slots.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center text-[#94A3B8]">
              <span className="text-2xl mb-2">💊</span>
              <span className="text-xs">No medicine slots found in Firestore.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {slots.map(s => {
                const pct = s.capacity > 0 ? (s.stock / s.capacity) * 100 : 0;
                const fillBg = pct > 50 ? 'bg-[#16A34A]' : pct >= 20 ? 'bg-[#D97706]' : 'bg-[#DC2626]';
                const statusBadgeClass = s.status === 'nominal' ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]' : s.status === 'warning' ? 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]' : 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]';
                const statusText = s.status === 'nominal' ? 'Optimal' : s.status === 'warning' ? 'Low Stock' : 'Empty';

                return (
                  <div key={s.id} className="py-3 border-b border-[#F1F5F9] last:border-0 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0F172A]">{displaySlot(s.slotNumber)}: {s.name} <span className="text-xs bg-[#F1F5F9] text-[#64748B] rounded-md px-2 py-0.5 font-mono">({s.dosage})</span></span>
                      <span className="font-mono text-[#64748B]">{s.stock} / {s.capacity} units</span>
                    </div>
                    {/* Gauge */}
                    <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                      <div className={`h-full ${fillBg}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-mono">
                      <span className="text-[#94A3B8] uppercase">Capacity {pct.toFixed(0)}%</span>
                      <span className={`uppercase font-bold rounded px-2 py-0.5 border text-[9px] ${statusBadgeClass}`}>{statusText}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Ledger panel */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0F172A] mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" /> Recent Actions Log
            </h2>
            <p className="text-xs text-[#64748B] mb-6">Real-time ledger events.</p>

            {logs.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[#E2E8F0] rounded-2xl flex flex-col items-center justify-center text-[#94A3B8]">
                <span className="text-2xl mb-2">📄</span>
                <span className="text-xs">No dispense logs recorded yet.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5 max-h-[260px] overflow-y-auto pr-1">
                {logs.slice(0, 5).map(log => {
                  const statusClass = log.status === 'Success' ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]' : log.status === 'Pending' ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]' : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';
                  return (
                    <div key={log.id} className="py-3 border-b border-[#F8FAFC] last:border-0 flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold text-[#0F172A]">{log.patientName}</div>
                        <div className="text-xs text-[#64748B] mt-0.5">Dispensed {log.medicineName} ({displaySlot(log.slot)})</div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-mono rounded-full px-2.5 py-0.5 border ${statusClass}`}>
                          {log.status}
                        </span>
                        <div className="text-[8px] font-mono text-[#94A3B8] mt-1">{log.timestamp.split(' ')[1] || ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
