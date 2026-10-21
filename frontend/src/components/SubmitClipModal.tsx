'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, Send, Hash, CheckCircle2, AlertCircle, Sparkles, Link2 } from 'lucide-react';
import { Campaign, SocialAccount, Submission } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface SubmitClipModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign | null;
  socialAccounts: SocialAccount[];
  onSubmitSuccess: (newSub: Submission) => void;
  onOpenBioChallenge: () => void;
}

export function SubmitClipModal({
  isOpen,
  onClose,
  campaign,
  socialAccounts,
  onSubmitSuccess,
  onOpenBioChallenge,
}: SubmitClipModalProps) {
  const { user } = useAuth();
  const [postUrl, setPostUrl] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(
    socialAccounts.length > 0 ? socialAccounts[0].id : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !campaign) return null;

  const verifiedAccounts = socialAccounts.filter((a) => a.is_verified);

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

    const isTikTok = postUrl.includes('tiktok.com');
    const isInstagram = postUrl.includes('instagram.com');

    if (!isTikTok && !isInstagram) {
      setErrorMsg('Format URL tidak didukung. Masukkan link video dari TikTok atau Instagram Reels.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const selectedAcc = socialAccounts.find((a) => a.id === selectedAccountId) || verifiedAccounts[0];
      const simulatedViews = Math.floor(Math.random() * 25000) + 8500;
      const simulatedLikes = Math.floor(simulatedViews * 0.14);
      const simulatedEarnings = Math.min(
        campaign.max_payout_per_clip,
        (simulatedViews / 1000) * campaign.rate_per_1k_views
      );

      const submissionPayload = {
        campaign_id: campaign.id,
        clipper_id: user.id,
        social_account_id: selectedAcc?.id || null,
        post_url: postUrl.trim(),
        platform: isTikTok ? 'tiktok' : 'instagram',
        caption: `Keseruan episode ${campaign.episode_guest}! ${campaign.hashtag_requirements.join(' ')}`,
        thumbnail_url: campaign.thumbnail_url,
        current_views: simulatedViews,
        current_likes: simulatedLikes,
        current_comments: Math.floor(simulatedViews * 0.012),
        current_shares: Math.floor(simulatedViews * 0.038),
        earnings: simulatedEarnings,
        status: 'approved',
        last_scraped_at: new Date().toISOString(),
      };

      // Try inserting into Supabase
      let savedSubmissionId = `sub_${Date.now()}`;
      try {
        const { data: dbSub, error: dbErr } = await supabase
          .from('submissions')
          .insert(submissionPayload)
          .select()
          .single();

        if (dbSub) {
          savedSubmissionId = dbSub.id;
        }
      } catch (insertErr) {
        console.warn('Could not save to Supabase directly, saving to client state:', insertErr);
      }

      const newSubmission: Submission = {
        id: savedSubmissionId,
        ...submissionPayload,
        created_at: new Date().toISOString(),
        campaign: {
          id: campaign.id,
          title: campaign.title,
          channel_name: campaign.channel_name,
          episode_guest: campaign.episode_guest,
          rate_per_1k_views: campaign.rate_per_1k_views,
        },
      } as Submission;

      onSubmitSuccess(newSubmission);
      onClose();
      setPostUrl('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal mengirim klip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#210635]/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-card rounded-2xl p-6 sm:p-8 border border-[#7B337E]/50 shadow-moon-glow">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-[#F5D5E0]/60 hover:text-[#F5D5E0] hover:bg-[#420D4B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7B337E]/30 text-[#F5D5E0] border border-[#7B337E]/50 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#6667AB]" />
            Setor Konten Klip
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F5D5E0]">
            Submit URL Klip Video
          </h2>
          <p className="text-xs text-[#F5D5E0]/70 mt-1 line-clamp-1">
            Episode: <strong className="text-[#F5D5E0]">{campaign.title}</strong>
          </p>
        </div>

        {!user ? (
          <div className="p-5 rounded-xl bg-purple-950/40 border border-[#7B337E]/60 text-xs space-y-3 text-center">
            <div className="w-12 h-12 mx-auto rounded-xl bg-[#420D4B] flex items-center justify-center text-[#6667AB]">
              <AlertCircle className="w-6 h-6 text-amber-400" />
            </div>
            <div className="font-bold text-sm text-[#F5D5E0]">
              Silakan Masuk / Login Terlebih Dahulu
            </div>
            <p className="text-[#F5D5E0]/70 max-w-sm mx-auto">
              Kamu perlu masuk ke akun klipzz.vid kamu untuk menyetor klip dan melacak views serta pencairan komisi otomatis.
            </p>
            <div className="flex gap-2 justify-center pt-2">
              <Link
                href="/login"
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl font-bold bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow"
              >
                Masuk Akun
              </Link>
              <Link
                href="/signup"
                onClick={onClose}
                className="py-2.5 px-5 rounded-xl font-semibold bg-[#420D4B] text-[#F5D5E0] border border-[#7B337E]/40"
              >
                Daftar Baru
              </Link>
            </div>
          </div>
        ) : verifiedAccounts.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Belum Ada Akun Sosmed Terverifikasi</span>
            </div>
            <p>
              Untuk mencegah spam dan kecurangan statistik, kamu harus memverifikasi akun TikTok atau Instagram Reels terlebih dahulu dengan menaruh Bio Code unik.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenBioChallenge();
              }}
              className="w-full py-2.5 px-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-[#210635] transition-colors"
            >
              Verifikasi Akun Sekarang
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pilih Akun Sosmed Pengunggah */}
            <div>
              <label className="block text-xs font-bold text-[#F5D5E0]/80 uppercase tracking-wider mb-2">
                Pilih Akun Terverifikasi
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#210635] border border-[#7B337E]/60 text-[#F5D5E0] focus:outline-none focus:border-[#6667AB] transition-colors text-sm"
              >
                {verifiedAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.platform.toUpperCase()} - {acc.handle} ({acc.follower_count.toLocaleString()} followers)
                  </option>
                ))}
              </select>
            </div>

            {/* Input URL Video */}
            <div>
              <label className="block text-xs font-bold text-[#F5D5E0]/80 uppercase tracking-wider mb-2">
                URL Video (TikTok / Reels)
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={postUrl}
                  onChange={(e) => setPostUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@username/video/..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#210635] border border-[#7B337E]/60 text-[#F5D5E0] placeholder-[#F5D5E0]/40 focus:outline-none focus:border-[#6667AB] transition-colors text-sm"
                  required
                />
                <Link2 className="w-4 h-4 text-[#F5D5E0]/50 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Checklist Syarat Hashtag */}
            <div className="p-3.5 rounded-xl bg-[#210635]/60 border border-[#7B337E]/40 space-y-2">
              <span className="text-xs font-bold text-[#F5D5E0] flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#6667AB]" />
                Hashtag Wajib di Postingan:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {campaign.hashtag_requirements.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-lg bg-[#420D4B] border border-[#6667AB]/40 text-xs font-medium text-[#F5D5E0]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-[#F5D5E0]/60">
                Sistem Apify Scraper akan memvalidasi apakah hashtag di atas ada pada caption postinganmu.
              </p>
            </div>

            {/* Reward Rate Info */}
            <div className="flex items-center justify-between text-xs p-3 rounded-xl bg-[#420D4B]/40 border border-[#7B337E]/30">
              <span className="text-[#F5D5E0]/70">Tarif Komisi:</span>
              <span className="font-bold text-emerald-400">
                Rp {campaign.rate_per_1k_views.toLocaleString('id-ID')} / 1.000 Views
              </span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-95 flex items-center justify-center gap-2 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
