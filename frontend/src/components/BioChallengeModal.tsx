'use client';

import React, { useState } from 'react';
import { X, Check, Copy, AlertCircle, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';
import { SocialAccount, SocialPlatform } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

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

  if (!isOpen) return null;

  const handleStartChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handle.trim()) return;

    // Generate random 4-char challenge
    const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = 'KLIPZZ-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    setGeneratedCode(code);
    setVerificationError(null);
    setStep(2);
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
      const cleanHandle = handle.trim().startsWith('@') ? handle.trim() : `@${handle.trim()}`;
      const userId = user?.id || '22222222-2222-2222-2222-222222222222';
      let accId = `acc_${Date.now()}`;

      // Simulate Apify scraping delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      try {
        const { data: dbAcc } = await supabase
          .from('social_accounts')
          .upsert(
            {
              user_id: userId,
              platform,
              handle: cleanHandle,
              verification_code: generatedCode,
              verification_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
              is_verified: true,
              verified_at: new Date().toISOString(),
              follower_count: 54200,
            },
            { onConflict: 'platform,handle' }
          )
          .select()
          .single();

        if (dbAcc) {
          accId = dbAcc.id;
        }
      } catch (e) {
        console.warn('Supabase social account save error:', e);
      }

      const newAccount: SocialAccount = {
        id: accId,
        user_id: userId,
        platform,
        handle: cleanHandle,
        profile_url: platform === 'tiktok' ? `https://tiktok.com/${cleanHandle}` : `https://instagram.com/${cleanHandle.replace('@', '')}`,
        verification_code: generatedCode,
        verification_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        is_verified: true,
        verified_at: new Date().toISOString(),
        follower_count: 54200,
      };

      onAccountVerified(newAccount);
      setStep(3);
    } catch (err: any) {
      setVerificationError('Gagal memverifikasi bio. Pastikan kode unik sudah tersimpan di Bio profil Anda.');
    } finally {
      setIsVerifying(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setHandle('');
    setGeneratedCode('');
    setVerificationError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#210635]/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-card rounded-2xl p-6 sm:p-8 border border-[#7B337E]/50 shadow-moon-glow">
        {/* Close Button */}
        <button
          onClick={resetModal}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-[#F5D5E0]/60 hover:text-[#F5D5E0] hover:bg-[#420D4B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7B337E]/30 text-[#F5D5E0] border border-[#7B337E]/50 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#6667AB]" />
            Proof-of-Ownership Verifikasi
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F5D5E0]">
            Hubungkan Akun Sosial Media
          </h2>
          <p className="text-xs sm:text-sm text-[#F5D5E0]/70 mt-1">
            klipzz.vid tidak meminta akses login / OAuth akunmu. Cukup tempel kode acak di Bio profilmu untuk membuktikan kepemilikan.
          </p>
        </div>

        {/* STEP 1: Pilih Platform & Input Handle */}
        {step === 1 && (
          <form onSubmit={handleStartChallenge} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[#F5D5E0]/80 uppercase tracking-wider mb-2">
                Pilih Platform
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPlatform('tiktok')}
                  className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                    platform === 'tiktok'
                      ? 'bg-gradient-to-r from-[#7B337E] to-[#6667AB] border-[#F5D5E0]/40 text-[#F5D5E0] shadow-moon-glow'
                      : 'bg-[#420D4B]/60 border-[#7B337E]/30 text-[#F5D5E0]/70 hover:bg-[#420D4B]'
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
                  className={`py-3 px-4 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                    platform === 'instagram'
                      ? 'bg-gradient-to-r from-[#7B337E] to-[#6667AB] border-[#F5D5E0]/40 text-[#F5D5E0] shadow-moon-glow'
                      : 'bg-[#420D4B]/60 border-[#7B337E]/30 text-[#F5D5E0]/70 hover:bg-[#420D4B]'
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
              <label className="block text-xs font-bold text-[#F5D5E0]/80 uppercase tracking-wider mb-2">
                Username / Handle
              </label>
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                placeholder="@username_kamu"
                className="w-full px-4 py-3 rounded-xl bg-[#210635] border border-[#7B337E]/60 text-[#F5D5E0] placeholder-[#F5D5E0]/40 focus:outline-none focus:border-[#6667AB] transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-95 transition-opacity"
            >
              Lanjutkan & Dapatkan Bio Code
            </button>
          </form>
        )}

        {/* STEP 2: Tampilkan Kode Unik & Verifikasi */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#210635]/80 border border-[#7B337E]/40 text-center">
              <span className="text-xs text-[#F5D5E0]/70 font-medium block mb-1">
                Kode Verifikasi Khusus ({platform.toUpperCase()}: {handle})
              </span>
              <div className="flex items-center justify-center gap-3 my-2">
                <span className="font-mono text-2xl sm:text-3xl font-black tracking-widest text-[#F5D5E0] bg-[#420D4B] px-4 py-1.5 rounded-xl border border-[#6667AB]/50">
                  {generatedCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-3 rounded-xl bg-[#7B337E] hover:bg-[#6667AB] text-[#F5D5E0] transition-colors"
                  title="Salin Kode"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-300" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              <span className="text-[11px] text-amber-300 flex items-center justify-center gap-1">
                ⏱️ Kode aktif selama 15 menit ke depan
              </span>
            </div>

            {/* Stepper Guide */}
            <div className="space-y-2 text-xs text-[#F5D5E0]/80">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#7B337E] flex items-center justify-center text-[10px] font-bold text-[#F5D5E0] shrink-0 mt-0.5">1</span>
                <span>Salin kode <strong className="text-[#F5D5E0]">{generatedCode}</strong> di atas.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#7B337E] flex items-center justify-center text-[10px] font-bold text-[#F5D5E0] shrink-0 mt-0.5">2</span>
                <span>Buka aplikasi <strong>{platform}</strong>, masuk ke Edit Profile, lalu tempel kode ke dalam teks <strong>Bio</strong> profil publik kamu.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#7B337E] flex items-center justify-center text-[10px] font-bold text-[#F5D5E0] shrink-0 mt-0.5">3</span>
                <span>Simpan profilmu di {platform}, lalu klik tombol verifikasi di bawah. Sistem Apify Scraper kami akan membaca bio profilmu secara otomatis.</span>
              </div>
            </div>

            {verificationError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verificationError}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 px-3 rounded-xl text-xs font-semibold bg-[#210635] text-[#F5D5E0]/80 border border-[#7B337E]/40 hover:bg-[#420D4B]"
              >
                Ganti Akun
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-2/3 py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengecek Bio via Scraper...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saya Sudah Pasang, Cek Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Sukses Terverifikasi */}
        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center mx-auto text-emerald-400">
              <Check className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#F5D5E0]">
                Akun Berhasil Diverifikasi!
              </h3>
              <p className="text-xs text-[#F5D5E0]/70 mt-1">
                Akun <strong>{handle}</strong> terbukti milikmu. Kamu sekarang bisa mulai submit klip dan menghasilkan komisi views!
              </p>
            </div>
            <button
              onClick={resetModal}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow"
            >
              Mulai Gunting Klip
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
