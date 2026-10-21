'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile, UserRole } from '../types';
import { DEMO_CLIPPER, DEMO_ADMIN } from '../data/mockData';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string, fullName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  toggleRole: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  loginAsDemoClipper: () => void;
  loginAsDemoAdmin: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // First time visitor is a Guest (user is null)
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync Supabase Auth Session
  useEffect(() => {
    async function loadUserSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              username: profile.username,
              full_name: profile.full_name || profile.username,
              avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
              role: (profile.role === 'admin' ? 'admin' : 'clipper') as UserRole,
              balance: Number(profile.balance) || 0,
              total_earned: Number(profile.total_earned) || 0,
            });
          }
        }
      } catch (err) {
        console.warn('Supabase session load error:', err);
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
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name || profile.username,
            avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            role: (profile.role === 'admin' ? 'admin' : 'clipper') as UserRole,
            balance: Number(profile.balance) || 0,
            total_earned: Number(profile.total_earned) || 0,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Demo shortcuts for convenience
      if (email === 'fajar@klipzz.vid') {
        setUser(DEMO_CLIPPER);
        return { success: true };
      }
      if (email === 'admin@dipanggilkeruangan.com' || email === 'brand@dipanggilkeruangan.com') {
        setUser(DEMO_ADMIN);
        return { success: true };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profile) {
          setUser({
            id: profile.id,
            username: profile.username,
            full_name: profile.full_name || profile.username,
            avatar_url: profile.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200',
            role: (profile.role === 'admin' ? 'admin' : 'clipper') as UserRole,
            balance: Number(profile.balance) || 0,
            total_earned: Number(profile.total_earned) || 0,
          });
        }
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
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

        setUser({
          id: data.user.id,
          username,
          full_name: fullName,
          avatar_url: avatarUrl,
          role,
          balance: 0,
          total_earned: 0,
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setUser(null);
  };

  const toggleRole = () => {
    if (!user) return;
    setUser({
      ...user,
      role: user.role === 'clipper' ? 'admin' : 'clipper',
    });
  };

  const loginAsDemoClipper = () => {
    setUser(DEMO_CLIPPER);
  };

  const loginAsDemoAdmin = () => {
    setUser(DEMO_ADMIN);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        toggleRole,
        setUser,
        loginAsDemoClipper,
        loginAsDemoAdmin,
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
