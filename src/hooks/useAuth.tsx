import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { AppUser, UserRole } from '@/types';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: AppUser | null;
  role: UserRole | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<AppUser>) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

async function fetchAppUser(authUser: User): Promise<AppUser | null> {
  const [profileRes, roleRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', authUser.id).single(),
    supabase.from('user_roles').select('role').eq('user_id', authUser.id).single(),
  ]);

  if (profileRes.error || !profileRes.data) return null;

  const profile = profileRes.data;
  const role = (roleRes.data?.role as UserRole) ?? 'STAFF';

  return {
    id: authUser.id,
    email: authUser.email ?? '',
    name: profile.name ?? '',
    phone: profile.phone ?? undefined,
    role,
    isActive: profile.is_active ?? true,
    createdAt: profile.created_at ?? '',
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener BEFORE checking session
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid Supabase deadlock during callback
          setTimeout(async () => {
            const appUser = await fetchAppUser(session.user);
            setUser(appUser);
            setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const appUser = await fetchAppUser(session.user);
        setUser(appUser);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data: Partial<AppUser>) => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update({ name: data.name, phone: data.phone })
      .eq('id', user.id);
    if (error) throw error;
    setUser(prev => prev ? { ...prev, ...data } : prev);
  }, [user]);

  const role = user?.role ?? null;

  return (
    <AuthContext.Provider value={{
      user, role, isAdmin: role === 'ADMIN', isAuthenticated: !!user, loading,
      login, signup, logout, updateProfile,
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
