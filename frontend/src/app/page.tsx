'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Scissors,
  Flame,
  Search,
  CheckCircle2,
  Play,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Sparkles,
  SlidersHorizontal,
  Wallet,
  Calculator,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomNav } from '../components/BottomNav';
import { BioChallengeModal } from '../components/BioChallengeModal';
import { SubmitClipModal } from '../components/SubmitClipModal';
import { CreateCampaignModal } from '../components/CreateCampaignModal';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Campaign, SocialAccount, Submission } from '../types';
import { MOCK_CAMPAIGNS } from '../data/mockData';

type FilterTab = 'all' | 'newest' | 'highest_budget' | 'highest_rate';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState<boolean>(false);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalPlatformViews, setTotalPlatformViews] = useState<number>(0);
  const [totalClippersCount, setTotalClippersCount] = useState<number>(0);

  // State Hero Carousel
  const [activeHeroIndex, setActiveHeroIndex] = useState<number>(0);

  // Filter & Search
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Kalkulator Cuan
  const [viewsEstimate, setViewsEstimate] = useState<number>(50000);

  // Modals
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Ambil campaign aktif dan metrik platform langsung dari supabase
  useEffect(() => {
    async function fetchLivePlatformData() {
      setIsLoadingCampaigns(true);
      try {
        const { data: dbCampaigns } = await supabase
          .from('campaigns')
          .select('*')
          .neq('status', 'draft')
          .order('created_at', { ascending: false });

        if (dbCampaigns && dbCampaigns.length > 0) {
          setCampaigns(dbCampaigns as Campaign[]);
        }

        const { data: dbSubs } = await supabase
          .from('submissions')
          .select('id, current_views, earnings, status');

        if (dbSubs) {
          setSubmissions(dbSubs as Submission[]);
          const sumViews = dbSubs.reduce((acc, s) => acc + (Number(s.current_views) || 0), 0);
          setTotalPlatformViews(sumViews);
        }

        const { count: clippersCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'clipper');

        if (clippersCount !== null) {
          setTotalClippersCount(clippersCount);
        }
      } catch (e) {
        console.error('Error fetching live platform data:', e);
      } finally {
        setIsLoadingCampaigns(false);
      }
    }
    fetchLivePlatformData();
  }, []);

  // Ambil akun sosmed terverifikasi milik user yang sedang login
  useEffect(() => {
    async function fetchUserAccounts() {
      if (!user) {
        setSocialAccounts([]);
        return;
      }
      try {
        const { data } = await supabase
          .from('social_accounts')
          .select('*')
          .eq('user_id', user.id);
        if (data) {
          setSocialAccounts(data as SocialAccount[]);
        }
      } catch (err) {
        console.warn('Failed to load user social accounts:', err);
      }
    }
    fetchUserAccounts();
  }, [user?.id]);

  const openSubmitFor = (camp: Campaign) => {
    setSelectedCampaign(camp);
    setIsSubmitModalOpen(true);
  };

  // Filter & Sorting logic ala TernakKlip
  const filteredAndSortedCampaigns = campaigns
    .filter((camp) => {
      const matchSearch =
        camp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (camp.episode_guest || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    })
    .sort((a, b) => {
      if (activeTab === 'newest') {
        const dateB = new Date(b.created_at || b.start_date || '').getTime() || 0;
        const dateA = new Date(a.created_at || a.start_date || '').getTime() || 0;
        return dateB - dateA;
      }
      if (activeTab === 'highest_budget') {
        return (Number(b.remaining_pool) || 0) - (Number(a.remaining_pool) || 0);
      }
      if (activeTab === 'highest_rate') {
        return (Number(b.rate_per_1k_views) || 0) - (Number(a.rate_per_1k_views) || 0);
      }
      return 0; // 'all' default order
    });

  const featuredCampaign = campaigns[activeHeroIndex] || campaigns[0] || MOCK_CAMPAIGNS[0];
  const featuredRewardPool = Number(featuredCampaign?.reward_pool) || 25000000;
  const featuredRemainingPool = Number(featuredCampaign?.remaining_pool) || 16800000;
  const featuredRate = Number(featuredCampaign?.rate_per_1k_views) || 18000;

  // Kalkulator cuan
  const maxPayoutPerClip =
    campaigns.length > 0 && campaigns[0]?.max_payout_per_clip
      ? Number(campaigns[0].max_payout_per_clip)
      : 2000000;
  const rawEarnings = Math.round((viewsEstimate / 1000) * 18000);
  const isCapped = rawEarnings >= maxPayoutPerClip;
  const estimatedEarnings = Math.min(rawEarnings, maxPayoutPerClip);

  return (
    <div className="min-h-screen bg-[#190428] text-[#F5D5E0] flex flex-col font-sans antialiased selection:bg-[#7B337E] selection:text-white">
      <Navbar
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
        onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 pb-28 md:pb-16">
        {/* ========================================================================= */}
        {/* HERO FEATURED CAMPAIGN (CINEMATIC BANNER ALA TERNAKKLIP DISCOVER)        */}
        {/* ========================================================================= */}
        <section className="relative w-full overflow-hidden rounded-3xl bg-[#26073d] border border-[#7B337E]/30 shadow-2xl">
          <div className="relative h-[340px] sm:h-[430px] md:h-[480px] w-full overflow-hidden">
            {/* Background Image with Dark Vignette */}
            <img
              src={featuredCampaign.thumbnail_url || 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1200'}
              alt={featuredCampaign.title}
              className="absolute inset-0 w-full h-full object-cover object-center scale-105 transition-transform duration-700"
            />
            {/* Gradients to keep text ultra-readable */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#190428] via-[#190428]/70 to-transparent sm:bg-gradient-to-r sm:from-[#190428]/95 sm:via-[#190428]/75 sm:to-transparent" />
            <div className="absolute inset-0 bg-black/30" />

            {/* Hero Content Overlay */}
            <div className="relative h-full flex flex-col justify-end p-6 sm:p-10 md:p-12 z-10 max-w-2xl space-y-4">
              {/* Channel / Brand Identity Pill */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{featuredCampaign.channel_name || '@DipanggilKeRuangan'}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#6667AB] fill-[#6667AB] text-white" />
                </span>
                <span className="text-xs text-white/70 font-medium">
                  Bintang Tamu: <strong className="text-white">{featuredCampaign.episode_guest}</strong>
                </span>
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight drop-shadow-md line-clamp-2">
                {featuredCampaign.title}
              </h1>

              {/* Rate & Budget Highlights */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs sm:text-sm text-white/80">
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60">Tarif CPM:</span>
                  <span className="font-extrabold text-emerald-400 font-mono text-sm sm:text-base">
                    Rp {featuredRate.toLocaleString('id-ID')} / 1K views
                  </span>
                </div>
                <span className="text-white/30">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-white/60">Sisa Pool:</span>
                  <span className="font-bold text-white font-mono">
                    Rp {featuredRemainingPool.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              {/* Action Buttons (Pills ala TernakKlip) */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href={`/campaign/${featuredCampaign.slug || featuredCampaign.id}`}
                  className="px-6 py-3 rounded-full font-bold text-xs sm:text-sm bg-white hover:bg-white/90 text-black shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Buka Creator Kit</span>
                </Link>

                <button
                  onClick={() => openSubmitFor(featuredCampaign)}
                  className="px-6 py-3 rounded-full font-semibold text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/30 transition-all active:scale-95 flex items-center gap-2"
                >
                  <Scissors className="w-4 h-4 -rotate-45" />
                  <span>Setor Klip</span>
                </button>
              </div>
            </div>

            {/* Carousel Navigation Dots */}
            {campaigns.length > 1 && (
              <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                {campaigns.slice(0, 4).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveHeroIndex(idx)}
                    className={`h-2 rounded-full transition-all ${
                      activeHeroIndex === idx ? 'w-6 bg-white' : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                    aria-label={`Slide ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* DISCOVER BAR: FILTER TABS & SEARCH (TERNAKKLIP DISCOVER PATTERN)         */}
        {/* ========================================================================= */}
        <section id="campaigns-section" className="space-y-6 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#7B337E]/25 pb-4">
            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: 'Semua Episode' },
                { id: 'newest', label: 'Terbaru' },
                { id: 'highest_budget', label: 'Budget Terbesar' },
                { id: 'highest_rate', label: 'Tarif CPM Tertinggi' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as FilterTab)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-black shadow-md'
                      : 'bg-[#26073d]/60 text-[#F5D5E0]/70 hover:text-white hover:bg-[#420D4B]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input Box */}
            <div className="relative w-full md:w-72 shrink-0">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari episode atau bintang tamu..."
                className="w-full pl-9 pr-4 py-2 rounded-full bg-[#26073d] border border-[#7B337E]/40 text-xs sm:text-sm text-[#F5D5E0] placeholder-[#F5D5E0]/40 focus:outline-none focus:border-white transition-colors"
              />
              <Search className="w-4 h-4 text-[#F5D5E0]/50 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* CAMPAIGN GRID (CLEAN 2-3 COLUMNS CARDS ALA TERNAKKLIP DISCOVER)          */}
          {/* ========================================================================= */}
          {isLoadingCampaigns ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="rounded-2xl bg-[#26073d]/60 border border-[#7B337E]/30 p-4 space-y-3 animate-pulse">
                  <div className="aspect-video rounded-xl bg-[#420D4B]/40" />
                  <div className="h-4 bg-[#420D4B]/60 rounded w-2/3" />
                  <div className="h-3 bg-[#420D4B]/30 rounded w-full" />
                </div>
              ))}
            </div>
          ) : filteredAndSortedCampaigns.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#26073d]/40 border border-[#7B337E]/30 space-y-3">
              <Flame className="w-8 h-8 text-[#6667AB] mx-auto" />
              <h3 className="text-base font-bold text-white">Tidak Ada Campaign</h3>
              <p className="text-xs text-[#F5D5E0]/60 max-w-sm mx-auto">
                {searchQuery
                  ? `Tidak ada episode yang cocok dengan pencarian "${searchQuery}".`
                  : 'Belum ada episode campaign aktif saat ini.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
              {filteredAndSortedCampaigns.map((camp) => {
                const pool = Number(camp.reward_pool) || 1;
                const rem = Number(camp.remaining_pool) || 0;
                const remainingPercentage = Math.min(100, Math.max(0, Math.round((rem / pool) * 100)));
                const rate = Number(camp.rate_per_1k_views) || 15000;

                return (
                  <div
                    key={camp.id}
                    className="group flex flex-col justify-between rounded-2xl bg-[#26073d]/70 hover:bg-[#30094e] border border-[#7B337E]/35 hover:border-[#6667AB]/70 transition-all p-3.5 space-y-3.5 shadow-sm"
                  >
                    {/* Media Thumbnail Container */}
                    <Link
                      href={`/campaign/${camp.slug || camp.id}`}
                      className="relative aspect-video rounded-xl overflow-hidden bg-black block cursor-pointer"
                    >
                      <img
                        src={camp.thumbnail_url}
                        alt={camp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Guest Tag */}
                      <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white">
                        {camp.episode_guest}
                      </div>

                      {/* Video Indicator */}
                      <div className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-[10px] font-medium flex items-center gap-1 border border-white/10">
                        <Play className="w-3 h-3 fill-current" />
                        <span>Source Footage</span>
                      </div>
                    </Link>

                    {/* Metadata Header & Title */}
                    <div className="space-y-1.5 px-1">
                      <div className="flex items-center justify-between text-xs text-[#F5D5E0]/60">
                        <span className="flex items-center gap-1 font-medium text-white/80">
                          <span>{camp.channel_name || '@DipanggilKeRuangan'}</span>
                          <CheckCircle2 className="w-3 h-3 text-[#6667AB]" />
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">
                          Aktif Payout
                        </span>
                      </div>

                      <Link href={`/campaign/${camp.slug || camp.id}`} className="block">
                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                          {camp.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-[#F5D5E0]/70 line-clamp-2 leading-relaxed">
                        {camp.description}
                      </p>
                    </div>

                    {/* Budget & CPM Metric Bar (TernakKlip Style) */}
                    <div className="space-y-2 pt-2 border-t border-[#7B337E]/25 px-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-[#F5D5E0]/70">
                          <strong className="text-white font-bold">{remainingPercentage}%</strong> budget tersisa
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
                          Rp {rate.toLocaleString('id-ID')} / 1K
                        </span>
                      </div>

                      {/* Progress Line */}
                      <div className="w-full h-1.5 rounded-full bg-[#190428] overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#7B337E] to-[#6667AB] rounded-full transition-all duration-500"
                          style={{ width: `${remainingPercentage}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1 px-1">
                      <Link
                        href={`/campaign/${camp.slug || camp.id}`}
                        className="py-2.5 px-3 rounded-xl text-center text-xs font-semibold bg-[#190428] hover:bg-[#420D4B] text-white border border-[#7B337E]/40 transition-colors flex items-center justify-center gap-1 shadow-sm"
                      >
                        <span>Creator Kit</span>
                      </Link>

                      <button
                        onClick={() => openSubmitFor(camp)}
                        className="py-2.5 px-3 rounded-xl text-center text-xs font-bold bg-white hover:bg-white/90 text-black shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                      >
                        <Scissors className="w-3.5 h-3.5 -rotate-45" />
                        <span>Setor Klip</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* SIMULASI KALKULATOR CUAN (COMPACT & MODERN)                              */}
        {/* ========================================================================= */}
        <section className="rounded-3xl p-6 sm:p-8 bg-[#26073d]/80 border border-[#7B337E]/40 shadow-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-lg">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#7B337E]/30 text-white border border-[#7B337E]/50 text-xs font-semibold">
                <Calculator className="w-3.5 h-3.5 text-[#6667AB]" />
                <span>Kalkulator Penghasilan Klip</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                Simulasi Cuan dari Setiap Views yang Kamu Hasilkan
              </h2>
              <p className="text-xs text-[#F5D5E0]/70 leading-relaxed">
                Tiap 1.000 views di TikTok / Reels menghasilkan komisi otomatis. Geser estimasi views untuk melihat proyeksi cuan dari 1 video klip.
              </p>

              {/* Views Presets */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  { label: '25K Views', value: 25000 },
                  { label: '50K (FYP)', value: 50000 },
                  { label: '150K (Viral)', value: 150000 },
                  { label: '500K (Mega)', value: 500000 },
                ].map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setViewsEstimate(p.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      viewsEstimate === p.value
                        ? 'bg-white text-black font-bold'
                        : 'bg-[#190428] text-[#F5D5E0]/70 hover:text-white border border-[#7B337E]/40'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider & Result Box */}
            <div className="w-full lg:max-w-md bg-[#190428] rounded-2xl p-6 border border-[#7B337E]/40 space-y-5">
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-2">
                  <span className="text-[#F5D5E0]/70">Estimasi Views Postingan:</span>
                  <span className="text-white font-mono font-bold text-sm">
                    {viewsEstimate.toLocaleString('id-ID')} views
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="1000000"
                  step="5000"
                  value={viewsEstimate}
                  onChange={(e) => setViewsEstimate(Number(e.target.value))}
                  className="w-full h-2 bg-[#420D4B] rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* Earnings Result */}
              <div className="p-4 rounded-xl bg-[#26073d] border border-[#7B337E]/50 text-center space-y-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5D5E0]/60">
                  Estimasi Komisi Klip
                </span>
                <div className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                  Rp {estimatedEarnings.toLocaleString('id-ID')}
                </div>
                {isCapped && (
                  <p className="text-[10px] text-amber-300 font-medium pt-1">
                    *Maksimal Rp {maxPayoutPerClip.toLocaleString('id-ID')} sesuai limit per klip episode
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  const target = document.getElementById('campaigns-section');
                  if (target) target.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-white hover:bg-white/90 text-black shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <span>Pilih Episode & Gunting Sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* SIMPLE 3-STEP GUIDE (ALUR GUNTING KLIP)                                  */}
        {/* ========================================================================= */}
        <section className="border-t border-[#7B337E]/20 pt-8 space-y-6">
          <div className="text-center max-w-md mx-auto space-y-1">
            <h2 className="text-lg sm:text-xl font-bold text-white">
              Cara Kerja klipzz.vid
            </h2>
            <p className="text-xs text-[#F5D5E0]/60">
              3 langkah cepat untuk mulai menghasilkan komisi dari konten komedi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-[#26073d]/50 border border-[#7B337E]/30 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                1
              </span>
              <h4 className="text-xs font-bold text-white">Pilih Episode & Creator Kit</h4>
              <p className="text-[11px] text-[#F5D5E0]/70 leading-relaxed">
                Tonton cuplikan podcast DiPanggil ke Ruangan, unduh video footage resolusi asli, dan cek menit-menit punchline lucu.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#26073d]/50 border border-[#7B337E]/30 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                2
              </span>
              <h4 className="text-xs font-bold text-white">Edit & Upload ke TikTok / Reels</h4>
              <p className="text-[11px] text-[#F5D5E0]/70 leading-relaxed">
                Potong durasi 30–60 detik vertikal 9:16, pasang subtitle yang rapi, dan sertakan hashtag wajib di caption postingan.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#26073d]/50 border border-[#7B337E]/30 space-y-2">
              <span className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                3
              </span>
              <h4 className="text-xs font-bold text-white">Setor Link & Cairkan Komisi</h4>
              <p className="text-[11px] text-[#F5D5E0]/70 leading-relaxed">
                Tempel link video ke klipzz.vid. Sistem otomatis menghitung views dan komisi langsung masuk ke saldo dompet akunmu.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Modals */}
      <BioChallengeModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        onAccountVerified={(acc) => setSocialAccounts((prev) => [acc, ...prev])}
      />

      <SubmitClipModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        campaign={selectedCampaign}
        socialAccounts={socialAccounts}
        onSubmitSuccess={(newSub) => {
          setSubmissions((prev) => [newSub, ...prev]);
        }}
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCampaignCreated={(camp) => {
          setCampaigns((prev) => [camp, ...prev]);
        }}
      />

      {/* Mobile Bottom App Navigation */}
      <BottomNav
        onOpenSubmit={() => {
          if (campaigns.length > 0) openSubmitFor(campaigns[0]);
        }}
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />
    </div>
  );
}
