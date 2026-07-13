import React from 'react';
import MedicineCard from './MedicineCard';
import { Medicine } from '../data/medicines';

interface MedicineGridProps {
  medicines: Medicine[];
  cart: { [id: string]: number };
  onAddToCart: (medicine: Medicine) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
}

export const MedicineGrid: React.FC<MedicineGridProps> = ({
  medicines,
  cart,
  onAddToCart,
  onUpdateQuantity,
}) => {
  if (medicines.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <span className="text-4xl mb-3">💊</span>
        <h3 className="text-sm font-bold text-slate-800">No Medications Available</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-[200px]">This tray compartment is currently empty.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-1">
      {medicines.map((medicine) => (
        <MedicineCard
          key={medicine.id}
          medicine={medicine}
          quantity={cart[medicine.id] || 0}
          onAddToCart={onAddToCart}
          onUpdateQuantity={onUpdateQuantity}
        />
      ))}
    </div>
  );
};

export default MedicineGrid;
