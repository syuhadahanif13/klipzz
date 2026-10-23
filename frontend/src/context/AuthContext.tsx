'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile, UserRole } from '../types';

interface AuthResult {
  success: boolean;
  error?: string;
  needsEmailConfirmation?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    username: string,
    fullName: string,
    role: UserRole
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200';

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeRole(role: unknown): UserRole {
  if (role === 'admin') return 'admin';
  if (role === 'brand') return 'brand';
  return 'clipper';
}

function mapProfile(row: any): UserProfile {
  return {
    id: row.id,
    username: row.username || 'user',
    full_name: row.full_name || row.username || 'Kreator',
    avatar_url: row.avatar_url || DEFAULT_AVATAR,
    role: normalizeRole(row.role),
    balance: Number(row.balance || 0),
    total_earned: Number(row.total_earned || 0),
  };
}

/**
 * Loads the signed-in user's full profile.
 * Uses the get_my_profile() RPC added by the hardening migration so that the
 * balance/email columns can stay hidden from client roles. Falls back to a
 * direct read before the migration has been applied.
 */
async function fetchProfile(userId: string): Promise<UserProfile | null> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase.rpc('get_my_profile');

    if (!error) {
      const row = Array.isArray(data) ? data[0] : data;
      if (row) return mapProfile(row);
    } else {
      const { data: row } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (row) return mapProfile(row);
    }

    await delay(300);
  }

  return null;
}

function fallbackProfile(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}): UserProfile {
  const meta = authUser.user_metadata || {};
  const username = meta.username || authUser.email?.split('@')[0] || 'clipper';

  return {
    id: authUser.id,
    username,
    full_name: meta.full_name || username,
    avatar_url: DEFAULT_AVATAR,
    role: normalizeRole(meta.role),
    balance: 0,
    total_earned: 0,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUserSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) return;

        const profile = await fetchProfile(session.user.id);
        if (active) {
          setUser(profile || fallbackProfile(session.user));
        }
      } catch (err) {
        console.warn('Session load notice:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadUserSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Supabase warns against awaiting other Supabase calls inside this
      // callback; defer the profile lookup to the next tick.
      const authUser = session.user;
      setTimeout(async () => {
        const profile = await fetchProfile(authUser.id);
        if (active) {
          setUser(profile || fallbackProfile(authUser));
          setLoading(false);
        }
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (identifier: string, password: string): Promise<AuthResult> => {
    try {
      const cleanId = identifier.trim().toLowerCase();

      // Users can sign in with their email. Short usernames map to the internal
      // klipzz.vid address (this also covers the seeded admin/clipper accounts).
      const emailTarget = cleanId.includes('@') ? cleanId : `${cleanId}@klipzz.vid`;

      const { error } = await supabase.auth.signInWithPassword({
        email: emailTarget,
        password,
      });

      if (error) {
        return {
          success: false,
          error: 'Email/username atau kata sandi tidak sesuai. Silakan periksa kembali.',
        };
      }

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        return { success: false, error: 'Sesi login tidak valid. Silakan coba lagi.' };
      }

      const profile = await fetchProfile(authUser.id);
      setUser(profile || fallbackProfile(authUser));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal masuk akun.' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    username: string,
    fullName: string,
    role: UserRole
  ): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            full_name: fullName,
            // The DB trigger only accepts clipper/brand; admin is never
            // assignable from a public signup.
            role: role === 'brand' ? 'brand' : 'clipper',
          },
        },
      });

      if (error) {
        let msg = error.message;
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('invalid') && lowerMsg.includes('email')) {
          msg = 'Format email tidak valid. Gunakan alamat email aktif.';
        } else if (lowerMsg.includes('rate limit')) {
          msg = 'Terlalu banyak permintaan pendaftaran. Mohon tunggu 1 menit lalu coba lagi.';
        } else if (lowerMsg.includes('already registered') || lowerMsg.includes('already exists')) {
          msg = 'Email ini sudah terdaftar. Silakan masuk langsung dengan akun Anda.';
        } else if (lowerMsg.includes('password') && lowerMsg.includes('least')) {
          msg = 'Kata sandi minimal harus 6 karakter.';
        } else if (lowerMsg.includes('database error saving new user')) {
          msg = 'Sistem database sedang sibuk. Silakan coba kembali dalam beberapa detik.';
        }
        return { success: false, error: msg };
      }

      // Email confirmation enabled: no session yet. The profile will be created
      // by the database trigger once the user confirms their email.
      if (!data.session || !data.user) {
        return { success: true, needsEmailConfirmation: true };
      }

      const profile = await fetchProfile(data.user.id);
      setUser(profile || fallbackProfile(data.user));

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal membuat akun.' };
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
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, setUser }}>
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
