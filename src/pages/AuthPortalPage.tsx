import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Lock,
  Mail,
  User,
  Shield,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck,
  KeyRound,
} from 'lucide-react';

export const AuthPortalPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, isAuthenticated, role } = useAuth();

  // Mode: 'signin' | 'signup'
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>(() =>
    location.pathname === '/signup' ? 'signup' : 'signin'
  );

  // Sync authMode when URL route switches between /signin and /signup
  useEffect(() => {
    if (location.pathname === '/signup') {
      setAuthMode('signup');
      setErrorMessage(null);
      setSuccessMessage(null);
    } else if (location.pathname === '/signin') {
      setAuthMode('signin');
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [location.pathname]);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'authority'>('citizen');
  const [showPassword, setShowPassword] = useState(false);

  // Status and Error State
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated with real backend session, redirect away from signin
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname;
      if (from && from !== '/signin' && from !== '/signup') {
        navigate(from, { replace: true });
      } else if (role === 'authority' || role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate, location.state]);

  // Handle Sign In (Section 16 A / B)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Validate email not empty
    if (!email || email.trim() === '') {
      setErrorMessage('Email address is required. Please check your credentials and try again.');
      return;
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // 3. Validate password not empty
    if (!password || password === '') {
      setErrorMessage('Password is required. Please check your credentials and try again.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 4-8. Send to backend auth provider & verify genuine session
      const result = await signIn({
        email: email.trim(),
        password,
      });

      if (!result.success) {
        // Section 16 B: Stay on screen, show user-friendly error, no fake access
        setErrorMessage(result.error || 'Invalid email or password. Please check your credentials and try again.');
        setIsSubmitting(false);
        return;
      }

      // Step 9-10. Successful backend authentication
      setSuccessMessage('Authentication verified by backend. Establishing secure session...');
      setTimeout(() => {
        const from = (location.state as any)?.from?.pathname;
        if (from && from !== '/signin') {
          navigate(from, { replace: true });
        } else if (result.role === 'authority' || result.role === 'admin') {
          navigate('/admin', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 600);
    } catch (err: any) {
      setErrorMessage('Unable to connect. Please check your internet connection and try again.');
      setIsSubmitting(false);
    }
  };

  // Handle Sign Up (Section 16 E)
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate Full Name
    if (!fullName || fullName.trim().length < 2) {
      setErrorMessage('Full name is required (minimum 2 characters).');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    // Validate password
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    // Validate password confirmation
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter your confirmation password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        role: selectedRole,
      });

      if (!result.success) {
        setErrorMessage(result.error || 'Account creation failed. Please check your details.');
        setIsSubmitting(false);
        return;
      }

      if (result.needsEmailVerification) {
        setSuccessMessage('Registration successful! Please check your email inbox to verify your account before signing in.');
        setIsSubmitting(false);
      } else {
        setSuccessMessage('Account registered successfully! Establishing session...');
        setTimeout(() => {
          navigate(selectedRole === 'authority' ? '/admin' : '/dashboard', { replace: true });
        }, 600);
      }
    } catch (err: any) {
      setErrorMessage('Unable to connect. Please check your internet connection and try again.');
      setIsSubmitting(false);
    }
  };

  // Helper to load test credentials into inputs (user still must submit for real backend verification)
  const fillTestCredentials = (testEmail: string, testPass: string) => {
    setEmail(testEmail);
    setPassword(testPass);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F2] text-[#171918] py-10 sm:py-16 px-4 sm:px-6 lg:px-8 selection:bg-[#DDE7DF] selection:text-[#315C4C]">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header Breadcrumb */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E8EAE5] border border-[#E4E6E2] text-[11px] font-semibold text-[#315C4C] uppercase tracking-wider">
            <Lock size={12} />
            <span>Strict Backend Authentication</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#171918]">
            {authMode === 'signin' ? 'Sign in to CivicEye' : 'Create CivicEye Account'}
          </h1>
          <p className="text-xs text-[#737773] max-w-xs mx-auto leading-relaxed">
            {authMode === 'signin'
              ? 'Access requires authentication verified by the actual authentication backend.'
              : 'Register your citizen or municipal credentials with the verified database.'}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-white border border-[#E4E6E2] shadow-xs">
          <button
            type="button"
            onClick={() => {
              setAuthMode('signin');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              authMode === 'signin'
                ? 'bg-[#315C4C] text-white shadow-xs'
                : 'text-[#737773] hover:text-[#171918]'
            }`}
          >
            <KeyRound size={14} />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('signup');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              authMode === 'signup'
                ? 'bg-[#315C4C] text-white shadow-xs'
                : 'text-[#737773] hover:text-[#171918]'
            }`}
          >
            <UserCheck size={14} />
            <span>Create Account</span>
          </button>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-[#FCE8E6] border border-[#B8463B]/30 text-xs font-medium text-[#B8463B] flex items-start gap-2.5 animate-in fade-in duration-200">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Success Alert Banner */}
        {successMessage && (
          <div className="p-3.5 rounded-xl bg-[#DDE7DF] border border-[#315C4C]/30 text-xs font-medium text-[#315C4C] flex items-start gap-2.5 animate-in fade-in duration-200">
            <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" />
            <span className="leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Auth Form Card */}
        <div className="bg-white border border-[#E4E6E2] rounded-2xl p-6 sm:p-7 shadow-sm">
          {authMode === 'signin' ? (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#171918] block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737773]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@civiceye.internal or ghmc.gov.in"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2] text-xs font-medium text-[#171918] placeholder:text-[#A3A8A0] focus:outline-none focus:border-[#315C4C] focus:bg-white transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#171918] block mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737773]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2] text-xs font-medium text-[#171918] placeholder:text-[#A3A8A0] focus:outline-none focus:border-[#315C4C] focus:bg-white transition-all"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#737773] hover:text-[#171918] p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(49,92,76,0.2)]"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Backend Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In with Verified Credentials</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-[#171918] block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737773]" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aditya Sharma"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2] text-xs font-medium text-[#171918] placeholder:text-[#A3A8A0] focus:outline-none focus:border-[#315C4C] focus:bg-white transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#171918] block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737773]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="aditya@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2] text-xs font-medium text-[#171918] placeholder:text-[#A3A8A0] focus:outline-none focus:border-[#315C4C] focus:bg-white transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#171918] block mb-1.5">
                  Role Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRole('citizen')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                      selectedRole === 'citizen'
                        ? 'border-[#315C4C] bg-[#DDE7DF]/40 text-[#315C4C] font-semibold'
                        : 'border-[#E4E6E2] bg-white text-[#737773] hover:text-[#171918]'
                    }`}
                  >
                    <User size={13} />
                    <span>Citizen Guardian</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedRole('authority')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-all ${
                      selectedRole === 'authority'
                        ? 'border-[#315C4C] bg-[#DDE7DF]/40 text-[#315C4C] font-semibold'
                        : 'border-[#E4E6E2] bg-white text-[#737773] hover:text-[#171918]'
                    }`}
                  >
                    <Building2 size={13} />
                    <span>Municipal Officer</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#171918] block mb-1.5">
                  Password (min 6 characters)
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737773]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2] text-xs font-medium text-[#171918] placeholder:text-[#A3A8A0] focus:outline-none focus:border-[#315C4C] focus:bg-white transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#171918] block mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#737773]" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F5F5F2] border border-[#E4E6E2] text-xs font-medium text-[#171918] placeholder:text-[#A3A8A0] focus:outline-none focus:border-[#315C4C] focus:bg-white transition-all"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-[#315C4C] text-white text-xs font-semibold hover:bg-[#26483B] disabled:opacity-60 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_2px_8px_rgba(49,92,76,0.2)]"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating Backend Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Register Account</span>
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Quick Credential Quickfill Chips for Testing */}
          <div className="mt-6 pt-5 border-t border-[#E4E6E2] space-y-2.5">
            <div className="text-[11px] font-semibold text-[#737773] uppercase tracking-wider flex items-center justify-between">
              <span>Registered Verification Credentials</span>
              <span className="text-[10px] font-mono text-[#315C4C]">Backend Verified</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => fillTestCredentials('citizen@civiceye.internal', 'Citizen@CivicEye2026')}
                className="w-full p-2.5 rounded-xl bg-[#F5F5F2] hover:bg-[#EAECE6] border border-[#E4E6E2] text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-[#171918] flex items-center gap-1.5">
                    <User size={13} className="text-[#315C4C]" />
                    <span>Citizen Guardian (Aditya)</span>
                  </div>
                  <div className="text-[10px] text-[#737773] font-mono mt-0.5">
                    citizen@civiceye.internal
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#315C4C] group-hover:underline">
                  Use Credential →
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillTestCredentials('rajesh.kumar@ghmc.gov.in', 'Rajesh@Ghmc2026')}
                className="w-full p-2.5 rounded-xl bg-[#F5F5F2] hover:bg-[#EAECE6] border border-[#E4E6E2] text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-[#171918] flex items-center gap-1.5">
                    <Building2 size={13} className="text-[#315C4C]" />
                    <span>Municipal Engineer (Rajesh Kumar)</span>
                  </div>
                  <div className="text-[10px] text-[#737773] font-mono mt-0.5">
                    rajesh.kumar@ghmc.gov.in
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#315C4C] group-hover:underline">
                  Use Credential →
                </span>
              </button>

              <button
                type="button"
                onClick={() => fillTestCredentials('admin@civiceye.internal', 'Admin@CivicEye2026')}
                className="w-full p-2.5 rounded-xl bg-[#F5F5F2] hover:bg-[#EAECE6] border border-[#E4E6E2] text-left transition-colors flex items-center justify-between group"
              >
                <div>
                  <div className="text-xs font-bold text-[#171918] flex items-center gap-1.5">
                    <Shield size={13} className="text-[#315C4C]" />
                    <span>Chief Operations Administrator</span>
                  </div>
                  <div className="text-[10px] text-[#737773] font-mono mt-0.5">
                    admin@civiceye.internal
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-[#315C4C] group-hover:underline">
                  Use Credential →
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Informational Footer */}
        <div className="text-center text-[11px] text-[#737773]">
          <Link to="/" className="hover:text-[#315C4C] transition-colors underline">
            ← Back to CivicEye Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AuthPortalPage;
