import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020408] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
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
          <div className="w-32 h-0.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-[#185FA5]/60 rounded-full animate-pulse" />
          </div>
          <span className="text-[10px] font-mono text-white/30 tracking-widest uppercase">
            Verifying Session
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page, saving the original requested location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
