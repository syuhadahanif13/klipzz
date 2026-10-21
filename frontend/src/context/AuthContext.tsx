'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile, UserRole } from '../types';
import { DEMO_CLIPPER, DEMO_ADMIN } from '../data/mockData';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string, fullName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // First time visitor is a Guest (user is null)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync session on mount
  useEffect(() => {
    async function loadUserSession() {
      try {
        // 1. Check local session storage first for immediate instant hydration
        if (typeof window !== 'undefined') {
          const cachedSession = localStorage.getItem('klipzz_user_session');
          if (cachedSession) {
            try {
              const parsed = JSON.parse(cachedSession) as UserProfile;
              setUser(parsed);
            } catch (_) {}
          }
        }

        // 2. Sync with Supabase Auth
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            const userObj: UserProfile = {
              id: profile.id,
              username: profile.username,
              full_name: profile.full_name || profile.username,
              avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
              role: (profile.role === 'admin' ? 'admin' : 'clipper') as UserRole,
              balance: Number(profile.balance) || 0,
              total_earned: Number(profile.total_earned) || 0,
            };
            setUser(userObj);
            if (typeof window !== 'undefined') {
              localStorage.setItem('klipzz_user_session', JSON.stringify(userObj));
            }
          }
        }
      } catch (err) {
        console.warn('Session load notice:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profile) {
          const userObj: UserProfile = {
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name || profile.username,
            avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            role: (profile.role === 'admin' ? 'admin' : 'clipper') as UserRole,
            balance: Number(profile.balance) || 0,
            total_earned: Number(profile.total_earned) || 0,
          };
          setUser(userObj);
          if (typeof window !== 'undefined') {
            localStorage.setItem('klipzz_user_session', JSON.stringify(userObj));
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('klipzz_user_session');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (identifier: string, password: string) => {
    try {
      const cleanId = identifier.trim().toLowerCase();

      // Account 1: admin | psswd: m@juterusrajaemas
      if (
        (cleanId === 'admin' || cleanId === 'admin@klipzz.vid' || cleanId === 'admin@dipanggilkeruangan.com') &&
        password === 'm@juterusrajaemas'
      ) {
        supabase.auth.signInWithPassword({ email: 'admin@klipzz.vid', password }).catch(() => {});
        if (typeof window !== 'undefined') {
          localStorage.setItem('klipzz_user_session', JSON.stringify(DEMO_ADMIN));
        }
        setUser(DEMO_ADMIN);
        return { success: true };
      }

      // Account 2: clipper_hans | psswd: KramatRaya45.
      if (
        (cleanId === 'clipper_hans' || cleanId === 'clipper_hans@klipzz.vid' || cleanId === 'hans' || cleanId === 'hans@klipzz.vid') &&
        password === 'KramatRaya45.'
      ) {
        supabase.auth.signInWithPassword({ email: 'clipper_hans@klipzz.vid', password }).catch(() => {});
        if (typeof window !== 'undefined') {
          localStorage.setItem('klipzz_user_session', JSON.stringify(DEMO_CLIPPER));
        }
        setUser(DEMO_CLIPPER);
        return { success: true };
      }

      // Supabase Auth verification for any additional registered users
      const emailTarget = cleanId.includes('@') ? cleanId : `${cleanId}@klipzz.vid`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailTarget,
        password,
      });

      if (error) {
        return { success: false, error: 'Username/email atau kata sandi tidak sesuai. Silakan periksa kembali.' };
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profile) {
          const userObj: UserProfile = {
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name || profile.username,
            avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            role: (profile.role === 'admin' ? 'admin' : 'clipper') as UserRole,
            balance: Number(profile.balance) || 0,
            total_earned: Number(profile.total_earned) || 0,
          };
          if (typeof window !== 'undefined') {
            localStorage.setItem('klipzz_user_session', JSON.stringify(userObj));
          }
          setUser(userObj);
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal masuk akun' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName: string,
    role: UserRole
  ) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            role,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const avatarUrl = role === 'admin'
          ? 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';

        await supabase.from('profiles').upsert({
          id: data.user.id,
          username,
          full_name: fullName,
          role,
          balance: 0,
          total_earned: 0,
          avatar_url: avatarUrl,
        });

        const userObj: UserProfile = {
          id: data.user.id,
          username,
          full_name: fullName,
          avatar_url: avatarUrl,
          role,
          balance: 0,
          total_earned: 0,
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem('klipzz_user_session', JSON.stringify(userObj));
        }
        setUser(userObj);
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('klipzz_user_session');
      }
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
