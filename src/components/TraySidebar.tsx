import React from 'react';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';

interface TraySidebarProps {
  activeTray: number;
  onSelectTray: (tray: number) => void;
}

export const TraySidebar: React.FC<TraySidebarProps> = ({
  activeTray,
  onSelectTray,
}) => {
  const trays = [1, 2, 3, 4, 5, 6];

  return (
    <div className="w-28 bg-slate-50 border-r border-slate-200/80 flex flex-col items-center justify-start gap-4 py-6 px-3 h-full overflow-y-auto">
      <div className="flex flex-col items-center gap-1.5 mb-2">
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
          <Layers className="w-5 h-5" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Trays</span>
      </div>

      {trays.map((trayNum) => {
        const isActive = activeTray === trayNum;
        return (
          <motion.button
            key={trayNum}
            onClick={() => onSelectTray(trayNum)}
            className={`w-full aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer relative ${
              isActive
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-500 hover:text-slate-800 shadow-sm'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {/* Slide active border effect */}
            {isActive && (
              <motion.div
                className="absolute -left-1 w-2.5 h-10 bg-blue-600 rounded-r-lg"
                layoutId="activeTrayMarker"
              />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Tray</span>
            <span className="text-2xl font-black">{trayNum}</span>
          </motion.button>
        );
      })}
    </div>
  );
};

export default TraySidebar;
