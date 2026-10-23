'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, Lock, Mail, User, ArrowRight, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !username) return;

    setLoading(true);
    setErrorMessage(null);
    setNoticeMessage(null);

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

    const res = await signUp(email, password, cleanUsername, fullName || cleanUsername, 'clipper');
    setLoading(false);

    if (res.success && res.needsEmailConfirmation) {
      setNoticeMessage(
        'Akun berhasil dibuat. Cek email kamu untuk konfirmasi sebelum masuk.'
      );
    } else if (res.success) {
      router.push('/dashboard');
    } else {
      setErrorMessage(res.error || 'Pendaftaran gagal. Silakan coba kembali.');
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
          Buat Akun & Mulai Menghasilkan dari Konten Klip Video
        </p>
      </div>

      {/* Signup Card */}
      <div className="w-full max-w-lg rounded-2xl p-6 sm:p-8 bg-[var(--surface)] border border-[var(--line)] shadow-xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-fg">
            Daftar Akun Clipper
          </h1>
          <p className="text-xs text-fg-muted mt-1">
            Mulai potong video, upload ke medsos, dan cairkan komisimu.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {noticeMessage && (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-fg-muted mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Fajar Ramadhan"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg placeholder:text-fg-subtle text-sm focus:outline-none focus:border-[var(--accent)]"
                  required
                />
                <User className="w-4 h-4 text-fg-subtle absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg-muted mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="fajar_clipper"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg placeholder:text-fg-subtle text-sm focus:outline-none focus:border-[var(--accent)]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-muted mb-1.5">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg placeholder:text-fg-subtle text-sm focus:outline-none focus:border-[var(--accent)]"
                required
              />
              <Mail className="w-4 h-4 text-fg-subtle absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-muted mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg placeholder:text-fg-subtle text-sm focus:outline-none focus:border-[var(--accent)]"
                required
                minLength={6}
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
                <span>Mendaftarkan Akun...</span>
              </>
            ) : (
              <>
                <span>Buat Akun Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-fg-muted pt-2 border-t border-[var(--line)]">
          Sudah memiliki akun?{' '}
          <Link href="/login" className="font-semibold text-white hover:underline">
            Masuk di Sini
          </Link>
        </div>
      </div>
    </div>
  );
}
