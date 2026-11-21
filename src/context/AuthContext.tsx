import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService, AuthUser, AuthSession } from '../services/authService';
import { UserProfile } from '../types';

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  role: 'citizen' | 'authority' | 'admin' | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string; role?: string }>;
  signUp: (params: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    role?: 'citizen' | 'authority';
  }) => Promise<{ success: boolean; error?: string; needsEmailVerification?: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapAuthUserToProfile(user: AuthUser | null): UserProfile | null {
  if (!user) return null;
  const role = user.user_metadata.role || 'citizen';
  return {
    id: user.id,
    name: user.user_metadata.full_name || user.email.split('@')[0],
    role: role === 'admin' ? 'authority' : role,
    title: user.user_metadata.title || (role === 'authority' ? 'Municipal Officer' : 'Citizen Guardian'),
    department: user.user_metadata.department,
    ward: user.user_metadata.ward || 'Ward 04 - Jubilee Hills',
    trustScore: user.user_metadata.trustScore || 800,
    reportsSubmitted: 6,
    confirmationsGiven: 24,
    verificationsCompleted: 12,
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<'citizen' | 'authority' | 'admin' | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session on boot
  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const activeSession = await authService.getSession();
        if (mounted) {
          if (activeSession && activeSession.user) {
            setSession(activeSession);
            setUser(activeSession.user);
            const userRole = activeSession.user.user_metadata.role || 'citizen';
            setRole(userRole);
            setProfile(mapAuthUserToProfile(activeSession.user));
          } else {
            setSession(null);
            setUser(null);
            setRole(null);
            setProfile(null);
          }
        }
      } catch (err) {
        if (mounted) {
          setSession(null);
          setUser(null);
          setRole(null);
          setProfile(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initializeAuth();

    // Subscribe to ongoing session state changes
    const { unsubscribe } = authService.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        if (newSession && newSession.user) {
          setSession(newSession);
          setUser(newSession.user);
          const userRole = newSession.user.user_metadata.role || 'citizen';
          setRole(userRole);
          setProfile(mapAuthUserToProfile(newSession.user));
        } else {
          setSession(null);
          setUser(null);
          setRole(null);
          setProfile(null);
        }
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (credentials: { email: string; password: string }) => {
      const response = await authService.signIn(credentials);
      if (response.error || !response.data.session) {
        return {
          success: false,
          error: response.error?.message || 'Invalid email or password. Please check your credentials and try again.',
        };
      }

      const activeSession = response.data.session;
      setSession(activeSession);
      setUser(activeSession.user);
      const userRole = activeSession.user.user_metadata.role || 'citizen';
      setRole(userRole);
      setProfile(mapAuthUserToProfile(activeSession.user));

      return {
        success: true,
        role: userRole,
      };
    },
    []
  );

  const signUp = useCallback(
    async (params: {
      fullName: string;
      email: string;
      password: string;
      confirmPassword: string;
      role?: 'citizen' | 'authority';
    }) => {
      const response = await authService.signUp(params);
      if (response.error) {
        return {
          success: false,
          error: response.error.message,
        };
      }

      if (response.data.session && response.data.user) {
        const activeSession = response.data.session;
        setSession(activeSession);
        setUser(activeSession.user);
        const userRole = activeSession.user.user_metadata.role || 'citizen';
        setRole(userRole);
        setProfile(mapAuthUserToProfile(activeSession.user));
      }

      return {
        success: true,
        needsEmailVerification: response.needsEmailVerification,
      };
    },
    []
  );

  const signOut = useCallback(async () => {
    await authService.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setProfile(null);
  }, []);

  const isAuthenticated = Boolean(session && user && session.user.id === user.id);

  const value: AuthContextType = {
    user,
    session,
    role,
    profile,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
