'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Flame,
  Scissors,
  Trophy,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  onOpenSubmit?: () => void;
  onOpenBioChallenge?: () => void;
}

export function BottomNav({ onOpenSubmit }: BottomNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  const isHome = pathname === '/';
  const isDashboard = pathname === '/dashboard';
  const isLeaderboard = pathname === '/leaderboard';
  const isCampaign = pathname?.startsWith('/campaign');
  const isAuthPage = pathname === '/login' || pathname === '/signup';

  if (isAuthPage) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[var(--surface)]/95 backdrop-blur-xl border-t border-[var(--line)] px-2 pt-1 pb-[calc(env(safe-area-inset-bottom)+8px)] transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around relative">
        {/* TAB 1: BERANDA */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            isHome && !isCampaign
              ? 'text-fg font-bold'
              : 'text-fg-muted hover:text-fg'
          }`}
        >
          <div className="relative">
            <Home className="w-5 h-5 transition-transform active:scale-90" />
            {isHome && !isCampaign && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Beranda</span>
        </Link>

        {/* TAB 2: CAMPAIGN / EKSPLORASI */}
        <Link
          href="/#campaigns-section"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            isCampaign
              ? 'text-fg font-bold'
              : 'text-fg-muted hover:text-fg'
          }`}
        >
          <div className="relative">
            <Flame className="w-5 h-5 transition-transform active:scale-90" />
            {isCampaign && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Campaign</span>
        </Link>

        {/* TAB 3: TOMBOL UTAMA (GUNTING / SETOR KLIP) */}
        <div className="relative -top-3.5 flex flex-col items-center">
          <button
            onClick={() => {
              if (onOpenSubmit) {
                onOpenSubmit();
              } else {
                router.push('/#campaigns-section');
              }
            }}
            className="w-14 h-14 p-3.5 rounded-full bg-white text-black shadow-lg border border-[var(--line)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all group"
            aria-label="Setor Klip"
          >
            <Scissors className="w-5 h-5 -rotate-45 text-black group-hover:rotate-0 transition-transform" />
          </button>
          <span className="text-[10px] font-bold text-fg mt-0.5 tracking-tight">
            Klip
          </span>
        </div>

        {/* TAB 4: LEADERBOARD / PERINGKAT */}
        <Link
          href="/leaderboard"
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            isLeaderboard
              ? 'text-fg font-bold'
              : 'text-fg-muted hover:text-fg'
          }`}
        >
          <div className="relative">
            <Trophy className="w-5 h-5 transition-transform active:scale-90 text-amber-400" />
            {isLeaderboard && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Top Rank</span>
        </Link>

        {/* TAB 5: AKUN / STUDIO */}
        <Link
          href={user ? '/dashboard' : '/login'}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            isDashboard
              ? 'text-fg font-bold'
              : 'text-fg-muted hover:text-fg'
          }`}
        >
          <div className="relative">
            {user ? (
              <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center text-[10px] font-bold text-white border border-[var(--line)]">
                {(user?.username || 'U').slice(0, 1).toUpperCase()}
              </div>
            ) : (
              <User className="w-5 h-5 transition-transform active:scale-90" />
            )}
            {isDashboard && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">
            {user ? 'Studio' : 'Masuk'}
          </span>
        </Link>
      </div>
    </nav>
  );
}
