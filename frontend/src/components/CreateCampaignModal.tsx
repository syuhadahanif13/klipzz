'use client';

import React, { useState } from 'react';
import { X, Youtube, Plus, AlertCircle } from 'lucide-react';
import { Campaign } from '../types';
import { apiFetch } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: (campaign: Campaign) => void;
}

export function CreateCampaignModal({ isOpen, onClose, onCampaignCreated }: CreateCampaignModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [episodeGuest, setEpisodeGuest] = useState('');
  const [rewardPool, setRewardPool] = useState('20000000');
  const [ratePer1k, setRatePer1k] = useState('15000');
  const [hashtags, setHashtags] = useState('#DipanggilKeRuangan, #KlipzzViral');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const videoIdMatch = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (!videoIdMatch) {
      setErrorMessage('Format URL YouTube tidak valid. Pastikan menyalin link video YouTube yang benar.');
      return;
    }
    if (!user) {
      setErrorMessage('Silakan masuk sebagai brand untuk membuat campaign.');
      return;
    }

    const poolNum = Number(rewardPool) || 10000000;
    const rateNum = Number(ratePer1k) || 15000;
    const tagList = hashtags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setSubmitting(true);

    try {
      // brand_id is derived from the access token on the server; never send it.
      const data = await apiFetch<{ campaign: Campaign }>('/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: `Momen punchline dan potongan seru episode ${
            episodeGuest.trim() || 'Terbaru'
          } di channel @DipanggilKeRuangan.`,
          sourceYoutubeUrl: youtubeUrl.trim(),
          episodeGuest: episodeGuest.trim() || 'Spesial Guest',
          rewardPool: poolNum,
          ratePer1kViews: rateNum,
          maxPayoutPerClip: Math.min(poolNum, 1500000),
          hashtagRequirements: tagList,
          guidelines: [
            'Ambil punchline/momen terlucu atau terheboh',
            'Gunakan subtitle font dinamis yang mudah dibaca',
            'Wajib sertakan hashtag kampanye di caption video',
          ],
        }),
      });

      if (data.campaign) {
        onCampaignCreated(data.campaign);
      }
      onClose();
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      setErrorMessage(err.message || 'Gagal membuat campaign. Silakan coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl p-6 sm:p-8 bg-[var(--surface)] border border-[var(--line)] shadow-2xl max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full text-fg-subtle hover:text-fg hover:bg-[var(--surface-2)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] text-fg border border-[var(--line)] text-xs font-semibold mb-2">
            <span>Brand Portal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-fg">
            Buka Campaign Clipping Baru
          </h2>
          <p className="text-xs text-fg-muted mt-1 leading-relaxed">
            Alokasikan budget reward pool untuk menggerakkan ribuan clipper menyebarkan episode podcast-mu di TikTok & Reels.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">
              Judul Episode Kampanye
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Abdur Arsyad & Mamat Alkatiri - Debat Panas Politik"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-[var(--accent)] text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">
              URL Video YouTube
            </label>
            <div className="relative">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-[var(--accent)] text-sm"
                required
              />
              <Youtube className="w-4 h-4 text-red-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">
              Bintang Tamu / Episode Guest
            </label>
            <input
              type="text"
              value={episodeGuest}
              onChange={(e) => setEpisodeGuest(e.target.value)}
              placeholder="Contoh: Mamat Alkatiri & Abdur Arsyad"
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg placeholder:text-fg-subtle focus:outline-none focus:border-[var(--accent)] text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">
                Total Reward Pool (IDR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={rewardPool}
                  onChange={(e) => setRewardPool(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg focus:outline-none focus:border-[var(--accent)] text-sm font-semibold"
                  required
                />
                <span className="text-xs text-fg-subtle absolute left-3 top-3">Rp</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">
                Rate per 1k Views (IDR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={ratePer1k}
                  onChange={(e) => setRatePer1k(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg focus:outline-none focus:border-[var(--accent)] text-sm font-semibold"
                  required
                />
                <span className="text-xs text-fg-subtle absolute left-3 top-3">Rp</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-fg-muted uppercase tracking-wider mb-1.5">
              Hashtag Wajib (pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] text-fg text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 px-4 rounded-full font-semibold text-sm bg-white text-black hover:bg-white/90 shadow-md flex items-center justify-center gap-2 mt-2 disabled:opacity-50 transition-all"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Menyimpan ke Supabase...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Terbitkan Campaign</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
