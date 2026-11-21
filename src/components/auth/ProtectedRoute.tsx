import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('citizen' | 'authority' | 'admin')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { session, user, role, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1. Loading State Barrier: NEVER render protected content before session verification completes
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F2] px-4">
        <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-white border border-[#E4E6E2] shadow-sm max-w-sm text-center">
          <div className="w-10 h-10 rounded-full bg-[#DDE7DF] text-[#315C4C] flex items-center justify-center animate-pulse">
            <Lock size={20} />
          </div>
          <div className="text-sm font-bold text-[#171918]">Verifying Security Session</div>
          <p className="text-xs text-[#737773] leading-relaxed">
            Confirming cryptographically signed backend authentication credentials with Supabase...
          </p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Barrier: No valid session exists -> Immediately redirect to /signin
  if (!isAuthenticated || !session || !user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // 3. Role Authorization Barrier: Citizen attempting staff/admin functions -> 403 Forbidden
  if (allowedRoles && allowedRoles.length > 0 && role) {
    if (!allowedRoles.includes(role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F5F2] px-4 py-12">
          <div className="max-w-md w-full bg-white border border-[#B8463B]/30 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FCE8E6] text-[#B8463B] flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>

            <div className="space-y-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#FCE8E6] text-[#B8463B] uppercase tracking-wider">
                403 · Access Forbidden
              </span>
              <h2 className="text-xl font-bold text-[#171918]">Unauthorized Municipal Role</h2>
              <p className="text-xs text-[#737773] leading-relaxed">
                Your authenticated account (<span className="font-mono text-[#171918]">{user.email}</span>) holds the role of{' '}
                <span className="font-semibold text-[#171918] uppercase">{role}</span>. Access to this municipal operations console requires{' '}
                <span className="font-semibold text-[#B8463B]">{allowedRoles.join(' or ')}</span> authorization.
              </p>
            </div>

            <div className="pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] transition-colors shadow-sm"
              >
                <ArrowLeft size={14} />
                <span>Return to My Civic Space</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }
  }

  // 4. Session and Role Verified: Grant Access
  return <>{children}</>;
};

export default ProtectedRoute;
