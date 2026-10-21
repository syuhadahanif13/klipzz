'use client';

import React, { useState } from 'react';
import { X, Youtube, Plus, Sparkles, DollarSign } from 'lucide-react';
import { Campaign } from '../types';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: (campaign: Campaign) => void;
}

export function CreateCampaignModal({ isOpen, onClose, onCampaignCreated }: CreateCampaignModalProps) {
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [episodeGuest, setEpisodeGuest] = useState('');
  const [rewardPool, setRewardPool] = useState('20000000');
  const [ratePer1k, setRatePer1k] = useState('15000');
  const [hashtags, setHashtags] = useState('#DipanggilKeRuangan, #KlipzzViral');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const videoIdMatch = youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    const videoId = videoIdMatch ? videoIdMatch[1] : 'dQw4w9WgXcQ';

    const poolNum = Number(rewardPool) || 10000000;
    const rateNum = Number(ratePer1k) || 15000;

    const newCampaign: Campaign = {
      id: `camp_${Date.now()}`,
      brand_id: '11111111-1111-1111-1111-111111111111',
      title: title || 'Episode Baru DiPanggil ke Ruangan',
      description: `Momen punchline dan potongan seru episode ${episodeGuest || 'Terbaru'} di channel @DipanggilKeRuangan.`,
      source_youtube_url: youtubeUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtube_video_id: videoId,
      thumbnail_url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      channel_name: '@DipanggilKeRuangan',
      episode_guest: episodeGuest || 'Spesial Guest',
      reward_pool: poolNum,
      remaining_pool: poolNum,
      rate_per_1k_views: rateNum,
      max_payout_per_clip: 1500000,
      min_views_threshold: 1000,
      hashtag_requirements: hashtags.split(',').map((t) => t.trim()).filter(Boolean),
      guidelines: [
        'Ambil punchline/momen terlucu atau terheboh',
        'Gunakan subtitle font dinamis',
        'Wajib sertakan hashtag kampanye di caption video',
      ],
      status: 'active',
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      brand: {
        username: 'dipanggilkeruangan_official',
        full_name: 'DiPanggil ke Ruangan Media',
        avatar_url: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200&auto=format&fit=crop&q=80',
      },
    };

    onCampaignCreated(newCampaign);
    onClose();
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
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-95 flex items-center justify-center gap-2 mt-2"
          >
            <Plus className="w-4 h-4" />
            <span>Terbitkan Campaign</span>
          </button>
        </form>
      </div>
    </div>
  );
}
