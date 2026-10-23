'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, Lock, User, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);

    const res = await signIn(identifier, password);
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setErrorMessage(res.error || 'Username/email atau kata sandi tidak valid.');
    }
  };

  return (
    <div className="min-h-screen surface-app flex flex-col justify-center items-center px-4 py-12 relative antialiased">
      {/* Brand Header */}
      <div className="mb-6 text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center group-hover:scale-105 transition-transform">
            <Scissors className="w-5 h-5 text-white -rotate-45" />
          </div>
          <span className="text-xl font-bold tracking-tight text-fg">
            klipzz<span className="text-[var(--accent)]">.vid</span>
          </span>
        </Link>
        <p className="text-xs text-fg-muted">
          Official Clipping Platform • @DipanggilKeRuangan Hub
        </p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-2xl p-6 sm:p-8 bg-[var(--surface)] border border-[var(--line)] shadow-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-fg">
            Masuk ke Akun
          </h1>
          <p className="text-xs text-fg-muted mt-1">
            Gunakan kredensial akun terdaftar untuk mengakses platform.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg-muted text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-[var(--accent)]" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-fg-muted mb-1.5">
              Username atau Email
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="nama@email.com atau username"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg placeholder:text-fg-subtle text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                required
              />
              <User className="w-4 h-4 text-fg-subtle absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-fg-muted">
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={() => setInfoMessage('Untuk reset kata sandi, hubungi admin komunitas resmi di info@klipzz.vid atau via grup komunitas.')}
                className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
              >
                Lupa sandi?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg placeholder:text-fg-subtle text-sm focus:outline-none focus:border-[var(--accent)] transition-colors"
                required
              />
              <Lock className="w-4 h-4 text-fg-subtle absolute left-3.5 top-3" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-fg-subtle hover:text-fg"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-full font-semibold text-sm bg-white text-black hover:bg-white/90 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
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

        {/* Footer Link */}
        <div className="text-center text-xs text-fg-muted pt-2 border-t border-[var(--line)]">
          Belum punya akun?{' '}
          <Link href="/signup" className="font-semibold text-white hover:underline">
            Daftar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
