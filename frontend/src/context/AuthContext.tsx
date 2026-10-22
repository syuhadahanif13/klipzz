'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile, UserRole } from '../types';


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
  // Waktu pertama kali buka web, statusnya guest (belum login)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Cek sesi user saat aplikasi pertama kali dimuat
  useEffect(() => {
    async function loadUserSession() {
      try {
        // Cek session lokal biar pas reload langsung keisi tanpa nunggu query
        if (typeof window !== 'undefined') {
          const cachedSession = localStorage.getItem('klipzz_user_session');
          if (cachedSession) {
            try {
              const parsed = JSON.parse(cachedSession) as UserProfile;
              setUser(parsed);
            } catch (_) {}
          }
        }

        // Sinkronkan data profil dari supabase auth
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            const roleVal: UserRole = profile.role === 'admin' ? 'admin' : profile.role === 'brand' ? 'brand' : 'clipper';
            const userObj: UserProfile = {
              id: profile.id,
              username: profile.username || 'user',
              full_name: profile.full_name || profile.username || 'Kreator',
              avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
              role: roleVal,
              balance: Number(profile.balance || 0),
              total_earned: Number(profile.total_earned || 0),
            };
            setUser(userObj);
            if (typeof window !== 'undefined') {
              localStorage.setItem('klipzz_user_session', JSON.stringify(userObj));
            }
          } else {
            // Profile belum ada di public.profiles, masukkan otomatis ke Supabase
            const meta = session.user.user_metadata || {};
            const username = meta.username || session.user.email?.split('@')[0] || 'clipper';
            const fullName = meta.full_name || username;
            const roleVal: UserRole = meta.role === 'admin' ? 'admin' : meta.role === 'brand' ? 'brand' : 'clipper';
            const fallbackObj: UserProfile = {
              id: session.user.id,
              username,
              full_name: fullName,
              avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
              role: roleVal,
              balance: 0,
              total_earned: 0,
            };
            await supabase.from('profiles').upsert(fallbackObj);
            setUser(fallbackObj);
            if (typeof window !== 'undefined') {
              localStorage.setItem('klipzz_user_session', JSON.stringify(fallbackObj));
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
          const roleVal: UserRole = profile.role === 'admin' ? 'admin' : profile.role === 'brand' ? 'brand' : 'clipper';
          const userObj: UserProfile = {
            id: profile.id,
            username: profile.username || 'user',
            full_name: profile.full_name || profile.username || 'Kreator',
            avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            role: roleVal,
            balance: Number(profile.balance || 0),
            total_earned: Number(profile.total_earned || 0),
          };
          setUser(userObj);
          if (typeof window !== 'undefined') {
            localStorage.setItem('klipzz_user_session', JSON.stringify(userObj));
          }
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

      // Cari email tujuan jika user mengetik username (tanpa tanda @)
      let emailTarget = cleanId;
      if (!cleanId.includes('@')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .ilike('username', cleanId)
          .maybeSingle();

        if (profile?.email) {
          emailTarget = profile.email;
        } else if (cleanId === 'admin') {
          emailTarget = 'admin@rajaemas.id';
        } else if (cleanId === 'clipper_hans' || cleanId === 'hans') {
          emailTarget = 'clipper_hans@rajaemas.id';
        } else {
          emailTarget = `${cleanId}@klipzz.vid`;
        }
      }

      // Autentikasi resmi via Supabase Auth
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
          const roleVal: UserRole = profile.role === 'admin' ? 'admin' : profile.role === 'brand' ? 'brand' : 'clipper';
          const userObj: UserProfile = {
            id: profile.id,
            username: profile.username || 'user',
            full_name: profile.full_name || profile.username || 'Kreator',
            avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            role: roleVal,
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
        let msg = error.message;
        const lowerMsg = msg.toLowerCase();
        if (lowerMsg.includes('invalid') && lowerMsg.includes('email')) {
          msg = 'Format email tidak valid atau domain email tidak didukung. Gunakan alamat email aktif.';
        } else if (lowerMsg.includes('rate limit')) {
          msg = 'Terlalu banyak permintaan pendaftaran. Mohon tunggu 1 menit lalu coba lagi.';
        } else if (lowerMsg.includes('already registered')) {
          msg = 'Email ini sudah terdaftar. Silakan masuk langsung dengan akun Anda.';
        } else if (lowerMsg.includes('password') && lowerMsg.includes('least')) {
          msg = 'Kata sandi minimal harus 6 karakter.';
        } else if (lowerMsg.includes('database error saving new user')) {
          msg = 'Sistem database sedang sibuk. Silakan coba kembali dalam beberapa detik.';
        }
        return { success: false, error: msg };
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
