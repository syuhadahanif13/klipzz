'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Scissors,
  Wallet,
  Trophy,
  Flame,
  UserCheck,
  PlusCircle,
  ShieldCheck,
  LogIn,
  LogOut,
  User,
  ChevronDown,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenBioChallenge?: () => void;
  onOpenCreateCampaign?: () => void;
}

export function Navbar({
  onOpenBioChallenge,
  onOpenCreateCampaign,
}: NavbarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-[#7B337E]/30 bg-[#210635]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7B337E] to-[#6667AB] flex items-center justify-center shadow-moon-glow group-hover:scale-105 transition-transform duration-200">
              <Scissors className="w-5 h-5 text-[#F5D5E0] -rotate-45" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight text-[#F5D5E0] flex items-center">
                klipzz<span className="text-[#6667AB]">.vid</span>
              </span>
              <span className="text-[11px] text-[#F5D5E0]/60 -mt-1 font-medium">
                Official Clipping Platform
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname === '/'
                  ? 'bg-[#7B337E]/30 text-[#F5D5E0] border border-[#7B337E]/50'
                  : 'text-[#F5D5E0]/70 hover:text-[#F5D5E0] hover:bg-[#420D4B]/40'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#6667AB]" />
                Campaigns
              </span>
            </Link>

            <Link
              href="/dashboard"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname === '/dashboard'
                  ? 'bg-[#7B337E]/30 text-[#F5D5E0] border border-[#7B337E]/50'
                  : 'text-[#F5D5E0]/70 hover:text-[#F5D5E0] hover:bg-[#420D4B]/40'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-[#7B337E]" />
                {isAdmin ? 'Admin Portal' : 'Clipper Studio'}
              </span>
            </Link>

            <Link
              href="/leaderboard"
              className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                pathname === '/leaderboard'
                  ? 'bg-[#7B337E]/30 text-[#F5D5E0] border border-[#7B337E]/50'
                  : 'text-[#F5D5E0]/70 hover:text-[#F5D5E0] hover:bg-[#420D4B]/40'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                Leaderboard
              </span>
            </Link>
          </nav>
        </div>

        {/* Right Action Area */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {user ? (
            <>
              {/* Clipper Action: Bio Verification */}
              {!isAdmin && onOpenBioChallenge && (
                <button
                  onClick={onOpenBioChallenge}
                  className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#420D4B] text-[#F5D5E0] border border-[#7B337E]/50 hover:border-[#F5D5E0]/50 transition-all shadow-sm"
                  title="Verifikasi Akun TikTok/Instagram dengan Bio Code"
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#6667AB]" />
                  <span>Verifikasi Bio</span>
                </button>
              )}

              {/* Admin Action: Create New Campaign */}
              {isAdmin && onOpenCreateCampaign && (
                <button
                  onClick={onOpenCreateCampaign}
                  className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-90 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Buat Campaign</span>
                </button>
              )}

              {/* Clipper Wallet Balance Pill */}
              {!isAdmin && (
                <Link
                  href="/dashboard"
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-[#420D4B]/80 border border-[#7B337E]/40 shadow-inner hover:border-emerald-400/40 transition-colors"
                >
                  <div className="w-5 h-5 rounded-md bg-[#7B337E]/40 flex items-center justify-center">
                    <Wallet className="w-3 h-3 text-emerald-400" />
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] text-[#F5D5E0]/60 font-medium leading-none">Dompet</span>
                    <span className="text-xs font-bold text-emerald-400 leading-tight">
                      Rp {Number(user?.balance || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </Link>
              )}

              {/* Role Indicator Badge (Static / Production) */}
              <div
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#210635] text-[#F5D5E0]/80 border border-[#6667AB]/40 shadow-inner"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#6667AB]" />
                <span className="hidden sm:inline">Role:</span>
                <span className={`capitalize font-bold ${isAdmin ? 'text-amber-400' : 'text-[#F5D5E0]'}`}>
                  {user?.role || 'clipper'}
                </span>
              </div>

              {/* User Avatar with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-[#420D4B]/60 transition-colors"
                >
                  <img
                    src={user?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'}
                    alt={user?.full_name || user?.username || 'User'}
                    className="w-9 h-9 rounded-xl border border-[#7B337E]/60 object-cover"
                  />
                  <ChevronDown className="w-3.5 h-3.5 text-[#F5D5E0]/60" />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-48 glass-card rounded-2xl p-2 border border-[#7B337E]/50 shadow-moon-glow space-y-1 z-50">
                    <div className="px-3 py-2 border-b border-[#7B337E]/30">
                      <span className="font-bold text-xs text-[#F5D5E0] block truncate">
                        {user?.full_name || user?.username || 'Kreator'}
                      </span>
                      <span className="text-[10px] text-[#6667AB] block truncate">
                        @{user?.username || 'user'} • <span className="capitalize text-amber-300 font-semibold">{user?.role || 'clipper'}</span>
                      </span>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#F5D5E0] hover:bg-[#420D4B] transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-[#6667AB]" />
                      <span>{isAdmin ? 'Admin Portal' : 'Clipper Studio'}</span>
                    </Link>

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-300 hover:bg-rose-950/40 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Guest Experience */
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#F5D5E0] hover:bg-[#420D4B]/60 border border-[#7B337E]/40 transition-colors"
              >
                Masuk
              </Link>

              <Link
                href="/signup"
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-95 transition-opacity"
              >
                Daftar Akun
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
