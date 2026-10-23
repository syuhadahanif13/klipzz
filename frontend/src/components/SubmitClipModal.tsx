'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Send, Hash, CheckCircle2, AlertCircle, Sparkles, Link2 } from 'lucide-react';
import { Campaign, SocialAccount, Submission } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/api';

interface SubmitClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  socialAccounts: SocialAccount[];
  onSubmitSuccess: (newSub: Submission) => void;
  onOpenBioChallenge: () => void;
  /** Override when this modal is opened from another modal. */
  zIndexClass?: string;
}

export function SubmitClipModal({
  isOpen,
  onClose,
  campaign,
  socialAccounts,
  onSubmitSuccess,
  onOpenBioChallenge,
  zIndexClass = 'z-50',
}: SubmitClipModalProps) {
  const { user } = useAuth();
  const [postUrl, setPostUrl] = useState('');
  const accountsList = Array.isArray(socialAccounts) ? socialAccounts : [];
  const verifiedAccounts = accountsList.filter((a) => a && a.is_verified);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (verifiedAccounts.length > 0 && (!selectedAccountId || !verifiedAccounts.some((a) => a.id === selectedAccountId))) {
      setSelectedAccountId(verifiedAccounts[0].id);
    }
  }, [socialAccounts]);

  if (!isOpen || !campaign) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postUrl.trim()) return;

    if (!user) {
      setErrorMsg('Kamu harus masuk / login terlebih dahulu untuk menyetor klip.');
      return;
    }

    if (verifiedAccounts.length === 0) {
      setErrorMsg('Kamu harus memverifikasi minimal 1 akun sosial media terlebih dahulu.');
      return;
    }

    let host = '';
    try {
      host = new URL(postUrl).hostname.toLowerCase().replace(/^www\./, '');
    } catch {
      host = '';
    }
    const isTikTok = host === 'tiktok.com' || host.endsWith('.tiktok.com');
    const isInstagram = host === 'instagram.com' || host.endsWith('.instagram.com');

    if (!isTikTok && !isInstagram) {
      setErrorMsg('Format URL tidak didukung. Masukkan link video dari TikTok atau Instagram Reels.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const selectedAcc =
        socialAccounts.find((a) => a.id === selectedAccountId) || verifiedAccounts[0];

      if (!selectedAcc) {
        throw new Error('Pilih akun sosial media terverifikasi terlebih dahulu.');
      }

      const data = await apiFetch<{ submission: Submission; missingHashtags: string[] }>(
        '/submissions',
        {
          method: 'POST',
          body: JSON.stringify({
            campaignId: campaign.id,
            socialAccountId: selectedAcc.id,
            postUrl: postUrl.trim(),
          }),
        }
      );

      const createdSubmission: Submission = {
        ...data.submission,
        campaign: data.submission.campaign || {
          id: campaign.id,
          title: campaign.title,
          channel_name: campaign.channel_name,
          episode_guest: campaign.episode_guest,
          rate_per_1k_views: campaign.rate_per_1k_views,
        },
      };

      onSubmitSuccess(createdSubmission);

      if (data.missingHashtags?.length > 0) {
        setErrorMsg(
          `Klip tersimpan, tetapi statusnya pending karena hashtag belum lengkap: ${data.missingHashtags.join(', ')}`
        );
      } else {
        onClose();
        setPostUrl('');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim klip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 ${zIndexClass} flex items-center justify-center p-4 bg-black/75 backdrop-blur-md`}>
      <div className="relative w-full max-w-lg rounded-2xl p-6 sm:p-8 bg-[var(--surface)] border border-[var(--line)] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-fg-subtle hover:text-fg hover:bg-[var(--surface-2)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] text-fg border border-[var(--line)] text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
            Setor Konten Klip
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-fg">
            Submit URL Klip Video
          </h2>
          <p className="text-xs text-fg-muted mt-1 line-clamp-1">
            Episode: <strong className="text-fg">{campaign.title}</strong>
          </p>
        </div>

        {!user ? (
          <div className="p-5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-xs space-y-3 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--surface-3)] flex items-center justify-center text-amber-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="font-bold text-sm text-fg">
              Silakan Masuk / Login Terlebih Dahulu
            </div>
            <p className="text-fg-muted max-w-sm mx-auto">
              Kamu perlu masuk ke akun klipzz.vid kamu untuk menyetor klip dan melacak views serta pencairan komisi otomatis.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Link
                href="/login"
                onClick={onClose}
                className="py-2.5 px-5 rounded-full font-bold bg-white text-black hover:bg-white/90 shadow-md"
              >
                Masuk Akun
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="py-2.5 px-5 rounded-full font-semibold bg-[var(--surface-3)] text-fg border border-[var(--line)]"
              >
                Daftar Baru
              </Link>
            </div>
          </div>
        ) : verifiedAccounts.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Belum Ada Akun Sosmed Terverifikasi</span>
            </div>
            <p className="text-amber-200/80">
              Untuk mencegah spam dan kecurangan statistik, kamu harus memverifikasi akun TikTok atau Instagram Reels terlebih dahulu dengan menaruh Bio Code unik.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBioChallenge();
              }}
              className="w-full py-2.5 px-3 rounded-full font-bold bg-white text-black hover:bg-white/90 transition-colors shadow-md"
            >
              Verifikasi Akun Sekarang
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pilih Akun Sosmed Pengunggah */}
            <div>
              <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">
                Pilih Akun Terverifikasi
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
              >
                {verifiedAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.platform.toUpperCase()} - {acc.handle} ({Number(acc.follower_count || 0).toLocaleString('id-ID')} followers)
                  </option>
                ))}
              </select>
            </div>

            {/* Input URL Video */}
            <div>
              <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-2">
                URL Video (TikTok / Reels)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@username/video/..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-[var(--accent)] transition-colors text-sm"
                  required
                />
                <Link2 className="w-4 h-4 text-fg-subtle absolute left-3.5 top-3" />
              </div>
            </div>

            {/* Checklist Syarat Hashtag */}
            <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] space-y-2">
              <span className="text-xs font-bold text-fg flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[var(--accent)]" />
                Hashtag Wajib di Postingan:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(campaign.hashtag_requirements || []).map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-[var(--surface-3)] border border-[var(--line)] text-xs font-medium text-fg"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-fg-subtle">
                Sistem Apify Scraper akan memvalidasi apakah hashtag di atas ada pada caption postinganmu.
              </p>
            </div>

            {/* Reward Rate Info */}
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--line)]">
              <span className="text-fg-muted">Tarif Komisi:</span>
              <span className="font-bold text-[var(--cpm)]">
                Rp {Number(campaign.rate_per_1k_views || 0).toLocaleString('id-ID')} / 1.000 Views
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-full font-semibold text-sm bg-white text-black hover:bg-white/90 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Mengambil Data Views Video...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim & Mulai Lacak Komisi</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
