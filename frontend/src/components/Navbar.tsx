'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scissors,
  Flame,
  Trophy,
  UserCheck,
  PlusCircle,
  ShieldCheck,
  LogOut,
  User,
  ChevronDown,
  Wallet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenBioChallenge?: () => void;
  onOpenCreateCampaign?: () => void;
}

export function Navbar({ onOpenBioChallenge, onOpenCreateCampaign }: NavbarProps) {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const navLink = (href: string, label: string) => {
    const active = pathname === href;
    return (
      <Link
        href={href}
        className={`rounded-full px-3 py-2 text-[0.9375rem] transition-colors outline-none ${
          active
            ? 'bg-[var(--surface-2)] text-fg'
            : 'text-fg-muted hover:bg-[var(--surface-2)] hover:text-fg'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 transition-[top] duration-300">
      <div className="header-blur transition-colors duration-200">
        {/* Full-width nav — persis TernakKlip: px-5 sm:px-[4vw] */}
        <div className="w-full px-5 sm:px-[4vw] flex h-[4.4375rem] items-center gap-5">

          {/* Logo */}
          <Link href="/" aria-label="klipzz.vid" className="shrink-0 flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center group-hover:opacity-90 transition-opacity">
              <Scissors className="w-4 h-4 text-white -rotate-45" />
            </div>
            <span className="font-bold text-[1rem] text-fg tracking-tight hidden sm:block">
              klipzz<span className="text-[var(--accent)]">.vid</span>
            </span>
          </Link>

          {/* Desktop Nav links */}
          <nav aria-label="Main" className="relative hidden lg:block">
            <ul className="flex items-center gap-0.5">
              <li>{navLink('/', 'Discover')}</li>
              <li>{navLink('/dashboard', isAdmin ? 'Admin Portal' : 'Clipper Studio')}</li>
              <li>{navLink('/leaderboard', 'Leaderboard')}</li>
            </ul>
          </nav>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-2">
            {loading ? (
              // Avoid flashing "Masuk / Daftar Gratis" while the session is
              // still being restored. That flash looks like a sudden logout.
              <div
                className="h-9 w-24 rounded-full bg-[var(--surface-2)] animate-pulse"
                aria-label="Memuat sesi"
              />
            ) : user ? (
              <>
                {/* Bio verify (clipper) */}
                {!isAdmin && onOpenBioChallenge && (
                  <button
                    onClick={onOpenBioChallenge}
                    title="Verifikasi Akun TikTok/Instagram"
                    className="hidden lg:flex items-center gap-1.5 rounded-full px-3 h-9 text-[0.875rem] font-medium text-fg-muted hover:bg-[var(--surface-2)] hover:text-fg transition-colors"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Verifikasi Bio</span>
                  </button>
                )}

                {/* Create campaign (admin) */}
                {isAdmin && onOpenCreateCampaign && (
                  <button
                    onClick={onOpenCreateCampaign}
                    className="flex items-center gap-1.5 rounded-full px-4 h-9 text-[0.875rem] font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Buat Campaign</span>
                  </button>
                )}

                {/* Wallet (clipper) */}
                {!isAdmin && (
                  <Link
                    href="/dashboard"
                    className="hidden sm:flex items-center gap-1.5 rounded-full px-3 h-9 text-[0.875rem] font-medium border border-[var(--line)] hover:border-[var(--line-hover)] hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <Wallet className="w-4 h-4 text-[var(--cpm)]" />
                    <span className="font-mono text-[0.8125rem] font-bold text-[var(--cpm)]">
                      Rp {Number(user?.balance || 0).toLocaleString('id-ID')}
                    </span>
                  </Link>
                )}

                {/* Avatar dropdown */}
                <div ref={dropdownRef} className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-1 p-1 rounded-full hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <img
                      src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
                      alt={user?.full_name || user?.username || 'User'}
                      className="w-8 h-8 rounded-full border border-[var(--line)] object-cover"
                    />
                    <ChevronDown className={`w-3.5 h-3.5 text-fg-muted transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-1.5 shadow-xl space-y-0.5 z-50">
                      <div className="px-3 py-2 border-b border-[var(--line)]">
                        <span className="font-semibold text-[0.8125rem] text-fg block truncate">
                          {user?.full_name || user?.username || 'Kreator'}
                        </span>
                        <span className="text-[0.75rem] text-fg-subtle block truncate">
                          @{user?.username || 'user'} ·{' '}
                          <span className="capitalize text-[var(--accent)] font-semibold">{user?.role || 'clipper'}</span>
                        </span>
                      </div>

                      <Link
                        href="/dashboard"
                        onClick={() => setMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[0.8125rem] font-medium text-fg-muted hover:bg-[var(--surface-2)] hover:text-fg transition-colors"
                      >
                        <User className="w-3.5 h-3.5" />
                        {isAdmin ? 'Admin Portal' : 'Clipper Studio'}
                      </Link>

                      <button
                        onClick={() => { setMenuOpen(false); signOut(); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[0.8125rem] font-medium text-rose-400 hover:bg-rose-950/40 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Keluar
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Guest */
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="inline-flex shrink-0 items-center justify-center rounded-full font-medium text-fg-muted hover:bg-[var(--surface-2)] hover:text-fg h-9 px-4 text-[0.875rem] transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] h-9 px-4 text-[0.875rem] transition-colors"
                >
                  Daftar Gratis
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
