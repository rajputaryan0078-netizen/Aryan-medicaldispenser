import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  subscribeLogs,
  DispenseLog,
} from '../services/firebaseService';
import { displaySlot, displayCompartment } from '../utils/slotHelper';

const Logs: React.FC = () => {
  const [logs, setLogs] = useState<DispenseLog[]>([]);
  const [search, setSearch] = useState('');
  const [slotFilter, setSlotFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeLogs((data) => {
      setLogs(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Get unique slots from actual data for filter dropdown
  const uniqueSlots = [...new Set(logs.map(l => l.slot))].sort((a, b) => a - b);

  // Filter logic
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.patientName.toLowerCase().includes(search.toLowerCase()) || 
      log.medicineName.toLowerCase().includes(search.toLowerCase()) ||
      log.id.toLowerCase().includes(search.toLowerCase());

    const matchesSlot = 
      slotFilter === 'all' || 
      log.slot === parseInt(slotFilter);

    return matchesSearch && matchesSlot;
  });

  if (loading) {
    return (
      <div className="min-h-screen pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
          <span className="text-xs font-mono text-[#64748B]">Loading audit logs...</span>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">Audit Ledger</h1>
          <p className="text-xs text-[#64748B] mt-1">Real-time Firestore ledger tracking prescription dispensations and refilling actions.</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-xs self-start md:self-auto">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <span className="font-mono text-[#64748B]">Live — auto-updating via onSnapshot</span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Search Logs</label>
          <input 
            type="text" 
            placeholder="Search patient, drug, or transaction ID..."
            className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm placeholder-[#94A3B8] focus:ring-2 focus:ring-[#2563EB] outline-none w-72 text-[#0F172A]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-mono text-[#64748B] uppercase tracking-wider">Filter Compartment</label>
          <select 
            className="bg-white border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2563EB] text-[#0F172A] w-48"
            value={slotFilter}
            onChange={(e) => setSlotFilter(e.target.value)}
          >
            <option value="all">All Compartments</option>
            {uniqueSlots.map(slot => (
              <option key={slot} value={slot}>{displayCompartment(slot)}</option>
            ))}
          </select>
        </div>

        <div className="text-[10px] font-mono text-[#94A3B8] self-start md:self-auto md:text-right">
          Showing {filteredLogs.length} of {logs.length} transactions
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest px-5 py-3.5">ID</th>
                <th className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest px-5 py-3.5">Timestamp</th>
                <th className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest px-5 py-3.5">Patient Name</th>
                <th className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest px-5 py-3.5">Prescribed Drug</th>
                <th className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest px-5 py-3.5">Slot</th>
                <th className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest px-5 py-3.5">Dosage</th>
                <th className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest px-5 py-3.5">Authorized Physician</th>
                <th className="text-[10px] font-semibold text-[#64748B] uppercase tracking-widest px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => {
                  const statusClass = log.status?.toLowerCase() === 'success' 
                    ? 'bg-[#F0FDF4] text-[#16A34A] border-[#BBF7D0]' 
                    : log.status?.toLowerCase() === 'pending'
                    ? 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]'
                    : 'bg-[#FEF2F2] text-[#DC2626] border-[#FECACA]';

                  return (
                    <tr key={log.id} className="border-b border-[#F8FAFC] hover:bg-[#F8FAFC] transition-colors duration-150">
                      <td className="py-3.5 px-5 font-mono text-[#94A3B8] text-xs">{log.id.substring(0, 12)}...</td>
                      <td className="py-3.5 px-5 font-mono text-[#64748B] text-xs">{log.timestamp}</td>
                      <td className="py-3.5 px-5 font-semibold text-[#0F172A] text-sm">{log.patientName}</td>
                      <td className="py-3.5 px-5 text-[#0F172A] text-sm">{log.medicineName}</td>
                      <td className="py-3.5 px-5 font-mono text-[#64748B] text-xs">{displaySlot(log.slot)}</td>
                      <td className="py-3.5 px-5 font-mono text-[#64748B] text-xs">{log.dosage ?? log.dose ?? "—"}</td>
                      <td className="py-3.5 px-5 text-[#64748B] text-xs">{log.physician}</td>
                      <td className="py-3.5 px-5 text-right">
                        <span className={`font-mono text-[10px] rounded-full px-2.5 py-0.5 border ${statusClass}`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center text-[#94A3B8]">
                      <span className="text-2xl mb-2">📄</span>
                      <span className="text-sm font-semibold text-[#64748B] mb-1">No Audit Records</span>
                      <span className="text-xs text-[#94A3B8]">
                        {logs.length === 0
                          ? 'No dispensation logs found in Firestore.'
                          : 'No records match current filter criteria.'}
                      </span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default Logs;
