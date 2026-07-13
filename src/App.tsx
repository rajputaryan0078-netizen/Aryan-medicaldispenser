import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthContextProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { seedMedicinePrices } from './services/firebaseService';

// Layouts
import MainLayout from './layouts/MainLayout';

// Pages - Landing and Login loads immediately
import Landing from './pages/Landing';
import Login from './pages/Login';

// Lazy load dashboard pages for code splitting
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Dispense = React.lazy(() => import('./pages/Dispense'));
const Inventory = React.lazy(() => import('./pages/Inventory'));
const Logs = React.lazy(() => import('./pages/Logs'));
const Medicines = React.lazy(() => import('./pages/Medicines'));
const Kiosk = React.lazy(() => import('./pages/Kiosk'));
const PaymentPage = React.lazy(() => import('./pages/PaymentPage'));
const Dispensing = React.lazy(() => import('./pages/Dispensing'));
// Page transition wrapper
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

// Suspense fallback
const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-[#020408] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      {/* Animated logo */}
      <div className="relative w-10 h-10">
        <div className="absolute inset-0 bg-[#185FA5]/20 rounded-xl blur-md animate-pulse" />
        <div className="relative flex items-center justify-center w-10 h-10 bg-[#185FA5]/10 border border-[#185FA5]/30 rounded-xl">
          <svg viewBox="0 0 16 16" className="w-5 h-5" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" fill="#185FA5" opacity="0.9" />
            <rect x="9" y="2" width="5" height="5" rx="1" fill="#185FA5" opacity="0.6" />
            <rect x="2" y="9" width="5" height="5" rx="1" fill="#185FA5" opacity="0.6" />
            <rect x="9" y="9" width="5" height="5" rx="1" fill="#185FA5" opacity="0.4" />
          </svg>
        </div>
      </div>

      {/* Loading bar */}
      <div className="w-32 h-0.5 bg-white/6 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#185FA5]/60 rounded-full"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <span className="text-xs font-mono text-white/20 tracking-widest">
        Loading module
      </span>
    </div>
  </div>
);

// App component
const App: React.FC = () => {
  // Seed missing medicine prices once on startup (idempotent — skips docs
  // that already have price > 0).
  useEffect(() => {
    seedMedicinePrices();
  }, []);

  return (
    <BrowserRouter>
      <AuthContextProvider>
        <Suspense fallback={<PageLoader />}>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Landing page */}
              <Route
                path="/"
                element={
                  <PageTransition>
                    <Landing />
                  </PageTransition>
                }
              />

              {/* Login route */}
              <Route
                path="/login"
                element={
                  <PageTransition>
                    <Login />
                  </PageTransition>
                }
              />

              {/* Kiosk route */}
              <Route
                path="/kiosk"
                element={
                  <PageTransition>
                    <Kiosk />
                  </PageTransition>
                }
              />

              {/* Payment route */}
              <Route
                path="/pay"
                element={
                  <PageTransition>
                    <PaymentPage />
                  </PageTransition>
                }
              />
              <Route
                path="/dispensing"
                element={
                  <PageTransition>
                    <Dispensing
                      medName="Paracetamol"
                      slotNumber={1}
                      onDispenseComplete={() => { }}
                    />
                  </PageTransition>
                }
              />

              {/* Protected clinical app pages with main layout wrapper */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route
                  index
                  element={
                    <Navigate to="/app/dashboard" replace />
                  }
                />
                <Route
                  path="dashboard"
                  element={
                    <PageTransition>
                      <Dashboard />
                    </PageTransition>
                  }
                />
                <Route
                  path="dispense"
                  element={
                    <PageTransition>
                      <Dispense />
                    </PageTransition>
                  }
                />
                <Route
                  path="inventory"
                  element={
                    <PageTransition>
                      <Inventory />
                    </PageTransition>
                  }
                />
                <Route
                  path="logs"
                  element={
                    <PageTransition>
                      <Logs />
                    </PageTransition>
                  }
                />
                <Route
                  path="medicines"
                  element={
                    <PageTransition>
                      <Medicines />
                    </PageTransition>
                  }
                />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </AuthContextProvider>
    </BrowserRouter>
  );
};

export default App;