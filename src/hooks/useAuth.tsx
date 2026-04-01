import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppUser, UserRole } from '@/types';
import type { User } from '@supabase/supabase-js';
import { getPreviewRole, getPreviewUser, isPreviewMode } from '@/lib/preview';

const PROFILE_SETUP_ERROR = 'Your account setup is incomplete. Please retry or contact an administrator.';

interface AuthState {
  user: AppUser | null;
  role: UserRole | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  authError: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AppUser>) => Promise<void>;
  retryHydration: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchAppUser(authUser: User): Promise<{ user: AppUser | null; error: string | null }> {
  const [profileRes, roleRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', authUser.id).single(),
    supabase.from('user_roles').select('role').eq('user_id', authUser.id).single(),
  ]);

  if (profileRes.error || !profileRes.data) {
    return { user: null, error: PROFILE_SETUP_ERROR };
  }

  const profile = profileRes.data;
  const role = (roleRes.data?.role as UserRole) ?? 'STAFF';

  return {
    user: {
      id: authUser.id,
      email: profile.email || authUser.email || '',
      name: profile.name ?? '',
      phone: profile.phone ?? undefined,
      role,
      isActive: profile.is_active ?? true,
      createdAt: profile.created_at ?? '',
    },
    error: null,
  };
}

export function AuthProvider({ children, pathname }: { children: React.ReactNode; pathname?: string }) {
  const previewPath = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  const previewMode = isPreviewMode(previewPath);
  const previewRole = getPreviewRole(previewPath);
  const [user, setUser] = useState<AppUser | null>(null);
  const [sessionUser, setSessionUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!previewMode);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setSessionUser(null);
    setAuthError(null);
  }, []);

  const hydrateUser = useCallback(async (authUser: User) => {
    setLoading(true);
    setSessionUser(authUser);

    try {
      const { user: appUser, error } = await fetchAppUser(authUser);
      setUser(appUser);
      setAuthError(error);
    } catch {
      setUser(null);
      setAuthError(PROFILE_SETUP_ERROR);
    } finally {
      setLoading(false);
    }
  }, []);

  const retryHydration = useCallback(async () => {
    if (previewMode) {
      setUser(getPreviewUser(previewRole));
      setAuthError(null);
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();

    if (session?.user) {
      await hydrateUser(session.user);
      return;
    }

    clearAuthState();
    setLoading(false);
  }, [clearAuthState, hydrateUser, previewMode, previewRole]);

  useEffect(() => {
    if (previewMode) {
      setUser(getPreviewUser(previewRole));
      setSessionUser(null);
      setAuthError(null);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setTimeout(() => {
            void hydrateUser(session.user);
          }, 0);
        } else {
          clearAuthState();
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void hydrateUser(session.user);
        return;
      }

      clearAuthState();
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [clearAuthState, hydrateUser, previewMode, previewRole]);

  const login = useCallback(async (email: string, password: string) => {
    if (previewMode) return;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, [previewMode]);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    if (previewMode) return;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
  }, [previewMode]);

  const logout = useCallback(async () => {
    if (previewMode) {
      setUser(getPreviewUser(previewRole));
      setAuthError(null);
      return;
    }

    await supabase.auth.signOut();
    clearAuthState();
  }, [clearAuthState, previewMode, previewRole]);

  const updateProfile = useCallback(async (data: Partial<AppUser>) => {
    if (previewMode) {
      setUser(prev => prev ? { ...prev, ...data } : prev);
      return;
    }

    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ name: data.name, phone: data.phone })
      .eq('id', user.id);
    if (error) throw error;
    setUser(prev => prev ? { ...prev, ...data } : prev);
  }, [previewMode, user]);

  const role = user?.role ?? null;

  return (
    <AuthContext.Provider value={{
      user,
      role,
      isAdmin: role === 'ADMIN',
      isAuthenticated: previewMode || !!sessionUser,
      loading,
      authError,
      login,
      signup,
      logout,
      updateProfile,
      retryHydration,
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
