'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Scissors,
  Youtube,
  Hash,
  CheckCircle2,
  AlertTriangle,
  Play,
  Wallet,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react';
import { Navbar } from '../../../components/Navbar';
import { BioChallengeModal } from '../../../components/BioChallengeModal';
import { SubmitClipModal } from '../../../components/SubmitClipModal';
import { CreateCampaignModal } from '../../../components/CreateCampaignModal';
import {
  INITIAL_USER,
  MOCK_CAMPAIGNS,
  MOCK_SOCIAL_ACCOUNTS,
} from '../../../data/mockData';
import { Campaign, SocialAccount, Submission, UserProfile } from '../../../types';

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>(MOCK_SOCIAL_ACCOUNTS);
  const [campaign, setCampaign] = useState<Campaign | undefined>(
    MOCK_CAMPAIGNS.find((c) => c.id === campaignId) || MOCK_CAMPAIGNS[0]
  );

  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedTags, setCopiedTags] = useState(false);

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#210635] text-[#F5D5E0] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Campaign Tidak Ditemukan</h2>
          <Link href="/" className="text-sm font-semibold text-[#6667AB] hover:underline">
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  const handleCopyTags = () => {
    navigator.clipboard.writeText(campaign.hashtag_requirements.join(' '));
    setCopiedTags(true);
    setTimeout(() => setCopiedTags(false), 2000);
  };

  const claimedPercentage = Math.round(
    ((campaign.reward_pool - campaign.remaining_pool) / campaign.reward_pool) * 100
  );

  return (
    <div className="min-h-screen bg-[#210635] text-[#F5D5E0] flex flex-col">
      <Navbar
        user={user}
        onToggleRole={() =>
          setUser((prev) => ({
            ...prev,
            role: prev.role === 'clipper' ? 'brand' : 'clipper',
          }))
        }
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
        onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Back */}
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[#F5D5E0]/70 hover:text-[#F5D5E0] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Semua Campaign</span>
          </Link>
        </div>

        {/* TOP CAMPAIGN BANNER & STATS */}
        <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[#7B337E]/40 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#7B337E]/40 text-[#F5D5E0] border border-[#7B337E]/60 text-xs font-bold">
                  {campaign.channel_name}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#420D4B] text-[#6667AB] border border-[#6667AB]/40 text-xs font-bold">
                  Bintang Tamu: {campaign.episode_guest}
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-[#F5D5E0] leading-tight">
                {campaign.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#F5D5E0]/80">
                {campaign.description}
              </p>
            </div>

            {/* Quick Action Button */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="py-3.5 px-6 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4 -rotate-45" />
                <span>Submit Klip Sekarang</span>
              </button>
            </div>
          </div>

          {/* Reward Pool Status Bar */}
          <div className="p-4 rounded-2xl bg-[#210635]/80 border border-[#7B337E]/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
              <span className="text-[#F5D5E0]/70 font-semibold">
                Alokasi Dana Tersisa: <strong className="text-emerald-400 font-bold">Rp {campaign.remaining_pool.toLocaleString('id-ID')}</strong> dari Rp {campaign.reward_pool.toLocaleString('id-ID')}
              </span>
              <span className="text-xs font-extrabold text-[#F5D5E0]">
                Tarif Komisi: <span className="text-emerald-400">Rp {campaign.rate_per_1k_views.toLocaleString('id-ID')}</span> / 1.000 Views
              </span>
            </div>

            <div className="w-full h-3 rounded-full bg-[#420D4B] overflow-hidden border border-[#7B337E]/40">
              <div
                className="h-full bg-gradient-to-r from-[#7B337E] to-[#6667AB] rounded-full"
                style={{ width: `${claimedPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* TWO COLUMN: VIDEO PREVIEW & CREATOR KIT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Video Player Embed */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card rounded-2xl p-4 sm:p-6 border border-[#7B337E]/40 space-y-4">
              <h2 className="text-lg font-bold text-[#F5D5E0] flex items-center gap-2">
                <Youtube className="w-5 h-5 text-red-500" />
                <span>Video Podcast Asli</span>
              </h2>

              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#7B337E]/40 shadow-inner">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${campaign.youtube_video_id}`}
                  title={campaign.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[#F5D5E0]/60">Channel: DiPanggil ke Ruangan Official</span>
                <a
                  href={campaign.source_youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#6667AB] hover:text-[#F5D5E0] flex items-center gap-1"
                >
                  <span>Buka di YouTube App</span>
                  <Play className="w-3 h-3 fill-current" />
                </a>
              </div>
            </div>

            {/* Panduan Punchline & Editorial Brief */}
            <div className="glass-card rounded-2xl p-6 border border-[#7B337E]/40 space-y-4">
              <h3 className="text-base font-bold text-[#F5D5E0] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6667AB]" />
                <span>Panduan Gunting Klip (Punchline Brief)</span>
              </h3>

              <ul className="space-y-2.5 text-xs text-[#F5D5E0]/80">
                {campaign.guidelines.map((g, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Creator Kit & Rules */}
          <div className="space-y-6">
            {/* Required Hashtags Box */}
            <div className="glass-card rounded-2xl p-6 border border-[#7B337E]/40 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#F5D5E0] flex items-center gap-1.5">
                  <Hash className="w-4 h-4 text-[#6667AB]" />
                  <span>Hashtag Wajib</span>
                </h3>
                <button
                  onClick={handleCopyTags}
                  className="p-1.5 rounded-lg bg-[#420D4B] hover:bg-[#7B337E] text-[#F5D5E0] text-xs flex items-center gap-1 transition-colors"
                  title="Salin Semua Hashtag"
                >
                  {copiedTags ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedTags ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {campaign.hashtag_requirements.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 rounded-xl bg-[#210635] border border-[#7B337E]/50 text-xs font-semibold text-[#F5D5E0]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <p className="text-[11px] text-[#F5D5E0]/60">
                Pastikan seluruh hashtag di atas ada di caption TikTok atau Instagram Reels kamu agar sistem scraper memvalidasi kelayakan komisi.
              </p>
            </div>

            {/* Payout Terms Card */}
            <div className="glass-card rounded-2xl p-6 border border-[#7B337E]/40 space-y-3">
              <h3 className="text-sm font-bold text-[#F5D5E0]">
                Ketentuan Payout
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#7B337E]/20">
                  <span className="text-[#F5D5E0]/60">Minimal Views</span>
                  <span className="font-bold text-[#F5D5E0]">
                    {campaign.min_views_threshold.toLocaleString('id-ID')} views
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#7B337E]/20">
                  <span className="text-[#F5D5E0]/60">Maksimal Komisi / Klip</span>
                  <span className="font-bold text-emerald-400">
                    Rp {campaign.max_payout_per_clip.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-[#F5D5E0]/60">Interval Sinkronisasi</span>
                  <span className="font-bold text-[#6667AB]">Tiap 15 Menit</span>
                </div>
              </div>

              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-95"
              >
                Kirimkan Link Video Klip
              </button>
            </div>
          </div>
        </div>
      </main>

      <BioChallengeModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        onAccountVerified={(acc) => setSocialAccounts((prev) => [acc, ...prev])}
      />

      <SubmitClipModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        campaign={campaign}
        socialAccounts={socialAccounts}
        onSubmitSuccess={(newSub) => {
          alert(`Klip berhasil disetor! Views awal: ${newSub.current_views.toLocaleString('id-ID')}`);
          router.push('/dashboard');
        }}
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCampaignCreated={(camp) => console.log('Created:', camp)}
      />
    </div>
  );
}
