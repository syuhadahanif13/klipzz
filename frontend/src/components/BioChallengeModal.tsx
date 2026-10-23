'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Check, Copy, AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';
import { SocialAccount, SocialPlatform } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

interface BioChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountVerified: (account: SocialAccount) => void;
}

export function BioChallengeModal({ isOpen, onClose, onAccountVerified }: BioChallengeModalProps) {
  const { user } = useAuth();
  const [platform, setPlatform] = useState<SocialPlatform>('tiktok');
  const [handle, setHandle] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [generatedCode, setGeneratedCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const [challengeAccountId, setChallengeAccountId] = useState<string>('');

  if (!isOpen) return null;

  const handleStartChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) {
      setVerificationError('Harap masukkan username atau handle sosmed kamu terlebih dahulu.');
      return;
    }
    if (!user) {
      setVerificationError('Silakan masuk ke akun terlebih dahulu.');
      return;
    }

    setIsVerifying(true);
    setVerificationError(null);

    const cleanHandle = handle.trim().replace(/^@+/, '');

    try {
      const data = await apiFetch<{
        challenge: { id: string; verificationCode: string | null };
        account?: SocialAccount;
        alreadyVerified?: boolean;
      }>('/social/challenge', {
        method: 'POST',
        body: JSON.stringify({ platform, handle: cleanHandle }),
      });

      if (data.alreadyVerified && data.account) {
        onAccountVerified(data.account);
        setStep(3);
        return;
      }

      if (data.challenge?.id && data.challenge.verificationCode) {
        setChallengeAccountId(data.challenge.id);
        setGeneratedCode(data.challenge.verificationCode);
        setStep(2);
      } else {
        throw new Error('Gagal membuat challenge verifikasi.');
      }
    } catch (err: any) {
      console.error('Challenge error:', err);
      setVerificationError(err.message || 'Terjadi kesalahan sistem saat membuat kode unik bio.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    setIsVerifying(true);
    setVerificationError(null);

    try {
      if (!challengeAccountId) {
        throw new Error('Kode verifikasi tidak ditemukan. Silakan minta kode baru.');
      }

      const data = await apiFetch<{ verified: boolean; account: SocialAccount }>('/social/verify', {
        method: 'POST',
        body: JSON.stringify({ accountId: challengeAccountId }),
      });

      if (!data.verified || !data.account) {
        throw new Error('Kode verifikasi belum ditemukan di bio akunmu.');
      }

      setStep(3);
      onAccountVerified(data.account);
    } catch (err: any) {
      console.error('Verify error:', err);
      setVerificationError(
        err.message || 'Kode verifikasi belum terdeteksi di bio. Pastikan kamu sudah menyimpan perubahan bio dan tunggu 1 menit lalu coba lagi.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setHandle('');
    setGeneratedCode('');
    setChallengeAccountId('');
    setVerificationError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl p-6 sm:p-8 bg-[var(--surface)] border border-[var(--line)] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={resetModal}
          className="absolute top-5 right-5 p-1.5 rounded-full text-fg-subtle hover:text-fg hover:bg-[var(--surface-2)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] text-fg border border-[var(--line)] text-xs font-semibold mb-2">
            <span>Anti-Spam Verification</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-fg">
            Verifikasi Kepemilikan Akun
          </h2>
          <p className="text-xs text-fg-muted mt-1 leading-relaxed">
            Pasang kode unik di bio profil media sosialmu agar sistem memverifikasi bahwa akun tersebut adalah milikmu.
          </p>
        </div>

        {/* If user is not logged in */}
        {!user ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-fg">
                Silakan Masuk Terlebih Dahulu
              </h3>
              <p className="text-xs text-fg-muted max-w-sm mx-auto leading-relaxed">
                Untuk menghubungkan akun TikTok atau Instagram dan menyimpan verifikasi ke profil akunmu, silakan masuk ke akunmu terlebih dahulu.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center pt-3">
              <Link
                href="/login"
                onClick={resetModal}
                className="py-2.5 px-6 rounded-full font-bold text-xs bg-white text-black hover:bg-white/90 text-center shadow-md transition-all"
              >
                Masuk Akun
              </Link>
              <Link
                href="/signup"
                onClick={resetModal}
                className="py-2.5 px-6 rounded-full font-semibold text-xs bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-fg border border-[var(--line)] text-center transition-colors"
              >
                Daftar Akun Baru
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* STEP 1: Pilih Platform & Input Handle */}
            {step === 1 && (
              <form onSubmit={handleStartChallenge} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">
                    Pilih Platform
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPlatform('tiktok')}
                      className={`py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
                        platform === 'tiktok'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-[var(--surface-2)] border-[var(--line)] text-fg-muted hover:text-fg'
                      }`}
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>
                      TikTok
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlatform('instagram')}
                      className={`py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
                        platform === 'instagram'
                          ? 'bg-white text-black border-white shadow-md'
                          : 'bg-[var(--surface-2)] border-[var(--line)] text-fg-muted hover:text-fg'
                      }`}
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Instagram Reels
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">
                    Username / Handle
                  </label>
                  <input
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="@username_kamu"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
                    required
                  />
                </div>

                {verificationError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{verificationError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 px-4 rounded-full font-semibold text-sm bg-white text-black hover:bg-white/90 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyiapkan Bio Code...</span>
                    </>
                  ) : (
                    <span>Lanjutkan & Dapatkan Bio Code</span>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: Tampilkan Kode Unik & Verifikasi */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-center">
                  <span className="text-xs text-fg-muted font-medium block mb-1">
                    Kode Verifikasi Khusus ({platform.toUpperCase()}: {handle})
                  </span>
                  <div className="flex items-center justify-center gap-3 my-2">
                    <span className="font-mono text-2xl font-black tracking-widest text-fg bg-[var(--surface-3)] px-4 py-1.5 rounded-xl border border-[var(--line)]">
                      {generatedCode}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-2.5 rounded-xl bg-[var(--surface-3)] hover:bg-white hover:text-black text-fg transition-colors"
                      title="Salin Kode"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[11px] text-amber-400 flex items-center justify-center gap-1">
                    ⏱️ Kode aktif selama 15 menit ke depan
                  </span>
                </div>

                {/* Stepper Guide */}
                <div className="space-y-2 text-xs text-fg-muted">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[10px] font-bold text-fg shrink-0 mt-0.5">1</span>
                    <span>Salin kode <strong className="text-fg">{generatedCode}</strong> di atas.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[10px] font-bold text-fg shrink-0 mt-0.5">2</span>
                    <span>Buka aplikasi <strong>{platform}</strong>, masuk ke Edit Profile, lalu tempel kode ke dalam teks <strong>Bio</strong> profil publik kamu.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-center text-[10px] font-bold text-fg shrink-0 mt-0.5">3</span>
                    <span>Simpan profilmu di {platform}, lalu klik tombol verifikasi di bawah. Sistem Apify Scraper kami akan membaca bio profilmu secara otomatis.</span>
                  </div>
                </div>

                {verificationError && (
                  <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{verificationError}</span>
                  </div>
                )}

                <div className="flex gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-2.5 px-3 rounded-full text-xs font-semibold bg-[var(--surface-2)] text-fg border border-[var(--line)] hover:bg-[var(--surface-3)]"
                  >
                    Ganti Akun
                  </button>
                  <button
                    type="button"
                    onClick={handleVerify}
                    disabled={isVerifying}
                    className="w-2/3 py-2.5 px-4 rounded-full font-bold text-sm bg-white text-black hover:bg-white/90 shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isVerifying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengecek Bio...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Cek Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Sukses Terverifikasi */}
            {step === 3 && (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center mx-auto text-emerald-400">
                  <Check className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-fg">
                    Akun Berhasil Diverifikasi!
                  </h3>
                  <p className="text-xs text-fg-muted mt-1">
                    Akun <strong>{handle}</strong> terbukti milikmu. Kamu sekarang bisa mulai submit klip dan menghasilkan komisi views!
                  </p>
                </div>
                <button
                  onClick={resetModal}
                  className="w-full py-3 px-4 rounded-full font-bold text-sm bg-white text-black hover:bg-white/90 shadow-md transition-all"
                >
                  Mulai Gunting Klip
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
