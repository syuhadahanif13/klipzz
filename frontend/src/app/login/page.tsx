'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, Lock, Mail, ArrowRight, Eye, EyeOff, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);
    setErrorMessage(null);

    const res = await signIn(email, password);
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setErrorMessage(res.error || 'Email atau kata sandi tidak valid.');
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    setErrorMessage(null);

    const res = await signIn(demoEmail, 'password123');
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#210635] text-[#F5D5E0] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Neon Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#7B337E]/25 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#6667AB]/20 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-8 text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7B337E] to-[#6667AB] flex items-center justify-center shadow-moon-glow group-hover:scale-105 transition-transform">
            <Scissors className="w-6 h-6 text-[#F5D5E0] -rotate-45" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#F5D5E0]">
            klipzz<span className="text-[#6667AB]">.vid</span>
          </span>
        </Link>
        <p className="text-xs text-[#F5D5E0]/70">
          Platform Resmi Clipping Campaign & Monetisasi Video
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md glass-card rounded-3xl p-6 sm:p-8 border border-[#7B337E]/50 shadow-moon-glow space-y-6">
        <div>
          <h1 className="text-2xl font-black text-[#F5D5E0]">
            Masuk ke Akun
          </h1>
          <p className="text-xs text-[#F5D5E0]/70 mt-1">
            Akses dashboard pembuat klip atau kelola kampanye podcast.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#F5D5E0]/80 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#210635] border border-[#7B337E]/60 text-[#F5D5E0] placeholder-[#F5D5E0]/40 text-sm focus:outline-none focus:border-[#6667AB] transition-colors"
                required
              />
              <Mail className="w-4 h-4 text-[#F5D5E0]/40 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#F5D5E0]/80 uppercase tracking-wider">
                Kata Sandi
              </label>
              <span className="text-[11px] text-[#6667AB] hover:underline cursor-pointer">
                Lupa sandi?
              </span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-3 rounded-xl bg-[#210635] border border-[#7B337E]/60 text-[#F5D5E0] placeholder-[#F5D5E0]/40 text-sm focus:outline-none focus:border-[#6667AB] transition-colors"
                required
              />
              <Lock className="w-4 h-4 text-[#F5D5E0]/40 absolute left-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-[#F5D5E0]/40 hover:text-[#F5D5E0]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-95 flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memproses Masuk...</span>
              </>
            ) : (
              <>
                <span>Masuk Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins for Instant Testing */}
        <div className="pt-2 border-t border-[#7B337E]/30 space-y-2">
          <span className="text-[11px] text-[#F5D5E0]/60 block text-center">
            Akses Cepat (Akun Demo)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('fajar@klipzz.vid')}
              className="py-2 px-2.5 rounded-xl text-[11px] font-semibold bg-[#210635] hover:bg-[#420D4B] text-[#F5D5E0] border border-[#7B337E]/40 text-center transition-colors"
            >
              Demo Clipper (Fajar)
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('brand@dipanggilkeruangan.com')}
              className="py-2 px-2.5 rounded-xl text-[11px] font-semibold bg-[#210635] hover:bg-[#420D4B] text-[#F5D5E0] border border-[#7B337E]/40 text-center transition-colors"
            >
              Demo Brand (Official)
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-[#F5D5E0]/70 pt-2">
          Belum punya akun?{' '}
          <Link href="/signup" className="font-bold text-[#6667AB] hover:text-[#F5D5E0] underline">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
