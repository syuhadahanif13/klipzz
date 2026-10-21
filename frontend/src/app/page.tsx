'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Scissors,
  Flame,
  TrendingUp,
  Sparkles,
  ExternalLink,
  Search,
  CheckCircle2,
  Play,
  ArrowRight,
  ShieldCheck,
  Eye,
  Wallet,
  Calculator,
  Zap,
  Coins,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { BottomNav } from '../components/BottomNav';
import { BioChallengeModal } from '../components/BioChallengeModal';
import { SubmitClipModal } from '../components/SubmitClipModal';
import { CreateCampaignModal } from '../components/CreateCampaignModal';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import {
  MOCK_CAMPAIGNS,
  MOCK_SOCIAL_ACCOUNTS,
  MOCK_SUBMISSIONS,
} from '../data/mockData';
import { Campaign, SocialAccount, Submission } from '../types';

export default function HomePage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>(MOCK_CAMPAIGNS);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  const [viewsEstimate, setViewsEstimate] = useState<number>(50000);

  // Modal states
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Load live campaigns from Supabase
  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const { data, error } = await supabase
          .from('campaigns')
          .select('*')
          .neq('status', 'draft')
          .order('created_at', { ascending: false });

        if (data && data.length > 0) {
          setCampaigns(data as Campaign[]);
        }
      } catch (e) {
        console.warn('Using fallback campaigns data:', e);
      }
    }
    fetchCampaigns();
  }, []);

  // Fetch social accounts for logged-in user
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
  }, [user]);

  const handleAccountVerified = (account: SocialAccount) => {
    setSocialAccounts((prev) => [account, ...prev]);
  };

  const handleSubmitSuccess = (newSub: Submission) => {
    setSubmissions((prev) => [newSub, ...prev]);
  };

  const handleCampaignCreated = (newCamp: Campaign) => {
    setCampaigns((prev) => [newCamp, ...prev]);
  };

  const openSubmitFor = (camp: Campaign) => {
    setSelectedCampaign(camp);
    setIsSubmitModalOpen(true);
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter((camp) => {
    const matchSearch =
      camp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camp.episode_guest.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  const estimatedEarnings = Math.round((viewsEstimate / 1000) * 18000);

  return (
    <div className="min-h-screen bg-[#210635] text-[#F5D5E0] flex flex-col">
      <Navbar
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
        onOpenCreateCampaign={() => setIsCreateModalOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-12 pb-24 md:pb-12">
        {/* HERO SECTION */}
        <section className="relative rounded-3xl p-8 sm:p-12 overflow-hidden glass-card border border-[#7B337E]/40 shadow-moon-glow">
          {/* Background Radial Glow */}
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#7B337E]/30 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#6667AB]/25 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#420D4B]/80 text-[#F5D5E0] border border-[#7B337E]/60 text-xs font-semibold shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Official Partner Channel: @DipanggilKeRuangan</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-[#F5D5E0]">
              Potong Punchline, <br />
              <span className="bg-gradient-to-r from-[#7B337E] via-[#6667AB] to-[#F5D5E0] bg-clip-text text-transparent">
                Dapat Komisi dari Views.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#F5D5E0]/80 leading-relaxed font-normal">
              Platform clipping cerdas untuk pembuat konten. Unduh episode podcast{' '}
              <strong className="text-[#F5D5E0]">DiPanggil ke Ruangan</strong> (Host: Arif Brata & Dara Sarasvati),
              unggah momen terlucu ke TikTok & Reels, dan terima pembayaran otomatis dengan verifikasi data Apify Scraper.
            </p>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  if (campaigns.length > 0) openSubmitFor(campaigns[0]);
                }}
                className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <Scissors className="w-4 h-4 -rotate-45" />
                <span>Mulai Gunting Klip</span>
              </button>

              <button
                onClick={() => setIsBioModalOpen(true)}
                className="px-5 py-3.5 rounded-2xl font-semibold text-sm bg-[#420D4B]/70 hover:bg-[#420D4B] text-[#F5D5E0] border border-[#7B337E]/40 hover:border-[#F5D5E0]/40 transition-all flex items-center gap-2"
              >
                <ShieldCheck className="w-4 h-4 text-[#6667AB]" />
                <span>Verifikasi Bio Sosmed</span>
              </button>

              {!user && (
                <Link
                  href="/login"
                  className="px-5 py-3.5 rounded-2xl font-semibold text-sm bg-[#210635] hover:bg-[#420D4B] text-[#F5D5E0] border border-[#6667AB]/40 transition-all"
                >
                  Masuk Akun
                </Link>
              )}
            </div>
          </div>

          {/* Real-time Platform Metrics Bar */}
          <div className="relative z-10 mt-10 pt-8 border-t border-[#7B337E]/30 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="text-xs text-[#F5D5E0]/60 font-medium block">Total Reward Pool</span>
              <span className="text-lg sm:text-2xl font-black text-[#F5D5E0] tracking-tight">
                Rp 70.000.000
              </span>
            </div>
            <div>
              <span className="text-xs text-[#F5D5E0]/60 font-medium block">Komisi Dicairkan</span>
              <span className="text-lg sm:text-2xl font-black text-emerald-400 tracking-tight">
                Rp 20.650.000
              </span>
            </div>
            <div>
              <span className="text-xs text-[#F5D5E0]/60 font-medium block">Total Views Klip</span>
              <span className="text-lg sm:text-2xl font-black text-[#6667AB] tracking-tight">
                2.84M+ Views
              </span>
            </div>
            <div>
              <span className="text-xs text-[#F5D5E0]/60 font-medium block">Clipper Terdaftar</span>
              <span className="text-lg sm:text-2xl font-black text-[#F5D5E0] tracking-tight">
                1.420+ Kreator
              </span>
            </div>
          </div>
        </section>

        {/* INTERACTIVE KALKULATOR CUAN CLIPPER */}
        <section className="glass-card rounded-3xl p-6 sm:p-8 border border-[#7B337E]/50 bg-gradient-to-br from-[#420D4B]/70 via-[#210635]/90 to-[#420D4B]/60 shadow-moon-glow">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#7B337E]/40 border border-[#7B337E] text-xs font-bold text-[#F5D5E0]">
                <Calculator className="w-3.5 h-3.5 text-[#F5D5E0]" />
                <span>Simulasi Cuan Clipper</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#F5D5E0] leading-snug">
                Berapa Cuan yang Bisa Kamu Dapatkan dari 1 Klip Viral?
              </h2>
              <p className="text-xs sm:text-sm text-[#F5D5E0]/70">
                Geser estimasi views di samping untuk melihat perkiraan komisi yang langsung cair ke dompetmu berdasarkan rata-rata tarif kampanye aktif DiPanggil ke Ruangan.
              </p>

              {/* Preset Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                {[
                  { label: '25.000 (Pemula)', value: 25000 },
                  { label: '50.000 (Rata-rata FYP)', value: 50000 },
                  { label: '150.000 (Viral)', value: 150000 },
                  { label: '500.000 (Mega Viral)', value: 500000 },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => setViewsEstimate(preset.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      viewsEstimate === preset.value
                        ? 'bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-white shadow-moon-glow border border-transparent'
                        : 'bg-[#210635] text-[#F5D5E0]/70 border border-[#7B337E]/40 hover:text-[#F5D5E0]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Slider & Result Box */}
            <div className="w-full lg:max-w-md bg-[#210635]/90 rounded-2xl p-6 border border-[#7B337E]/40 space-y-5">
              <div>
                <div className="flex justify-between items-center text-xs sm:text-sm font-semibold mb-2">
                  <span className="text-[#F5D5E0]/70">Estimasi Views TikTok / Reels:</span>
                  <span className="text-[#F5D5E0] font-black text-base">{viewsEstimate.toLocaleString('id-ID')} views</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="1000000"
                  step="5000"
                  value={viewsEstimate}
                  onChange={(e) => setViewsEstimate(Number(e.target.value))}
                  className="w-full h-2.5 bg-[#420D4B] rounded-lg appearance-none cursor-pointer accent-[#6667AB]"
                />
                <div className="flex justify-between text-[10px] text-[#F5D5E0]/50 mt-1">
                  <span>5K views</span>
                  <span>500K views</span>
                  <span>1 Juta views</span>
                </div>
              </div>

              {/* Big Earnings Box */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#420D4B] to-[#7B337E]/40 border border-[#7B337E]/60 text-center space-y-1">
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#F5D5E0]/70">
                  Perkiraan Komisi Diterima
                </span>
                <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight">
                  Rp {estimatedEarnings.toLocaleString('id-ID')}
                </div>
                <span className="text-[11px] text-[#F5D5E0]/60 block">
                  Berdasarkan tarif rata-rata Rp 18.000 / 1.000 views
                </span>
              </div>

              {/* Action */}
              <button
                onClick={() => {
                  const target = document.getElementById('campaigns-section');
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                  } else if (campaigns.length > 0) {
                    openSubmitFor(campaigns[0]);
                  }
                }}
                className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-[#7B337E] to-[#6667AB] hover:opacity-95 text-[#F5D5E0] shadow-moon-glow transition-all flex items-center justify-center gap-2"
              >
                <Scissors className="w-4 h-4 -rotate-45" />
                <span>Pilih Episode & Mulai Gunting Klip</span>
              </button>
            </div>
          </div>
        </section>

        {/* CAMPAIGN LIST & EXPLORE SECTION */}
        <section id="campaigns-section" className="space-y-6">
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#F5D5E0] flex items-center gap-2.5">
                <Flame className="w-6 h-6 text-[#6667AB]" />
                Campaigns DiPanggil ke Ruangan
              </h2>
              <p className="text-xs sm:text-sm text-[#F5D5E0]/70 mt-1">
                Pilih episode favoritmu, buka Creator Kit, dan setor link videomu.
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative min-w-[280px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari bintang tamu atau episode..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#420D4B]/60 border border-[#7B337E]/40 text-[#F5D5E0] placeholder-[#F5D5E0]/40 text-xs sm:text-sm focus:outline-none focus:border-[#6667AB] transition-colors"
              />
              <Search className="w-4 h-4 text-[#F5D5E0]/50 absolute left-3.5 top-3" />
            </div>
          </div>

          {/* Campaign Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {filteredCampaigns.map((camp) => {
              const claimedPercentage = Math.round(
                ((camp.reward_pool - camp.remaining_pool) / camp.reward_pool) * 100
              );

              return (
                <div
                  key={camp.id}
                  className="glass-card glass-panel-hover rounded-2xl p-5 border border-[#7B337E]/40 flex flex-col justify-between space-y-4"
                >
                  {/* Top Thumbnail & Guest Badge */}
                  <div className="relative rounded-xl overflow-hidden aspect-video bg-[#210635]">
                    <img
                      src={camp.thumbnail_url}
                      alt={camp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#210635] via-transparent to-black/40" />

                    {/* Guest Badge */}
                    <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-[#420D4B]/90 backdrop-blur-md border border-[#7B337E]/60 text-xs font-bold text-[#F5D5E0]">
                      {camp.episode_guest}
                    </div>

                    {/* YouTube Watch link */}
                    <a
                      href={camp.source_youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute bottom-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-[#F5D5E0] border border-white/20 transition-all flex items-center gap-1.5 text-xs font-medium"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Tonton di YouTube</span>
                    </a>
                  </div>

                  {/* Campaign Title & Description */}
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-[#F5D5E0] line-clamp-2 hover:text-[#6667AB] transition-colors">
                      {camp.title}
                    </h3>
                    <p className="text-xs text-[#F5D5E0]/70 line-clamp-2">
                      {camp.description}
                    </p>
                  </div>

                  {/* Required Hashtags */}
                  <div className="flex flex-wrap gap-1.5">
                    {camp.hashtag_requirements.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#210635] text-[#F5D5E0]/80 border border-[#7B337E]/30"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Budget & Reward Rate Bar */}
                  <div className="space-y-2 pt-2 border-t border-[#7B337E]/30">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#F5D5E0]/60">Sisa Reward Pool:</span>
                      <span className="font-bold text-[#F5D5E0]">
                        Rp {camp.remaining_pool.toLocaleString('id-ID')} / Rp {camp.reward_pool.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-[#210635] overflow-hidden border border-[#7B337E]/30">
                      <div
                        className="h-full bg-gradient-to-r from-[#7B337E] to-[#6667AB] rounded-full transition-all duration-500"
                        style={{ width: `${claimedPercentage}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[#F5D5E0]/60">Tarif per 1k views:</span>
                      <span className="font-extrabold text-emerald-400">
                        Rp {camp.rate_per_1k_views.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Link
                      href={`/campaign/${camp.slug || camp.id}`}
                      className="py-2.5 px-3 rounded-xl text-center text-xs font-semibold bg-[#210635] hover:bg-[#420D4B] text-[#F5D5E0] border border-[#7B337E]/40 transition-colors"
                    >
                      Creator Kit & Detail
                    </Link>

                    <button
                      onClick={() => openSubmitFor(camp)}
                      className="py-2.5 px-3 rounded-xl text-center text-xs font-bold bg-gradient-to-r from-[#7B337E] to-[#6667AB] text-[#F5D5E0] shadow-moon-glow hover:opacity-95 transition-opacity flex items-center justify-center gap-1.5"
                    >
                      <Scissors className="w-3.5 h-3.5 -rotate-45" />
                      <span>Submit Klip</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="glass-card rounded-3xl p-8 sm:p-10 border border-[#7B337E]/40 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#6667AB]">
              Alur Kerja Simpel & Transparan
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#F5D5E0]">
              Cara Kerja klipzz.vid
            </h2>
            <p className="text-xs sm:text-sm text-[#F5D5E0]/70">
              Tidak ada birokrasi rumit. Cukup 4 langkah mudah untuk mulai menghasilkan uang dari konten komedi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-[#210635]/80 border border-[#7B337E]/30 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#7B337E]/30 border border-[#7B337E]/50 flex items-center justify-center text-sm font-black text-[#F5D5E0]">
                01
              </div>
              <h4 className="font-bold text-sm text-[#F5D5E0]">Verifikasi Bio Sosmed</h4>
              <p className="text-xs text-[#F5D5E0]/70">
                Tempel kode acak (misal: KLIPZZ-89A2) di bio profil TikTok atau Instagram untuk membuktikan akun milikmu.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#210635]/80 border border-[#7B337E]/30 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#7B337E]/30 border border-[#7B337E]/50 flex items-center justify-center text-sm font-black text-[#F5D5E0]">
                02
              </div>
              <h4 className="font-bold text-sm text-[#F5D5E0]">Pilih & Potong Momen</h4>
              <p className="text-xs text-[#F5D5E0]/70">
                Tonton episode DiPanggil ke Ruangan, ambil momen punchline terlucu, dan edit format vertikal dengan subtitle dinamis.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#210635]/80 border border-[#7B337E]/30 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#7B337E]/30 border border-[#7B337E]/50 flex items-center justify-center text-sm font-black text-[#F5D5E0]">
                03
              </div>
              <h4 className="font-bold text-sm text-[#F5D5E0]">Upload & Setor URL</h4>
              <p className="text-xs text-[#F5D5E0]/70">
                Upload ke TikTok / Reels dengan hashtag wajib, lalu masukkan link video ke platform klipzz.vid.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#210635]/80 border border-[#7B337E]/30 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#7B337E]/30 border border-[#7B337E]/50 flex items-center justify-center text-sm font-black text-[#F5D5E0]">
                04
              </div>
              <h4 className="font-bold text-sm text-[#F5D5E0]">Auto-Track & Cuan</h4>
              <p className="text-xs text-[#F5D5E0]/70">
                Apify Scraper Engine memantau pertumbuhan views klip secara berkala. Komisi otomatis masuk ke saldo akunmu!
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#7B337E]/30 bg-[#210635] py-8 text-center text-xs text-[#F5D5E0]/60">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-black text-[#F5D5E0]">klipzz.vid</span>
            <span>• Platform Clipping Campaign Resmi DiPanggil ke Ruangan</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="hover:text-[#F5D5E0] cursor-pointer">Panduan Komunitas</span>
            <span className="hover:text-[#F5D5E0] cursor-pointer">Aturan Hak Cipta</span>
            <span className="hover:text-[#F5D5E0] cursor-pointer">Hubungi Kami</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BioChallengeModal
        isOpen={isBioModalOpen}
        onClose={() => setIsBioModalOpen(false)}
        onAccountVerified={handleAccountVerified}
      />

      <SubmitClipModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        campaign={selectedCampaign}
        socialAccounts={socialAccounts}
        onSubmitSuccess={handleSubmitSuccess}
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />

      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCampaignCreated={handleCampaignCreated}
      />

      {/* MOBILE BOTTOM APP NAVIGATION */}
      <BottomNav
        onOpenSubmit={() => {
          if (campaigns.length > 0) openSubmitFor(campaigns[0]);
        }}
        onOpenBioChallenge={() => setIsBioModalOpen(true)}
      />
    </div>
  );
}
