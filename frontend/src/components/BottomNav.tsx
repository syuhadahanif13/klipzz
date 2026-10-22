'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Flame,
  Scissors,
  Wallet,
  User,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  onOpenSubmit?: () => void;
  onOpenBioChallenge?: () => void;
}

export function BottomNav({ onOpenSubmit, onOpenBioChallenge }: BottomNavProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isHome = pathname === '/';
  const isDashboard = pathname === '/dashboard';
  const isCampaign = pathname?.startsWith('/campaign');
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  // Sembunyikan bottom nav di halaman login dan registrasi
  if (isAuthPage) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#210635]/95 backdrop-blur-2xl border-t border-[#7B337E]/40 shadow-[0_-8px_25px_rgba(33,6,53,0.8)] px-2 pt-1 pb-[calc(env(safe-area-inset-bottom)+8px)] transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* TAB 1: BERANDA */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            isHome && !isCampaign
              ? 'text-[#F5D5E0] font-bold'
              : 'text-[#F5D5E0]/60 hover:text-[#F5D5E0]'
          }`}
        >
          <div className="relative">
            <Home className="w-5 h-5 transition-transform active:scale-90" />
            {isHome && !isCampaign && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#7B337E] to-[#6667AB] shadow-sm" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Beranda</span>
        </Link>

        {/* TAB 2: CAMPAIGN / EKSPLORASI */}
        <Link
          href="/#campaigns-section"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            isCampaign
              ? 'text-[#F5D5E0] font-bold'
              : 'text-[#F5D5E0]/60 hover:text-[#F5D5E0]'
          }`}
        >
          <div className="relative">
            <Flame className="w-5 h-5 transition-transform active:scale-90 text-[#6667AB]" />
            {isCampaign && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#7B337E] to-[#6667AB] shadow-sm" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Campaign</span>
        </Link>

        {/* TAB 3: TOMBOL UTAMA (GUNTING / SETOR KLIP) */}
        <div className="relative -top-4 flex flex-col items-center">
          <button
            onClick={() => {
              if (onOpenSubmit) {
                onOpenSubmit();
              } else {
                // Kalau lagi di halaman luar tanpa modal langsung, arahkan ke daftar campaign
                window.location.href = '/#campaigns-section';
              }
            }}
            className="w-13 h-13 p-3 rounded-full bg-gradient-to-tr from-[#7B337E] via-[#6667AB] to-[#F5D5E0] text-white shadow-[0_4px_20px_rgba(123,51,126,0.6)] border-2 border-[#210635] flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
            aria-label="Setor Klip"
          >
            <Scissors className="w-6 h-6 -rotate-45 text-white drop-shadow group-hover:rotate-0 transition-transform" />
          </button>
          <span className="text-[10px] font-bold text-[#F5D5E0] mt-0.5 tracking-tight">
            Klip
          </span>
        </div>

        {/* TAB 4: CUAN / WALLET */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            isDashboard
              ? 'text-[#F5D5E0] font-bold'
              : 'text-[#F5D5E0]/60 hover:text-[#F5D5E0]'
          }`}
        >
          <div className="relative">
            <Wallet className="w-5 h-5 transition-transform active:scale-90 text-emerald-400" />
            {isDashboard && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#7B337E] to-[#6667AB] shadow-sm" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Cuan</span>
        </Link>

        {/* TAB 5: AKUN / PROFIL */}
        <Link
          href={user ? '/dashboard' : '/login'}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            pathname === '/login' || pathname === '/signup'
              ? 'text-[#F5D5E0] font-bold'
              : 'text-[#F5D5E0]/60 hover:text-[#F5D5E0]'
          }`}
        >
          <div className="relative">
            {user ? (
              <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#7B337E] to-[#6667AB] flex items-center justify-center text-[10px] font-bold text-white border border-[#F5D5E0]/40">
                {user.username.slice(0, 1).toUpperCase()}
              </div>
            ) : (
              <User className="w-5 h-5 transition-transform active:scale-90" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">
            {user ? 'Akun' : 'Masuk'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
