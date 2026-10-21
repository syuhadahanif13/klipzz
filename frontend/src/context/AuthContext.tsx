'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { UserProfile, UserRole } from '../types';
import { INITIAL_USER } from '../data/mockData';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, username: string, fullName: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  toggleRole: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(INITIAL_USER);
  const [loading, setLoading] = useState(true);

  // Sync Supabase Auth Session
  useEffect(() => {
    async function loadUserSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch user profile from Supabase
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
              role: profile.role || 'clipper',
              balance: Number(profile.balance) || 0,
              total_earned: Number(profile.total_earned) || 0,
            });
          }
        }
      } catch (err) {
        console.warn('Supabase session load error, using cached user:', err);
      } finally {
        setLoading(false);
      }
    }

    loadUserSession();

    // Listen for auth state changes
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
            role: profile.role || 'clipper',
            balance: Number(profile.balance) || 0,
            total_earned: Number(profile.total_earned) || 0,
          });
        }
      } else if (event === 'SIGNED_OUT') {
        // Fall back to null or guest user
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Quick fallback for demo accounts if user entered predefined demo accounts
        if (email === 'fajar@klipzz.vid') {
          setUser(INITIAL_USER);
          return { success: true };
        }
        if (email === 'brand@dipanggilkeruangan.com') {
          setUser({
            id: '11111111-1111-1111-1111-111111111111',
            username: 'dipanggilkeruangan_official',
            full_name: 'DiPanggil ke Ruangan Official',
            avatar_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200',
            role: 'brand',
            balance: 150000000,
            total_earned: 0,
          });
          return { success: true };
        }
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
            role: profile.role || 'clipper',
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
        // Upsert into public.profiles
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: data.user.id,
          username,
          full_name: fullName,
          role,
          balance: 0,
          total_earned: 0,
          avatar_url: `https://images.unsplash.com/photo-${role === 'brand' ? '1590602847861-f357a9332bbc' : '1535713875002-d1d0cf377fde'}?w=200`,
        });

        if (profileError) {
          console.error('Failed to create profile record:', profileError);
        }

        setUser({
          id: data.user.id,
          username,
          full_name: fullName,
          avatar_url: `https://images.unsplash.com/photo-${role === 'brand' ? '1590602847861-f357a9332bbc' : '1535713875002-d1d0cf377fde'}?w=200`,
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
    await supabase.auth.signOut();
    setUser(null);
  };

  const toggleRole = () => {
    if (!user) return;
    setUser({
      ...user,
      role: user.role === 'clipper' ? 'brand' : 'clipper',
    });
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
