'use client';

import React, { useState } from 'react';
import { X, Youtube, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { Campaign } from '../types';
import { supabase } from '../lib/supabaseClient';
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
    const videoId = videoIdMatch[1];

    const poolNum = Number(rewardPool) || 10000000;
    const rateNum = Number(ratePer1k) || 15000;
    const tagList = hashtags.split(',').map((t) => t.trim()).filter(Boolean);
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const brandId = user?.id || '11111111-1111-1111-1111-111111111111';

    setSubmitting(true);

    try {
      // Simpan langsung ke database Supabase
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          brand_id: brandId,
          title: title.trim(),
          description: `Momen punchline dan potongan seru episode ${episodeGuest.trim() || 'Terbaru'} di channel @DipanggilKeRuangan.`,
          source_youtube_url: youtubeUrl.trim(),
          youtube_video_id: videoId,
          thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          channel_name: '@DipanggilKeRuangan',
          episode_guest: episodeGuest.trim() || 'Spesial Guest',
          reward_pool: poolNum,
          remaining_pool: poolNum,
          rate_per_1k_views: rateNum,
          max_payout_per_clip: 1500000,
          min_views_threshold: 1000,
          hashtag_requirements: tagList,
          guidelines: [
            'Ambil punchline/momen terlucu atau terheboh',
            'Gunakan subtitle font dinamis yang mudah dibaca',
            'Wajib sertakan hashtag kampanye di caption video',
          ],
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          slug: slug || `episode-${Date.now()}`,
        })
        .select('*, brand:profiles!campaigns_brand_id_fkey(username, full_name, avatar_url)')
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        onCampaignCreated(data as unknown as Campaign);
      }
      onClose();
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      setErrorMessage(err.message || 'Gagal menyimpan campaign ke database. Silakan coba kembali.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#210635]/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-card rounded-2xl p-6 sm:p-8 border border-[#7B337E]/50 shadow-moon-glow max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-[#F5D5E0]/60 hover:text-[#F5D5E0] hover:bg-[#420D4B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7B337E]/30 text-[#F5D5E0] border border-[#7B337E]/50 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#6667AB]" />
            Brand Portal: DiPanggil ke Ruangan
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F5D5E0]">
            Buka Campaign Clipping Baru
          </h2>
          <p className="text-xs text-[#F5D5E0]/70 mt-1">
            Alokasikan budget reward pool untuk menggerakkan ribuan clipper menyebarkan episode podcast-mu di TikTok & Reels.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#F5D5E0]/80 uppercase tracking-wider mb-1.5">
              Judul Episode Kampanye
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Abdur Arsyad & Mamat Alkatiri - Debat Panas Politik"
              className="w-full px-4 py-2.5 rounded-xl bg-[#210635] border border-[#7B337E]/60 text-[#F5D5E0] placeholder-[#F5D5E0]/40 focus:outline-none focus:border-[#6667AB] text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#F5D5E0]/80 uppercase tracking-wider mb-1.5">
              URL Video YouTube (@DipanggilKeRuangan)
            </label>
            <div className="relative">
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#210635] border border-[#7B337E]/60 text-[#F5D5E0] placeholder-[#F5D5E0]/40 focus:outline-none focus:border-[#6667AB] text-sm"
                required
              />
              <Youtube className="w-4 h-4 text-red-500 absolute left-3.5 top-3" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#F5D5E0]/80 uppercase tracking-wider mb-1.5">
              Bintang Tamu / Episode Guest
            </label>
            <input
              type="text"
              value={episodeGuest}
              onChange={(e) => setEpisodeGuest(e.target.value)}
              placeholder="Contoh: Mamat Alkatiri & Abdur Arsyad"
              className="w-full px-4 py-2.5 rounded-xl bg-[#210635] border border-[#7B337E]/60 text-[#F5D5E0] placeholder-[#F5D5E0]/40 focus:outline-none focus:border-[#6667AB] text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#F5D5E0]/80 uppercase tracking-wider mb-1.5">
                Total Reward Pool (IDR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={rewardPool}
                  onChange={(e) => setRewardPool(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#210635] border border-[#7B337E]/60 text-[#F5D5E0] focus:outline-none focus:border-[#6667AB] text-sm font-semibold"
                  required
                />
                <span className="text-xs text-[#F5D5E0]/50 absolute left-3 top-3">Rp</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#F5D5E0]/80 uppercase tracking-wider mb-1.5">
                Rate per 1k Views (IDR)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={ratePer1k}
                  onChange={(e) => setRatePer1k(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[#210635] border border-[#7B337E]/60 text-[#F5D5E0] focus:outline-none focus:border-[#6667AB] text-sm font-semibold"
                  required
                />
                <span className="text-xs text-[#F5D5E0]/50 absolute left-3 top-3">Rp</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#F5D5E0]/80 uppercase tracking-wider mb-1.5">
              Hashtag Wajib (pisahkan dengan koma)
            </label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#210635] border border-[#7B337E]/60 text-[#F5D5E0] text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-95 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 transition-opacity"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
