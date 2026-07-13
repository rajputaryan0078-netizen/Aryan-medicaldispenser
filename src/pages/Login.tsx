import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const Login: React.FC = () => {
  const { login, signup, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Get redirect path
  const from = (location.state as any)?.from?.pathname || '/app/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      if (isForgot) {
        if (!email) throw new Error('Please enter your registered clinical email.');
        await resetPassword(email);
        setSuccess('Passcode reset instructions dispatched to your inbox.');
        setTimeout(() => setIsForgot(false), 2000);
      } else if (isSignUp) {
        if (!email || !password || !name) throw new Error('All registration fields are required.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        await signup(email, password, name);
        navigate(from, { replace: true });
      } else {
        if (!email || !password) throw new Error('Please enter credentials.');
        await login(email, password);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020408] text-white flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background radial lines */}
      <div 
        className="absolute inset-0 opacity-[0.015] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#185FA5 1px, transparent 1px), linear-gradient(90deg, #185FA5 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#185FA5]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#3B6D11]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main card */}
      <motion.div 
        className="w-full max-w-md bg-[#0a0f1d] border border-white/5 rounded-2xl p-8 shadow-2xl relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Header Logo */}
        <div className="flex flex-col items-center gap-3 mb-8 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#185FA5]/10 border border-[#185FA5]/30 flex items-center justify-center">
            <svg viewBox="0 0 16 16" className="w-7 h-7 text-[#185FA5]" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.9" />
              <rect x="9" y="2" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.6" />
              <rect x="2" y="9" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.6" />
              <rect x="9" y="9" width="5" height="5" rx="1.5" fill="currentColor" opacity="0.4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
              NexDose <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#185FA5]/10 border border-[#185FA5]/25 text-[#185FA5] font-mono">Console</span>
            </h1>
            <p className="text-xs text-[#8892a4] mt-1.5">
              Smart Prescription. Accurate Dispensing. Zero Errors.
            </p>
          </div>
        </div>

        {/* Status Alerts */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 mb-5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl p-3 mb-5"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Forms */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && !isForgot && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-mono text-[#8892a4] uppercase tracking-wider">Physician Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. Dr. Alexis Sterling"
                className="w-full bg-[#030712] border border-white/5 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#185FA5]/30 focus:bg-[#030712]/50 transition-all text-white"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono text-[#8892a4] uppercase tracking-wider">Clinical Email Address</label>
            <input 
              type="email" 
              placeholder="physician@nexdose.com"
              className="w-full bg-[#030712] border border-white/5 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#185FA5]/30 focus:bg-[#030712]/50 transition-all text-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {!isForgot && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono text-[#8892a4] uppercase tracking-wider">Access Passcode</label>
                <button 
                  type="button"
                  onClick={() => setIsForgot(true)}
                  className="text-[10px] font-mono text-[#185FA5] hover:text-[#185FA5]/80 transition-colors uppercase tracking-wider"
                >
                  Forgot passcode?
                </button>
              </div>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full bg-[#030712] border border-white/5 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#185FA5]/30 focus:bg-[#030712]/50 transition-all text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full mt-2 py-3 bg-[#185FA5] hover:bg-[#15528f] text-white font-semibold rounded-xl text-sm transition-all shadow-md active:scale-98 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : isForgot ? (
              'Reset Credentials'
            ) : isSignUp ? (
              'Register Clinical License'
            ) : (
              'Authorize Console Access'
            )}
          </button>
        </form>

        {/* Tab Toggle Links */}
        <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-[#8892a4]">
          {isForgot ? (
            <button 
              type="button" 
              onClick={() => setIsForgot(false)}
              className="text-[#185FA5] hover:underline"
            >
              Return to Clinical Sign In
            </button>
          ) : isSignUp ? (
            <span>
              Already hold a registered console license?{' '}
              <button 
                type="button" 
                onClick={() => setIsSignUp(false)}
                className="text-[#185FA5] hover:underline"
              >
                Sign In
              </button>
            </span>
          ) : (
            <span>
              Don't have clinical dispenser access?{' '}
              <button 
                type="button" 
                onClick={() => setIsSignUp(true)}
                className="text-[#185FA5] hover:underline"
              >
                Register License
              </button>
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
