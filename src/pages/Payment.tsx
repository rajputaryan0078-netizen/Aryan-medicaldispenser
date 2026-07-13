import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Check, QrCode, PhoneCall } from 'lucide-react';

interface PaymentProps {
  totalAmount: number;
  itemCount: number;
  onPaymentSuccess: () => void;
  onCancel: () => void;
}

export const Payment: React.FC<PaymentProps> = ({
  totalAmount,
  itemCount,
  onPaymentSuccess,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'QR' | 'CARD'>('QR');

  return (
    <motion.div
      className="flex-1 flex flex-col p-6 bg-slate-50 h-full justify-between text-center"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.35 }}
    >
      <div>
        {/* Top Header */}
        <div className="mb-4">
          <h2 className="text-lg font-black text-slate-800">Secure Payment Portal</h2>
          <p className="text-xs text-slate-400">Complete transaction to begin medication release</p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 bg-slate-200/60 p-1 rounded-xl mb-6">
          <button
            onClick={() => setSelectedMethod('QR')}
            className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedMethod === 'QR'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <QrCode className="w-4 h-4" /> Scan QR code
          </button>
          <button
            onClick={() => setSelectedMethod('CARD')}
            className={`py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              selectedMethod === 'CARD'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Credit Card
          </button>
        </div>

        {/* Payment Main Area */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6 flex flex-col items-center justify-center min-h-[220px]">
          {selectedMethod === 'QR' ? (
            <div className="flex flex-col items-center">
              {/* Specialized Medical QR Mock */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 relative shadow-sm">
                <svg width="150" height="150" viewBox="0 0 100 100" className="text-slate-800">
                  <path d="M0,0 h15 v3 h-12 v12 h-3 z M0,5 h12 v3 h-12 z" />
                  <path d="M0,85 h3 v12 h12 v3 h-15 z M0,90 h12 v3 h-12 z" />
                  <path d="M85,0 h15 v15 h-3 v-12 h-12 z M90,0 v12 h3 v-12 z" />
                  <rect x="20" y="5" width="10" height="5" />
                  <rect x="35" y="10" width="5" height="15" />
                  <rect x="15" y="25" width="20" height="5" />
                  <rect x="5" y="45" width="10" height="10" />
                  <rect x="25" y="40" width="10" height="5" />
                  <rect x="45" y="25" width="10" height="10" />
                  <rect x="65" y="5" width="10" height="10" />
                  <rect x="80" y="25" width="15" height="5" />
                  <rect x="25" y="60" width="5" height="15" />
                  <rect x="35" y="65" width="15" height="10" />
                  <rect x="55" y="50" width="15" height="5" />
                  <rect x="80" y="45" width="10" height="15" />
                  <rect x="65" y="65" width="15" height="20" />
                  {/* Medical Plus core */}
                  <rect x="42" y="42" width="16" height="16" fill="#2563EB" rx="4" />
                  <path d="M47,50 h6 M50,47 v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                </svg>
                
                {/* Scan animation line */}
                <motion.div 
                  className="absolute inset-x-3 h-0.5 bg-blue-500 shadow-md shadow-blue-500"
                  animate={{ top: ['12px', '162px', '12px'] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                />
              </div>

              <div className="mt-4 text-[10px] font-mono text-slate-400">
                INVOICE REFERENCE: <span className="text-slate-600 font-bold">INV-{Date.now().toString().slice(6)}</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-3 border border-blue-100">
                <CreditCard className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Tap or Insert Card</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px]">Use contactless reader or chip terminal to finalize checkout.</p>
            </div>
          )}
        </div>

        {/* Invoice breakdown summary */}
        <div className="bg-white border border-slate-200 rounded-3xl p-4 flex items-center justify-between text-left">
          <div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none block">Total Invoiced</span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">${totalAmount.toFixed(2)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-700 block">{itemCount} items ordered</span>
            <span className="text-[10px] text-slate-400 mt-0.5 block">10% tax exemption applied</span>
          </div>
        </div>

      </div>

      {/* Control Buttons */}
      <div className="flex flex-col gap-3">
        <motion.button
          onClick={onPaymentSuccess}
          className="w-full py-4.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-2xl text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          whileTap={{ scale: 0.98 }}
        >
          Simulate Payment Success
          <Check className="w-5 h-5" />
        </motion.button>

        <button
          onClick={onCancel}
          className="w-full py-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-bold rounded-2xl text-xs uppercase tracking-wider cursor-pointer"
        >
          Cancel Transaction
        </button>

        <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
          <PhoneCall className="w-3 h-3" /> Need help? Press the assist button on physical dispenser.
        </span>
      </div>

    </motion.div>
  );
};

export default Payment;
