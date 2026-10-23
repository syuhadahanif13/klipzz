'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  Eye,
  Scissors,
  CheckCircle2,
  ExternalLink,
  Plus,
  ShieldCheck,
  Heart,
  Sparkles,
  Flame,
  Layers,
} from 'lucide-react';
import { Navbar } from '../../components/Navbar';
import { BottomNav } from '../../components/BottomNav';
import { BioChallengeModal } from '../../components/BioChallengeModal';
import { CreateCampaignModal } from '../../components/CreateCampaignModal';
import { SubmitClipModal } from '../../components/SubmitClipModal';
import { CampaignDetailModal } from '../../components/CampaignDetailModal';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { Campaign, SocialAccount, Submission } from '../../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [detailCampaign, setDetailCampaign] = useState<Campaign | null>(null);

  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isBrandOrAdmin = user?.role === 'admin' || user?.role === 'brand';

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) {
        setSocialAccounts([]);
        setSubmissions([]);
        setCampaigns([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        if (isBrandOrAdmin) {
          const { data: brandCamps } = await supabase
            .from('campaigns')
            .select('*')
            .eq('brand_id', user.id)
            .order('created_at', { ascending: false });

          if (brandCamps) {
            setCampaigns(brandCamps as Campaign[]);
          }

          const campaignIds = (brandCamps || []).map((camp) => camp.id);
          if (campaignIds.length === 0) {
            setSubmissions([]);
            return;
          }

          const { data: brandSubs } = await supabase
            .from('submissions')
            .select(`
              *,
              campaign:campaigns(id, title, channel_name, episode_guest, rate_per_1k_views),
              clipper:profiles!submissions_clipper_id_fkey(username, full_name, avatar_url)
            `)
            .in('campaign_id', campaignIds)
            .order('created_at', { ascending: false });

          if (brandSubs) {
            setSubmissions(brandSubs as Submission[]);
          }
        } else {
          const { data: accounts } = await supabase
            .from('social_accounts')
            .select('*')
            .eq('user_id', user.id);

          if (accounts) {
            setSocialAccounts(accounts as SocialAccount[]);
          }

          const { data: userSubs } = await supabase
            .from('submissions')
            .select(`
              *,
              campaign:campaigns(id, title, channel_name, episode_guest, rate_per_1k_views)
            `)
            .eq('clipper_id', user.id)
            .order('created_at', { ascending: false });

          if (userSubs) {
            setSubmissions(userSubs as Submission[]);
          }

          const { data: activeCamps } = await supabase
            .from('campaigns')
            .select('*')
            .neq('status', 'draft')
            .order('created_at', { ascending: false });

          if (activeCamps) {
            setCampaigns(activeCamps as Campaign[]);
          }
        }
      } catch (err) {
        console.warn('Error loading dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [user, isBrandOrAdmin]);

  const totalViews = submissions.reduce((sum, s) => sum + (Number(s.current_views) || 0), 0);
  const totalLikes = submissions.reduce((sum, s) => sum + (Number(s.current_likes) || 0), 0);
  const totalRewardBudget = campaigns.reduce((sum, c) => sum + (Number(c.reward_pool) || 0), 0);
  const totalRemainingBudget = campaigns.reduce((sum, c) => sum + (Number(c.remaining_pool) || 0), 0);

  const handleAccountVerified = (account: SocialAccount) => {
    setSocialAccounts((prev) => [
      account,
      ...prev.filter(
        (item) =>
          item.id !== account.id &&
          !(item.platform === account.platform && item.handle === account.handle)
      ),
    ]);
  };

  const handleOpenSubmit = (camp: Campaign) => {
    setSelectedCampaign(camp);
    setIsSubmitModalOpen(true);
  };

  const handleSubmitSuccess = (newSub: Submission) => {
    setSubmissions((prev) => [newSub, ...prev]);
  };

  return (
    <div className="min-h-screen surface-app flex flex-col antialiased">
      <Navbar
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
        onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 w-full px-5 sm:px-[4vw] py-6 sm:py-8 space-y-8 pb-24 md:pb-12">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--surface-2)] text-fg border border-[var(--line)] text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{isBrandOrAdmin ? 'Brand Management Portal' : 'Clipper Creator Studio'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-fg flex items-center gap-2.5">
              {isBrandOrAdmin ? (
                <>
                  <Layers className="w-7 h-7 text-[var(--accent)]" />
                  <span>Portal Pengelola Kampanye</span>
                </>
              ) : (
                <>
                  <Scissors className="w-6 h-6 text-[var(--accent)] -rotate-45" />
                  <span>Clipper Studio & Tracking Hub</span>
                </>
              )}
            </h1>
            <p className="text-xs sm:text-sm text-fg-muted mt-1">
              {isBrandOrAdmin
                ? 'Kelola alokasi reward pool kampanye dan pantau sebaran klip video resmi yang digunting oleh komunitas clipper.'
                : 'Pantau performa views klip TikTok & Reels-mu yang disinkronkan langsung via Apify Scraper Engine.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isBrandOrAdmin ? (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-white text-black hover:bg-white/90 shadow-md text-center flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Buka Campaign Baru</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsBioModalOpen(true)}
                  className="px-4 py-2.5 rounded-full text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-fg border border-[var(--line)] transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verifikasi Akun Sosmed</span>
                </button>

                <a
                  href="#campaigns-list"
                  className="px-5 py-2.5 rounded-full font-bold text-xs sm:text-sm bg-white text-black hover:bg-white/90 shadow-md text-center flex items-center justify-center gap-2 transition-all"
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Lihat Campaign Siap Gunting</span>
                </a>
              </>
            )}
          </div>
        </div>

        {/* METRICS STATS CARDS */}
        {isBrandOrAdmin ? (
          /* Brand Metrics */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-1.5">
              <span className="text-xs font-medium text-fg-subtle">Total Alokasi Reward Pool</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                Rp {totalRewardBudget.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-fg-subtle block">Dari {campaigns.length} episode kampanye</span>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-1.5">
              <span className="text-xs font-medium text-fg-subtle">Sisa Budget Tersedia</span>
              <div className="text-2xl font-black text-amber-400 font-mono">
                Rp {totalRemainingBudget.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-amber-400/80 block">Siap diklaim oleh kreator</span>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-1.5">
              <span className="text-xs font-medium text-fg-subtle">Total Klip Masuk</span>
              <div className="text-2xl font-black text-fg font-mono">
                {submissions.length} Klip
              </div>
              <span className="text-[11px] text-fg-subtle block">Tersinkronisasi otomatis</span>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-1.5">
              <span className="text-xs font-medium text-fg-subtle">Total Views Didorong</span>
              <div className="text-2xl font-black text-fg font-mono">
                {totalViews.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Jangkauan viralitas
              </span>
            </div>
          </div>
        ) : (
          /* Clipper Metrics */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-fg-subtle">Saldo Dapat Ditarik</span>
                <div className="w-8 h-8 rounded-lg bg-[var(--cpm-soft)] text-[var(--cpm)] flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-[var(--cpm)] font-mono">
                Rp {(user?.balance || 0).toLocaleString('id-ID')}
              </div>
              <button
                disabled
                title="Fitur penarikan saldo sedang dalam pengembangan"
                className="text-[11px] font-semibold text-fg-muted underline cursor-not-allowed opacity-50 block pt-1"
              >
                Tarik Saldo ke Rekening / E-Wallet → (Segera Hadir)
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-fg-subtle">Total Views Klip</span>
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] text-fg flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-fg font-mono">
                {totalViews.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Bertumbuh tiap 15 menit
              </span>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-fg-subtle">Total Likes Klip</span>
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
                  <Heart className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-fg font-mono">
                {totalLikes.toLocaleString('id-ID')}
              </div>
              <span className="text-[11px] text-fg-subtle block">Engagement organik verified</span>
            </div>

            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-fg-subtle">Klip Berjalan</span>
                <div className="w-8 h-8 rounded-lg bg-[var(--surface-2)] text-[var(--accent)] flex items-center justify-center">
                  <Scissors className="w-4 h-4 -rotate-45" />
                </div>
              </div>
              <div className="text-2xl font-black text-fg font-mono">
                {submissions.length} Klip
              </div>
              <span className="text-[11px] text-fg-subtle block">Status: Approved & Tracking</span>
            </div>
          </div>
        )}

        {/* SECTION AKUN SOSIAL MEDIA (Khusus Clipper) */}
        {!isBrandOrAdmin && (
          <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-fg">
                  Akun Sosial Media Terhubung
                </h2>
              </div>
              <button
                onClick={() => setIsBioModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-fg border border-[var(--line)] transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Hubungkan Akun Baru</span>
              </button>
            </div>

            {socialAccounts.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-[var(--surface-2)] border border-[var(--line)] space-y-3">
                <ShieldCheck className="w-8 h-8 text-fg-subtle mx-auto" />
                <p className="text-xs text-fg-muted max-w-sm mx-auto">
                  Belum ada akun sosial media (TikTok / Instagram) yang terhubung. Hubungkan akunmu untuk melacak klip dan mendapatkan komisi.
                </p>
                <button
                  onClick={() => setIsBioModalOpen(true)}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-white text-black hover:bg-white/90 transition-colors"
                >
                  Hubungkan Akun Baru
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {socialAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--surface-3)] border border-[var(--line)] flex items-center justify-center font-bold uppercase text-xs text-fg">
                        {acc.platform === 'tiktok' ? 'TT' : 'IG'}
                      </div>
                      <div>
                        <span className="font-bold text-sm text-fg block leading-snug">
                          {acc.handle}
                        </span>
                        <span className="text-[11px] text-fg-subtle">
                          {Number(acc.follower_count || 0).toLocaleString('id-ID')} followers
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      {acc.is_verified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            Pending
                          </span>
                          <span className="text-[10px] font-mono text-fg-subtle mt-1">
                            {acc.verification_code}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* SECTION CAMPAIGN */}
        <section id="campaigns-list" className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <div>
                <h2 className="text-lg font-bold text-fg">
                  {isBrandOrAdmin ? 'Daftar Kampanye Resmi Milik Brand' : 'Campaign Aktif Siap Digunting'}
                </h2>
                <p className="text-xs text-fg-muted">
                  {isBrandOrAdmin
                    ? 'Kelola episode kampanye resmi dan alokasi reward pool brand Anda.'
                    : 'Pilih episode podcast, ambil footage video, dan setor klip untuk raih komisi.'}
                </p>
              </div>
            </div>

            {isBrandOrAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white text-black hover:bg-white/90 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Campaign</span>
              </button>
            )}
          </div>

          {campaigns.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[var(--surface-2)] border border-[var(--line)] space-y-2">
              <p className="text-xs text-fg-muted">
                {isBrandOrAdmin
                  ? 'Belum ada campaign yang dibuat. Klik tombol di atas untuk membuka campaign baru.'
                  : 'Belum ada campaign aktif yang tersedia saat ini.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {campaigns.map((camp) => {
                const pool = Number(camp.reward_pool) || 0;
                const rem = Number(camp.remaining_pool) || 0;
                const progress = pool > 0 ? Math.min(100, Math.round(((pool - rem) / pool) * 100)) : 0;

                return (
                  <div
                    key={camp.id}
                    className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--line)] hover:border-[var(--accent-line)] transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-[var(--line)]">
                        <img
                          src={camp.thumbnail_url || `https://img.youtube.com/vi/${camp.youtube_video_id}/hqdefault.jpg`}
                          alt={camp.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-mono text-[var(--cpm)] font-bold">
                          Rp {Number(camp.rate_per_1k_views || 0).toLocaleString('id-ID')}/1k
                        </span>
                      </div>

                      <h3 className="font-bold text-xs text-fg line-clamp-2 leading-snug">
                        {camp.title}
                      </h3>

                      <span className="text-[11px] text-fg-subtle block font-medium truncate">
                        Guest: {camp.episode_guest || 'Spesial Guest'}
                      </span>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-[var(--line)]">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-fg-subtle">Sisa Pool:</span>
                        <span className="font-bold text-fg">
                          Rp {rem.toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setDetailCampaign(camp)}
                          className="py-2 px-2.5 rounded-lg text-center text-[11px] font-semibold bg-[var(--surface-3)] hover:bg-white/10 text-fg transition-colors flex items-center justify-center truncate"
                        >
                          Creator Kit
                        </button>

                        {!isBrandOrAdmin ? (
                          <button
                            onClick={() => handleOpenSubmit(camp)}
                            className="py-2 px-2.5 rounded-lg text-center text-[11px] font-bold bg-white text-black hover:bg-white/90 transition-all flex items-center justify-center gap-1"
                          >
                            <Scissors className="w-3 h-3 -rotate-45" />
                            <span>Setor</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setDetailCampaign(camp)}
                            className="py-2 px-2.5 rounded-lg text-center text-[11px] font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center"
                          >
                            Kelola
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION RIWAYAT KLIP */}
        <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-fg">
                {isBrandOrAdmin ? 'Setoran Klip Masuk dari Seluruh Komunitas' : 'Riwayat Setoran Klip Video Kamu'}
              </h2>
              <p className="text-xs text-fg-muted">
                {isBrandOrAdmin
                  ? 'Klip video yang diposting oleh para clipper di media sosial untuk mempromosikan episode podcast Anda.'
                  : 'Daftar video yang telah kamu setor beserta update views dan komisi terkini.'}
              </p>
            </div>
          </div>

          {submissions.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-[var(--surface-2)] border border-[var(--line)] space-y-3">
              <Scissors className="w-8 h-8 text-fg-subtle mx-auto -rotate-45" />
              <p className="text-xs text-fg-muted max-w-sm mx-auto">
                {isBrandOrAdmin
                  ? 'Belum ada clipper yang menyetor klip ke kampanye Anda saat ini.'
                  : 'Kamu belum menyetor video klip apapun. Pilih episode di atas untuk mulai memotong dan menyetor klip.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-fg-subtle uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Video / Episode</th>
                    {isBrandOrAdmin && <th className="py-3 px-4">Clipper</th>}
                    <th className="py-3 px-4">Platform</th>
                    <th className="py-3 px-4">Views Terkini</th>
                    <th className="py-3 px-4">Likes</th>
                    <th className="py-3 px-4">Komisi Diperoleh</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]">
                  {submissions.map((sub: any) => (
                    <tr key={sub.id} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="py-3.5 px-4 font-medium text-fg">
                        <div className="flex items-center gap-3">
                          <img
                            src={sub.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=200'}
                            alt="thumbnail"
                            className="w-12 h-12 rounded-lg object-cover border border-[var(--line)] shrink-0"
                          />
                          <div className="max-w-xs">
                            <span className="font-bold block truncate text-fg">
                              {sub.campaign?.title || 'Episode Kampanye'}
                            </span>
                            <span className="text-[11px] text-fg-subtle block truncate">
                              Guest: {sub.campaign?.episode_guest || 'Spesial Guest'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {isBrandOrAdmin && (
                        <td className="py-3.5 px-4 font-semibold text-fg">
                          @{sub.clipper?.username || 'clipper'}
                        </td>
                      )}

                      <td className="py-3.5 px-4 font-bold uppercase text-[11px] text-fg-muted">
                        {sub.platform}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--cpm)]">
                        {Number(sub.current_views || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-fg-muted">
                        {Number(sub.current_likes || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--cpm)]">
                        Rp {Number(sub.earnings || 0).toLocaleString('id-ID')}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                            sub.status === 'approved'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : sub.status === 'pending'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : sub.status === 'rejected'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <a
                          href={sub.post_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--surface-2)] hover:bg-[var(--surface-3)] text-fg text-[11px] font-semibold border border-[var(--line)] transition-colors"
                        >
                          <span>Lihat Video</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      <BioChallengeModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        onAccountVerified={handleAccountVerified}
      />

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCampaignCreated={(camp) => {
          setCampaigns((prev) => [camp, ...prev]);
          setDetailCampaign(camp);
        }}
      />

      <CampaignDetailModal
        isOpen={Boolean(detailCampaign)}
        campaign={detailCampaign}
        onClose={() => setDetailCampaign(null)}
        socialAccounts={socialAccounts}
        onAccountVerified={handleAccountVerified}
        onSubmissionCreated={handleSubmitSuccess}
      />

      <SubmitClipModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        campaign={selectedCampaign}
        socialAccounts={socialAccounts}
        onSubmitSuccess={handleSubmitSuccess}
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />

      {/* MOBILE BOTTOM APP NAVIGATION */}
      <BottomNav
        onOpenSubmit={() => {
          if (campaigns.length > 0) handleOpenSubmit(campaigns[0]);
        }}
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />
    </div>
  );
}
